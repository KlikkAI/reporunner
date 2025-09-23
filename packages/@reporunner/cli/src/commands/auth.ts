import { Command } from 'commander';
import chalk from 'chalk';

export const authCommand = new Command()
  .name('auth')
  .description('Manage authentication')
  .action(() => {
    console.log(chalk.yellow('Auth command not yet implemented'));
  });
