#!/usr/bin/env node

/**
 * Demo script to show architecture validation functionality
 * Run with: node demo-architecture-validation.js
 */

console.log('🏗️ Architecture Validation Demo');
console.log('================================\n');

// Simulate the architecture validation results
const mockResults = {
  timestamp: new Date(),
  dependencyAnalysis: {
    circularDependencies: {
      hasCircularDependencies: false,
      circularDependencies: [],
      totalPackages: 12,
      affectedPackages: [],
      severity: 'low',
      recommendations: ['✅ No circular dependencies detected. Great job maintaining clean architecture!']
    },
    packageBoundaries: {
      violations: [],
      totalChecks: 45,
      violationCount: 0,
      complianceScore: 100,
      recommendations: ['✅ Excellent package boundary compliance!']
    },
    dependencyGraph: {
      nodes: [
        { id: 'shared', name: 'shared', type: 'package', size: 15, dependencies: 0, dependents: 8, layer: 'foundation' },
        { id: '@reporunner/core', name: '@reporunner/core', type: 'package', size: 25, dependencies: 1, dependents: 6, layer: 'core' },
        { id: 'backend', name: 'backend', type: 'package', size: 45, dependencies: 5, dependents: 0, layer: 'application' },
        { id: 'frontend', name: 'frontend', type: 'package', size: 38, dependencies: 4, dependents: 0, layer: 'application' }
      ],
      edges: [
        { from: '@reporunner/core', to: 'shared', weight: 1, type: 'direct' },
        { from: 'backend', to: '@reporunner/core', weight: 1, type: 'direct' },
        { from: 'frontend', to: '@reporunner/core', weight: 1, type: 'direct' }
      ],
      metrics: {
        totalNodes: 12,
        totalEdges: 18,
        averageDependencies: 2.3,
        maxDependencies: 5,
        cyclomaticComplexity: 8,
        instability: 0.35,
        abstractness: 0.5
      },
      visualization: 'digraph Dependencies {\n  rankdir=TB;\n  ...\n}'
    }
  },
  codeOrganization: {
    separationOfConcerns: {
      score: 85.2,
      violations: [
        {
          packageName: 'backend',
          filePath: 'packages/backend/src/controllers/UserController.ts',
          violationType: 'mixed_concerns',
          description: 'Controller mixing with database logic',
          severity: 'medium',
          suggestion: 'Consider separating concerns into different modules or classes'
        }
      ],
      packageScores: {
        'shared': 95.0,
        '@reporunner/core': 88.5,
        'backend': 82.1,
        'frontend': 87.3
      }
    },
    codeDuplication: {
      duplicatedBlocks: [
        {
          files: ['packages/backend/src/utils/validation.ts', 'packages/frontend/src/utils/validation.ts'],
          lines: 8,
          tokens: 120,
          similarity: 95,
          startLines: [15, 22],
          endLines: [23, 30]
        }
      ],
      totalDuplication: 8,
      duplicationPercentage: 2.1,
      affectedFiles: ['packages/backend/src/utils/validation.ts', 'packages/frontend/src/utils/validation.ts'],
      recommendations: [
        'ℹ️ Low code duplication detected. Monitor and refactor when convenient.',
        '📋 Duplication reduction strategies:',
        '• Extract common functionality into shared utilities'
      ]
    },
    namingConventions: {
      violations: [
        {
          filePath: 'packages/backend/src/models/user_model.ts',
          elementName: 'user_model',
          elementType: 'variable',
          expectedPattern: 'camelCase or CONSTANT_CASE',
          actualPattern: 'snake_case',
          suggestion: 'Rename to userModel or USER_MODEL'
        }
      ],
      complianceScore: 92.5,
      conventionsCovered: [
        'Class names (PascalCase)',
        'Function names (camelCase)',
        'Variable names (camelCase/CONSTANT_CASE)',
        'Interface names (PascalCase)',
        'Type names (PascalCase)'
      ],
      recommendations: [
        '✅ Good naming convention compliance with room for improvement.',
        '📋 Violations found in: variable',
        '• Use consistent naming patterns across the codebase'
      ]
    },
    overallScore: 86.7,
    recommendations: [
      '✅ Good code organization with some areas for improvement.',
      '🏗️ Separation of concerns improvements needed:',
      '• Review package responsibilities and boundaries'
    ]
  },
  typeSafety: {
    crossPackageConsistency: {
      inconsistencies: [
        {
          typeName: 'User',
          packages: ['backend', 'frontend'],
          definitions: [
            {
              packageName: 'backend',
              filePath: 'packages/backend/src/types/User.ts',
              definition: 'interface User { id: string; name: string; email: string; }',
              lineNumber: 5,
              typeName: 'User'
            },
            {
              packageName: 'frontend',
              filePath: 'packages/frontend/src/types/User.ts',
              definition: 'interface User { id: string; name: string; }',
              lineNumber: 3,
              typeName: 'User'
            }
          ],
          conflictType: 'structure',
          severity: 'error',
          suggestion: 'Move User to a shared package (@reporunner/core or shared) to ensure consistency across backend, frontend'
        }
      ],
      totalTypes: 45,
      consistencyScore: 88.9
    },
    interfaceCompatibility: {
      incompatibilities: [],
      totalInterfaces: 23,
      compatibilityScore: 100
    },
    exportStructure: {
      issues: [
        {
          packageName: '@reporunner/core',
          filePath: 'packages/@reporunner/core/src/utils/helpers.ts',
          issueType: 'unused_export',
          description: "Export 'debugHelper' appears to be unused",
          severity: 'info',
          suggestion: 'Consider removing unused export or documenting its purpose'
        }
      ],
      totalExports: 156,
      structureScore: 94.2,
      optimizationOpportunities: [
        'Remove 1 unused exports to reduce bundle size'
      ]
    },
    overallScore: 91.1,
    recommendations: [
      '✅ Excellent type safety! Your types are well-organized and consistent.',
      '🔄 Type consistency improvements needed:',
      '• Move shared types to common packages (@reporunner/core or shared)'
    ]
  },
  overallScore: 88.6,
  criticalIssues: 1,
  recommendations: [
    '✅ Good architecture with some areas for improvement.',
    '🚨 1 critical issues found that should be addressed immediately:',
    '• Review circular dependencies and package boundaries',
    '• Fix type inconsistencies across packages'
  ]
};

