#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  maxFileSize: 150,
  targetFileSize: 100,
  packages: [
    'packages/backend/src/services',
    'packages/frontend/src/components',
    'packages/core/src',
  ],
  patterns: {
    service: /class\s+(\w+Service)/,
    controller: /class\s+(\w+Controller)/,
    component: /(?:function|const)\s+(\w+).*(?:React\.FC|Component)/,
    repository: /class\s+(\w+Repository)/,
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Find all TypeScript files
function findTsFiles(dir) {
  const files = [];

  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;

    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Analyze file to determine its type
function analyzeFile(filePath, content) {
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Determine file type
  let fileType = 'unknown';
  const fileName = path.basename(filePath);

  if (fileName.includes('.service.')) fileType = 'service';
  else if (fileName.includes('.controller.')) fileType = 'controller';
  else if (fileName.includes('.component.')) fileType = 'component';
  else if (fileName.includes('.repository.')) fileType = 'repository';
  else if (CONFIG.patterns.service.test(content)) fileType = 'service';
  else if (CONFIG.patterns.controller.test(content)) fileType = 'controller';
  else if (CONFIG.patterns.component.test(content)) fileType = 'component';
  else if (CONFIG.patterns.repository.test(content)) fileType = 'repository';

  // Calculate complexity
  const complexityIndicators = [
    /if\s*\(/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /switch\s*\(/g,
    /\?\s*.*:/g,
  ];

  let complexity = 1;
  complexityIndicators.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) complexity += matches.length;
  });

  return {
    path: filePath,
    lineCount,
    complexity,
    fileType,
    needsRefactoring: lineCount > CONFIG.maxFileSize || complexity > 10,
  };
}

// Extract methods from a class
function extractMethods(content) {
  const methods = [];
  const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g;
  let match;

  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1];
    if (methodName !== 'constructor') {
      methods.push(methodName);
    }
  }

  return methods;
}

