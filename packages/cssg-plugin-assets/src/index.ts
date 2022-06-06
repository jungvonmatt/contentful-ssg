import type { MapAssetLink, RuntimeContext, TransformContext } from '@jungvonmatt/contentful-ssg';
import { resolve } from 'path';
import { getAssetHelper } from './helper/asset.js';
import { getImageHelper } from './helper/image.js';
import { getSvgHelper } from './helper/svg.js';
import { getVideoHelper } from './helper/video.js';
import type {
  PluginConfig,
  ProcessedAsset,
  ProcessedImage,
  ProcessedSvg,
  ProcessedVideo,
} from './types.js';

/**
 *
 * @param {*} options
 * @returns
 */
const processOptions = (options: PluginConfig = {}): PluginConfig => {
  const defaultOptions: PluginConfig = {
    sizes: [1920, 1280, 640, 320],
    rootDir: process.cwd(),
    assetBase: '/assets/cf',
    assetFolder: 'static',
    cacheFolder: '.cache',
    extraTypes: ['image/avif', 'image/webp'],
    quality: 80,
    ratios: {},
    focusAreas: {},
    svgoPlugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
      'removeDimensions',
    ],
  };

  const { rootDir, cacheFolder, assetFolder } = { ...defaultOptions, ...options };

  return {
    ...defaultOptions,
    rootDir,
    assetFolder,
    cacheFolder,
    cachePath: resolve(rootDir, cacheFolder),
    assetPath: resolve(rootDir, assetFolder),
    ...options,
  };
};

export default (pluginOptions?: PluginConfig) => {
  const options = processOptions(pluginOptions);

  const assetHelper = getAssetHelper(options);
  const svgHelper = getSvgHelper(options);
  const imageHelper = getImageHelper(options);
  const videoHelper = getVideoHelper(options);

  const mapAssetLink = async (
    transformContext: TransformContext,
    runtimeContext: RuntimeContext,
    defaultValue: MapAssetLink
  ): Promise<ProcessedAsset | ProcessedSvg | ProcessedImage | ProcessedVideo> => {
    const { download } = options;
    const { asset } = transformContext;
    const { sys } = asset || {};
    const { url, mimeType = '' } = defaultValue;
    const src = url.startsWith('//') ? `https:${url}` : url;

    if (mimeType === 'image/svg+xml') {
      return svgHelper.mapAssetLink(transformContext, runtimeContext, defaultValue);
    }

    if (mimeType.startsWith('image')) {
      return imageHelper.mapAssetLink(transformContext, runtimeContext, defaultValue);
    }

    if (mimeType.startsWith('video')) {
      return videoHelper.mapAssetLink(transformContext, runtimeContext, defaultValue);
    }

    return {
      ...defaultValue,
      src: download ? assetHelper.getLocalSrc(src, sys) : src,
    } as ProcessedAsset;
  };

  const after = async () => {
    await assetHelper.after();
    await imageHelper.after();
    await svgHelper.after();
    await videoHelper.after();
  };

  return {
    after,
    mapAssetLink,
  };
};
