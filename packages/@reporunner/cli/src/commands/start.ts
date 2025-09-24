import { Command } from 'commander';

export const startCommand = new Command()
  .name('start')
  .description('Start Reporunner in production mode')
  .option('--tunnel', 'Start with tunnel support')
  .action((options) => {
    if (options.tunnel) {
    }
  });