// Display results
console.log('📊 Architecture Validation Results');
console.log('==================================');
console.log(`Overall Score: ${mockResults.overallScore}/100`);
console.log(`Critical Issues: ${mockResults.criticalIssues}`);
console.log(`Timestamp: ${mockResults.timestamp.toISOString()}\n`);

console.log('🔍 Dependency Analysis');
console.log('----------------------');
console.log(`Circular Dependencies: ${mockResults.dependencyAnalysis.circularDependencies.circularDependencies.length}`);
console.log(`Package Boundary Compliance: ${mockResults.dependencyAnalysis.packageBoundaries.complianceScore}%`);
console.log(`Total Packages: ${mockResults.dependencyAnalysis.circularDependencies.totalPackages}`);
console.log(`Dependency Graph Nodes: ${mockResults.dependencyAnalysis.dependencyGraph.nodes.length}`);
console.log(`Dependency Graph Edges: ${mockResults.dependencyAnalysis.dependencyGraph.edges.length}\n`);

console.log('🏗️ Code Organization');
console.log('--------------------');
console.log(`Overall Score: ${mockResults.codeOrganization.overallScore}/100`);
console.log(`Separation of Concerns: ${mockResults.codeOrganization.separationOfConcerns.score}/100`);
console.log(`Code Duplication: ${mockResults.codeOrganization.codeDuplication.duplicationPercentage}%`);
console.log(`Naming Compliance: ${mockResults.codeOrganization.namingConventions.complianceScore}%\n`);

console.log('🔍 Type Safety');
console.log('---------------');
console.log(`Overall Score: ${mockResults.typeSafety.overallScore}/100`);
console.log(`Type Consistency: ${mockResults.typeSafety.crossPackageConsistency.consistencyScore}%`);
console.log(`Interface Compatibility: ${mockResults.typeSafety.interfaceCompatibility.compatibilityScore}%`);
console.log(`Export Structure: ${mockResults.typeSafety.exportStructure.structureScore}%\n`);

console.log('💡 Key Recommendations');
console.log('======================');
mockResults.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});

console.log('\n🎯 Architecture Validation Components Implemented:');
console.log('==================================================');
console.log('✅ DependencyAnalyzer - Circular dependency detection and package boundary validation');
console.log('✅ CodeOrganizationChecker - Separation of concerns, duplication, and naming validation');
console.log('✅ TypeSafetyValidator - Cross-package type consistency and export structure validation');
console.log('✅ CLI Interface - Command-line tools for running architecture validation');
console.log('✅ Comprehensive Reporting - JSON, HTML, and Markdown output formats');

console.log('\n🚀 Usage Examples:');
console.log('==================');
console.log('# Run complete architecture validation');
console.log('npm run architecture:validate');
console.log('');
console.log('# Run specific validations');
console.log('npm run architecture:dependencies');
console.log('npm run architecture:organization');
console.log('npm run architecture:types');
console.log('');
console.log('# Generate reports');
console.log('npm run architecture:validate -- --output html --output-file report.html');
console.log('npm run architecture:dependencies -- --generate-graph');

console.log('\n✨ Architecture validation system successfully implemented!');
