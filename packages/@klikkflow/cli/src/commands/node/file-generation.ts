import { join } from 'node:path';
import { ensureDirSync, writeFileSync } from 'fs-extra';
import Mustache from 'mustache';

interface NodeGenerationData {
  name: string;
  category: string;
  template: string;
  description: string;
  author: string;
  credentialTypes?: string[];
}

export async function generateNodeFiles(nodeDir: string, data: NodeGenerationData): Promise<void> {
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

  // Get templates
  const { getNodeTemplate } = await import('./node-templates');
  const { getCredentialsTemplate, getPropertiesTemplate } = await import('./credential-templates');

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

  // Create src directory
  ensureDirSync(join(nodeDir, 'src'));

  // Generate files
  writeFileSync(join(nodeDir, 'package.json'), Mustache.render(packageJsonTemplate, data));
  writeFileSync(join(nodeDir, 'src/index.ts'), Mustache.render(nodeTemplate, data));
  writeFileSync(join(nodeDir, 'src/credentials.ts'), Mustache.render(credentialsTemplate, data));
  writeFileSync(join(nodeDir, 'src/properties.ts'), Mustache.render(propertiesTemplate, data));
  writeFileSync(join(nodeDir, 'README.md'), Mustache.render(readmeTemplate, data));
  writeFileSync(join(nodeDir, 'tsconfig.json'), tsConfigTemplate);
}
