import chalk from 'chalk';
import { writeFile } from 'fs/promises';
import { Locale, TransformContext } from '../types.js';
import { ErrorEntry, ValidationError } from './error.js';
import { Stats } from './stats.js';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(true),
}));

const getContext = (context = {}): TransformContext => {
  return {
    id: 'id',
    locale: { code: 'de' } as Locale,
    contentTypeId: 'contentTypeId',
    ...context,
  } as TransformContext;
};

const errorEntry: ErrorEntry = {
  spaceId: 'spaceId',
  environmentId: 'environmentId',
  entryId: 'entryId',
  contentTypeId: 'contentTypeId',
  locale: { code: 'de' } as Locale,
  missingFields: ['invalid-field'],
};

describe('Stats', () => {
  test('non-verbose', async () => {
    console.log = jest.fn();
    const stats = new Stats({ directory: 'test', verbose: false });
    stats.addSuccess(getContext(), 'test-success');
    stats.addSkipped(getContext(), new ValidationError(errorEntry));
    stats.addError(getContext(), new Error('test-error'));

    await stats.print();

    expect(console.log).toHaveBeenCalled();

    const calls = (console.log as jest.Mock)?.mock?.calls ?? [];
    const message = calls.flat().join('\n');

    expect(message).toMatch(`contentTypeId: ${chalk.cyan(1)}(de)`);

    expect(message).toMatch(`Saved ${chalk.green(1)} entries`);
    expect(message).toMatch(`${chalk.cyan(1)} entries skipped due to validation issues`);
    expect(message).toMatch(`${chalk.red(1)} errors`);
    expect(message).toMatch(`Use --verbose to see actual errors`);
  });
  test('verbose', async () => {
    console.log = jest.fn();
    const stats = new Stats({ directory: 'test', verbose: true });
    stats.addSuccess(getContext(), 'test-success');
    stats.addSkipped(getContext(), new ValidationError(errorEntry));
    stats.addError(getContext(), new Error('test-error'));

    await stats.print();

    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalled();

    const writeCalls = (writeFile as jest.Mock)?.mock?.calls ?? [];

    const calls = (console.log as jest.Mock)?.mock?.calls ?? [];
    const message = calls.flat().join('\n');

    expect(message).toMatch(`contentTypeId: ${chalk.cyan(1)}(de)`);

    expect(message).toMatch(`Saved ${chalk.green(1)} entries`);
    expect(message).toMatch(`${chalk.cyan(1)} entries skipped due to validation issues`);
    expect(message).toMatch(`${chalk.red(1)} errors`);
    expect(message).toMatch(/See validation-errors-\d+\.log/);
    expect(message).toMatch(/See errors-\d+\.log/);
    expect(writeCalls[0][0]).toMatch(/validation-errors-\d+\.log/);
    expect(writeCalls[1][0]).toMatch(/errors-\d+\.log/);
  });
});
