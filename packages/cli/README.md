# @reporunner/cli

Command-line interface for the Reporunner workflow automation platform.

## Overview

The Reporunner CLI provides powerful command-line tools for managing workflows, credentials, and deployments. Perfect for CI/CD pipelines, automation scripts, and developer workflows.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @reporunner/cli
# or
pnpm add -g @reporunner/cli
```

### Local Installation

```bash
npm install @reporunner/cli
# or
pnpm add @reporunner/cli
```

## Quick Start

```bash
# Initialize a new project
reporunner init my-workflow-project

# Navigate to project
cd my-workflow-project

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
pnpm install

# Deploy workflows
reporunner deploy
```

## Commands

### Project Management

#### `reporunner init [project-name]`

Initialize a new Reporunner project with templates and configuration.

```bash
# Interactive project setup
reporunner init

# Create project with specific name
reporunner init my-automation-project

# Create in specific directory
reporunner init --dir ./projects my-project
```

**Options:**

- `-n, --name <name>` - Project name
- `-d, --dir <directory>` - Target directory (default: current)

**Templates:**

- **Basic workflow** - Simple email automation (recommended)
- **AI-powered workflows** - OpenAI/Anthropic integrations
- **Data processing workflows** - Transform and route data
- **Empty project** - Minimal setup

### Workflow Management

#### `reporunner workflow list` (alias: `rr wf ls`)

List all workflows in your project or connected instance.

```bash
# List workflows
reporunner workflow list

# JSON output
reporunner workflow list --json
```

#### `reporunner workflow run [workflow-id]`

Execute a workflow by ID or from file.

```bash
# Run workflow by ID
reporunner workflow run wf_123456

# Run from file
reporunner workflow run --file ./workflows/email-automation.json

# Wait for completion
reporunner workflow run wf_123456 --wait
```

**Options:**

- `-f, --file <file>` - Workflow file to run
- `--wait` - Wait for execution completion

#### `reporunner workflow test [workflow-id]`

Validate workflow configuration and test connections.

```bash
# Test workflow
reporunner workflow test wf_123456

# Test from file
reporunner workflow test --file ./workflows/my-workflow.json
```

#### `reporunner workflow deploy [workflow-id]`

Deploy workflow to cloud environment.

```bash
# Deploy workflow
reporunner workflow deploy wf_123456

# Deploy from file
reporunner workflow deploy --file ./workflows/production.json

# Deploy to specific environment
reporunner workflow deploy --env staging wf_123456
```

### Credential Management

#### `reporunner credentials list` (alias: `rr creds ls`)

List all configured credentials.

```bash
# List credentials
reporunner credentials list

# JSON output for scripts
reporunner credentials list --json
```

#### `reporunner credentials add`

Add a new credential interactively.

```bash
# Interactive credential setup
reporunner credentials add

# Pre-specify type and name
reporunner credentials add --type oauth2 --name "Gmail Integration"
```

**Supported Types:**

- `api-key` - API key authentication
- `oauth2` - OAuth2 flow credentials
- `basic-auth` - Username/password authentication
- `bearer-token` - Bearer token authentication

#### `reporunner credentials test <credential-id>`

Test credential connection and validity.

```bash
# Test credential
reporunner credentials test cred_123456
```

#### `reporunner credentials delete <credential-id>`

Remove a credential.

```bash
# Delete with confirmation
reporunner credentials delete cred_123456

# Force delete without confirmation
reporunner credentials delete cred_123456 --force
```

### Deployment

#### `reporunner deploy`

Deploy entire project to cloud environment.

```bash
# Deploy to production
reporunner deploy

# Deploy to specific environment
reporunner deploy --env staging

# Dry run (show what would be deployed)
reporunner deploy --dry-run

# Force deployment without confirmation
reporunner deploy --force
```

**Options:**

- `-e, --env <environment>` - Target environment (default: production)
- `--dry-run` - Show deployment plan without executing
- `-f, --force` - Skip confirmation prompts

## Global Options

All commands support these global options:

- `-v, --verbose` - Enable verbose logging
- `--api-url <url>` - Reporunner API URL (default: http://localhost:5000)
- `--token <token>` - API authentication token

## Configuration

### Environment Variables

```bash
# API Configuration
REPORUNNER_API_URL=http://localhost:5000
REPORUNNER_TOKEN=your-api-token-here

# Optional: Custom node modules
NODE_PATH=./custom-nodes
```

### Config File

Create `.reporunnerrc.json` in your project root:

```json
{
  "apiUrl": "https://api.reporunner.dev",
  "defaultEnvironment": "production",
  "workflows": {
    "directory": "./workflows",
    "autoBackup": true
  },
  "credentials": {
    "autoTest": true
  }
}
```

## Examples

### Basic Workflow Project

```bash
# 1. Create new project
reporunner init email-automation

# 2. Configure environment
cd email-automation
cp .env.example .env
# Edit .env with your API keys

# 3. Test workflow
reporunner workflow test --file workflows/example.json

# 4. Deploy to staging
reporunner deploy --env staging

# 5. Deploy to production
reporunner deploy
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Workflows

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install CLI
        run: npm install -g @reporunner/cli

      - name: Deploy workflows
        run: reporunner deploy --force
        env:
          REPORUNNER_TOKEN: ${{ secrets.REPORUNNER_TOKEN }}
```

### Credential Management Script

```bash
#!/bin/bash
# setup-credentials.sh

# Add Gmail OAuth credential
reporunner credentials add \
  --type oauth2 \
  --name "Gmail Production" \
  --client-id "$GMAIL_CLIENT_ID" \
  --client-secret "$GMAIL_CLIENT_SECRET"

# Test all credentials
reporunner credentials list --json | \
  jq -r '.[].id' | \
  xargs -I {} reporunner credentials test {}
```

## Troubleshooting

### Common Issues

**Authentication Error:**

```bash
# Set your API token
export REPORUNNER_TOKEN=your-token-here
# or
reporunner --token your-token-here workflow list
```

**Connection Error:**

```bash
# Check API URL
reporunner --api-url http://localhost:5000 workflow list

# Verify server is running
curl http://localhost:5000/api/health
```

**Workflow Validation Error:**

```bash
# Test workflow syntax
reporunner workflow test --file ./workflows/my-workflow.json

# Check credential configuration
reporunner credentials list
```

## API Reference

See the [full CLI API documentation](../../docs/api/cli/) for detailed information about all commands and options.

## Contributing

Contributions welcome! See the [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.
