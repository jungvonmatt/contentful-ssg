import { write } from './write.js';
import { stringify } from '../converter/toml.js';
import { getRuntimeContext, getTransformContext, getConfig } from '../__test__/mock.js';
import { Locale } from '../types.js';

jest.mock('../mapper/map-entry.js', () => ({
  mapEntry: jest.fn().mockResolvedValue({ mocked: true }),
}));

describe('write', () => {
  test('write json file with format passed as string', async () => {
    const config = getConfig({
      format: 'json',
    });
    const runtimeContext = getRuntimeContext();
    const transformContext = getTransformContext({
      id: 'id',
      locale: { default: false, code: 'de-DE' } as Locale,
      contentTypeId: 'c-test',
      content: { test: 'test' },
    });

    await write(transformContext, runtimeContext, config);

    expect(runtimeContext.fileManager.writeFile).toHaveBeenCalled();
    const calls = (runtimeContext.fileManager.writeFile as jest.Mock)?.mock?.calls ?? [];

    expect(calls[0][0]).toEqual('test/c-test/id@de_DE.json');
    expect(calls[0][1]).toMatch(/"test"\s*:\s*"test"/);
  });

  test('write json file with format passed as object', async () => {
    const config = getConfig({
      format: { json: ['test'], md: ['/content'] },
    });
    const runtimeContext = getRuntimeContext();
    const transformContext = getTransformContext({
      id: 'id',
      locale: { default: false, code: 'de-DE' } as Locale,
      contentTypeId: 'c-test',
      content: { test: 'test' },
    });

    await write(transformContext, runtimeContext, config);

    expect(runtimeContext.fileManager.writeFile).toHaveBeenCalled();
    const calls = (runtimeContext.fileManager.writeFile as jest.Mock)?.mock?.calls ?? [];

    expect(calls[0][0]).toEqual('test/c-test/id@de_DE.json');
    expect(calls[0][1]).toMatch(/"test"\s*:\s*"test"/);
  });

  test('write yaml file as default', async () => {
    const config = getConfig({
      format: { json: ['none'], md: ['/content'] },
    });
    const runtimeContext = getRuntimeContext();
    const transformContext = getTransformContext({
      id: 'id',
      locale: { default: true, code: 'de-DE' } as Locale,
      contentTypeId: 'c-test',
      content: { test: 'test' },
    });

    await write(transformContext, runtimeContext, config);

    expect(runtimeContext.fileManager.writeFile).toHaveBeenCalled();
    const calls = (runtimeContext.fileManager.writeFile as jest.Mock)?.mock?.calls ?? [];

    expect(calls[0][0]).toEqual('test/c-test/id.yaml');
    expect(calls[0][1]).toMatch(/test\s*:\s*test/);
  });

  test('write json file with format passed function', async () => {
    const config = getConfig({
      format: () => 'toml',
    });
    const runtimeContext = getRuntimeContext();
    const transformContext = getTransformContext({
      id: 'id',
      locale: { default: true, code: 'de-DE' } as Locale,
      contentTypeId: 'c-test',
      content: { test: 'test' },
    });

    await write(transformContext, runtimeContext, config);

    expect(runtimeContext.fileManager.writeFile).toHaveBeenCalled();
    const calls = (runtimeContext.fileManager.writeFile as jest.Mock)?.mock?.calls ?? [];

    expect(calls[0][0]).toEqual('test/c-test/id.toml');
    expect(calls[0][1]).toEqual(stringify({ test: 'test' }));
  });
});
