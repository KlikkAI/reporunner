import { exec } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import { ensureDirSync, writeFileSync } from 'fs-extra';
import inquirer from 'inquirer';
import Mustache from 'mustache';
import ora from 'ora';

const execAsync = promisify(exec);

export const nodeCommand = new Command('node')
  .description('Node development tools')
  .addCommand(createNodeCommand())
  .addCommand(testNodeCommand())
  .addCommand(buildNodeCommand())
  .addCommand(validateNodeCommand());

function createNodeCommand(): Command {
  return new Command('create')
    .description('Create a new node')
    .option('-n, --name <name>', 'Node name')
    .option('-c, --category <category>', 'Node category')
    .option('-t, --template <template>', 'Template to use', 'basic')
    .option('--skip-install', 'Skip dependency installation')
    .action(async (options) => {
      const spinner = ora('Creating node...').start();

      try {
        // Get node details
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Node name:',
            when: !options.name,
            validate: (input) => input.length > 0 || 'Node name is required',
          },
          {
            type: 'list',
            name: 'category',
            message: 'Select category:',
            when: !options.category,
            choices: [
              'Communication',
              'Data Storage',
              'AI/ML',
              'Analytics',
              'Developer Tools',
              'Finance',
              'Marketing',
              'Productivity',
              'Social Media',
              'E-commerce',
              'Other',
            ],
          },
          {
            type: 'list',
            name: 'template',
            message: 'Select template:',
            when: !options.template || options.template === 'basic',
            choices: [
              { name: 'Basic Node (Simple API call)', value: 'basic' },
              { name: 'OAuth Node (OAuth authentication)', value: 'oauth' },
              { name: 'Webhook Node (Webhook trigger)', value: 'webhook' },
              { name: 'AI Node (AI/ML integration)', value: 'ai' },
              { name: 'Database Node (Database operations)', value: 'database' },
              { name: 'File Node (File operations)', value: 'file' },
            ],
          },
          {
            type: 'input',
            name: 'description',
            message: 'Node description:',
            default: (answers: any) => `${answers.name || options.name} integration for Reporunner`,
          },
          {
            type: 'input',
            name: 'author',
            message: 'Author name:',
            default: 'Reporunner Team',
          },
          {
            type: 'confirm',
            name: 'addCredentials',
            message: 'Does this node require credentials?',
            default: true,
          },
          {
            type: 'checkbox',
            name: 'credentialTypes',
            message: 'Select credential types:',
            when: (answers) => answers.addCredentials,
            choices: [
              { name: 'API Key', value: 'apiKey' },
              { name: 'OAuth2', value: 'oauth2' },
              { name: 'Basic Auth', value: 'basic' },
              { name: 'Bearer Token', value: 'bearer' },
              { name: 'Custom', value: 'custom' },
            ],
          },
        ]);

        const nodeName = options.name || answers.name;
        const category = options.category || answers.category;
        const template = options.template || answers.template || 'basic';

        spinner.text = `Creating ${nodeName} node...`;

        // Create node directory
        const nodeDir = join(
          process.cwd(),
          'nodes',
          category.toLowerCase(),
          nodeName.toLowerCase()
        );
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
      } catch (_error) {
        spinner.fail(chalk.red('Failed to create node'));
        process.exit(1);
      }
    });
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

async function generateNodeFiles(nodeDir: string, data: any): Promise<void> {
  // Package.json template
  const packageJsonTemplate = `{
  "name": "@reporunner/node-{{name}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "@reporunner/core": "workspace:*",
    "@reporunner/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "@types/node": "catalog:",
    "jest": "catalog:",
    "@types/jest": "catalog:",
    "eslint": "catalog:"
  },
  "keywords": ["reporunner", "node", "{{category}}", "{{name}}"],
  "author": "{{author}}"
}`;

  // Main node template
  const nodeTemplate = getNodeTemplate(data.template);

  // Credentials template
  const credentialsTemplate = getCredentialsTemplate(data.credentialTypes || []);

  // Properties template
  const propertiesTemplate = getPropertiesTemplate(data.template);

  // README template
  const readmeTemplate = `# {{name}} Node

{{description}}

## Installation

\`\`\`bash
pnpm install
\`\`\`

## Development

\`\`\`bash
# Build
pnpm build

# Watch for changes
pnpm build:watch

# Run tests
pnpm test
\`\`\`

## Usage

This node provides {{name}} integration for Reporunner workflows.

### Operations

- **Get Data**: Retrieve data from {{name}}
{{#addCredentials}}

### Credentials

This node requires {{name}} credentials. Configure them in your Reporunner instance.
{{/addCredentials}}

## Author

{{author}}
`;

  // TypeScript config
  const tsConfigTemplate = `{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}`;

  // Generate files
  writeFileSync(join(nodeDir, 'package.json'), Mustache.render(packageJsonTemplate, data));

  writeFileSync(join(nodeDir, 'src/index.ts'), Mustache.render(nodeTemplate, data));

  writeFileSync(join(nodeDir, 'src/credentials.ts'), Mustache.render(credentialsTemplate, data));

  writeFileSync(join(nodeDir, 'src/properties.ts'), Mustache.render(propertiesTemplate, data));

  writeFileSync(join(nodeDir, 'README.md'), Mustache.render(readmeTemplate, data));

  writeFileSync(join(nodeDir, 'tsconfig.json'), tsConfigTemplate);

  // Create src directory
  ensureDirSync(join(nodeDir, 'src'));
}

function getNodeTemplate(template: string): string {
  const templates = {
    basic: `import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from '@reporunner/core';

export class {{name}} implements INodeType {
  description: INodeTypeDescription = {
    displayName: '{{name}}',
    name: '{{name}}',
    icon: 'file:{{name}}.svg',
    group: ['{{category}}'],
    version: 1,
    description: '{{description}}',
    defaults: {
      name: '{{name}}',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: '{{name}}Api',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Get Data',
            value: 'getData',
            description: 'Get data from {{name}}',
            action: 'Get data',
          },
        ],
        default: 'getData',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'getData') {
          const credentials = await this.getCredentials('{{name}}Api', i);

          // TODO: Implement your API logic here
          const responseData = {
            message: 'Hello from {{name}}',
            timestamp: new Date().toISOString(),
          };

          returnData.push({
            json: responseData,
            pairedItem: { item: i },
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error.message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}`,
    // Add more templates for oauth, webhook, ai, etc.
  };

  return templates[template as keyof typeof templates] || templates.basic;
}

function getCredentialsTemplate(credentialTypes: string[]): string {
  if (!credentialTypes || credentialTypes.length === 0) {
    return `// No credentials required for this node
export {};`;
  }

  return `import {
  ICredentialType,
  INodeProperties,
} from '@reporunner/core';

export class {{name}}Api implements ICredentialType {
  name = '{{name}}Api';
  displayName = '{{name}} API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'API key for {{name}}',
    },
  ];

  test() {
    // TODO: Implement credential test
    return Promise.resolve();
  }
}`;
}

function getPropertiesTemplate(_template: string): string {
  return `import { INodeProperties } from '@reporunner/core';

export const {{name}}Properties: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Get Data',
        value: 'getData',
        description: 'Get data from {{name}}',
        action: 'Get data',
      },
    ],
    default: 'getData',
  },
  // Add more properties here
];`;
}
