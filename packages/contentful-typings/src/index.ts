/* _eslint-disable @typescript-eslint/no-unsafe-call */
import path from 'node:path';
import pico from 'picocolors';
import { type ContentfulConfig } from '@jungvonmatt/contentful-ssg';
import { loadContentfulConfig } from '@jungvonmatt/contentful-config';
import { getEnvironment } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { getManagementClient } from '@jungvonmatt/contentful-client';
import { fetchAll } from 'contentful-management';
import {
  CFDefinitionsBuilder,
  type CFContentType,
  type Renderer,
} from 'cf-content-types-generator';
import { readFile } from 'node:fs/promises';
import semiver from 'semiver';

import {
  DefaultContentTypeRenderer,
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
  cwd?: string;
  configFile?: string;
};

const isLegacyVersion = async (dir?: string) => {
  try {
    const pkgPath = path.join(dir || process.cwd(), 'node_modules', 'contentful', 'package.json');
    const packageJson = JSON.parse(await readFile(pkgPath, 'utf-8')) as {
      name: string;
      version: string;
    };
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
  const loaderResult = await loadContentfulConfig<ContentfulConfig>('contentful', {
    configFile: options?.configFile,
    cwd: options?.cwd,
    required: ['managementToken', 'environmentId', 'spaceId'],
  });

  const config = loaderResult.config;
  const environment = await getEnvironment(config);
  const client = getManagementClient(config);

  console.log(
    `Generating typescript definitions for: ${pico.gray('spaces/')}${pico.green(config.spaceId)}${pico.gray('/environments/')}${pico.green(config.environmentId)}`,
  );

  const contentTypes = await fetchAll(
    (params) =>
      client.contentType.getMany({
        spaceId: config.spaceId,
        environmentId: config.environmentId ?? environment.sys.id,
        ...params,
      }),
    {},
  );

  const legacyVersion =
    typeof options.legacy === 'undefined' ? await isLegacyVersion() : options.legacy;

  const renderers: Renderer[] = [new DefaultContentTypeRenderer()];
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
    builder.appendType(model as CFContentType);
  }

  return builder.toString();
};
