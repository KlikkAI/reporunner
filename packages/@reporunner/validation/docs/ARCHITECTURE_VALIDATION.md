# Architecture Validation

The Architecture Validation system provides comprehensive analysis of the consolidated package architecture across three key dimensions: dependencies, code organization, and type safety.

## Overview

The architecture validation system consists of three main components:

1. **DependencyAnalyzer** - Validates package dependencies and boundaries
2. **CodeOrganizationChecker** - Validates code organization and structure
3. **TypeSafetyValidator** - Validates type safety across packages

## Components

### DependencyAnalyzer

Analyzes package dependencies and validates architectural boundaries.

#### Features

- **Circular Dependency Detection**: Detects circular dependencies at both package and file levels
- **Package Boundary Validation**: Validates architectural layers and unauthorized access patterns
- **Dependency Graph Generation**: Creates visual dependency graphs with metrics
- **Layer Compliance**: Enforces proper layering (foundation → core → domain → platform → application)

#### Usage

```typescript
import { DependencyAnalyzer } from '@reporunner/validation/architecture';

const analyzer = new DependencyAnalyzer('/path/to/workspace');
await analyzer.initialize();

// Check for circular dependencies
const circularReport = await analyzer.checkCircularDependencies();
console.log(`Found ${circularReport.circularDependencies.length} circular dependencies`);

// Validate package boundaries
const boundaryReport = await analyzer.validatePackageBoundaries();
console.log(`Boundary compliance: ${boundaryReport.complianceScore}%`);

// Generate dependency graph
const graph = await analyzer.generateDependencyGraph();
console.log(`Graph has ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
```

#### Package Layers

The system enforces the following architectural layers:

- **Foundation** (Layer 0): `shared`
- **Core** (Layer 1): `@reporunner/core`
- **Domain** (Layer 2): `@reporunner/auth`, `@reporunner/services`, `@reporunner/workflow`, `@reporunner/ai`
- **Platform** (Layer 3): `@reporunner/platform`, `@reporunner/enterprise`
- **Application** (Layer 4): `backend`, `frontend`, `@reporunner/cli`, `@reporunner/validation`

### CodeOrganizationChecker

Validates code organization and structural quality.

#### Features

- **Separation of Concerns**: Detects mixed concerns and tight coupling
- **Code Duplication Detection**: Identifies duplicated code blocks
- **Naming Convention Validation**: Enforces consistent naming patterns
- **God Class Detection**: Identifies overly large classes and files

#### Usage

```typescript
import { CodeOrganizationChecker } from '@reporunner/validation/architecture';

const checker = new CodeOrganizationChecker('/path/to/workspace');
await checker.initialize();

const report = await checker.validateCodeOrganization();
console.log(`Overall organization score: ${report.overallScore}/100`);
console.log(`Separation of concerns: ${report.separationOfConcerns.score}/100`);
console.log(`Code duplication: ${report.codeDuplication.duplicationPercentage}%`);
console.log(`Naming compliance: ${report.namingConventions.complianceScore}%`);
```

#### Validation Rules

**Separation of Concerns**:
- Controllers should not contain database logic
- Services should not contain UI logic
- Models should not contain HTTP logic
- Components should not contain database logic

**Naming Conventions**:
- Classes: PascalCase
- Functions: camelCase
- Variables: camelCase or CONSTANT_CASE
- Interfaces: PascalCase (optionally with 'I' prefix)
- Types: PascalCase

**Code Quality**:
- Maximum file size: 500 lines
- Maximum methods per class: 20
- Duplication threshold: 5+ lines with 50+ tokens

### TypeSafetyValidator

Validates type safety across package boundaries.

#### Features

- **Cross-Package Type Consistency**: Validates type definitions across packages
- **Interface Compatibility**: Checks interface inheritance and compatibility
- **Export Structure Analysis**: Validates export patterns and identifies optimization opportunities
- **TypeScript Integration**: Uses TypeScript compiler API for accurate analysis

#### Usage

```typescript
import { TypeSafetyValidator } from '@reporunner/validation/architecture';

const validator = new TypeSafetyValidator('/path/to/workspace');
await validator.initialize();

