import type { QuestionCollection } from 'inquirer';
import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Log info
 * @param {String} str Info text
 */
export const logInfo = (str: string) => {
  console.log(chalk.cyan(str));
};

/**
 * Log error
 * @param {Error} error Error object
 */
export const logError = (error: Error) => {
  const { message, stack } = error;
  console.error(chalk.red('\nError:'), message);
  if (stack) {
    console.log(stack);
  }
};

/**
 * Render confirm message to the console
 * @param {String} message Error object
 * @param {Boolean} defaultValue Error object
 * @returns {Boolean} Confirm value
 */
export const confirm = async (message: string, defaultValue?: boolean) => {
  const question: QuestionCollection<{ value: boolean }> = [
    {
      type: 'confirm',
      name: 'value',
      message,
      default: Boolean(defaultValue),
    },
  ];
  const answers = await inquirer.prompt(question);

  return Boolean(answers.value);
};
