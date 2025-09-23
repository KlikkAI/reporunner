import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';

export const buildCommand = new Command()
  .name('build')
  .description('Build the Reporunner project')
  .option('-p, --production', 'Build for production')
  .action(async (options) => {
    console.log(chalk.blue('Building Reporunner...'));

    try {
      const { stdout } = await execa('pnpm', ['build'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
      console.log(stdout);
      console.log(chalk.green('✓ Build completed successfully'));
    } catch (error) {
      console.error(chalk.red('✗ Build failed:'), error);
      process.exit(1);
    }
  });
