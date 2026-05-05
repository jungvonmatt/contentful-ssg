import { vi } from 'vitest';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { logInfo, logError, confirm } from './ui';

vi.mock('inquirer', () => ({
  default: { prompt: vi.fn(async (args) => args) },
}));

describe('Utils', () => {
  test('logInfo', () => {
    console.log = vi.fn();
    const text = 'test';
    logInfo(text);

    // The first argument of the first call to the function was 'hello'
    expect(console.log).toHaveBeenCalledWith(chalk.cyan(text));
  });

  test('logError', () => {
    console.log = vi.fn();
    console.error = vi.fn();
    const error = new Error('Test');
    error.stack = 'teststack';
    logError(error);

    // The first argument of the first call to the function was 'hello'
    expect(console.error).toHaveBeenCalledWith(chalk.red('\nError:'), error.message);
    expect(console.log).toHaveBeenCalledWith(error.stack);
  });

  test('logError without stack', () => {
    console.log = vi.fn();
    console.error = vi.fn();
    const error = new Error('Test');
    delete error.stack;
    logError(error);
    expect(console.error).toHaveBeenCalledWith(chalk.red('\nError:'), error.message);
    expect(console.log).not.toHaveBeenCalled();
  });

  test('confirm (false)', async () => {
    const message = 'test';
    await confirm(message);

    // console.log(test);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'confirm',
        name: 'value',
        message,
        default: false,
      },
    ]);
  });

  test('confirm (true)', async () => {
    const message = 'test';
    await confirm(message, true);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'confirm',
        name: 'value',
        message,
        default: true,
      },
    ]);
  });
});
