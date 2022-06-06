import type { Asset, MapAssetLink, TransformContext } from '@jungvonmatt/contentful-ssg';
import type { PluginConfig, ProcessedImage } from '../types.js';
import { getAssetHelper } from './asset.js';

// Max width that can be handled by the contentful image api
const contentfulMaxWidth = 4000;
// Some image formats (avif) have an additional limitation on the megapixel size
const maxMegaPixels = {
  avif: 9,
};

export const getImageHelper = (options: PluginConfig) => {
  const { getLocalSrc } = getAssetHelper(options);

  const getImageData = (asset: Asset, ratio, focusArea) => {
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
              (!ratio || (w / ratio <= contentfulMaxWidth && w / ratio <= height))
          )
          .map((w) => Math.round(w))
      ),
    ];

    const [maxWidth] = widths;
    const maxHeight = Math.round(maxWidth / (ratio || width / height));
    const sizesAttribute = `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;

    const sizeParams = (width, ratio) => {
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
      const max = maxMegaPixels?.[type.replace('image/', '')];
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
      })
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
    content: MapAssetLink
  ): Promise<ProcessedImage> => {
    const { asset, entry, fieldId } = transformContext;
    const { mimeType = '' } = content;

    // Get ratio from config
    const defaultRatio = entry?.fields?.ratio ?? options?.ratios?.default;
    const contentTypeDefaultRatio =
      options?.ratios?.[entry?.sys?.contentType?.sys?.id ?? 'unknown']?.default ?? defaultRatio;

    const { [entry?.sys?.contentType?.sys?.id ?? 'unknown']: contentTypeRatios } =
      options?.ratios?.contentTypes ?? {};
    const ratioConfig = contentTypeRatios?.fields?.[fieldId] ?? contentTypeDefaultRatio;

    // Get focusArea from config
    const defaultFocusArea = entry?.fields?.focus_area ?? options?.focusAreas?.default ?? 'center';
    const contentTypeDefaultFocusArea =
      options?.focusAreas?.[entry?.sys?.contentType?.sys?.id ?? 'unknown']?.default ??
      defaultFocusArea;
    const { [entry?.sys?.contentType?.sys?.id ?? 'unknown']: focusAreaConfig } =
      options?.focusAreas?.contentTypes ?? {};
    const focusArea = focusAreaConfig?.fields?.[fieldId] ?? contentTypeDefaultFocusArea;

    if (mimeType.startsWith('image')) {
      const original = getImageData(asset, undefined, focusArea);
      const derivatives = Object.fromEntries(
        Object.entries(ratioConfig || {}).map(([name, ratio]) => [
          name,
          getImageData(asset, ratio, focusArea),
        ])
      );
      return {
        ...content,
        src: original.src,
        derivatives: { original, ...derivatives },
      } as ProcessedImage;
    }
  };

  const after = async () => {};

  return {
    mapAssetLink,
    after,
  };
};