const report = await validator.validateTypeSafety();
console.log(`Overall type safety: ${report.overallScore}/100`);
console.log(`Type consistency: ${report.crossPackageConsistency.consistencyScore}%`);
console.log(`Interface compatibility: ${report.interfaceCompatibility.compatibilityScore}%`);
console.log(`Export structure: ${report.exportStructure.structureScore}%`);
```

#### Validation Rules

**Type Consistency**:
- Shared types should be defined in common packages
- Type definitions should be consistent across packages
- Avoid duplicate type definitions

**Interface Compatibility**:
- Interface inheritance should be backward compatible
- Required properties should not be removed
- Type changes should maintain compatibility

**Export Structure**:
- Remove unused exports
- Use proper barrel exports (index.ts files)
- Avoid circular export dependencies
- Follow consistent naming conventions

## CLI Usage

### Complete Architecture Validation

```bash
# Run all architecture validations
pnpm architecture:validate

# With custom output format
pnpm architecture:validate -- --output html --output-file report.html
pnpm architecture:validate -- --output markdown --output-file report.md
```

### Individual Validations

```bash
# Dependency analysis only
pnpm architecture:dependencies

# Code organization only
pnpm architecture:organization

# Type safety only
pnpm architecture:types
```

### Advanced Options

```bash
# Generate dependency graph visualization
pnpm architecture:dependencies -- --generate-graph

# Custom output file
pnpm architecture:organization -- --output-file org-report.json

# HTML report for type safety
pnpm architecture:types -- --output html --output-file types.html
```

## Configuration

### Validation Options

```typescript
interface ArchitectureValidationOptions {
  includeCircularDependencies?: boolean;
  includeBoundaryValidation?: boolean;
  includeDependencyGraph?: boolean;
  includeCodeOrganization?: boolean;
  includeTypeSafety?: boolean;
  outputFormat?: 'json' | 'html' | 'markdown';
  generateVisualization?: boolean;
}
```

### Custom Rules

You can extend the validation rules by creating custom validators:

```typescript
import { DependencyAnalyzer } from '@reporunner/validation/architecture';

