#!/usr/bin/env node
import { Command } from 'commander';
import { DevTools } from './index';

const program = new Command();

program
  .name('reporunner-dev')
  .description('Reporunner development tools CLI')
  .version('1.0.0');

program
  .command('generate:workflow <name>')
  .description('Generate a new workflow')
  .option('-t, --template <type>', 'Template type (basic|api|data-processing|ai-workflow)', 'basic')
  .option('-d, --description <desc>', 'Workflow description')
  .option('-o, --output <path>', 'Output path')
  .action(async (name, options) => {
    const devTools = new DevTools();
    try {
      const path = await devTools.generateWorkflow({
        name,
        template: options.template,
        description: options.description,
        outputPath: options.output,
      });
      console.log(`✅ Generated workflow at: ${path}`);
    } catch (error) {
      console.error('❌ Failed to generate workflow:', error);
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
      const path = await devTools.generateNode({
        type,
        name,
        category: options.category,
        outputPath: options.output,
      });
      console.log(`✅ Generated node at: ${path}`);
    } catch (error) {
      console.error('❌ Failed to generate node:', error);
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
        console.log(`✅ Workflow test passed in ${result.duration}ms`);
      } else {
        console.error(`❌ Workflow test failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to test workflow:', error);
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
      const iterations = parseInt(options.iterations, 10);
      const results = await devTools.benchmarkWorkflow(workflowId, iterations);
      
      console.log('📊 Benchmark Results:');
      console.log(`  Average Duration: ${results.averageDuration.toFixed(2)}ms`);
      console.log(`  Min Duration: ${results.minDuration}ms`);
      console.log(`  Max Duration: ${results.maxDuration}ms`);
      console.log(`  Success Rate: ${results.successRate.toFixed(2)}%`);
    } catch (error) {
      console.error('❌ Failed to benchmark workflow:', error);
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
      
      console.log('🔍 Validation Results:');
      console.log(`  Valid: ${results.valid}`);
      console.log(`  Invalid: ${results.invalid}`);
      
      if (results.errors.length > 0) {
        console.error('\n❌ Errors:');
        results.errors.forEach(error => {
          console.error(`  ${error.file}:`);
          error.errors.forEach(e => console.error(`    - ${e}`));
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to validate workflows:', error);
      process.exit(1);
    }
  });

program.parse();

export { program as devToolsCLI };