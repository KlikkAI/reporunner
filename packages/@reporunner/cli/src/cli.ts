#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
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
Run ${chalk.cyan(`pnpm add -g ${packageJson.name}`)} to update`,
  });
}

// ASCII Art Banner
function showBanner(): void {
  // TODO: Implement ASCII art banner display
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
process.on('uncaughtException', (_error) => {
  if (program.opts().verbose) {
  }
  process.exit(1);
});

process.on('unhandledRejection', (_reason, _promise) => {
  process.exit(1);
});

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
