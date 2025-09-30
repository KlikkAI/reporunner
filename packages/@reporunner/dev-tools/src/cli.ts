#!/usr/bin/env node
import { Command } from 'commander';
import { DevTools } from './index';

const program = new Command();

program.name('reporunner-dev').description('Reporunner development tools CLI').version('1.0.0');

program
  .command('generate:workflow <name>')
  .description('Generate a new workflow')
  .option('-t, --template <type>', 'Template type (basic|api|data-processing|ai-workflow)', 'basic')
  .option('-d, --description <desc>', 'Workflow description')
  .option('-o, --output <path>', 'Output path')
  .action(async (name, options) => {
    const devTools = new DevTools();
    try {
      const _path = await devTools.generateWorkflow({
        name,
        template: options.template,
        description: options.description,
        outputPath: options.output,
      });
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('generate:node <type> <name>')
  .description('Generate a new node')
  .option('-c, --category <category>', 'Node category', 'custom')
  .option('-o, --output <path>', 'Output path')
  .action(async (type, name, options) => {
    const devTools = new DevTools();
    try {
      const _path = await devTools.generateNode({
        type,
        name,
        category: options.category,
        outputPath: options.output,
      });
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('test:workflow <workflowId>')
  .description('Test a workflow')
  .option('-d, --data <json>', 'Test data JSON')
  .action(async (workflowId, options) => {
    const devTools = new DevTools();
    try {
      const testData = options.data ? JSON.parse(options.data) : undefined;
      const result = await devTools.testWorkflow(workflowId, testData);

      if (result.status === 'passed') {
      } else {
        process.exit(1);
      }
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('benchmark:workflow <workflowId>')
  .description('Benchmark a workflow')
  .option('-i, --iterations <number>', 'Number of iterations', '10')
  .action(async (workflowId, options) => {
    const devTools = new DevTools();
    try {
      const iterations = Number.parseInt(options.iterations, 10);
      const _results = await devTools.benchmarkWorkflow(workflowId, iterations);
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('validate:workflows [directory]')
  .description('Validate workflows in a directory')
  .action(async (directory) => {
    const devTools = new DevTools();
    try {
      const results = await devTools.validateWorkflows(directory);

      if (results.errors.length > 0) {
        results.errors.forEach((error) => {
          error.errors.forEach((_e) => {});
        });
        process.exit(1);
      }
    } catch (_error) {
      process.exit(1);
    }
  });

program.parse();

export { program as devToolsCLI };
