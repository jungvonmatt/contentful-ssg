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
  contentTypes?: Record<
    string,
    {
      default?: Ratios;
      fields?: Record<string, Ratios>;
    }
  >;
};

export type FocusAreaConfig = {
  default?: FocusArea;
  contentTypes?: Record<
    string,
    {
      default?: FocusArea;
      fields?: Record<string, FocusArea>;
    }
  >;
};

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
