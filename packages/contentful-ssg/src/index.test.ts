import chalk from 'chalk';
import { run } from './index.js';
import { write } from './tasks/write.js';
import { FileManager } from './lib/file-manager.js';
// jest.mock('./tasks/write.js', () => ({ write: jest.fn().mockResolvedValue(true) }));
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
        { before: (context) => {
          fileManager = context.fileManager;
        } },
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
});
