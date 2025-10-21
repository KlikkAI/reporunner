#!/usr/bin/env node

import * as path from 'node:path';
import { TypeScriptAnalyzer } from './analyzer';

async function runTypeScriptAnalysisTest() {
  try {
    // Find workspace root
    const workspaceRoot = findWorkspaceRoot();

    // Create analyzer
    const analyzer = new TypeScriptAnalyzer(workspaceRoot);
    const packageDirs = await analyzer.getPackageDirectories();
    packageDirs.forEach((_dir) => {});
    const compilationAnalyzer = (analyzer as any).compilationAnalyzer;
    const compilationMetrics = await compilationAnalyzer.analyzeCompilation();
    compilationMetrics.forEach((metrics: any) => {
      if (metrics.errors.length > 0) {
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
  runTypeScriptAnalysisTest();
}

export { runTypeScriptAnalysisTest };
