import {
  type Hooks,
  type KeyValueMap,
  type PluginSource,
  type RuntimeContext,
  type TransformContext,
} from '@jungvonmatt/contentful-ssg';
import { join, relative } from 'path';

export type TypeConfigEntry = {
  [x: string]: string;
  view: string;
  path: string;
};
export type PluginConfig = {
  typeConfig: Record<string, TypeConfigEntry>;
};

/**
 * Built-in fields carry special meaning that can affect various aspects of building your site.
 * The values of built-in fields can change things such as a tag's output in the template API or the routes served by your site.
 * See: https://grow.io/reference/documents/#built-in-fields
 */
const buildInFields = [
  'category',
  'date',
  'hidden',
  'localization',
  'order',
  'parent',
  'path',
  'slug',
  'title',
  'view',
  'dates',
  'titles',
];

const getContentTypeDirectory = async (
  contentTypeId: string,
  runtimeContext: RuntimeContext,
): Promise<string> => {
  const contentTypeDirectory = await runtimeContext.hooks.mapDirectory(
    { contentTypeId } as TransformContext,
    contentTypeId,
  );

  return join(runtimeContext.config.directory || process.cwd(), contentTypeDirectory);
};

const plugin = (
  options: PluginConfig,
): Required<Pick<Hooks, 'after' | 'transform' | 'mapEntryLink'>> => ({
  /**
   * Map document links to other yaml documents
   * @param transformContext
   * @param runtimeContext
   * @returns
   */
  async mapEntryLink(
    transformContext: TransformContext,
    runtimeContext?: RuntimeContext,
  ): Promise<string | undefined> {
    const { entry, contentTypeId, entryMap, locale } = transformContext;
    const id = entry?.sys?.id ?? '';
    const directory = await getContentTypeDirectory(contentTypeId, runtimeContext);

    if (id && directory && entryMap.has(id)) {
      const hasBlueprint = Object.keys(options.typeConfig).includes(contentTypeId);
      const localeExt = locale === undefined || locale?.default ? '' : `@${locale?.code}`;
      const file = `${id}${localeExt}.yaml`;
      const func = hasBlueprint ? '!g.doc' : '!g.yaml';
      return `${func} /${join(relative(process.cwd(), directory), file)}`;
    }

    return undefined;
  },

  /**
   * Map keys for build in fields
   * @param {Object} content
   * @param {Object} config
   */
  async transform(
    transformContext: TransformContext,
    runtimeContext: RuntimeContext,
  ): Promise<KeyValueMap> {
    const content = runtimeContext.helper.object.snakeCaseKeys(transformContext?.content ?? {});
    const { entry, contentTypeId } = transformContext;

    if (Object.keys(options.typeConfig || {}).includes(contentTypeId)) {
      return content;
    }

    const dates = {
      created: new Date(entry.sys.createdAt).toISOString(),
      published: new Date(entry.sys.updatedAt).toISOString(),
    };

    return Object.fromEntries<KeyValueMap>(
      Object.entries<any>({ ...dates, date: dates.published, ...content }).map(([key, value]) => {
        if (buildInFields.includes(key)) {
          return [`$${key}`, value];
        }

        return [key, value];
      }),
    );
  },

  /**
   * Add blueprint files
   * @param runtimeContext
   */
  async after(runtimeContext: RuntimeContext) {
    // Add blueprints
    const { fileManager, converter } = runtimeContext;
    const { typeConfig } = options || {};

    const promises = Object.entries<TypeConfigEntry>(typeConfig).map(
      async ([contentType, blueprint]) => {
        try {
          const content = converter.yaml.stringify(blueprint);
          const directory = await getContentTypeDirectory(contentType, runtimeContext);
          const filepath = join(directory, '_blueprint.yaml');
          await fileManager.writeFile(filepath, content);
        } catch (error: unknown) {
          console.log(error);
        }
      },
    );

    return Promise.all(promises);
  },
});

export default plugin as unknown as PluginSource;
