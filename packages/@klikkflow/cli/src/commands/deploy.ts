import { Command } from 'commander';

export const deployCommand = new Command()
  .name('deploy')
  .description('Deploy KlikkFlow to production')
  .option('-e, --env <environment>', 'Target environment', 'production')
  .action((_options) => {
    // TODO: Implement deployment logic
  });
