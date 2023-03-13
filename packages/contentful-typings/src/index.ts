/* _eslint-disable @typescript-eslint/no-unsafe-call */
import { ContentfulConfig, ContentType } from '@jungvonmatt/contentful-ssg';
import { getConfig } from '@jungvonmatt/contentful-ssg/lib/config';
import { getEnvironment, pagedGet } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { askMissing } from '@jungvonmatt/contentful-ssg/lib/ui';
import { CFDefinitionsBuilder, ContentTypeRenderer } from 'cf-content-types-generator';

import {
  DefaultContentTypeRenderer,
  JsDocRenderer,
  LocalizedContentTypeRenderer,
  TypeGuardRenderer,
} from './renderer/index.js';

type Options = {
  localized?: boolean;
  jsdoc?: boolean;
  typeguard?: boolean;
};

export const generateTypings = async (options: Options = {}) => {
  const contentfulConfig: ContentfulConfig = (await askMissing(
    await getConfig({
      previewAccessToken: '-',
      accessToken: '-',
    })
  )) as ContentfulConfig;

  const client = await getEnvironment(contentfulConfig);

  const { items: contentTypes } = await pagedGet<ContentType>(client, {
    method: 'getContentTypes',
  });

  const renderers: ContentTypeRenderer[] = [new DefaultContentTypeRenderer()];
  if (options.localized) {
    renderers.push(new LocalizedContentTypeRenderer());
  }

  if (options.jsdoc) {
    renderers.push(new JsDocRenderer());
  }

  if (options.typeguard) {
    renderers.push(new TypeGuardRenderer());
  }

  const builder = new CFDefinitionsBuilder(renderers);

  for (const model of contentTypes) {
    builder.appendType(model);
  }

  return builder.toString();
};
