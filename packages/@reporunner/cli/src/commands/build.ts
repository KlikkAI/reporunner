import { Command } from 'commander';
import { execa } from 'execa';

export const buildCommand = new Command()
  .name('build')
  .description('Build the Reporunner project')
  .option('-p, --production', 'Build for production')
  .action(async (_options) => {
    try {
      const { stdout } = await execa('pnpm', ['build'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
    } catch (_error) {
      process.exit(1);
    }
  });
