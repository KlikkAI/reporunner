#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

// Node scaffolding script inspired by n8n
async function setupNode() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: pnpm setup-node <node-name> <category>');
    console.error('Example: pnpm setup-node Gmail Communication');
    process.exit(1);
  }

  const [nodeName, category] = args;
  const nodeNameKebab = nodeName.toLowerCase().replace(/\s+/g, '-');
  const nodeDir = path.join(
    'packages',
    '@reporunner',
    'nodes',
    category.toLowerCase(),
    nodeNameKebab
  );

  console.log(`🔧 Creating node: ${nodeName}`);
  console.log(`📁 Directory: ${nodeDir}`);

  // Create directory structure
  mkdirSync(nodeDir, { recursive: true });
  mkdirSync(path.join(nodeDir, 'src'), { recursive: true });

  // Package.json
  const packageJson = {
    name: `@reporunner/node-${nodeNameKebab}`,
    version: '1.0.0',
    description: `${nodeName} node for Reporunner`,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
      test: 'jest',
      'test:watch': 'jest --watch',
    },
    dependencies: {
      '@reporunner/core': 'workspace:*',
      '@reporunner/shared': 'workspace:*',
    },
    devDependencies: {
      typescript: 'catalog:',
      '@types/node': 'catalog:',
    },
  };

  writeFileSync(path.join(nodeDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // TypeScript config
  const tsConfig = {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      outDir: 'dist',
      rootDir: 'src',
    },
    include: ['src/**/*'],
    exclude: ['dist', 'node_modules', '**/*.test.ts'],
  };

  writeFileSync(path.join(nodeDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // Node implementation template
  const nodeTemplate = `import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from '@reporunner/core';

export class ${nodeName.replace(/\s+/g, '')} implements INodeType {
  description: INodeTypeDescription = {
    displayName: '${nodeName}',
    name: '${nodeNameKebab}',
    icon: 'file:${nodeNameKebab}.svg',
    group: ['${category.toLowerCase()}'],
    version: 1,
    description: '${nodeName} integration node',
    defaults: {
      name: '${nodeName}',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Get',
            value: 'get',
            description: 'Get data',
            action: 'Get data',
          },
        ],
        default: 'get',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'get') {
          // Implement your logic here
          const responseData = {
            message: 'Hello from ${nodeName}',
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
}
`;

  writeFileSync(path.join(nodeDir, 'src', 'index.ts'), nodeTemplate);

  // Test template
  const testTemplate = `import { ${nodeName.replace(/\s+/g, '')} } from './index';

describe('${nodeName}', () => {
  let node: ${nodeName.replace(/\s+/g, '')};

  beforeEach(() => {
    node = new ${nodeName.replace(/\s+/g, '')}();
  });

  it('should have correct description', () => {
    expect(node.description.displayName).toBe('${nodeName}');
    expect(node.description.name).toBe('${nodeNameKebab}');
  });

  // Add more tests here
});
`;

  writeFileSync(path.join(nodeDir, 'src', 'index.test.ts'), testTemplate);

  console.log('✅ Node created successfully!');
  console.log('');
  console.log('Next steps:');
  console.log(`1. cd ${nodeDir}`);
  console.log('2. Implement your node logic in src/index.ts');
  console.log('3. Add tests in src/index.test.ts');
  console.log('4. Run: pnpm build');
}

setupNode().catch(console.error);
