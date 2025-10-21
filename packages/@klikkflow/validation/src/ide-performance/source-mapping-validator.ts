import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SourceMappingTestCase, SourceMappingTestResult } from './types';

export class SourceMappingValidator {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async validateSourceMapping(): Promise<SourceMappingTestResult[]> {
    const testCases = await this.generateSourceMappingTestCases();
    const results: SourceMappingTestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await this.validateSingleSourceMapping(testCase);
        results.push(result);
      } catch (error) {
        results.push({
          testName: testCase.testName,
          sourceFile: testCase.sourceFile,
          compiledFile: testCase.compiledFile,
          sourceMappingAccurate: false,
          debuggingExperience: 'broken',
          issues: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    return results;
  }

  private async validateSingleSourceMapping(
    testCase: SourceMappingTestCase
  ): Promise<SourceMappingTestResult> {
    const issues: string[] = [];
    let sourceMappingAccurate = true;
    let debuggingExperience: 'excellent' | 'good' | 'poor' | 'broken' = 'excellent';

    try {
      // Check if source file exists
      const sourceFilePath = path.resolve(this.workspaceRoot, testCase.sourceFile);
      if (!fs.existsSync(sourceFilePath)) {
        // Create a test source file
        await this.createSourceMappingTestFile(testCase);
      }

      // Check if compiled file exists (look in dist directories)
      const compiledFilePath = this.findCompiledFile(testCase.compiledFile);
      if (!compiledFilePath) {
        issues.push(`Compiled file not found: ${testCase.compiledFile}`);
        sourceMappingAccurate = false;
        debuggingExperience = 'broken';
      } else {
        // Check for source map file
        const sourceMapPath = `${compiledFilePath}.map`;
        if (!fs.existsSync(sourceMapPath)) {
          issues.push(`Source map file not found: ${sourceMapPath}`);
          sourceMappingAccurate = false;
          debuggingExperience = 'poor';
        } else {
          // Validate source map content
          const sourceMapValidation = await this.validateSourceMapContent(
            sourceFilePath,
            compiledFilePath,
            sourceMapPath,
            testCase.testBreakpoints
          );

          if (!sourceMapValidation.isValid) {
            issues.push(...sourceMapValidation.issues);
            sourceMappingAccurate = false;
            debuggingExperience = sourceMapValidation.severity;
          }
        }
      }

      // Additional checks for debugging experience
      if (sourceMappingAccurate) {
        // Check TypeScript configuration for source map settings
        const tsConfigIssues = await this.validateTypeScriptSourceMapConfig();
        if (tsConfigIssues.length > 0) {
          issues.push(...tsConfigIssues);
          if (debuggingExperience === 'excellent') {
            debuggingExperience = 'good';
          }
        }
      }

      return {
        testName: testCase.testName,
        sourceFile: testCase.sourceFile,
        compiledFile: testCase.compiledFile,
        sourceMappingAccurate,
        debuggingExperience,
        issues,
      };
    } catch (error) {
      return {
        testName: testCase.testName,
        sourceFile: testCase.sourceFile,
        compiledFile: testCase.compiledFile,
        sourceMappingAccurate: false,
        debuggingExperience: 'broken',
        issues: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  private async generateSourceMappingTestCases(): Promise<SourceMappingTestCase[]> {
    const testCases: SourceMappingTestCase[] = [];

    // Test cases for different package types
    testCases.push({
      testName: 'Backend source mapping',
      sourceFile: 'packages/backend/src/controllers/test.controller.ts',
      compiledFile: 'packages/backend/dist/controllers/test.controller.js',
      testBreakpoints: [
        { line: 5, expectedSourceLine: 5 },
        { line: 10, expectedSourceLine: 10 },
      ],
      description: 'Test source mapping for backend TypeScript compilation',
    });

    testCases.push({
      testName: 'Frontend source mapping',
      sourceFile: 'packages/frontend/src/components/TestComponent.tsx',
      compiledFile: 'packages/frontend/dist/components/TestComponent.js',
      testBreakpoints: [
        { line: 3, expectedSourceLine: 3 },
        { line: 8, expectedSourceLine: 8 },
      ],
      description: 'Test source mapping for frontend React component',
    });

    testCases.push({
      testName: 'Core package source mapping',
      sourceFile: 'packages/@reporunner/core/src/workflow/test-engine.ts',
      compiledFile: 'packages/@reporunner/core/dist/workflow/test-engine.js',
      testBreakpoints: [
        { line: 4, expectedSourceLine: 4 },
        { line: 12, expectedSourceLine: 12 },
      ],
      description: 'Test source mapping for core package compilation',
    });

    testCases.push({
      testName: 'Shared types source mapping',
      sourceFile: 'packages/shared/src/types/test-types.ts',
      compiledFile: 'packages/shared/dist/types/test-types.js',
      testBreakpoints: [
        { line: 2, expectedSourceLine: 2 },
        { line: 6, expectedSourceLine: 6 },
      ],
      description: 'Test source mapping for shared type definitions',
    });

    return testCases;
  }

  private async createSourceMappingTestFile(testCase: SourceMappingTestCase): Promise<void> {
    const sourceFilePath = path.resolve(this.workspaceRoot, testCase.sourceFile);
    const sourceDir = path.dirname(sourceFilePath);

    // Ensure directory exists
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }

    let testContent = '';

    if (testCase.sourceFile.includes('controller')) {
      testContent = `// Test controller for source mapping validation
export class TestController {
  constructor() {
    console.log('TestController initialized');
  }

  public testMethod(): string {
    const result = 'test result';
    console.log('Test method called');
    return result;
  }

  public async asyncMethod(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Async method completed');
  }
}
`;
    } else if (testCase.sourceFile.includes('Component')) {
      testContent = `// Test React component for source mapping validation
import React from 'react';

export const TestComponent: React.FC = () => {
  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};
`;
    } else if (testCase.sourceFile.includes('engine')) {
      testContent = `// Test engine for source mapping validation
export class TestEngine {
  private isRunning = false;

  public start(): void {
    this.isRunning = true;
    console.log('Engine started');
  }

  public stop(): void {
    this.isRunning = false;
    console.log('Engine stopped');
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}
`;
    } else if (testCase.sourceFile.includes('types')) {
      testContent = `// Test types for source mapping validation
export interface TestEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export type TestStatus = 'active' | 'inactive' | 'pending';

export interface TestConfig {
  enabled: boolean;
  timeout: number;
  retries: number;
}
`;
    } else {
      // Generic test file
      testContent = `// Test file for source mapping validation
export class TestClass {
  public testMethod(): string {
    console.log('Test method');
    return 'test';
  }
}
`;
    }

    fs.writeFileSync(sourceFilePath, testContent);
  }

  private findCompiledFile(compiledFile: string): string | null {
    // Try different possible locations for compiled files
    const possiblePaths = [
      path.resolve(this.workspaceRoot, compiledFile),
      path.resolve(this.workspaceRoot, compiledFile.replace('/src/', '/dist/')),
      path.resolve(this.workspaceRoot, compiledFile.replace('/src/', '/build/')),
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }

    return null;
  }

  private async validateSourceMapContent(
    sourceFilePath: string,
    _compiledFilePath: string,
    sourceMapPath: string,
    _testBreakpoints: Array<{ line: number; expectedSourceLine: number }>
  ): Promise<{
    isValid: boolean;
    issues: string[];
    severity: 'excellent' | 'good' | 'poor' | 'broken';
  }> {
    const issues: string[] = [];
    let isValid = true;
    let severity: 'excellent' | 'good' | 'poor' | 'broken' = 'excellent';

    try {
      // Read and parse source map
      const sourceMapContent = fs.readFileSync(sourceMapPath, 'utf-8');
      const sourceMap = JSON.parse(sourceMapContent);

      // Basic source map structure validation
      if (!(sourceMap.version && sourceMap.sources && sourceMap.mappings)) {
        issues.push('Invalid source map structure');
        isValid = false;
        severity = 'broken';
        return { isValid, issues, severity };
      }

      // Check if source file is referenced in source map
      const relativeSourcePath = path.relative(path.dirname(sourceMapPath), sourceFilePath);
      const normalizedSourcePath = relativeSourcePath.replace(/\\/g, '/');

      const sourceFound = sourceMap.sources.some(
        (source: string) =>
          source.includes(path.basename(sourceFilePath)) ||
          source === normalizedSourcePath ||
          source === relativeSourcePath
      );

      if (!sourceFound) {
        issues.push(`Source file not found in source map: ${normalizedSourcePath}`);
        isValid = false;
        severity = 'poor';
      }

      // Check source content
      if (sourceMap.sourcesContent && sourceMap.sourcesContent.length > 0) {
        const originalContent = fs.readFileSync(sourceFilePath, 'utf-8');
        const hasMatchingContent = sourceMap.sourcesContent.some(
          (content: string) => content && content.trim() === originalContent.trim()
        );

        if (!hasMatchingContent) {
          issues.push('Source content in source map does not match original file');
          if (severity === 'excellent') {
            severity = 'good';
          }
        }
      } else {
        issues.push('Source map does not contain source content');
        if (severity === 'excellent') {
          severity = 'good';
        }
      }

      // Validate mappings exist
      if (!sourceMap.mappings || sourceMap.mappings.length === 0) {
        issues.push('Source map contains no mappings');
        isValid = false;
        severity = 'broken';
      }
    } catch (error) {
      issues.push(
        `Failed to parse source map: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      isValid = false;
      severity = 'broken';
    }

    return { isValid, issues, severity };
  }

  private async validateTypeScriptSourceMapConfig(): Promise<string[]> {
    const issues: string[] = [];

    try {
      const configPath = path.join(this.workspaceRoot, 'tsconfig.base.json');
      if (!fs.existsSync(configPath)) {
        issues.push('TypeScript configuration file not found');
        return issues;
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      if (!config.compilerOptions) {
        issues.push('TypeScript configuration missing compilerOptions');
        return issues;
      }

      // Check source map related settings
      if (!config.compilerOptions.sourceMap) {
        issues.push('TypeScript sourceMap option is not enabled');
      }

      if (!config.compilerOptions.declarationMap) {
        issues.push('TypeScript declarationMap option is not enabled (affects .d.ts debugging)');
      }

      // Check for inline source maps (less ideal for debugging)
      if (config.compilerOptions.inlineSourceMap) {
        issues.push(
          'Using inline source maps instead of separate .map files (may impact debugging performance)'
        );
      }
    } catch (error) {
      issues.push(
        `Failed to validate TypeScript configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return issues;
  }
}
