import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import type { AutocompleteTestCase, AutocompleteTestResult } from './types';

export class AutocompleteTester {
  private workspaceRoot: string;
  private languageService: ts.LanguageService | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async runAutocompleteTests(): Promise<AutocompleteTestResult[]> {
    const testCases = await this.generateAutocompleteTestCases();
    const results: AutocompleteTestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await this.runSingleAutocompleteTest(testCase);
        results.push(result);
      } catch (_error) {
        results.push({
          packageName: testCase.packageName,
          testFile: testCase.testFile,
          position: testCase.position,
          expectedSuggestions: testCase.expectedSuggestions,
          actualSuggestions: [],
          accuracy: 0,
          responseTime: 0,
          passed: false,
        });
      }
    }

    return results;
  }

  private async runSingleAutocompleteTest(
    testCase: AutocompleteTestCase
  ): Promise<AutocompleteTestResult> {
    const startTime = Date.now();

    // Create a temporary test file if it doesn't exist
    const testFilePath = path.join(this.workspaceRoot, testCase.testFile);
    const testFileExists = fs.existsSync(testFilePath);

    if (!testFileExists) {
      await this.createTestFile(testCase);
    }

    try {
      const languageService = await this.getLanguageService(testCase.packageName);
      const completions = languageService.getCompletionsAtPosition(
        testCase.testFile,
        this.getPositionOffset(testCase.testFile, testCase.position),
        {}
      );

      const actualSuggestions = completions?.entries.map((entry) => entry.name) || [];
      const responseTime = Date.now() - startTime;

      // Calculate accuracy based on how many expected suggestions were found
      const foundSuggestions = testCase.expectedSuggestions.filter((expected) =>
        actualSuggestions.some((actual) => actual.includes(expected))
      );
      const accuracy =
        testCase.expectedSuggestions.length > 0
          ? (foundSuggestions.length / testCase.expectedSuggestions.length) * 100
          : 0;

      const passed = accuracy >= 70; // Consider 70% accuracy as passing

      return {
        packageName: testCase.packageName,
        testFile: testCase.testFile,
        position: testCase.position,
        expectedSuggestions: testCase.expectedSuggestions,
        actualSuggestions,
        accuracy,
        responseTime,
        passed,
      };
    } finally {
      // Clean up temporary test file
      if (!testFileExists && fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  }

  private async generateAutocompleteTestCases(): Promise<AutocompleteTestCase[]> {
    const testCases: AutocompleteTestCase[] = [];

    // Test cases for @klikkflow packages
    testCases.push({
      packageName: '@klikkflow/core',
      testFile: 'test-autocomplete-core.ts',
      position: { line: 2, character: 20 },
      expectedSuggestions: ['WorkflowEngine', 'NodeRegistry', 'ExecutionContext'],
      description: 'Test autocomplete for core package exports',
    });

    testCases.push({
      packageName: '@klikkflow/auth',
      testFile: 'test-autocomplete-auth.ts',
      position: { line: 2, character: 20 },
      expectedSuggestions: ['AuthService', 'UserManager', 'TokenValidator'],
      description: 'Test autocomplete for auth package exports',
    });

    testCases.push({
      packageName: '@klikkflow/workflow',
      testFile: 'test-autocomplete-workflow.ts',
      position: { line: 2, character: 25 },
      expectedSuggestions: ['WorkflowBuilder', 'NodeExecutor', 'TriggerManager'],
      description: 'Test autocomplete for workflow package exports',
    });

    // Test cases for main packages
    testCases.push({
      packageName: 'shared',
      testFile: 'test-autocomplete-shared.ts',
      position: { line: 2, character: 15 },
      expectedSuggestions: ['types', 'utils', 'constants'],
      description: 'Test autocomplete for shared package exports',
    });

    return testCases;
  }

  private async createTestFile(testCase: AutocompleteTestCase): Promise<void> {
    const testFilePath = path.join(this.workspaceRoot, testCase.testFile);
    const packageImport = testCase.packageName.startsWith('@klikkflow/')
      ? `import { } from '${testCase.packageName}';`
      : `import { } from '../packages/${testCase.packageName}/src';`;

    const testContent = `// Autocomplete test file for ${testCase.packageName}
${packageImport}
// Cursor position for autocomplete test
`;

    fs.writeFileSync(testFilePath, testContent);
  }

  private async getLanguageService(_packageName: string): Promise<ts.LanguageService> {
    if (this.languageService) {
      return this.languageService;
    }

    // Create a simple language service for testing
    const configPath = path.join(this.workspaceRoot, 'tsconfig.base.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      this.workspaceRoot
    ).options;

    const files: { [fileName: string]: { version: number } } = {};
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => Object.keys(files),
      getScriptVersion: (fileName) => files[fileName]?.version.toString(),
      getScriptSnapshot: (fileName) => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
      getCurrentDirectory: () => this.workspaceRoot,
      getCompilationSettings: () => compilerOptions,
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

  private getPositionOffset(
    fileName: string,
    position: { line: number; character: number }
  ): number {
    const filePath = path.join(this.workspaceRoot, fileName);
    if (!fs.existsSync(filePath)) {
      return 0;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let offset = 0;
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline character
    }

    return offset + position.character;
  }
}
