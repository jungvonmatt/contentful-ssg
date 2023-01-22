import chalk from 'chalk';
import { run, cleanupPrevData } from './index.js';
import { gracefulExit } from 'exit-hook';
import { write } from './tasks/write.js';
import { RunResult, RuntimeContext } from './types.js';
import { getContent } from './__test__/mock.js';

const mockedGracefulExit = <jest.Mock<typeof gracefulExit>>gracefulExit;

jest.mock('./lib/contentful.js', () => {
  const originalModule = jest.requireActual('./lib/contentful.js');
  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    getContent: jest.fn().mockImplementation(async (context) => {
      const mocks = await import('./__test__/mock.js');
      return mocks.getContent();
    }),
  };
});

jest.mock('./lib/file-manager.js', () => ({
  FileManager: function () {
    return {
      initialize: jest.fn(),
      writeFile: jest.fn(),
      deleteFile: jest.fn(),
      cleanup: jest.fn(),
      count: 1,
    };
  },
}));

jest.mock('exit-hook', () => ({
  gracefulExit: jest.fn(),
}));

describe('Run', () => {
  test('main loop', async () => {
    console.log = jest.fn();

    let fileManager;
    const hooks = {
      before: jest.fn().mockResolvedValue({}),
      after: jest.fn().mockResolvedValue({}),
      mapDirectory: jest.fn().mockImplementation((tc, rc, prev) => prev),
      mapFilename: jest.fn().mockImplementation((tc, rc, prev) => prev),
      mapMetaFields: jest.fn().mockImplementation((tc, rc, prev) => prev),
      mapAssetLink: jest.fn().mockImplementation((tc, rc, prev) => prev),
      mapEntryLink: jest.fn().mockImplementation((tc, rc, prev) => prev),
    };

    await run({
      directory: 'test',
      ...hooks,
      transform: (context) => {
        return { ...(context?.content ?? {}), test: [...(context?.content?.test ?? []), 'config'] };
      },
      resolvedPlugins: [
        {
          before: (context) => {
            fileManager = context.fileManager;
          },
        },
        {
          transform: (context) => {
            return {
              ...(context?.content ?? {}),
              test: [...(context?.content?.test ?? []), 'plugin'],
            };
          },
        },
      ],
    });

    expect(hooks.before).toHaveBeenCalled();
    expect(hooks.after).toHaveBeenCalled();
    expect(hooks.mapDirectory).toHaveBeenCalled();
    expect(hooks.mapFilename).toHaveBeenCalled();
    expect(hooks.mapMetaFields).toHaveBeenCalled();
    expect(hooks.mapAssetLink).toHaveBeenCalled();
    expect(hooks.mapEntryLink).toHaveBeenCalled();
    expect(fileManager.writeFile).toHaveBeenCalledTimes(12);

    const output = ((console.log as jest.Mock)?.mock?.calls ?? []).flat().join('\n');
    const calls = (write as jest.Mock)?.mock?.calls ?? [];
    calls.forEach((call) => {
      expect(call?.[0]?.content).toMatchObject({ test: ['plugin', 'config'] });
    });

    expect(output).toMatch(
      `fieldTest: ${chalk.cyan(4)}(de) - ${chalk.cyan(4)}(en-US) - ${chalk.cyan(4)}(en-GB)`
    );
    expect(output).toMatch(`Saved ${chalk.green(12)} entries`);
    expect(output).toMatch(`${chalk.cyan(0)} entries skipped due to validation issues`);
    expect(output).toMatch(`${chalk.red(0)} errors`);
  });

  test('fails on exception before/after', async () => {
    console.log = jest.fn();
    const mockError = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await expect(async () => {
      await run({
        directory: 'test',
        before: mockError,
      });
    }).rejects.toThrowError();

    await expect(async () => {
      await run({
        directory: 'test',
        after: mockError,
      });
    }).rejects.toThrowError();
  });

  test('fails on transform exception', async () => {
    console.log = jest.fn();

    mockedGracefulExit.mockImplementation((number) => {
      throw new Error('process.exit: ' + number);
    });

    await expect(async () => {
      await run({
        directory: 'test',
        transform: async () => {
          throw new Error();
        },
      });
    }).rejects.toThrowError();

    expect(mockedGracefulExit).toHaveBeenCalledWith(1);
    mockedGracefulExit.mockRestore();
  });

  test('does not fail on transform exception with ignoreErrors option', async () => {
    console.log = jest.fn();

    mockedGracefulExit.mockImplementation((number) => {
      throw new Error('process.exit: ' + number);
    });

    await run({
      directory: 'test',
      ignoreErrors: true,
      transform: async () => {
        throw new Error();
      },
    });

    expect(mockedGracefulExit).toBeCalledTimes(0);
    mockedGracefulExit.mockRestore();
  });

  test('does not fail on transform exception in sync mode', async () => {
    console.log = jest.fn();
    mockedGracefulExit.mockImplementation((number) => {
      throw new Error('process.exit: ' + number);
    });

    await run({
      directory: 'test',
      sync: true,
      transform: async () => {
        throw new Error();
      },
    });

    expect(mockedGracefulExit).toBeCalledTimes(0);
    mockedGracefulExit.mockRestore();
  });

  test('cleanupPrevData', async () => {
    const mockData = await getContent();
    const [entry] = mockData.entries;
    const [asset] = mockData.assets;
    const [locale] = mockData.locales;

    const prev: RunResult = {
      observables: {},
      localized: {
        [locale.code]: {
          assets: mockData.assets,
          entries: mockData.entries,
          assetMap: mockData.assetMap,
          entryMap: mockData.entryMap,
        },
      },
    };

    const deletedEntry = { sys: { id: entry.sys.id, type: 'DeletedEntry' } };
    const deletedAsset = { sys: { id: asset.sys.id, type: 'DeletedAsset' } };

    const context: RuntimeContext = {
      defaultLocale: locale.code,
      data: {
        deletedEntries: [deletedEntry],
        deletedAssets: [deletedAsset],
        locales: [locale],
      },
    } as RuntimeContext;

    cleanupPrevData(context, prev);

    for (let node of context.data.deletedEntries) {
      expect(Object.keys(node)).toEqual(expect.arrayContaining(['sys', 'fields']));
      expect(Object.keys(node.sys)).toEqual(expect.arrayContaining(['contentType']));
      expect(node.sys.type).toEqual('DeletedEntry');
    }

    expect(prev.localized[locale.code].entries.length).toBe(mockData.entries.length - 1);
    expect(prev.localized[locale.code].assets.length).toBe(mockData.assets.length - 1);
    expect(prev.localized[locale.code].entryMap.has(deletedEntry.sys.id)).toBe(false);
    expect(prev.localized[locale.code].assetMap.has(deletedAsset.sys.id)).toBe(false);
  });
});