// Refactor service file
function refactorService(filePath, content) {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.ts').replace('Service', '');
  const serviceName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  const newDir = path.join(dir, baseName.toLowerCase());

  // Create directory structure
  const dirs = [
    path.join(newDir, 'domain', 'entities'),
    path.join(newDir, 'domain', 'value-objects'),
    path.join(newDir, 'application', 'use-cases'),
    path.join(newDir, 'infrastructure', 'repositories'),
  ];

  dirs.forEach((d) => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  // Extract methods to create use cases
  const methods = extractMethods(content);

  // Create use cases
  methods.forEach((method) => {
    const useCaseName = method.charAt(0).toUpperCase() + method.slice(1);
    const useCaseContent = `import { injectable } from 'inversify';

@injectable()
export class ${useCaseName}UseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement ${method} logic
    throw new Error('Not implemented');
  }
}
`;
    const useCasePath = path.join(newDir, 'application', 'use-cases', `${useCaseName}.use-case.ts`);
    fs.writeFileSync(useCasePath, useCaseContent);
  });

  // Create repository interface
  const repoInterfaceContent = `export interface I${serviceName}Repository {
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
}
`;
  const repoInterfacePath = path.join(
    newDir,
    'domain',
    'repositories',
    `I${serviceName}Repository.ts`
  );
  if (!fs.existsSync(path.dirname(repoInterfacePath))) {
    fs.mkdirSync(path.dirname(repoInterfacePath), { recursive: true });
  }
  fs.writeFileSync(repoInterfacePath, repoInterfaceContent);

  // Create repository implementation
  const repoImplContent = `import { injectable } from 'inversify';
import { I${serviceName}Repository } from '../../domain/repositories/I${serviceName}Repository';

@injectable()
export class ${serviceName}Repository implements I${serviceName}Repository {
  async findById(id: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async findAll(): Promise<any[]> {
    // TODO: Implement
    return [];
  }

  async create(data: any): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async update(id: string, data: any): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Implement
    return false;
  }
}
`;
  const repoImplPath = path.join(
    newDir,
    'infrastructure',
    'repositories',
    `${serviceName}Repository.ts`
  );
  fs.writeFileSync(repoImplPath, repoImplContent);

  // Create refactored service
  const refactoredServiceContent = `import { injectable, inject } from 'inversify';
import { I${serviceName}Repository } from './domain/repositories/I${serviceName}Repository';
${methods
  .map((m) => {
    const ucName = m.charAt(0).toUpperCase() + m.slice(1);
    return `import { ${ucName}UseCase } from './application/use-cases/${ucName}.use-case';`;
  })
  .join('\n')}

@injectable()
export class ${serviceName}Service {
  constructor(
    @inject('I${serviceName}Repository') private repository: I${serviceName}Repository,
    ${methods
      .map((m) => {
        const ucName = m.charAt(0).toUpperCase() + m.slice(1);
        return `@inject(${ucName}UseCase) private ${m}UseCase: ${ucName}UseCase`;
      })
      .join(',\n    ')}
  ) {}

  ${methods
    .map(
      (m) => `async ${m}(input: any): Promise<any> {
    return this.${m}UseCase.execute(input);
  }`
    )
    .join('\n\n  ')}
}
`;
  const refactoredServicePath = path.join(newDir, `${serviceName}Service.ts`);
  fs.writeFileSync(refactoredServicePath, refactoredServiceContent);

  // Create index file
  const indexContent = `export * from './${serviceName}Service';
export * from './domain/repositories/I${serviceName}Repository';
export * from './infrastructure/repositories/${serviceName}Repository';
${methods
  .map((m) => {
    const ucName = m.charAt(0).toUpperCase() + m.slice(1);
    return `export * from './application/use-cases/${ucName}.use-case';`;
  })
  .join('\n')}
`;
  fs.writeFileSync(path.join(newDir, 'index.ts'), indexContent);

  return {
    filesCreated: methods.length + 4,
    newDir,
  };
}

// Refactor controller file
function refactorController(filePath, content) {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.ts').replace('Controller', '');
  const controllerName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  const newDir = path.join(dir, baseName.toLowerCase());

  // Create directory structure
  const dirs = [
    path.join(newDir, 'handlers'),
    path.join(newDir, 'dto'),
    path.join(newDir, 'validators'),
  ];

  dirs.forEach((d) => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  // Create main controller
  const mainControllerContent = `import { Router } from 'express';
import { injectable } from 'inversify';

@injectable()
export class ${controllerName}Controller {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // TODO: Register routes
  }
}
`;
  fs.writeFileSync(path.join(newDir, `${controllerName}Controller.ts`), mainControllerContent);

  // Create sample DTO
  const dtoContent = `import { IsString, IsOptional } from 'class-validator';

export class ${controllerName}DTO {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;
}
`;
  fs.writeFileSync(path.join(newDir, 'dto', `${controllerName}.dto.ts`), dtoContent);

  return {
    filesCreated: 2,
    newDir,
  };
}

// Split large file into smaller modules
function splitLargeFile(filePath, content) {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.ts').replace('.tsx', '');
  const newDir = path.join(dir, baseName.toLowerCase());

  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
  }

  const lines = content.split('\n');
  const chunkSize = CONFIG.targetFileSize;
  const chunks = [];

  // Extract imports
  const imports = [];
  let i = 0;
  while (i < lines.length && (lines[i].startsWith('import') || lines[i].trim() === '')) {
    imports.push(lines[i]);
    i++;
  }

  // Split remaining content
  const remainingLines = lines.slice(i);
  for (let j = 0; j < remainingLines.length; j += chunkSize) {
    const chunk = remainingLines.slice(j, j + chunkSize);
    chunks.push(chunk);
  }

  // Write chunks
  chunks.forEach((chunk, index) => {
    const chunkContent = [...imports, '', ...chunk].join('\n');
    const chunkPath = path.join(newDir, `${baseName}.part${index + 1}.ts`);
    fs.writeFileSync(chunkPath, chunkContent);
  });

  // Create index file
  const indexContent = chunks
    .map((_, index) => `export * from './${baseName}.part${index + 1}';`)
    .join('\n');
  fs.writeFileSync(path.join(newDir, 'index.ts'), indexContent);

  return {
    filesCreated: chunks.length + 1,
    newDir,
  };
}

// Main refactoring function
function refactorFile(fileInfo) {
  const content = fs.readFileSync(fileInfo.path, 'utf-8');

  try {
    switch (fileInfo.fileType) {
      case 'service':
        return refactorService(fileInfo.path, content);
      case 'controller':
        return refactorController(fileInfo.path, content);
      case 'component':
      case 'repository':
      default:
        if (fileInfo.lineCount > CONFIG.maxFileSize) {
          return splitLargeFile(fileInfo.path, content);
        }
        return null;
    }
  } catch (error) {
    console.error(`Error refactoring ${fileInfo.path}:`, error.message);
    return null;
  }
}

// Main execution
function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║     🚀 REPORUNNER IMMEDIATE REFACTORING SYSTEM 🚀          ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

  const stats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    filesCreated: 0,
    startTime: Date.now(),
  };

  // Find all TypeScript files
  log('📂 Scanning for TypeScript files...', 'blue');

  const allFiles = [];
  for (const pkg of CONFIG.packages) {
    const packagePath = path.join(process.cwd(), pkg);
    const files = findTsFiles(packagePath);
    allFiles.push(...files);
  }

  stats.totalFiles = allFiles.length;
  log(`Found ${stats.totalFiles} TypeScript files\n`, 'green');

  // Analyze files
  log('🔍 Analyzing files...', 'blue');

  const filesToRefactor = [];
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileInfo = analyzeFile(file, content);

      if (fileInfo.needsRefactoring) {
        filesToRefactor.push(fileInfo);
      } else {
        stats.skippedFiles++;
      }
    } catch (error) {
      // Skip files that can't be read
      stats.skippedFiles++;
    }
  }

  log(`${filesToRefactor.length} files need refactoring\n`, 'yellow');

  // Show top files to refactor
  if (filesToRefactor.length > 0) {
    log('📝 Top files to refactor:', 'blue');
    const topFiles = filesToRefactor.sort((a, b) => b.lineCount - a.lineCount).slice(0, 10);

    topFiles.forEach((file, index) => {
      const relativePath = path.relative(process.cwd(), file.path);
      log(
        `  ${index + 1}. ${relativePath} (${file.lineCount} lines, type: ${file.fileType})`,
        'reset'
      );
    });
    log('', 'reset');
  }

  // Refactor files
  log('⚙️  Starting refactoring...', 'blue');

  for (const fileInfo of filesToRefactor) {
    const result = refactorFile(fileInfo);

    if (result) {
      stats.processedFiles++;
      stats.filesCreated += result.filesCreated;

      const relativePath = path.relative(process.cwd(), fileInfo.path);
      log(`  ✅ Refactored: ${relativePath}`, 'green');
      log(`     Created ${result.filesCreated} new files in ${result.newDir}`, 'reset');
    }
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║                   REFACTORING COMPLETE                      ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

  log('📊 Summary:', 'green');
  log(`  • Total files scanned: ${stats.totalFiles}`, 'reset');
  log(`  • Files refactored: ${stats.processedFiles}`, 'green');
  log(`  • Files skipped: ${stats.skippedFiles}`, 'yellow');
  log(`  • New files created: ${stats.filesCreated}`, 'blue');
  log(`  • Duration: ${duration} seconds`, 'reset');

  log('\n✨ Your codebase has been refactored!\n', 'magenta');
}

// Run the refactoring
main();
