import { Mock, vi } from 'vitest';
import chalk from 'chalk';
import { ReplaySubject } from 'rxjs';
import { writeFile } from 'fs/promises';
import { ErrorEntry, Locale, ObservableContext, RunResult, TransformContext } from '../types.js';
import { ValidationError } from './error.js';
import { Stats } from './stats.js';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(true),
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
    console.log = vi.fn();
    const stats = new Stats({ directory: 'test', verbose: false });
    stats.addSuccess(getContext(), 'test-success');
    stats.addSkipped(getContext(), new ValidationError(errorEntry));
    stats.addError(getContext(), new Error('test-error'));

    await stats.print();

    expect(console.log).toHaveBeenCalled();

    const calls = (console.log as Mock)?.mock?.calls ?? [];
    const message = calls.flat().join('\n');

    expect(message).toMatch(`contentTypeId: ${chalk.cyan(1)}(de)`);

    expect(message).toMatch(`Saved ${chalk.green(1)} entries`);
    expect(message).toMatch(`${chalk.cyan(1)} entries skipped due to validation issues`);
    expect(message).toMatch(`${chalk.red(1)} errors`);
    expect(message).toMatch(`Use --verbose to see actual errors`);
  });
  test('verbose', async () => {
    console.log = vi.fn();
    const stats = new Stats({ directory: 'test', verbose: true });
    stats.addSuccess(getContext(), 'test-success');
    stats.addSkipped(getContext(), new ValidationError(errorEntry));
    stats.addError(getContext(), new Error('test-error'));

    await stats.print();

    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalled();

    const writeCalls = (writeFile as Mock)?.mock?.calls ?? [];

    const calls = (console.log as Mock)?.mock?.calls ?? [];
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

  test('addError wraps non-Error values', () => {
    const stats = new Stats({ directory: 'test', verbose: false });
    stats.addError(getContext(), 'plain string error');
    stats.addError(getContext(), { weird: true });

    expect(stats.errors).toHaveLength(2);
    expect(stats.errors[0].error).toBeInstanceOf(Error);
    expect((stats.errors[0].error as Error).message).toBe('plain string error');
    expect(stats.errors[1].error).toBeInstanceOf(Error);
  });

  test('print with prev RunResult logs sync cache totals', async () => {
    console.log = vi.fn();

    const makeObservable = (
      ctxs: Array<Partial<ObservableContext>>,
    ): ReplaySubject<ObservableContext> => {
      const subject = new ReplaySubject<ObservableContext>();
      ctxs.forEach((ctx) => subject.next(ctx as ObservableContext));
      subject.complete();
      return subject;
    };

    const prev: RunResult = {
      observables: {
        a: makeObservable([{ error: undefined }, { error: undefined }, { error: new Error('x') }]),
        b: makeObservable([{ error: undefined }]),
      },
      localized: {},
    };

    const stats = new Stats({ directory: 'test', verbose: false });
    stats.addSuccess(getContext(), 'ok');
    await stats.print(prev);

    const calls = (console.log as Mock)?.mock?.calls ?? [];
    const message = calls.flat().join('\n');
    expect(message).toMatch(
      `Sync cache contains ${chalk.green(3)} entries and ${chalk.red(1)} errors`,
    );
    expect(message).toMatch(`Saved ${chalk.green(1)} new entries`);
  });
});
