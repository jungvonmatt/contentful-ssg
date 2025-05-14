import { type ContentfulConfig, type KeyValueMap } from '@jungvonmatt/contentful-ssg';
import { getEnvironment } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { getConfig } from '@jungvonmatt/contentful-ssg/lib/config';
import { askMissing } from '@jungvonmatt/contentful-ssg/lib/ui';
import { getMockData, type ContentTypes } from './lib/faker.js';

export async function createFakes(
  contentTypeIds: string[],
  moduleName?: string,
  configFile?: string,
): Promise<Record<string, KeyValueMap[]>> {
  const contentfulConfig = (await askMissing(
    await getConfig({
      previewAccessToken: '-',
      accessToken: '-',
      moduleName,
      configFile,
    }),
  )) as ContentfulConfig;
  const environment = await getEnvironment(contentfulConfig);
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
