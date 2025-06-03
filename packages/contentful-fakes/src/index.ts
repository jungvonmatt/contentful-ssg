import { type ContentfulConfig, type KeyValueMap } from '@jungvonmatt/contentful-ssg';
import { getEnvironment } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { loadContentfulConfig } from '@jungvonmatt/contentful-config';
import { getMockData, type ContentTypes } from './lib/faker.js';

export async function createFakes(
  contentTypeIds: string[],
  configFile?: string,
  cwd?: string,
): Promise<Record<string, KeyValueMap[]>> {
  const loaderResult = await loadContentfulConfig<ContentfulConfig>('contentful-ssg', {
    configFile,
    required: ['managementToken', 'environmentId', 'spaceId'],
    cwd,
  });

  const environment = await getEnvironment(loaderResult.config);
  const { items: contentTypes } = await environment.getContentTypes();
  const { items } = await environment.getEditorInterfaces();

  const interfaces: ContentTypes = Object.fromEntries(
    items
      .filter(
        (item) => !contentTypeIds.length || contentTypeIds.includes(item.sys.contentType.sys.id),
      )
      .map((item) => {
        const { id } = item.sys.contentType.sys;
        const contentType = contentTypes.find((ct) => ct.sys.id === id);
        const { controls } = item;

        const fields = controls.map((control) => {
          const { fieldId } = control;
          const fieldSettings = contentType.fields.find((field) => field.id === fieldId);
          return { interface: control, settings: fieldSettings };
        });
        return [id, fields];
      }),
  );

  const data = await getMockData(interfaces);

  return Object.fromEntries(
    Object.entries(interfaces).map(([contentTypeId, fields]) => {
      const { [contentTypeId]: fakeData = {} } = data;
      const required = Object.fromEntries(
        fields.map((field) => [field.settings.id, field.settings.required]),
      );

      const minData = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.entries(fakeData).filter(([fieldId]) => required?.[fieldId]),
      );
      return [contentTypeId, [fakeData, minData]];
    }),
  );
}
