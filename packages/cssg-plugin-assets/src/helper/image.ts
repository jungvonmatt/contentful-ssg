import type {
  Asset,
  MapAssetLink,
  RuntimeContext,
  TransformContext,
} from '@jungvonmatt/contentful-ssg';
import type {
  Derivative,
  FocusArea,
  FocusAreaConfig,
  PluginConfig,
  ProcessedImage,
  RatioConfig,
  Ratios,
} from '../types.js';
import { getAssetHelper } from './asset.js';

// Max width that can be handled by the contentful image api
const contentfulMaxWidth = 4000;
// Some image formats (avif) have an additional limitation on the megapixel size
const maxMegaPixels = {
  avif: 9,
};

export const getRatioConfig = (
  transformContext: TransformContext,
  config: RatioConfig | undefined,
): Ratios => {
  const { entry, fieldId } = transformContext;
  const contentTypeId = entry?.sys?.contentType?.sys?.id ?? 'default';

  // Try to get configuration from plugin configuration
  const defaultConfig = config?.default;
  const contentTypeDefaultConfig = config?.contentTypes?.[contentTypeId]?.default;
  const fieldConfig = config?.contentTypes?.[contentTypeId]?.fields?.[fieldId];
  return fieldConfig ?? contentTypeDefaultConfig ?? defaultConfig ?? {};
};

export const getFocusArea = (
  transformContext: TransformContext,
  config: FocusAreaConfig | undefined,
): FocusArea => {
  const { entry, fieldId } = transformContext;
  const contentTypeId = entry?.sys?.contentType?.sys?.id ?? 'default';

  const defaultConfig = config?.default;
  const contentTypeDefaultConfig = config?.contentTypes?.[contentTypeId]?.default;
  const fieldConfig = config?.contentTypes?.[contentTypeId]?.fields?.[fieldId];
  const value = fieldConfig ?? contentTypeDefaultConfig ?? defaultConfig;

  const [, referenceFieldId = `${fieldId}_focus_area`] = value?.split(':') ?? [];

  const fallback =
    (!contentTypeDefaultConfig?.startsWith('field:') && (contentTypeDefaultConfig as FocusArea)) ||
    (!defaultConfig?.startsWith('field:') && (defaultConfig as FocusArea)) ||
    (entry?.fields?.focus_area as FocusArea) ||
    'center';

  if (Object.keys(entry.fields).includes(referenceFieldId)) {
    return (entry?.fields?.[referenceFieldId] as FocusArea) || fallback;
  }

  if (value?.startsWith('field:')) {
    return fallback;
  }

  return (value as FocusArea) || fallback;
};

export const getImageHelper = (options: PluginConfig) => {
  const { getLocalSrc } = getAssetHelper(options);

  const getImageData = (asset: Asset, ratio: number, focusArea: string) => {
    const { width, height } = asset?.fields?.file?.details?.image ?? {};
    const mimeType = asset?.fields?.file?.contentType;
    const url = asset?.fields?.file?.url;
    const types = [...new Set([...(options.extraTypes || []), mimeType])];
    const sizes = (options.sizes || []).map((value) => {
      if (typeof value === 'function') {
        return value(asset, ratio, focusArea);
      }

      return parseFloat(value.toString());
    });

    if (!url || !width || !height) {
      return {};
    }

    const src = url.startsWith('//') ? `https:${url}` : url;

    // Compute possible widths considering ratio & contentful max size
    const widths = [
      ...new Set(
        (ratio
          ? [
              contentfulMaxWidth,
              contentfulMaxWidth * ratio,
              width,
              Math.floor(height * ratio),
              ...sizes,
            ]
          : [contentfulMaxWidth, width, ...sizes]
        )
          .sort((a, b) => b - a)
          .filter(
            (w) =>
              w <= width &&
              w <= contentfulMaxWidth &&
              (!ratio || (w / ratio <= contentfulMaxWidth && w / ratio <= height)),
          )
          .map((w) => Math.round(w)),
      ),
    ];

    const [maxWidth] = widths;
    const maxHeight = Math.round(maxWidth / (ratio || width / height));
    const sizesAttribute = `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;

    const sizeParams = (width: number, ratio: number) => {
      if (!ratio) {
        return `w=${width}`;
      }

      return [
        'fit=fill',
        `w=${width}`,
        `h=${Math.floor(width / ratio)}`,
        `f=${focusArea || 'center'}`,
      ].join('&');
    };

    const megaPixelFilter = (w, type = '-') => {
      const max = maxMegaPixels?.[type.replace('image/', '')] as number;
      const r = ratio || width / height;
      return !max || max >= (w * Math.floor(w / r)) / 1000000;
    };

    const sources = Object.fromEntries(
      types.map((type) => {
        const fm = type === mimeType ? '' : `&fm=${type.replace('image/', '')}`;
        return [
          type,
          widths
            .filter((w) => megaPixelFilter(w, type))
            .map((w) => ({
              src: `${src}?${sizeParams(w, ratio)}&q=${options.quality}${fm}`,
              width: w,
            })),
        ];
      }),
    );

    const [assetFile] = sources[mimeType];
    const { src: assetSrc } = assetFile;

    // Fetch original src and srcsets for production use
    const finalSrc = options.download ? getLocalSrc(assetSrc, asset.sys) : assetSrc;
    const finalSrcsets = Object.entries(sources).map(([type, files]) => {
      const srcset = files.map((file) => {
        const { width, src } = file;
        return `${options.download ? getLocalSrc(src, asset.sys) : src} ${width}w`;
      });
      return {
        type,
        srcset: srcset.join(', '),
      };
    });

    return {
      width: maxWidth,
      height: maxHeight,
      sizes: sizesAttribute,
      srcsets: finalSrcsets,
      src: finalSrc,
    };
  };

  const mapAssetLink = async (
    transformContext: TransformContext,
    _runtimeContext: RuntimeContext,
    content: MapAssetLink,
  ): Promise<ProcessedImage> => {
    const { asset } = transformContext;
    const { mimeType = '' } = content;

    // Get ratio from config
    const ratioConfig = getRatioConfig(transformContext, options?.ratios);

    // Get focusArea from config
    const focusArea = getFocusArea(transformContext, options?.focusAreas);

    if (mimeType.startsWith('image')) {
      const original = getImageData(asset, undefined, focusArea);
      const derivatives = Object.fromEntries(
        Object.entries(ratioConfig).map(([name, ratio]) => [
          name,
          getImageData(asset, ratio, focusArea),
        ]),
      );

      const result: ProcessedImage = {
        ...content,
        src: original.src,
        derivatives: { original: original as Derivative, ...derivatives },
      };

      return result;
    }
  };

  const after = async () => {
    return true;
  };

  return {
    mapAssetLink,
    after,
  };
};
