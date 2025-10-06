#!/usr/bin/env node

import { ImportPathOptimizer } from './import-path-optimizer';
import * as path from 'path';

async function runImportOptimizationTest() {
  console.log('🔍 Running Import Path Optimization Test...\n');

  try {
    // Find workspace root
    const workspaceRoot = findWorkspaceRoot();
    console.log(`Workspace root: ${workspaceRoot}`);

    // Create optimizer
    const optimizer = new ImportPathOptimizer(workspaceRoot);

    // Test circular dependency detection
    console.log('\n🔄 Testing circular dependency detection...');
    const circularDependencyDetector = (optimizer as any).circularDependencyDetector;
    const circularDependencies = await circularDependencyDetector.detectCircularDependencies();

    console.log(`\n📊 Circular Dependency Results:`);
    if (circularDependencies.length === 0) {
      console.log('  ✅ No circular dependencies detected');
    } else {
      circularDependencies.forEach((cycle: any) => {
        const severity = cycle.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${severity} ${cycle.severity}: ${cycle.cycle.slice(0, 3).join(' → ')}${cycle.cycle.length > 3 ? '...' : ''}`);
        if (cycle.suggestions.length > 0) {
          console.log(`    Suggestion: ${cycle.suggestions[0]}`);
        }
      });
    }

    // Test import consistency validation
    console.log('\n📋 Testing import consistency validation...');
    const importConsistencyValidator = (optimizer as any).importConsistencyValidator;
    const consistencyResults = await importConsistencyValidator.validateImportConsistency();

    console.log(`\n📊 Import Consistency Results:`);
    console.log(`  Files analyzed: ${consistencyResults.analyses.length}`);

    const totalImports = consistencyResults.analyses.reduce((sum: number, analysis: any) => sum + analysis.imports.length, 0);
    const totalIssues = consistencyResults.analyses.reduce((sum: number, analysis: any) => sum + analysis.issues.length, 0);

    console.log(`  Total imports: ${totalImports}`);
    console.log(`  Total issues: ${totalIssues}`);

    if (totalIssues > 0) {
      const issueTypes = new Map<string, number>();
      consistencyResults.analyses.forEach((analysis: any) => {
        analysis.issues.forEach((issue: any) => {
          issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
        });
      });

      console.log('  Issue breakdown:');
      issueTypes.forEach((count, type) => {
        console.log(`    ${type}: ${count}`);
      });
    }

    // Test path suggestion engine
    console.log('\n💡 Testing path suggestion engine...');
    const pathSuggestionEngine = (optimizer as any).pathSuggestionEngine;
    const suggestions = await pathSuggestionEngine.generateSuggestions(consistencyResults.analyses);

    console.log(`\n📊 Path Suggestion Results:`);
    console.log(`  Total suggestions: ${suggestions.length}`);

    if (suggestions.length > 0) {
      const suggestionTypes = new Map<string, number>();
      const impactLevels = new Map<string, number>();

      suggestions.forEach((suggestion: any) => {
        suggestionTypes.set(suggestion.type, (suggestionTypes.get(suggestion.type) || 0) + 1);
        impactLevels.set(suggestion.estimatedImpact, (impactLevels.get(suggestion.estimatedImpact) || 0) + 1);
      });

      console.log('  Suggestion types:');
      suggestionTypes.forEach((count, type) => {
        console.log(`    ${type}: ${count}`);
      });

      console.log('  Impact levels:');
      impactLevels.forEach((count, impact) => {
        console.log(`    ${impact}: ${count}`);
      });
    }

    // Test package structure analysis
    console.log('\n📦 Testing package structure analysis...');
    const packageStructure = await optimizer.analyzePackageStructure();

    console.log(`\n📊 Package Structure Results:`);
    const packageNames = Object.keys(packageStructure);
    console.log(`  Packages analyzed: ${packageNames.length}`);

    packageNames.slice(0, 5).forEach(packageName => {
      const pkg = packageStructure[packageName];
      console.log(`  📦 ${packageName}:`);
      console.log(`    Imports: ${pkg.imports.length}`);
      console.log(`    Has exports: ${Object.keys(pkg.exports.exports || {}).length > 0 ? 'Yes' : 'No'}`);
    });

    if (packageNames.length > 5) {
      console.log(`    ... and ${packageNames.length - 5} more packages`);
    }

    console.log('\n✅ Import path optimization test completed successfully!');

  } catch (error) {
    console.error('❌ Import path optimization test failed:', error);
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
  runImportOptimizationTest();
}

export { runImportOptimizationTest };
