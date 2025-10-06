import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { IntelliSenseTestResult, IntelliSenseTestCase } from './types';

export class IntelliSenseTester {
  private workspaceRoot: string;
  private languageService: ts.LanguageService | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async runIntelliSenseTests(): Promise<IntelliSenseTestResult[]> {
    const testCases = await this.generateIntelliSenseTestCases();
    const results: IntelliSenseTestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await this.runSingleIntelliSenseTest(testCase);
        results.push(result);
      } catch (error) {
        console.error(`Failed to run IntelliSense test ${testCase.testName}:`, error);
        results.push({
          testName: testCase.testName,
          sourceFile: testCase.sourceFile,
          position: testCase.position,
          expectedFeatures: testCase.expectedFeatures,
          actualFeatures: [],
          responseTime: 0,
          accuracy: 0,
          successful: false
        });
      }
    }

    return results;
  }

  private async runSingleIntelliSenseTest(testCase: IntelliSenseTestCase): Promise<IntelliSenseTestResult> {
    const startTime = Date.now();

    try {
      const languageService = await this.getLanguageService();
      const sourceFilePath = path.resolve(this.workspaceRoot, testCase.sourceFile);

      // Create test file if it doesn't exist
      const testFileExists = fs.existsSync(sourceFilePath);
      if (!testFileExists) {
        await this.createIntelliSenseTestFile(testCase);
      }

      try {
        // Get position offset
        const position = this.getPositionOffset(sourceFilePath, testCase.position);

        // Test different IntelliSense features
        const actualFeatures: string[] = [];

        // 1. Completions
        const completions = languageService.getCompletionsAtPosition(sourceFilePath, position, {});
        if (completions && completions.entries.length > 0) {
          actualFeatures.push('completions');
          // Add specific completion items that match expected features
          const completionNames = completions.entries.map(entry => entry.name);
          testCase.expectedFeatures.forEach(expected => {
            if (completionNames.some(name => name.includes(expected) || expected.includes(name))) {
              actualFeatures.push(`completion:${expected}`);
            }
          });
        }

        // 2. Quick Info (hover)
        const quickInfo = languageService.getQuickInfoAtPosition(sourceFilePath, position);
        if (quickInfo) {
          actualFeatures.push('quickInfo');
        }

        // 3. Signature Help
        const signatureHelp = languageService.getSignatureHelpItems(sourceFilePath, position, {});
        if (signatureHelp && signatureHelp.items.length > 0) {
          actualFeatures.push('signatureHelp');
        }

        // 4. Definition
        const definitions = languageService.getDefinitionAtPosition(sourceFilePath, position);
        if (definitions && definitions.length > 0) {
          actualFeatures.push('definition');
        }

        // 5. References
        const references = languageService.getReferencesAtPosition(sourceFilePath, position);
        if (references && references.length > 0) {
          actualFeatures.push('references');
        }

        // 6. Rename
        const renameInfo = languageService.getRenameInfo(sourceFilePath, position);
        if (renameInfo && renameInfo.canRename) {
          actualFeatures.push('rename');
        }

        const responseTime = Date.now() - startTime;

        // Calculate accuracy
        const matchedFeatures = testCase.expectedFeatures.filter(expected =>
          actualFeatures.some(actual => actual.includes(expected) || expected.includes(actual))
        );
        const accuracy = testCase.expectedFeatures.length > 0
          ? (matchedFeatures.length / testCase.expectedFeatures.length) * 100
          : 0;

        const successful = accuracy >= 60; // Consider 60% accuracy as successful

        return {
          testName: testCase.testName,
          sourceFile: testCase.sourceFile,
          position: testCase.position,
          expectedFeatures: testCase.expectedFeatures,
          actualFeatures,
          responseTime,
          accuracy,
          successful
        };

      } finally {
        // Clean up test file
        if (!testFileExists && fs.existsSync(sourceFilePath)) {
          fs.unlinkSync(sourceFilePath);
        }
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        testName: testCase.testName,
        sourceFile: testCase.sourceFile,
        position: testCase.position,
        expectedFeatures: testCase.expectedFeatures,
        actualFeatures: [],
        responseTime,
        accuracy: 0,
        successful: false
      };
    }
  }

  private async generateIntelliSenseTestCases(): Promise<IntelliSenseTestCase[]> {
    const testCases: IntelliSenseTestCase[] = [];

    // Test completions for @reporunner packages
    testCases.push({
      testName: 'Core package completions',
      sourceFile: 'test-intellisense-core.ts',
      position: { line: 3, character: 15 },
      expectedFeatures: ['completions', 'WorkflowEngine', 'NodeRegistry', 'quickInfo'],
      description: 'Test IntelliSense for core package exports'
    });

    testCases.push({
      testName: 'Auth package completions',
      sourceFile: 'test-intellisense-auth.ts',
      position: { line: 3, character: 12 },
      expectedFeatures: ['completions', 'AuthService', 'UserManager', 'quickInfo'],
      description: 'Test IntelliSense for auth package exports'
    });

    // Test method completions
    testCases.push({
      testName: 'Method completions',
      sourceFile: 'test-intellisense-methods.ts',
      position: { line: 4, character: 8 },
      expectedFeatures: ['completions', 'signatureHelp', 'quickInfo'],
      description: 'Test method completions and signature help'
    });

    // Test type information
    testCases.push({
      testName: 'Type information',
      sourceFile: 'test-intellisense-types.ts',
      position: { line: 2, character: 20 },
      expectedFeatures: ['quickInfo', 'definition', 'references'],
      description: 'Test type information and navigation'
    });

    // Test cross-package references
    testCases.push({
      testName: 'Cross-package references',
      sourceFile: 'test-intellisense-cross.ts',
      position: { line: 5, character: 10 },
      expectedFeatures: ['definition', 'references', 'rename'],
      description: 'Test cross-package symbol references'
    });

    return testCases;
  }

  private async createIntelliSenseTestFile(testCase: IntelliSenseTestCase): Promise<void> {
    const testFilePath = path.resolve(this.workspaceRoot, testCase.sourceFile);

    let testContent = '';

    // Generate appropriate test content based on test case
    if (testCase.testName.includes('Core package')) {
      testContent = `// IntelliSense test for core package
import { WorkflowEngine, NodeRegistry } from '@reporunner/core';

const engine = new WorkflowEngine();
// Cursor position for testing completions
`;
    } else if (testCase.testName.includes('Auth package')) {
      testContent = `// IntelliSense test for auth package
import { AuthService } from '@reporunner/auth';

const auth = new AuthService();
// Cursor position for testing completions
`;
    } else if (testCase.testName.includes('Method completions')) {
      testContent = `// IntelliSense test for method completions
import { WorkflowEngine } from '@reporunner/core';

const engine = new WorkflowEngine();
engine.
// Cursor position for method completions
`;
    } else if (testCase.testName.includes('Type information')) {
      testContent = `// IntelliSense test for type information
import type { BaseEntity } from '../packages/shared/src';

const entity: BaseEntity = {} as BaseEntity;
// Cursor position for type information
`;
    } else if (testCase.testName.includes('Cross-package')) {
      testContent = `// IntelliSense test for cross-package references
import { WorkflowEngine } from '@reporunner/core';
import { AuthService } from '@reporunner/auth';

const engine = new WorkflowEngine();
const auth = new AuthService();
// Cursor position for cross-package testing
`;
    } else {
      // Generic test case
      testContent = `// IntelliSense test file for ${testCase.testName}
// Test content for IntelliSense functionality

export {};
`;
    }

    fs.writeFileSync(testFilePath, testContent);
  }

  private getPositionOffset(fileName: string, position: { line: number; character: number }): number {
    if (!fs.existsSync(fileName)) {
      return 0;
    }

    const content = fs.readFileSync(fileName, 'utf-8');
    const lines = content.split('\n');

    let offset = 0;
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline character
    }

    return offset + position.character;
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
