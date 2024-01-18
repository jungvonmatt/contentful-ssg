/* _eslint-disable @typescript-eslint/no-unsafe-call */
import path from 'node:path';
import { type ContentfulConfig, type ContentType } from '@jungvonmatt/contentful-ssg';
import { getConfig } from '@jungvonmatt/contentful-ssg/lib/config';
import { getEnvironment, pagedGet } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { askMissing } from '@jungvonmatt/contentful-ssg/lib/ui';
import { CFDefinitionsBuilder, type ContentTypeRenderer } from 'cf-content-types-generator';
import { readPackageUp } from 'read-pkg-up';
import semiver from 'semiver';

import {
  DefaultContentTypeRenderer,
  V10ContentTypeRenderer,
  V10TypeGuardRenderer,
  JsDocRenderer,
  LocalizedContentTypeRenderer,
  TypeGuardRenderer,
} from './renderer/index.js';

type Options = {
  localized?: boolean;
  jsdoc?: boolean;
  typeguard?: boolean;
  legacy?: boolean;
};

const isLegacyVersion = async (dir?: string) => {
  try {
    const cwd = path.join(dir || process.cwd(), 'node_modules', 'contentful');
    const { packageJson } = await readPackageUp({ cwd });
    // New skeleton types were released in contentful v10.0.0-beta-v10.33
    if (
      packageJson.name === 'contentful' &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      semiver(packageJson.version, '10.0.0-beta-v10.33') < 0
    ) {
      return true;
    }
  } catch {}

  return false;
};

export const generateTypings = async (options: Options = {}) => {
  const contentfulConfig = await askMissing(
    await getConfig({
      previewAccessToken: '-',
      accessToken: '-',
    }),
  );

  const client = await getEnvironment(contentfulConfig as ContentfulConfig);

  const { items: contentTypes } = await pagedGet<ContentType>(client, {
    method: 'getContentTypes',
  });

  const legacyVersion =
    typeof options.legacy === 'undefined' ? await isLegacyVersion() : options.legacy;

  const renderers: ContentTypeRenderer[] = [
    legacyVersion ? new DefaultContentTypeRenderer() : new V10ContentTypeRenderer(),
  ];
  if (options.localized) {
    renderers.push(new LocalizedContentTypeRenderer());
  }

  if (options.jsdoc) {
    renderers.push(new JsDocRenderer());
  }

  if (options.typeguard) {
    renderers.push(legacyVersion ? new TypeGuardRenderer() : new V10TypeGuardRenderer());
  }

  const builder = new CFDefinitionsBuilder(renderers);

  for (const model of contentTypes) {
    builder.appendType(model);
  }

  return builder.toString();
};
