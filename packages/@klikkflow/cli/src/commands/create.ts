import { Command } from 'commander';
import inquirer from 'inquirer';

export const createCommand = new Command()
  .name('create')
  .description('Create a new KlikkFlow project or component')
  .argument('[name]', 'Project or component name')
  .option('-t, --template <template>', 'Template to use')
  .action(async (name, _options) => {
    if (!name) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is the name of your project?',
          default: 'my-klikkflow-project',
        },
      ]);
      name = answers.name;
    }
  });
