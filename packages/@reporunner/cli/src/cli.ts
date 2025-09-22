#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import figlet from 'figlet';
import { readFileSync } from 'fs';
import { join } from 'path';
import updateNotifier from 'update-notifier';
import { authCommand } from './commands/auth';
import { buildCommand } from './commands/build';
// Import commands
import { createCommand } from './commands/create';
import { deployCommand } from './commands/deploy';
import { devCommand } from './commands/dev';
import { nodeCommand } from './commands/node';
import { startCommand } from './commands/start';
import { workflowCommand } from './commands/workflow';

// Get package info
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

// Check for updates
const notifier = updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24, // 24 hours
});

if (notifier.update) {
  notifier.notify({
    defer: false,
    message: `Update available ${chalk.dim(notifier.update.current)} → ${chalk.green(
      notifier.update.latest
    )}
Run ${chalk.cyan(`npm install -g ${packageJson.name}`)} to update`,
  });
}

// ASCII Art Banner
function showBanner(): void {
  console.log(
    chalk.cyan(
      figlet.textSync('Reporunner', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  );
  console.log(chalk.gray(`v${packageJson.version} - AI-powered workflow automation platform`));
  console.log();
}

// Create CLI program
const program = new Command();

program
  .name('reporunner')
  .description('Reporunner CLI - Build and manage AI-powered workflows')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-banner', 'Disable banner display')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().banner !== false) {
      showBanner();
    }
  });

// Add commands
program.addCommand(createCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(deployCommand);
program.addCommand(startCommand);
program.addCommand(nodeCommand);
program.addCommand(workflowCommand);
program.addCommand(authCommand);

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise);
  console.error(chalk.red('Reason:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
