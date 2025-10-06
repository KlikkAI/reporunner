#!/usr/bin/env node

import { TypeScriptAnalyzer } from './analyzer';
import * as path from 'path';

async function runTypeScriptAnalysisTest() {
  console.log('🔍 Running TypeScript Analysis Test...\n');

  try {
    // Find workspace root
    const workspaceRoot = findWorkspaceRoot();
    console.log(`Workspace root: ${workspaceRoot}`);

    // Create analyzer
    const analyzer = new TypeScriptAnalyzer(workspaceRoot);

    // Test package directory discovery
    console.log('\n📁 Testing package directory discovery...');
    const packageDirs = await analyzer.getPackageDirectories();
    console.log(`Found ${packageDirs.length} packages:`);
    packageDirs.forEach(dir => {
      console.log(`  - ${path.relative(workspaceRoot, dir)}`);
    });

    // Run basic analysis (just compilation for now to avoid complex setup)
    console.log('\n🔧 Testing compilation analysis...');
    const compilationAnalyzer = (analyzer as any).compilationAnalyzer;
    const compilationMetrics = await compilationAnalyzer.analyzeCompilation();

    console.log(`\n📊 Compilation Results:`);
    compilationMetrics.forEach((metrics: any) => {
      console.log(`  📦 ${metrics.packageName}:`);
      console.log(`    Files: ${metrics.totalFiles}`);
      console.log(`    Time: ${metrics.compilationTime}ms`);
      console.log(`    Errors: ${metrics.errors.length}`);
      console.log(`    Warnings: ${metrics.warnings.length}`);

      if (metrics.errors.length > 0) {
        console.log(`    First error: ${metrics.errors[0].message}`);
      }
    });

    console.log('\n✅ TypeScript analysis test completed successfully!');

  } catch (error) {
    console.error('❌ TypeScript analysis test failed:', error);
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
  runTypeScriptAnalysisTest();
}

export { runTypeScriptAnalysisTest };
