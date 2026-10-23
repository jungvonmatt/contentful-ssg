import {
  type Asset,
  type MapAssetLink,
  type RuntimeContext,
  type TransformContext,
} from '@jungvonmatt/contentful-ssg';
import type { PluginConfig, ProcessedSvg } from '../types.js';
import { getAssetHelper } from './asset.js';
import { optimize, type Config } from 'svgo';

export const getSvgHelper = (options: PluginConfig) => {
  const { fetchAsset, getLocalSrc, getAssetTimestamp } = getAssetHelper(options);

  const readAsset = async (asset: Asset) => {
    const { sys, fields } = asset || {};
    const fileUrl = fields?.file?.url ?? '';
    const src = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
    const timestamp = getAssetTimestamp(sys);

    if (!src) {
      return;
    }

    const buffer = await fetchAsset(src, timestamp);
    return new TextDecoder().decode(buffer);
  };

  const mapAssetLink = async (
    transformContext: TransformContext,
    runtimeContext: RuntimeContext,
    content: MapAssetLink,
  ): Promise<ProcessedSvg> => {
    const { asset } = transformContext;
    const { url } = content;
    const src = url.startsWith('//') ? `https:${url}` : url;

    const source = await readAsset(asset);

    const svgoOptions: Config = { multipass: true };
    if (typeof options?.svgoPlugins === 'function') {
      svgoOptions.plugins = await options.svgoPlugins({ ...transformContext, content });
    } else if (Array.isArray(options?.svgoPlugins)) {
      svgoOptions.plugins = options.svgoPlugins;
    }

    const optimized = source ? optimize(source, svgoOptions).data : '';

    // Add viewBox if not present
    const result: ProcessedSvg = {
      ...content,
      source: optimized,
      srcsets: [],
      src: options.download ? getLocalSrc(src, asset.sys) : src,
    };

    return result;
  };

  const after = async () => {
    return true;
  };

  return {
    mapAssetLink,
    after,
  };
};
