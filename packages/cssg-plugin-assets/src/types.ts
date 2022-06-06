import { Asset, MapAssetLink, TransformContext } from '@jungvonmatt/contentful-ssg';
import { Plugin } from 'svgo';

export type Ratios = Record<string, number>;
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

export type RatioConfig = {
  default?: Ratios;
  contentTypes?: {
    [contentTypeId: string]: {
      default?: Ratios;
      fields?: {
        [fieldId: string]: Ratios;
      };
    };
  };
};

export type FocusAreaConfig = {
  default?: FocusArea;
  contentTypes?: {
    [contentTypeId: string]: {
      default?: FocusArea;
      fields?: {
        [fieldId: string]: FocusArea;
      };
    };
  };
};

// eslint-disable-next-line no-unused-vars
export type SizesCallback = (asset: Asset, ratio: number, focusArea: string) => number;
// eslint-disable-next-line no-unused-vars
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

export type ProcessedSvg = ProcessedAsset & {
  source: string;
  srcsets: [];
};

type Srcset = {
  type: string;
  srcset: string;
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
    original: Derivative;
    [ratio: string]: Derivative;
  };
};

export type ProcessedVideo = ProcessedAsset & {
  poster?: string;
};
