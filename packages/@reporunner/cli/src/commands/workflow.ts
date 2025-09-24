import { Command } from 'commander';

export const workflowCommand = new Command()
  .name('workflow')
  .description('Manage workflows')
  .addCommand(
    new Command()
      .name('list')
      .description('List all workflows')
      .action(() => {})
  )
  .addCommand(
    new Command()
      .name('run')
      .description('Run a workflow')
      .argument('<id>', 'Workflow ID')
      .action((_id) => {})
  );
