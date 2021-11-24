import chalk from 'chalk';
import inquirer from 'inquirer';
import { logInfo, logError, confirm } from './ui';

jest.mock('inquirer', () => ({
  prompt: jest.fn(async (args) => args),
}));

describe('Utils', () => {
  test('logInfo', () => {
    console.log = jest.fn();
    const text = 'test';
    logInfo(text);

    // The first argument of the first call to the function was 'hello'
    expect(console.log).toHaveBeenCalledWith(chalk.cyan(text));
  });

  test('logError', () => {
    console.log = jest.fn();
    console.error = jest.fn();
    const error = new Error('Test');
    error.stack = 'teststack';
    logError(error);

    // The first argument of the first call to the function was 'hello'
    expect(console.error).toHaveBeenCalledWith(chalk.red('\nError:'), error.message);
    expect(console.log).toHaveBeenCalledWith(error.stack);
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
