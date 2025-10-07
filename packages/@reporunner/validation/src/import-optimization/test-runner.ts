#!/usr/bin/env node

import * as path from 'node:path';
import { ImportPathOptimizer } from './import-path-optimizer';

async function runImportOptimizationTest() {
  try {
    // Find workspace root
    const workspaceRoot = findWorkspaceRoot();

    // Create optimizer
    const optimizer = new ImportPathOptimizer(workspaceRoot);
    const circularDependencyDetector = (optimizer as any).circularDependencyDetector;
    const circularDependencies = await circularDependencyDetector.detectCircularDependencies();
    if (circularDependencies.length === 0) {
    } else {
      circularDependencies.forEach((cycle: any) => {
        const _severity = cycle.severity === 'critical' ? '🚨' : '⚠️';
        if (cycle.suggestions.length > 0) {
        }
      });
    }
    const importConsistencyValidator = (optimizer as any).importConsistencyValidator;
    const consistencyResults = await importConsistencyValidator.validateImportConsistency();

    const _totalImports = consistencyResults.analyses.reduce(
      (sum: number, analysis: any) => sum + analysis.imports.length,
      0
    );
    const totalIssues = consistencyResults.analyses.reduce(
      (sum: number, analysis: any) => sum + analysis.issues.length,
      0
    );

    if (totalIssues > 0) {
      const issueTypes = new Map<string, number>();
      consistencyResults.analyses.forEach((analysis: any) => {
        analysis.issues.forEach((issue: any) => {
          issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
        });
      });
      issueTypes.forEach((_count, _type) => {});
    }
    const pathSuggestionEngine = (optimizer as any).pathSuggestionEngine;
    const suggestions = await pathSuggestionEngine.generateSuggestions(consistencyResults.analyses);

    if (suggestions.length > 0) {
      const suggestionTypes = new Map<string, number>();
      const impactLevels = new Map<string, number>();

      suggestions.forEach((suggestion: any) => {
        suggestionTypes.set(suggestion.type, (suggestionTypes.get(suggestion.type) || 0) + 1);
        impactLevels.set(
          suggestion.estimatedImpact,
          (impactLevels.get(suggestion.estimatedImpact) || 0) + 1
        );
      });
      suggestionTypes.forEach((_count, _type) => {});
      impactLevels.forEach((_count, _impact) => {});
    }
    const packageStructure = await optimizer.analyzePackageStructure();
    const packageNames = Object.keys(packageStructure);

    packageNames.slice(0, 5).forEach((packageName) => {
      const _pkg = packageStructure[packageName];
    });

    if (packageNames.length > 5) {
    }
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
  runImportOptimizationTest();
}

export { runImportOptimizationTest };
