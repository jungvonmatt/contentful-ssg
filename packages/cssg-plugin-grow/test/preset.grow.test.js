const { mapGrowLink, mapBuildInFields } = require('../lib/presets/grow');
const { getContent } = require('./utils');

describe('Preset: grow', () => {
  test('mapGrowLink (doc)', async () => {
    const { entry } = await getContent();
    const typeConfig = { test: {} };
    const entries = new Map([[entry.sys.id, entry]]);
    const value = await mapGrowLink(entry, { contentType: 'test', typeConfig, directory: '', entries });

    expect(value).toEqual(`!g.doc /test/${entry.sys.id}.yaml`);
  });

  test('mapGrowLink (yaml)', async () => {
    const { entry } = await getContent();
    const typeConfig = {};
    const entries = new Map([[entry.sys.id, entry]]);
    const value = await mapGrowLink(entry, { contentType: 'test', typeConfig, directory: '', entries });
    expect(value).toEqual(`!g.yaml /test/${entry.sys.id}.yaml`);
  });

  test('mapGrowLink (invalid)', async () => {
    const { entry, entryLink } = await getContent();
    const typeConfig = {};
    const entries = new Map([[entry.sys.id, entry]]);
    const value = await mapGrowLink(entryLink, { contentType: 'test', typeConfig, directory: '', entries });
    expect(value).toBe(undefined);
  });
});
