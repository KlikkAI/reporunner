# Reporunner Migration: Import/Export Path Resolution Plan

## Migration Challenge Analysis

The proposed large-scale architecture will involve moving packages, creating scoped packages, and restructuring the entire codebase. This will break thousands of import statements across the project.

## Affected Areas Assessment

### 1. **Current Import Patterns**

```typescript
// Current patterns that will break
import { something } from "../../../backend/src/utils";
import { WorkflowEngine } from "../workflow-engine/src";
import { ApiClient } from "../../core/src/api";
import { NodeType } from "../nodes-base/types";
```

### 2. **New Import Patterns After Migration**

```typescript
// New scoped package imports
import { ApiClient } from "@reporunner/api-types";
import { WorkflowEngine } from "@reporunner/platform/execution-engine";
import { NodeType } from "@reporunner/connector-sdk";
import { SecurityUtils } from "@reporunner/security";
```

## Migration Strategy & Tools

### Phase 1: Automated Analysis & Mapping

**1.1 Dependency Mapping Tool**

- Scan all TypeScript/JavaScript files for import statements
- Create dependency graph showing current import relationships
- Identify most commonly imported modules for priority migration
- Generate migration impact report

**1.2 Import Pattern Analysis**

```bash
# Tools to build:
packages/migration-tools/
├── import-scanner/          # Scan all import statements
├── dependency-mapper/       # Create dependency graphs
├── impact-analyzer/         # Analyze migration impact
└── path-translator/         # Generate new import paths
```

### Phase 2: Incremental Migration Strategy

**2.1 Barrel Export Strategy**

```typescript
// Create temporary barrel exports during migration
// packages/legacy-exports/index.ts
export * from "@reporunner/api-types";
export * from "@reporunner/platform/execution-engine";
export * from "@reporunner/security";

// Allow gradual migration:
import { ApiClient } from "../legacy-exports"; // Old way
import { ApiClient } from "@reporunner/api-types"; // New way
```

**2.2 Alias-Based Migration**

```json
// tsconfig.json path mapping for gradual migration
{
  "compilerOptions": {
    "paths": {
      // Legacy aliases (temporary)
      "@/backend/*": ["packages/backend/src/*"],
      "@/core/*": ["packages/core/src/*"],

      // New scoped aliases
      "@reporunner/api-types": ["packages/@reporunner/api-types/src"],
      "@reporunner/platform/*": ["packages/@reporunner/platform/*/src"],
      "@reporunner/security": ["packages/@reporunner/security/src"]
    }
  }
}
```

### Phase 3: Automated Code Transformation

**3.1 CodeMod Scripts**

```javascript
// packages/migration-tools/codemods/
├── update-imports.js        # Transform import statements
├── update-package-refs.js   # Update package.json references
├── update-paths.js          # Update path aliases
└── validate-imports.js      # Validate new import paths
```

**3.2 AST-Based Transformation**

```typescript
// Example codemod using jscodeshift
export default function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.ImportDeclaration)
    .forEach((path) => {
      // Transform old imports to new scoped imports
      if (path.value.source.value.includes("../backend/src")) {
        path.value.source.value = "@reporunner/platform/backend";
      }
    })
    .toSource();
}
```

## Detailed Migration Steps

### Step 1: Pre-Migration Analysis (Week 1)

```bash
# 1. Scan entire codebase for imports
find packages/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  | xargs grep -n "^import\|^export\|require(" > import-analysis.txt

# 2. Generate dependency graph
node migration-tools/dependency-mapper/analyze.js > dependency-graph.json

# 3. Create migration plan
node migration-tools/impact-analyzer/generate-plan.js
```

### Step 2: Package Structure Migration (Weeks 2-3)

```bash
# 1. Create new package structure
mkdir -p packages/@reporunner/{api-types,platform,security,monitoring}

# 2. Move files to new locations
# 3. Update package.json files with new names
# 4. Create barrel exports for backward compatibility
```

### Step 3: Import Path Migration (Weeks 4-5)

```bash
# 1. Run codemods to update import statements
npx jscodeshift -t migration-tools/codemods/update-imports.js packages/

# 2. Update TypeScript path mappings
node migration-tools/update-tsconfig.js

# 3. Update build configurations
node migration-tools/update-build-configs.js
```

### Step 4: Validation & Testing (Week 6)

```bash
# 1. Validate all imports resolve correctly
pnpm type-check

# 2. Run full test suite
pnpm test

# 3. Check for circular dependencies
pnpm build:check-circular

# 4. Validate package boundaries
node migration-tools/validate-boundaries.js
```

## Migration Tools Architecture

### Tool 1: Import Scanner

```typescript
interface ImportScanResult {
  file: string;
  imports: {
    module: string;
    specifiers: string[];
    isRelative: boolean;
    line: number;
  }[];
  exports: {
    specifiers: string[];
    line: number;
  }[];
}
```

### Tool 2: Dependency Mapper

