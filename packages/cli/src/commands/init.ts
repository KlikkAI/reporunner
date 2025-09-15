import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export const initCommand = new Command("init")
  .description("Initialize a new Reporunner project")
  .option("-n, --name <name>", "Project name")
  .option("-d, --dir <directory>", "Project directory", ".")
  .action(async (options) => {
    console.log(chalk.blue("🚀 Initializing Reporunner project...\n"));

    // Get project details
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Project name:",
        default: options.name || "my-reporunner-project",
        validate: (input) => input.length > 0 || "Project name is required",
      },
      {
        type: "input",
        name: "description",
        message: "Project description:",
        default: "A Reporunner workflow automation project",
      },
      {
        type: "list",
        name: "template",
        message: "Choose a template:",
        choices: [
          { name: "Basic workflow (recommended)", value: "basic" },
          { name: "AI-powered workflows", value: "ai" },
          { name: "Data processing workflows", value: "data" },
          { name: "Empty project", value: "empty" },
        ],
      },
    ]);

    // Create project structure
    const projectDir = join(process.cwd(), options.dir, answers.name);

    try {
      mkdirSync(projectDir, { recursive: true });
      mkdirSync(join(projectDir, "workflows"), { recursive: true });
      mkdirSync(join(projectDir, "credentials"), { recursive: true });

      // Create package.json
      const packageJson = {
        name: answers.name,
        version: "1.0.0",
        description: answers.description,
        main: "index.js",
        scripts: {
          start: "reporunner workflow run",
          deploy: "reporunner deploy",
          test: "reporunner workflow test",
        },
        dependencies: {
          "@reporunner/cli": "^1.0.0",
        },
      };

      writeFileSync(
        join(projectDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );

      // Create basic workflow template
      if (answers.template !== "empty") {
        const workflow = createWorkflowTemplate(answers.template);
        writeFileSync(
          join(projectDir, "workflows", "example.json"),
          JSON.stringify(workflow, null, 2),
        );
      }

      // Create .env template
      const envContent = `# Reporunner Configuration
REPORUNNER_API_URL=http://localhost:5000
REPORUNNER_TOKEN=your-api-token-here

# Database (if self-hosting)
DATABASE_URL=mongodb://localhost:27017/reporunner

# Optional: Custom node modules
# NODE_PATH=./custom-nodes
`;

      writeFileSync(join(projectDir, ".env.example"), envContent);

      // Create README
      const readmeContent = createReadmeTemplate(
        answers.name,
        answers.description,
      );
      writeFileSync(join(projectDir, "README.md"), readmeContent);

      console.log(chalk.green("✅ Project initialized successfully!\n"));
      console.log(chalk.yellow("Next steps:"));
      console.log(`  cd ${answers.name}`);
      console.log("  cp .env.example .env");
      console.log("  # Edit .env with your configuration");
      console.log("  pnpm install");
      console.log("  pnpm start");
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to create project:"),
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

function createWorkflowTemplate(template: string) {
  const baseWorkflow = {
    id: "example-workflow",
    name: "Example Workflow",
    description: "An example workflow to get you started",
    active: false,
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  switch (template) {
    case "basic":
      return {
        ...baseWorkflow,
        name: "Basic Email Workflow",
        description: "Send emails based on webhook triggers",
        nodes: [
          {
            id: "trigger-1",
            type: "webhook-trigger",
            position: { x: 100, y: 100 },
            data: { path: "/webhook/email" },
          },
          {
            id: "email-1",
            type: "email-send",
            position: { x: 300, y: 100 },
            data: {
              to: "{{ $trigger.email }}",
              subject: "Hello from Reporunner!",
              body: "This is an automated email.",
            },
          },
        ],
        edges: [{ id: "e1-2", source: "trigger-1", target: "email-1" }],
      };

    case "ai":
      return {
        ...baseWorkflow,
        name: "AI Content Generation",
        description: "Generate content using AI models",
        nodes: [
          {
            id: "trigger-1",
            type: "schedule-trigger",
            position: { x: 100, y: 100 },
            data: { cron: "0 9 * * 1" },
          },
          {
            id: "ai-1",
            type: "openai-completion",
            position: { x: 300, y: 100 },
            data: {
              prompt: "Write a motivational quote for Monday",
              model: "gpt-4",
            },
          },
        ],
        edges: [{ id: "e1-2", source: "trigger-1", target: "ai-1" }],
      };

    default:
      return baseWorkflow;
  }
}

function createReadmeTemplate(name: string, description: string) {
  return `# ${name}

${description}

## Getting Started

This project uses Reporunner for workflow automation.

### Prerequisites

- Node.js 18+
- Reporunner CLI (\`npm install -g @reporunner/cli\`)

### Setup

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Configure environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Run workflows:
   \`\`\`bash
   pnpm start
   \`\`\`

## Workflows

- \`workflows/\` - Workflow definitions
- \`credentials/\` - Credential configurations

## Commands

- \`pnpm start\` - Run workflows
- \`pnpm deploy\` - Deploy to Reporunner cloud
- \`pnpm test\` - Test workflows

## Documentation

- [Reporunner Documentation](https://docs.reporunner.dev)
- [CLI Reference](https://docs.reporunner.dev/cli)
`;
}
