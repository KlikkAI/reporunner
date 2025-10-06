#!/usr/bin/env node

import { IDEPerformanceValidator } from './ide-performance-validator';
import * as path from 'path';

async function runIDEPerformanceTest() {
  console.log('🔍 Running IDE Performance Validation Test...\n');

  try {
    // Find workspace root
    const workspaceRoot = findWorkspaceRoot();
    console.log(`Workspace root: ${workspaceRoot}`);

    // Create validator
    const validator = new IDEPerformanceValidator(workspaceRoot);

    // Test navigation functionality
    console.log('\n🧭 Testing navigation functionality...');
    const navigationTester = (validator as any).navigationTester;
    const navigationResults = await navigationTester.runNavigationTests();

    console.log(`\n📊 Navigation Results:`);
    navigationResults.forEach((result: any) => {
      const status = result.successful ? '✅' : '❌';
      console.log(`  ${status} ${result.testName}: ${result.navigationTime}ms`);
      if (!result.successful && result.errorMessage) {
        console.log(`    Error: ${result.errorMessage}`);
      }
    });

    // Test IntelliSense functionality
    console.log('\n🧠 Testing IntelliSense functionality...');
    const intelliSenseTester = (validator as any).intelliSenseTester;
    const intelliSenseResults = await intelliSenseTester.runIntelliSenseTests();

    console.log(`\n📊 IntelliSense Results:`);
    intelliSenseResults.forEach((result: any) => {
      const status = result.successful ? '✅' : '❌';
      console.log(`  ${status} ${result.testName}: ${result.accuracy.toFixed(1)}% accuracy (${result.responseTime}ms)`);
      if (result.actualFeatures.length > 0) {
        console.log(`    Features: ${result.actualFeatures.slice(0, 3).join(', ')}${result.actualFeatures.length > 3 ? '...' : ''}`);
      }
    });

    // Test source mapping validation
    console.log('\n🗺️ Testing source mapping validation...');
    const sourceMappingValidator = (validator as any).sourceMappingValidator;
    const sourceMappingResults = await sourceMappingValidator.validateSourceMapping();

    console.log(`\n📊 Source Mapping Results:`);
    sourceMappingResults.forEach((result: any) => {
      const status = result.sourceMappingAccurate ? '✅' : '❌';
      console.log(`  ${status} ${result.testName}: ${result.debuggingExperience} debugging experience`);
      if (result.issues.length > 0) {
        console.log(`    Issues: ${result.issues.slice(0, 2).join(', ')}${result.issues.length > 2 ? '...' : ''}`);
      }
    });

    console.log('\n✅ IDE performance validation test completed successfully!');

  } catch (error) {
    console.error('❌ IDE performance validation test failed:', error);
    process.exit(1);
  }
}

function findWorkspaceRoot(): string {
  let currentDir = process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const pnpmWorkspacePath = path.join(currentDir, 'pnpm-workspace.yaml');

    try {
      const fs = require('fs');
      if (fs.existsSync(packageJsonPath) && fs.existsSync(pnpmWorkspacePath)) {
        return currentDir;
      }
    } catch (error) {
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