```typescript
interface DependencyGraph {
  packages: {
    [packageName: string]: {
      dependencies: string[];
      dependents: string[];
      files: string[];
      importCount: number;
    };
  };
  files: {
    [filePath: string]: {
      imports: string[];
      exports: string[];
      package: string;
    };
  };
}
```

### Tool 3: Migration Path Mapper

```typescript
interface MigrationMap {
  [oldPath: string]: {
    newPath: string;
    package: string;
    deprecated?: boolean;
    alternatives?: string[];
  };
}
```

## Risk Mitigation Strategies

### 1. **Backward Compatibility**

- Maintain legacy barrel exports for 6 months
- Use TypeScript path mapping for gradual migration
- Create deprecation warnings for old imports
- Provide clear migration guides

### 2. **Incremental Migration**

- Migrate one package at a time
- Keep CI/CD running throughout migration
- Use feature flags for new vs old imports
- Rollback plan for each migration step

### 3. **Validation & Testing**

- Automated import resolution validation
- Full test suite execution after each step
- Bundle size analysis to detect issues
- Performance benchmarks to ensure no regressions

## Migration Timeline

### Phase 1: Preparation (Week 1)

- [ ] Build migration analysis tools
- [ ] Scan codebase and generate reports
- [ ] Create detailed migration plan
- [ ] Set up backup and rollback procedures

### Phase 2: Infrastructure (Weeks 2-3)

- [ ] Create new package structure
- [ ] Set up scoped packages with proper package.json
- [ ] Create barrel exports for backward compatibility
- [ ] Update build system configurations

### Phase 3: Code Migration (Weeks 4-5)

- [ ] Run automated import transformation
- [ ] Update TypeScript configurations
- [ ] Fix any remaining manual import issues
- [ ] Update documentation and examples

### Phase 4: Validation (Week 6)

- [ ] Full type-checking validation
- [ ] Complete test suite execution
- [ ] Performance and bundle analysis
- [ ] Security and dependency audit

### Phase 5: Cleanup (Weeks 7-8)

- [ ] Remove legacy barrel exports
- [ ] Clean up deprecated imports
- [ ] Update CI/CD configurations
- [ ] Final documentation updates

## Migration Tools Implementation

### Import Scanner Tool

```typescript
// packages/migration-tools/import-scanner/scanner.ts
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

export class ImportScanner {
  scanFile(filePath: string): ImportScanResult {
    const sourceCode = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
    );

    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        imports.push(this.extractImportInfo(node));
      }
      if (ts.isExportDeclaration(node)) {
        exports.push(this.extractExportInfo(node));
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return { file: filePath, imports, exports };
  }
}
```

### Dependency Graph Builder

```typescript
// packages/migration-tools/dependency-mapper/mapper.ts
export class DependencyMapper {
  buildGraph(scanResults: ImportScanResult[]): DependencyGraph {
    const graph: DependencyGraph = { packages: {}, files: {} };

    // Process scan results and build dependency relationships
    scanResults.forEach((result) => {
      graph.files[result.file] = {
        imports: result.imports.map((i) => i.module),
        exports: result.exports.map((e) => e.specifiers).flat(),
        package: this.getPackageForFile(result.file),
      };
    });

    return graph;
  }
}
```

### CodeMod Generator

```typescript
// packages/migration-tools/codemods/generator.ts
export class CodeModGenerator {
  generateImportTransform(migrationMap: MigrationMap): string {
    return `
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const migrationMap = ${JSON.stringify(migrationMap, null, 2)};

  return j(file.source)
    .find(j.ImportDeclaration)
    .forEach(path => {
      const oldPath = path.value.source.value;
      const newMapping = migrationMap[oldPath];
      if (newMapping) {
        path.value.source.value = newMapping.newPath;
      }
    })
    .toSource();
}`;
  }
}
```

## Success Criteria

### Technical Validation

- [ ] 100% of imports resolve correctly
- [ ] All tests pass without modification
- [ ] No circular dependencies introduced
- [ ] Build times remain within 10% of current
- [ ] Bundle sizes don't increase significantly

### Developer Experience

- [ ] IDE autocomplete works correctly
- [ ] Clear error messages for wrong imports
- [ ] Documentation reflects new structure
- [ ] Migration guide is comprehensive
- [ ] Developer onboarding updated

### Operational Requirements

- [ ] CI/CD pipeline continues to work
- [ ] No production downtime during migration
- [ ] Rollback procedures tested and documented
- [ ] Performance monitoring shows no regressions
- [ ] Security audit passes with new structure

## Emergency Rollback Plan

### Rollback Triggers

- More than 5% increase in build time
- Any test failures that can't be quickly resolved
- Critical import resolution failures
- Performance regressions > 10%

### Rollback Procedure

1. Restore from pre-migration git tags
2. Revert package.json changes
3. Restore original tsconfig.json paths
4. Run full test suite validation
5. Deploy restored version to staging
6. Validate all functionality works
7. Schedule post-mortem and revised migration plan

This migration plan ensures a smooth transition to the new architecture while minimizing disruption to development workflow and maintaining system stability throughout the process.
