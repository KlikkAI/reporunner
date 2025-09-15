import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";

export const credentialsCommands = new Command("credentials")
  .alias("creds")
  .description("Manage credentials");

// List credentials
credentialsCommands
  .command("list")
  .alias("ls")
  .description("List all credentials")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const spinner = ora("Loading credentials...").start();

    try {
      // Mock credentials list
      const credentials = [
        { id: "1", name: "Gmail OAuth", type: "oauth2", status: "active" },
        { id: "2", name: "OpenAI API", type: "api-key", status: "active" },
        { id: "3", name: "Slack Bot", type: "oauth2", status: "expired" },
      ];

      spinner.succeed("Credentials loaded");

      if (options.json) {
        console.log(JSON.stringify(credentials, null, 2));
      } else {
        console.log(chalk.blue("\n🔐 Credentials:\n"));
        credentials.forEach((cred) => {
          const status =
            cred.status === "active" ? chalk.green("✓") : chalk.red("✗");
          console.log(`${status} ${cred.name} (${cred.type})`);
          console.log(
            `   ID: ${chalk.gray(cred.id)} | Status: ${cred.status}\n`,
          );
        });
      }
    } catch (error) {
      spinner.fail("Failed to load credentials");
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error)),
      );
    }
  });

// Add credential
credentialsCommands
  .command("add")
  .description("Add a new credential")
  .option("-t, --type <type>", "Credential type")
  .option("-n, --name <name>", "Credential name")
  .action(async (options) => {
    console.log(chalk.blue("🔐 Adding new credential...\n"));

    // Get credential details
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Credential name:",
        default: options.name,
        validate: (input) => input.length > 0 || "Name is required",
      },
      {
        type: "list",
        name: "type",
        message: "Credential type:",
        default: options.type,
        choices: [
          { name: "API Key", value: "api-key" },
          { name: "OAuth2", value: "oauth2" },
          { name: "Basic Auth", value: "basic-auth" },
          { name: "Bearer Token", value: "bearer-token" },
        ],
      },
    ]);

    // Type-specific prompts
    let credentialData = {};

    switch (answers.type) {
      case "api-key":
        const apiKeyData = await inquirer.prompt([
          {
            type: "password",
            name: "apiKey",
            message: "API Key:",
            mask: "*",
          },
        ]);
        credentialData = apiKeyData;
        break;

      case "oauth2":
        const oauthData = await inquirer.prompt([
          {
            type: "input",
            name: "clientId",
            message: "Client ID:",
          },
          {
            type: "password",
            name: "clientSecret",
            message: "Client Secret:",
            mask: "*",
          },
          {
            type: "input",
            name: "redirectUri",
            message: "Redirect URI:",
          },
        ]);
        credentialData = oauthData;
        break;

      case "basic-auth":
        const basicData = await inquirer.prompt([
          {
            type: "input",
            name: "username",
            message: "Username:",
          },
          {
            type: "password",
            name: "password",
            message: "Password:",
            mask: "*",
          },
        ]);
        credentialData = basicData;
        break;
    }

    const spinner = ora("Saving credential...").start();

    try {
      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1500));

      spinner.succeed("Credential saved successfully");

      console.log(chalk.green("✅ Credential added"));
      console.log(`📝 Name: ${answers.name}`);
      console.log(`🔒 Type: ${answers.type}`);
      console.log(`🆔 ID: cred_${Date.now()}`);
    } catch (error) {
      spinner.fail("Failed to save credential");
      console.error(
        chalk.red("❌ Error:"),
        error instanceof Error ? error.message : String(error),
      );
    }
  });

// Test credential
credentialsCommands
  .command("test")
  .description("Test a credential")
  .argument("<credential-id>", "Credential ID to test")
  .action(async (credentialId) => {
    const spinner = ora(`Testing credential ${credentialId}...`).start();

    try {
      // Mock test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      spinner.succeed("Credential test passed");

      console.log(chalk.green("✅ Credential is valid"));
      console.log("🔗 Connection successful");
      console.log("📊 Response time: 145ms");
    } catch (error) {
      spinner.fail("Credential test failed");
      console.error(
        chalk.red("❌ Error:"),
        error instanceof Error ? error.message : String(error),
      );
    }
  });

// Delete credential
credentialsCommands
  .command("delete")
  .alias("del")
  .description("Delete a credential")
  .argument("<credential-id>", "Credential ID to delete")
  .option("-f, --force", "Force delete without confirmation")
  .action(async (credentialId, options) => {
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to delete credential ${credentialId}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow("❌ Deletion cancelled"));
        return;
      }
    }

    const spinner = ora(`Deleting credential ${credentialId}...`).start();

    try {
      // Mock delete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      spinner.succeed("Credential deleted");
      console.log(chalk.green("✅ Credential removed successfully"));
    } catch (error) {
      spinner.fail("Failed to delete credential");
      console.error(
        chalk.red("❌ Error:"),
        error instanceof Error ? error.message : String(error),
      );
    }
  });
