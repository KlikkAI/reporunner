import { Command } from 'commander';

export const authCommand = new Command()
  .name('auth')
  .description('Manage authentication')
  .action(() => {});
