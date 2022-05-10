import type { Asset } from 'contentful';

export type KeyValueMap<T = any> = Record<string, T>;

interface Dynamic<T> {
  [key: string]: T;
}

export type RatioConfig = Dynamic<KeyValueMap<KeyValueMap<number>> | RatioConfig> & {
  default?: KeyValueMap<number>;
}

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

export type MimeTypes = 'image/jpg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/avif';

export type FocusAreaConfig = Dynamic<KeyValueMap<FocusArea> | FocusAreaConfig> & {
  default?: FocusArea;
}

export type SizeFunction = (asset?: Asset, ratio?: number, focusArea?: FocusArea) => number;

export type Size = number | SizeFunction;

export interface AssetPluginConfig {
  download?: boolean; // Serve assets from local instead of using the contentful cdn
  sizes?: Size[]; // Widths which should be generated
  rootDir?: string; // Project root
  assetBase?: string; // Base URI. Defaults to '/assets/cf'. Will be located in your asset folder
  assetFolder?: string; // Public folder relative to you project root. Usually something like 'public' or 'static' depending on your static site generator.
  cacheFolder?: string; // Folder where the downloaded assets should be cached. Defaults to '.cache'.
  extraTypes?: MimeTypes[]; // Additional mimetypes to create alongside the asset mime-type. Defaults to ['image/webp', 'image/avif'].
  ratios?: RatioConfig; // Configure ratios per content-type && field or add a default ratio config
  focusAreas?: FocusAreaConfig; // Specify focus area which should be used for cropping. See https://www.contentful.com/developers/docs/references/images-api/#/reference/resizing-&-cropping/specify-focus-area
}
