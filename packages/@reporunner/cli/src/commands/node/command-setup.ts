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
