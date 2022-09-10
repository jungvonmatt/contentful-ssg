import { Asset, MapAssetLink, TransformContext } from '@jungvonmatt/contentful-ssg';
import { Plugin } from 'svgo';

export type Ratios = Record<string, number>;
export type FocusAreaReference = `field:${string}`;
export type FocusArea =
  | 'center'
  | 'top'
  | 'right'
  | 'left'
  | 'bottom'
  | 'top_right'
  | 'top_left'
  | 'bottom_right'
  | 'bottom_left'
  | 'face'
  | 'faces';

export type EntryConfig<T = any> = {
  default?: T;
  contentTypes?: Record<
    string,
    {
      default?: T;
      fields?: Record<string, T>;
    }
  >;
};

export type EntryConfigKey = keyof Pick<PluginConfig, 'ratios' | 'focusAreas'>;

export type RatioConfig = EntryConfig<Ratios>;

export type FocusAreaConfig = EntryConfig<FocusArea | FocusAreaReference>;

export type SizesCallback = (asset: Asset, ratio: number, focusArea: string) => number;

type SvgPluginCallback = (transformContext: TransformContext) => Promise<Plugin[]>;

export interface PluginConfig {
  sizes?: Array<number | SizesCallback>;
  rootDir?: string;
  assetBase?: string;
  assetFolder?: string;
  cacheFolder?: string;
  cachePath?: string;
  assetPath?: string;
  extraTypes?: string[];
  quality?: number;
  ratios?: RatioConfig;
  focusAreas?: FocusAreaConfig;
  download?: boolean;
  generatePosterImages?: boolean;
  posterPosition?: string;
  posterScale?: string;
  svgoPlugins?: SvgPluginCallback | Plugin[];
}

export type ProcessedAsset = MapAssetLink & {
  src: string;
};

type Srcset = {
  type: string;
  srcset: string;
};

export type ProcessedSvg = ProcessedAsset & {
  source: string;
  srcsets: Srcset[];
};

export type Derivative = {
  width: number;
  height: number;
  sizes: string;
  srcsets: Srcset[];
  src: string;
};

export type ProcessedImage = ProcessedAsset & {
  derivatives: {
    [ratio: string]: Derivative;
    original: Derivative;
  };
};

export type ProcessedVideo = ProcessedAsset & {
  poster?: string;
};
