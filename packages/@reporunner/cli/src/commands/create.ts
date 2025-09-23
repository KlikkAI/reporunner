import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

export const createCommand = new Command()
  .name('create')
  .description('Create a new Reporunner project or component')
  .argument('[name]', 'Project or component name')
  .option('-t, --template <template>', 'Template to use')
  .action(async (name, options) => {
    if (!name) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is the name of your project?',
          default: 'my-reporunner-project',
        },
      ]);
      name = answers.name;
    }

    console.log(chalk.blue(`Creating new project: ${name}`));
    console.log(chalk.yellow('Create command not yet fully implemented'));
  });
