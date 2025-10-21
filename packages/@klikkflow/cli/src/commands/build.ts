import { Command } from 'commander';
import { execa } from 'execa';

export const buildCommand = new Command()
  .name('build')
  .description('Build the KlikkFlow project')
  .option('-p, --production', 'Build for production')
  .action(async (_options) => {
    try {
      await execa('pnpm', ['build'], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
    } catch (_error) {
      process.exit(1);
    }
  });
