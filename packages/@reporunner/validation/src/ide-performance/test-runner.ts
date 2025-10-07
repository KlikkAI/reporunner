#!/usr/bin/env node

import * as path from 'node:path';
import { IDEPerformanceValidator } from './ide-performance-validator';

async function runIDEPerformanceTest() {
  try {
    // Find workspace root
    const workspaceRoot = findWorkspaceRoot();

    // Create validator
    const validator = new IDEPerformanceValidator(workspaceRoot);
    const navigationTester = (validator as any).navigationTester;
    const navigationResults = await navigationTester.runNavigationTests();
    navigationResults.forEach((result: any) => {
      const _status = result.successful ? '✅' : '❌';
      if (!result.successful && result.errorMessage) {
      }
    });
    const intelliSenseTester = (validator as any).intelliSenseTester;
    const intelliSenseResults = await intelliSenseTester.runIntelliSenseTests();
    intelliSenseResults.forEach((result: any) => {
      const _status = result.successful ? '✅' : '❌';
      if (result.actualFeatures.length > 0) {
      }
    });
    const sourceMappingValidator = (validator as any).sourceMappingValidator;
    const sourceMappingResults = await sourceMappingValidator.validateSourceMapping();
    sourceMappingResults.forEach((result: any) => {
      const _status = result.sourceMappingAccurate ? '✅' : '❌';
      if (result.issues.length > 0) {
      }
    });
  } catch (_error) {
    process.exit(1);
  }
}

function findWorkspaceRoot(): string {
  let currentDir = process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const pnpmWorkspacePath = path.join(currentDir, 'pnpm-workspace.yaml');

    try {
      const fs = require('node:fs');
      if (fs.existsSync(packageJsonPath) && fs.existsSync(pnpmWorkspacePath)) {
        return currentDir;
      }
    } catch (_error) {
      // Continue searching
    }

    currentDir = path.dirname(currentDir);
  }

  // Fallback to a reasonable default for testing
  return path.resolve(__dirname, '../../../../../');
}

if (require.main === module) {
  runIDEPerformanceTest();
}

export { runIDEPerformanceTest };
