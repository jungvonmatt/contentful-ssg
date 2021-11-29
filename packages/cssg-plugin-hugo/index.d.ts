
export type TYPECONFIG_KEY =  'page' | 'data' | 'headless';
export type TRANSLATION_STRATEGY = 'directory' | 'filename';

export interface AssetPluginConfig {
  typeIdSettings: string;
  translationStrategy: TRANSLATION_STRATEGY;
  typeIdI18n: string;
  languageConfig: boolean;
  fieldIdHome: string;
  fieldIdSlug: string;
  fieldIdParent: string;
  typeConfig: {
    [x: TYPECONFIG_KEY]: string | string[];
  },
}
