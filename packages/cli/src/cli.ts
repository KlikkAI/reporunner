#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Commands
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";
import { workflowCommands } from "./commands/workflow.js";
import { credentialsCommands } from "./commands/credentials.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package.json for version
const packageJson = require(join(__dirname, "../package.json"));

const program = new Command();

program
  .name("reporunner")
  .description("CLI for Reporunner workflow automation platform")
  .version(packageJson.version);

// Global options
program
  .option("-v, --verbose", "Enable verbose logging")
  .option("--api-url <url>", "Reporunner API URL", "http://localhost:5000")
  .option("--token <token>", "API authentication token");

// Commands
program.addCommand(initCommand);
program.addCommand(deployCommand);
program.addCommand(workflowCommands);
program.addCommand(credentialsCommands);

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

program.exitOverride((err) => {
  if (err.code === "commander.help") {
    process.exit(0);
  }
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});

// Parse arguments
program.parse();

export { program };
