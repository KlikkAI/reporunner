import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import type { TypeResolutionResult, TypeResolutionTestCase } from './types';

export class TypeResolutionValidator {
  private workspaceRoot: string;
  private program: ts.Program | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async validateTypeResolution(): Promise<TypeResolutionResult[]> {
    const testCases = await this.generateTypeResolutionTestCases();
    const results: TypeResolutionResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await this.validateSingleTypeResolution(testCase);
        results.push(result);
      } catch (error) {
        results.push({
          packageName: testCase.packageName,
          typeDefinition: testCase.typeDefinition,
          resolutionTime: 0,
          resolved: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sourceFile: testCase.sourceFile,
        });
      }
    }

    return results;
  }

  private async validateSingleTypeResolution(
    testCase: TypeResolutionTestCase
  ): Promise<TypeResolutionResult> {
    const startTime = Date.now();

    try {
      const program = await this.getTypeScriptProgram();
      const checker = program.getTypeChecker();

      // Create a temporary test file to check type resolution
      const testFilePath = path.join(this.workspaceRoot, testCase.sourceFile);
      const testFileExists = fs.existsSync(testFilePath);

      if (!testFileExists) {
        await this.createTypeTestFile(testCase);
      }

      try {
        const sourceFile = program.getSourceFile(testCase.sourceFile);
        if (!sourceFile) {
          throw new Error(`Could not find source file: ${testCase.sourceFile}`);
        }

        // Find type references in the file
        let resolved = false;
        let errorMessage: string | undefined;

        const visit = (node: ts.Node) => {
          if (ts.isTypeReferenceNode(node) || ts.isIdentifier(node)) {
            const symbol = checker.getSymbolAtLocation(node);
            if (symbol && symbol.name === testCase.typeDefinition) {
              resolved = true;
              return;
            }
          }
          ts.forEachChild(node, visit);
        };

        visit(sourceFile);

        // Check for compilation errors related to this type
        const diagnostics = program.getSemanticDiagnostics(sourceFile);
        const typeErrors = diagnostics.filter((diagnostic) =>
          diagnostic.messageText.toString().includes(testCase.typeDefinition)
        );

        if (typeErrors.length > 0) {
          resolved = false;
          errorMessage = typeErrors[0].messageText.toString();
        }

        const resolutionTime = Date.now() - startTime;

        return {
          packageName: testCase.packageName,
          typeDefinition: testCase.typeDefinition,
          resolutionTime,
          resolved,
          errorMessage,
          sourceFile: testCase.sourceFile,
        };
      } finally {
        // Clean up temporary test file
        if (!testFileExists && fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      return {
        packageName: testCase.packageName,
        typeDefinition: testCase.typeDefinition,
        resolutionTime,
        resolved: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        sourceFile: testCase.sourceFile,
      };
    }
  }

  private async generateTypeResolutionTestCases(): Promise<TypeResolutionTestCase[]> {
    const testCases: TypeResolutionTestCase[] = [];

    // Test cases for @klikkflow packages
    testCases.push({
      packageName: '@klikkflow/core',
      typeDefinition: 'WorkflowEngine',
      sourceFile: 'test-types-core.ts',
      description: 'Test WorkflowEngine type resolution from core package',
    });

    testCases.push({
      packageName: '@klikkflow/auth',
      typeDefinition: 'AuthService',
      sourceFile: 'test-types-auth.ts',
      description: 'Test AuthService type resolution from auth package',
    });

    testCases.push({
      packageName: '@klikkflow/workflow',
      typeDefinition: 'WorkflowBuilder',
      sourceFile: 'test-types-workflow.ts',
      description: 'Test WorkflowBuilder type resolution from workflow package',
    });

    testCases.push({
      packageName: '@klikkflow/platform',
      typeDefinition: 'PlatformConfig',
      sourceFile: 'test-types-platform.ts',
      description: 'Test PlatformConfig type resolution from platform package',
    });

    // Test cross-package type resolution
    testCases.push({
      packageName: 'shared',
      typeDefinition: 'BaseEntity',
      sourceFile: 'test-types-shared.ts',
      description: 'Test shared types resolution across packages',
    });

    return testCases;
  }

  private async createTypeTestFile(testCase: TypeResolutionTestCase): Promise<void> {
    const testFilePath = path.join(this.workspaceRoot, testCase.sourceFile);

    const packageImport = testCase.packageName.startsWith('@klikkflow/')
      ? `import type { ${testCase.typeDefinition} } from '${testCase.packageName}';`
      : `import type { ${testCase.typeDefinition} } from '../packages/${testCase.packageName}/src';`;

    const testContent = `// Type resolution test file for ${testCase.packageName}
${packageImport}

// Test type usage
const test: ${testCase.typeDefinition} = {} as ${testCase.typeDefinition};

export { test };
`;

    fs.writeFileSync(testFilePath, testContent);
  }

  private async getTypeScriptProgram(): Promise<ts.Program> {
    if (this.program) {
      return this.program;
    }

    const configPath = path.join(this.workspaceRoot, 'tsconfig.base.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

    if (configFile.error) {
      throw new Error(`Error reading TypeScript config: ${configFile.error.messageText}`);
    }

    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      this.workspaceRoot
    );

    if (errors.length > 0) {
    }

    // Get all TypeScript files from packages
    const packageFiles = await this.getAllTypeScriptFiles();
    const allFiles = [...fileNames, ...packageFiles];

    this.program = ts.createProgram(allFiles, options);
    return this.program;
  }

  private async getAllTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    const packagesDir = path.join(this.workspaceRoot, 'packages');

    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !entry.name.includes('node_modules') &&
          !entry.name.includes('dist')
        ) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(packagesDir);
    return files;
  }
}
