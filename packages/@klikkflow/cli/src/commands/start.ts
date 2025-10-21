import { Command } from 'commander';

export const startCommand = new Command()
  .name('start')
  .description('Start KlikkFlow in production mode')
  .option('--tunnel', 'Start with tunnel support')
  .action((options) => {
    if (options.tunnel) {
      // TODO: Implement tunnel support for production mode
    }
  });
