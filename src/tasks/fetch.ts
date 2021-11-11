import type {RuntimeContext, Config, ContentfulConfig} from '../types.js';
import {getContent, getFieldSettings} from '../helper/contentful.js';

export const fetch = async (context: RuntimeContext, config: Config) => {
  const content = await getContent(config as ContentfulConfig);
  const {locales, contentTypes} = content;

  const fieldSettings = getFieldSettings(contentTypes);
  const {code: defauleLocale} = locales.find(locale => locale.default);

  context.defauleLocale = defauleLocale;

  context.data = {
    ...content,
    fieldSettings,
  };
};
