import { Command } from 'commander';

export const workflowCommand = new Command()
  .name('workflow')
  .description('Manage workflows')
  .addCommand(
    new Command()
      .name('list')
      .description('List all workflows')
      .action(() => {
        // TODO: Implement workflow list functionality
      })
  )
  .addCommand(
    new Command()
      .name('run')
      .description('Run a workflow')
      .argument('<id>', 'Workflow ID')
      .action((_id) => {
        // TODO: Implement workflow run functionality
      })
  );
