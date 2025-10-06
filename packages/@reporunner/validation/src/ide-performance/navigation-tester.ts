import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { NavigationTestResult, NavigationTestCase } from './types';

export class NavigationTester {
  private workspaceRoot: string;
  private languageService: ts.LanguageService | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async runNavigationTests(): Promise<NavigationTestResult[]> {
    const testCases = await this.generateNavigationTestCases();
    const results: NavigationTestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await this.runSingleNavigationTest(testCase);
        results.push(result);
      } catch (error) {
        console.error(`Failed to run navigation test ${testCase.testName}:`, error);
        results.push({
          testName: testCase.testName,
          sourceFile: testCase.sourceFile,
          targetFile: testCase.expectedTargetFile,
          navigationTime: 0,
          successful: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async runSingleNavigationTest(testCase: NavigationTestCase): Promise<NavigationTestResult> {
    const startTime = Date.now();

    try {
      const languageService = await this.getLanguageService();
      const sourceFilePath = path.resolve(this.workspaceRoot, testCase.sourceFile);

      // Create test file if it doesn't exist
      const testFileExists = fs.existsSync(sourceFilePath);
      if (!testFileExists) {
        await this.createNavigationTestFile(testCase);
      }

      try {
        // Find the symbol in the source file
        const sourceFile = languageService.getProgram()?.getSourceFile(sourceFilePath);
        if (!sourceFile) {
          throw new Error(`Could not load source file: ${sourceFilePath}`);
        }

        // Find the target symbol position
        const symbolPosition = this.findSymbolPosition(sourceFile, testCase.targetSymbol);
        if (symbolPosition === -1) {
          throw new Error(`Could not find symbol '${testCase.targetSymbol}' in source file`);
        }

        // Get definition location
        const definitions = languageService.getDefinitionAtPosition(sourceFilePath, symbolPosition);
        const navigationTime = Date.now() - startTime;

        if (!definitions || definitions.length === 0) {
          return {
            testName: testCase.testName,
            sourceFile: testCase.sourceFile,
            targetFile: testCase.expectedTargetFile,
            navigationTime,
            successful: false,
            errorMessage: 'No definitions found for symbol'
          };
        }

        // Check if navigation leads to expected file
        const actualTargetFile = path.relative(this.workspaceRoot, definitions[0].fileName);
        const expectedTargetFile = testCase.expectedTargetFile;

        const successful = actualTargetFile === expectedTargetFile ||
                          actualTargetFile.endsWith(expectedTargetFile) ||
                          expectedTargetFile.endsWith(actualTargetFile);

        return {
          testName: testCase.testName,
          sourceFile: testCase.sourceFile,
          targetFile: actualTargetFile,
          navigationTime,
          successful,
          errorMessage: successful ? undefined : `Expected ${expectedTargetFile}, got ${actualTargetFile}`
        };

      } finally {
        // Clean up test file
        if (!testFileExists && fs.existsSync(sourceFilePath)) {
          fs.unlinkSync(sourceFilePath);
        }
      }

    } catch (error) {
      const navigationTime = Date.now() - startTime;
      return {
        testName: testCase.testName,
        sourceFile: testCase.sourceFile,
        targetFile: testCase.expectedTargetFile,
        navigationTime,
        successful: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateNavigationTestCases(): Promise<NavigationTestCase[]> {
    const testCases: NavigationTestCase[] = [];

    // Cross-package navigation tests
    testCases.push({
      testName: 'Navigate to core WorkflowEngine',
      sourceFile: 'test-navigation-core.ts',
      targetSymbol: 'WorkflowEngine',
      expectedTargetFile: 'packages/@reporunner/core/src/workflow/engine.ts',
      description: 'Test navigation from consumer to core WorkflowEngine'
    });

    testCases.push({
      testName: 'Navigate to auth AuthService',
      sourceFile: 'test-navigation-auth.ts',
      targetSymbol: 'AuthService',
      expectedTargetFile: 'packages/@reporunner/auth/src/services/auth.service.ts',
      description: 'Test navigation from consumer to auth service'
    });

    testCases.push({
      testName: 'Navigate to shared types',
      sourceFile: 'test-navigation-shared.ts',
      targetSymbol: 'BaseEntity',
      expectedTargetFile: 'packages/shared/src/types/base.ts',
      description: 'Test navigation to shared type definitions'
    });

    // Intra-package navigation tests
    testCases.push({
      testName: 'Navigate within backend package',
      sourceFile: 'test-navigation-backend.ts',
      targetSymbol: 'UserController',
      expectedTargetFile: 'packages/backend/src/controllers/user.controller.ts',
      description: 'Test navigation within backend package'
    });

    testCases.push({
      testName: 'Navigate within frontend package',
      sourceFile: 'test-navigation-frontend.ts',
      targetSymbol: 'UserService',
      expectedTargetFile: 'packages/frontend/src/services/user.service.ts',
      description: 'Test navigation within frontend package'
    });

    return testCases;
  }

  private async createNavigationTestFile(testCase: NavigationTestCase): Promise<void> {
    const testFilePath = path.resolve(this.workspaceRoot, testCase.sourceFile);

    let importStatement = '';
    let usageStatement = '';

    // Generate appropriate import and usage based on test case
    if (testCase.targetSymbol === 'WorkflowEngine') {
      importStatement = `import { WorkflowEngine } from '@reporunner/core';`;
      usageStatement = `const engine = new WorkflowEngine();`;
    } else if (testCase.targetSymbol === 'AuthService') {
      importStatement = `import { AuthService } from '@reporunner/auth';`;
      usageStatement = `const auth = new AuthService();`;
    } else if (testCase.targetSymbol === 'BaseEntity') {
      importStatement = `import type { BaseEntity } from '../packages/shared/src';`;
      usageStatement = `const entity: BaseEntity = {} as BaseEntity;`;
    } else if (testCase.targetSymbol === 'UserController') {
      importStatement = `import { UserController } from '../packages/backend/src/controllers/user.controller';`;
      usageStatement = `const controller = new UserController();`;
    } else if (testCase.targetSymbol === 'UserService') {
      importStatement = `import { UserService } from '../packages/frontend/src/services/user.service';`;
      usageStatement = `const service = new UserService();`;
    } else {
      // Generic test case
      importStatement = `// Import for ${testCase.targetSymbol}`;
      usageStatement = `// Usage of ${testCase.targetSymbol}`;
    }

    const testContent = `// Navigation test file for ${testCase.testName}
${importStatement}

// Test navigation to ${testCase.targetSymbol}
${usageStatement}

export {};
`;

    fs.writeFileSync(testFilePath, testContent);
  }

  private findSymbolPosition(sourceFile: ts.SourceFile, symbolName: string): number {
    let position = -1;

    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && node.text === symbolName) {
        position = node.getStart();
        return;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return position;
  }

  private async getLanguageService(): Promise<ts.LanguageService> {
    if (this.languageService) {
      return this.languageService;
    }

    const configPath = path.join(this.workspaceRoot, 'tsconfig.base.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

    if (configFile.error) {
      throw new Error(`Error reading TypeScript config: ${configFile.error.messageText}`);
    }

    const { options, fileNames } = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      this.workspaceRoot
    );

    // Get all TypeScript files from packages
    const packageFiles = await this.getAllTypeScriptFiles();
    const allFiles = [...fileNames, ...packageFiles];

    const files: { [fileName: string]: { version: number } } = {};
    allFiles.forEach(fileName => {
      files[fileName] = { version: 0 };
    });

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => Object.keys(files),
      getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
      getScriptSnapshot: (fileName) => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
      getCurrentDirectory: () => this.workspaceRoot,
      getCompilationSettings: () => options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    };

    this.languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    return this.languageService;
  }

  private async getAllTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    const packagesDir = path.join(this.workspaceRoot, 'packages');

    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('dist')) {
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
