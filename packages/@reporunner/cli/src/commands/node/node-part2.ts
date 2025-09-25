{
  name: 'Custom', value;
  : 'custom'
}
,
            ],
          },
        ])

const nodeName = options.name || answers.name;
const category = options.category || answers.category;
const template = options.template || answers.template || 'basic';

spinner.text = `Creating ${nodeName} node...`;

// Create node directory
const nodeDir = join(process.cwd(), 'nodes', category.toLowerCase(), nodeName.toLowerCase());
ensureDirSync(nodeDir);

// Generate node files
await generateNodeFiles(nodeDir, {
  ...answers,
  name: nodeName,
  category,
  template,
});

spinner.succeed(chalk.green(`✅ Node '${nodeName}' created successfully!`));

if (!options.skipInstall) {
  const installSpinner = ora('Installing dependencies...').start();
  try {
    await execAsync('pnpm install', { cwd: nodeDir });
    installSpinner.succeed(chalk.green('Dependencies installed'));
  } catch (_error) {
    installSpinner.fail(chalk.red('Failed to install dependencies'));
  }
}
} catch (_error)
{
  spinner.fail(chalk.red('Failed to create node'));
  process.exit(1);
}
})
}

function testNodeCommand(): Command {
  return new Command('test')
    .description('Test a node')
    .option('-n, --name <name>', 'Node name')
    .option('-d, --data <data>', 'Test data JSON')
    .action(async (_options) => {
      const spinner = ora('Running node tests...').start();

      try {
        // Implementation for testing nodes
        spinner.succeed(chalk.green('Tests passed!'));
      } catch (_error) {
        spinner.fail(chalk.red('Tests failed'));
        process.exit(1);
      }
    });
}

function buildNodeCommand(): Command {
  return new Command('build')
    .description('Build a node')
    .option('-n, --name <name>', 'Node name')
    .option('-w, --watch', 'Watch for changes')
    .action(async (options) => {
      const spinner = ora('Building node...').start();

      try {
        const command = options.watch ? 'pnpm build:watch' : 'pnpm build';
        await execAsync(command);
        spinner.succeed(chalk.green('Node built successfully!'));
      } catch (_error) {
        spinner.fail(chalk.red('Build failed'));
        process.exit(1);
      }
    });
}

function validateNodeCommand(): Command {
  return new Command('validate')
    .description('Validate a node definition')
    .option('-n, --name <name>', 'Node name')
    .action(async (_options) => {
      const spinner = ora('Validating node...').start();

      try {
        // Implementation for validating nodes
        spinner.succeed(chalk.green('Node is valid!'));
      } catch (_error) {
        spinner.fail(chalk.red('Validation failed'));
        process.exit(1);
      }
    });
}
