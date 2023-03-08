/* _eslint-disable @typescript-eslint/no-unsafe-call */
import { ContentfulConfig, ContentType } from '@jungvonmatt/contentful-ssg';
import { getConfig } from '@jungvonmatt/contentful-ssg/lib/config';
import { getEnvironment, pagedGet } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { askMissing } from '@jungvonmatt/contentful-ssg/lib/ui';
import camelcase from 'camelcase';
import {
  CFDefinitionsBuilder,
  ContentTypeRenderer,
  createDefaultContext,
  DefaultContentTypeRenderer,
  JsDocRenderer,
  LocalizedContentTypeRenderer,
  RenderContext,
  TypeGuardRenderer,
} from 'cf-content-types-generator';

type Options = {
  localized?: boolean;
  jsdoc?: boolean;
  typeguard?: boolean;
};

class CustomContentTypeRenderer extends DefaultContentTypeRenderer {
  public createContext(): RenderContext {
    const moduleName = (name: string) => `${camelcase(name, { pascalCase: true })}`;
    const moduleFieldsName = (name: string) => `${moduleName(name)}Fields`;

    return { ...createDefaultContext(), moduleName, moduleFieldsName };
  }
}

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

  const renderers: ContentTypeRenderer[] = [new CustomContentTypeRenderer()];
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
