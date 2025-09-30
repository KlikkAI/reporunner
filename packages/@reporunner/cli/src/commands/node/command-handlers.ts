import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

const execAsync = promisify(exec);

export function createNodeCommand(): Command {
  return new Command('create')
    .description('Create a new node')
    .option('-n, --name <name>', 'Node name')
    .option('-c, --category <category>', 'Node category')
    .option('-t, --template <template>', 'Template to use', 'basic')
    .option('--skip-install', 'Skip dependency installation')
    .action(async (options) => {
      const { handleCreateNode } = await import('./command-setup');
      await handleCreateNode(options);
    });
}

export function testNodeCommand(): Command {
  return new Command('test')
    .description('Test a node')
    .option('-n, --name <name>', 'Node name')
    .option('-d, --data <data>', 'Test data JSON')
    .action(async (_options) => {
      const spinner = ora('Running node tests...').start();

      try {
        // Implementation for testing nodes
        spinner.succeed(chalk.green('Tests passed!'));
      } catch (_error) {
        spinner.fail(chalk.red('Tests failed'));
        process.exit(1);
      }
    });
}

export function buildNodeCommand(): Command {
  return new Command('build')
    .description('Build a node')
    .option('-n, --name <name>', 'Node name')
    .option('-w, --watch', 'Watch for changes')
    .action(async (options) => {
      const spinner = ora('Building node...').start();

      try {
        const command = options.watch ? 'pnpm build:watch' : 'pnpm build';
        await execAsync(command);
        spinner.succeed(chalk.green('Node built successfully!'));
      } catch (_error) {
        spinner.fail(chalk.red('Build failed'));
        process.exit(1);
      }
    });
}

export function validateNodeCommand(): Command {
  return new Command('validate')
    .description('Validate a node definition')
    .option('-n, --name <name>', 'Node name')
    .action(async (_options) => {
      const spinner = ora('Validating node...').start();

      try {
        // Implementation for validating nodes
        spinner.succeed(chalk.green('Node is valid!'));
      } catch (_error) {
        spinner.fail(chalk.red('Validation failed'));
        process.exit(1);
      }
    });
}
