import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';

export const devCommand = new Command()
  .name('dev')
  .description('Start development server')
  .option('-b, --backend-only', 'Start backend only')
  .option('-f, --frontend-only', 'Start frontend only')
  .action(async (options) => {
    let command = 'dev:full';

    if (options.backendOnly) {
      command = 'dev:backend';
      console.log(chalk.blue('Starting backend development server...'));
    } else if (options.frontendOnly) {
      command = 'dev:frontend';
      console.log(chalk.blue('Starting frontend development server...'));
    } else {
      console.log(chalk.blue('Starting full development environment...'));
    }

    try {
      await execa('pnpm', [command], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to start dev server:'), error);
      process.exit(1);
    }
  });