class CustomDependencyAnalyzer extends DependencyAnalyzer {
  protected isUnauthorizedAccess(source: string, target: string): boolean {
    // Add custom unauthorized access patterns
    const customPatterns = [
      { source: 'my-package', target: 'restricted-package' }
    ];

    return super.isUnauthorizedAccess(source, target) ||
           customPatterns.some(pattern =>
             source === pattern.source && target === pattern.target
           );
  }
}
```

## Report Structure

### Dependency Analysis Report

```typescript
interface CircularDependencyReport {
  hasCircularDependencies: boolean;
  circularDependencies: CircularDependency[];
  totalPackages: number;
  affectedPackages: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface PackageBoundaryReport {
  violations: BoundaryViolation[];
  totalChecks: number;
  violationCount: number;
  complianceScore: number;
  recommendations: string[];
}
```

### Code Organization Report

```typescript
interface CodeOrganizationReport {
  separationOfConcerns: SeparationReport;
  codeDuplication: DuplicationReport;
  namingConventions: NamingReport;
  overallScore: number;
  recommendations: string[];
}
```

### Type Safety Report

```typescript
interface TypeSafetyReport {
  crossPackageConsistency: TypeConsistencyReport;
  interfaceCompatibility: InterfaceCompatibilityReport;
  exportStructure: ExportStructureReport;
  overallScore: number;
  recommendations: string[];
}
```

## Integration

### CI/CD Integration

```yaml
# .github/workflows/architecture-validation.yml
name: Architecture Validation
on: [push, pull_request]

jobs:
  validate-architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build --filter=@reporunner/validation
      - run: pnpm architecture:validate
      - name: Upload Architecture Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: architecture-report
          path: architecture-report.html
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm architecture:dependencies && pnpm architecture:organization"
    }
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "validate": "pnpm architecture:validate",
    "validate:deps": "pnpm architecture:dependencies",
    "validate:org": "pnpm architecture:organization",
    "validate:types": "pnpm architecture:types",
    "validate:report": "pnpm architecture:validate -- --output html --output-file architecture-report.html"
  }
}
```

## Best Practices

### Dependency Management

1. **Avoid Circular Dependencies**: Use dependency inversion and event-driven patterns
2. **Respect Layer Boundaries**: Higher layers should not depend on lower layers
3. **Use Proper Abstractions**: Implement interfaces for cross-layer communication
4. **Document Dependencies**: Maintain clear documentation of package relationships

### Code Organization

1. **Single Responsibility**: Each class/file should have one clear purpose
2. **Consistent Naming**: Follow established naming conventions across the codebase
3. **Avoid Duplication**: Extract common functionality into shared utilities
4. **Proper Separation**: Keep concerns separated across different modules

### Type Safety

1. **Shared Types**: Define common types in shared packages
2. **Interface Consistency**: Maintain backward compatibility in interface changes
3. **Export Hygiene**: Remove unused exports and use proper barrel exports
4. **Type Documentation**: Document complex types and their usage

## Troubleshooting

### Common Issues

1. **Madge Dependency Errors**
   - Ensure all TypeScript files are properly configured
   - Check that node_modules are installed correctly
   - Verify workspace configuration

2. **Type Analysis Failures**
   - Ensure TypeScript compiler is properly configured
   - Check that all packages have valid tsconfig.json files
   - Verify path mappings are correct

3. **Performance Issues**
   - Use `--skip-lib-check` in TypeScript configuration
   - Exclude unnecessary files from analysis
   - Consider running validations in parallel

### Debug Mode

Enable verbose logging for detailed analysis:

```bash
pnpm architecture:validate -- --verbose
pnpm architecture:dependencies -- --verbose
```

## Performance

### Benchmarks

Based on the RepoRunner codebase:

- **Packages Analyzed**: 12 consolidated packages
- **Files Processed**: 990+ TypeScript files
- **Dependencies Checked**: 200+ package dependencies
- **Analysis Time**: ~15 seconds for complete validation
- **Memory Usage**: ~150MB peak during analysis

### Optimization Tips

1. **Incremental Analysis**: Only analyze changed packages in CI
2. **Parallel Execution**: Run different validations in parallel
3. **Caching**: Cache analysis results for unchanged files
4. **Selective Validation**: Use specific validation commands for faster feedback

## Contributing

When extending the architecture validation system:

1. **Add Tests**: Include comprehensive tests for new validation rules
2. **Update Documentation**: Document new features and configuration options
3. **Maintain Compatibility**: Ensure backward compatibility with existing reports
4. **Performance**: Consider performance impact of new validations

## Examples

### Custom Validation Script

```typescript
import {
  DependencyAnalyzer,
  CodeOrganizationChecker,
  TypeSafetyValidator
} from '@reporunner/validation/architecture';

async function validateArchitecture() {
  const workspaceRoot = process.cwd();

  // Initialize validators
  const analyzer = new DependencyAnalyzer(workspaceRoot);
  const checker = new CodeOrganizationChecker(workspaceRoot);
  const validator = new TypeSafetyValidator(workspaceRoot);

  await Promise.all([
    analyzer.initialize(),
    checker.initialize(),
    validator.initialize()
  ]);

  // Run validations
  const [depReport, orgReport, typeReport] = await Promise.all([
    analyzer.checkCircularDependencies(),
    checker.validateCodeOrganization(),
    validator.validateTypeSafety()
  ]);

  // Calculate overall score
  const overallScore = (
    (depReport.hasCircularDependencies ? 50 : 100) +
    orgReport.overallScore +
    typeReport.overallScore
  ) / 3;

  console.log(`Overall Architecture Score: ${overallScore.toFixed(1)}/100`);

  return {
    dependencies: depReport,
    organization: orgReport,
    typeSafety: typeReport,
    overallScore
  };
}

validateArchitecture().catch(console.error);
```

### Integration with Build Tools

```javascript
// webpack.config.js
const { DependencyAnalyzer } = require('@reporunner/validation/architecture');

module.exports = {
  // ... other config
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.beforeCompile.tapAsync('ArchitectureValidation', async (params, callback) => {
          const analyzer = new DependencyAnalyzer();
          await analyzer.initialize();
          const report = await analyzer.checkCircularDependencies();

          if (report.hasCircularDependencies) {
            console.warn('Circular dependencies detected:', report.circularDependencies);
          }

          callback();
        });
      }
    }
  ]
};
```

This comprehensive architecture validation system ensures that the consolidated package architecture remains clean, maintainable, and follows best practices as the codebase evolves.
