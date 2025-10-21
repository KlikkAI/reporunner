import { exec } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { ensureDirSync } from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';

const execAsync = promisify(exec);

interface CreateNodeOptions {
  name?: string;
  category?: string;
  template?: string;
  skipInstall?: boolean;
}

interface InquirerAnswers {
  name?: string;
  category?: string;
  template?: string;
  description?: string;
  author?: string;
}

export async function handleCreateNode(options: CreateNodeOptions): Promise<void> {
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
        default: (answers: InquirerAnswers) =>
          `${answers.name || options.name} integration for Reporunner`,
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
    const nodeDir = join(process.cwd(), 'nodes', category.toLowerCase(), nodeName.toLowerCase());
    ensureDirSync(nodeDir);

    // Generate node files
    const { generateNodeFiles } = await import('./file-generation');
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
}
