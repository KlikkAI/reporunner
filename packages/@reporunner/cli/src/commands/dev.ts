import { Command } from 'commander';
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
    } else if (options.frontendOnly) {
      command = 'dev:frontend';
    } else {
    }

    try {
      await execa('pnpm', [command], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
    } catch (_error) {
      process.exit(1);
    }
  });
