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

const moduleName = (name: string) => `${camelcase(name, { pascalCase: true })}`;
const moduleFieldsName = (name: string) => `${moduleName(name)}Fields`;
const context: RenderContext = { ...createDefaultContext(), moduleName, moduleFieldsName };

class CustomTypeGuardRenderer extends TypeGuardRenderer {
  public createContext(): RenderContext {
    return context;
  }
}

class CustomJsDocRenderer extends JsDocRenderer {
  public createContext(): RenderContext {
    return context;
  }
}
class CustomLocalizedContentTypeRenderer extends LocalizedContentTypeRenderer {
  public createContext(): RenderContext {
    return context;
  }
}

class CustomContentTypeRenderer extends DefaultContentTypeRenderer {
  public createContext(): RenderContext {
    return context;
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
    renderers.push(new CustomLocalizedContentTypeRenderer());
  }

  if (options.jsdoc) {
    renderers.push(new CustomJsDocRenderer());
  }

  if (options.typeguard) {
    renderers.push(new CustomTypeGuardRenderer());
  }

  const builder = new CFDefinitionsBuilder(renderers);

  for (const model of contentTypes) {
    builder.appendType(model);
  }

  return builder.toString();
};
