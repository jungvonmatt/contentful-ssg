import { ContentfulConfig, KeyValueMap } from '@jungvonmatt/contentful-ssg';
import { getEnvironment } from '@jungvonmatt/contentful-ssg/lib/contentful';
import { getMockData, ContentTypes } from './lib/faker.js';

export async function createFakes(
  config: ContentfulConfig,
  contentTypeIds: string[]
): Promise<Record<string, KeyValueMap[]>> {
  const environment = await getEnvironment(config);
  const { items: contentTypes } = await environment.getContentTypes();
  const { items } = await environment.getEditorInterfaces();

  const interfaces: ContentTypes = Object.fromEntries(
    items
      .filter(
        (item) => !contentTypeIds.length || contentTypeIds.includes(item.sys.contentType.sys.id)
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
      })
  );

  const data = await getMockData(interfaces);

  return Object.fromEntries(
    Object.entries(interfaces).map(([contentTypeId, fields]) => {
      const { [contentTypeId]: fakeData = {} } = data;
      const required = Object.fromEntries(
        fields.map((field) => [field.settings.id, field.settings.required])
      );

      const minData = Object.fromEntries(
        Object.entries(fakeData).filter(([fieldId]) => required?.[fieldId])
      );
      return [contentTypeId, [fakeData, minData]];
    })
  );
}
