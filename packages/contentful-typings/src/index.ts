/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ContentfulConfig, ContentType, Locale } from '@jungvonmatt/contentful-ssg';
import { getConfig } from '@jungvonmatt/contentful-ssg/lib/config';
import { getEnvironment, pagedGet } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { askMissing } from '@jungvonmatt/contentful-ssg/lib/ui';
import renderer from 'contentful-typescript-codegen/dist/lib/renderers/render.js';

type Options = {
  namespace?: string;
  localization?: string;
};

export const generateTypings = async (options: Options = {}) => {
  const contentfulConfig: ContentfulConfig = (await askMissing(
    await getConfig({
      previewAccessToken: '-',
      accessToken: '-',
    })
  )) as ContentfulConfig;

  const client = await getEnvironment(contentfulConfig);

  const { items: locales } = await pagedGet<Locale>(client, {
    method: 'getLocales',
  });

  const { items: contentTypes } = await pagedGet<ContentType>(client, {
    method: 'getContentTypes',
  });

  return renderer.default(contentTypes, locales, {
    localization: options.localization,
    namespace: options.namespace,
  }) as string;
};
