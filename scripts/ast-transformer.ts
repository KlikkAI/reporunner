#!/usr/bin/env ts-node

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

interface TransformResult {
  files: Map<string, string>;
  metrics: {
    originalLines: number;
    refactoredLines: number;
    extractedInterfaces: number;
    extractedTypes: number;
    extractedFunctions: number;
    extractedClasses: number;
  };
}

export class ASTTransformer {
  private sourceFile: ts.SourceFile;
  private printer: ts.Printer;
  private checker: ts.TypeChecker | undefined;

  constructor(
    private filePath: string,
    private content: string
  ) {
    this.sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    this.printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });
  }

  async transform(): Promise<TransformResult> {
    const result: TransformResult = {
      files: new Map(),
      metrics: {
        originalLines: this.content.split('\n').length,
        refactoredLines: 0,
        extractedInterfaces: 0,
        extractedTypes: 0,
        extractedFunctions: 0,
        extractedClasses: 0,
      },
    };

    // Analyze the file structure
    const analysis = this.analyzeFile();

    // Determine refactoring strategy based on file type
    if (analysis.isService) {
      await this.refactorService(result);
    } else if (analysis.isController) {
      await this.refactorController(result);
    } else if (analysis.isComponent) {
      await this.refactorComponent(result);
    } else if (analysis.isRepository) {
      await this.refactorRepository(result);
    } else if (analysis.isLarge) {
      await this.refactorLargeFile(result);
    } else {
      await this.refactorGenericFile(result);
    }

    return result;
  }

  private analyzeFile() {
    const classes: ts.ClassDeclaration[] = [];
    const interfaces: ts.InterfaceDeclaration[] = [];
    const functions: ts.FunctionDeclaration[] = [];
    const types: ts.TypeAliasDeclaration[] = [];
    const enums: ts.EnumDeclaration[] = [];
    const imports: ts.ImportDeclaration[] = [];
    const exports: ts.ExportDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) classes.push(node);
      else if (ts.isInterfaceDeclaration(node)) interfaces.push(node);
      else if (ts.isFunctionDeclaration(node)) functions.push(node);
      else if (ts.isTypeAliasDeclaration(node)) types.push(node);
      else if (ts.isEnumDeclaration(node)) enums.push(node);
      else if (ts.isImportDeclaration(node)) imports.push(node);
      else if (ts.isExportDeclaration(node)) exports.push(node);

      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);

    const fileName = path.basename(this.filePath).toLowerCase();
    const content = this.content.toLowerCase();

    return {
      classes,
      interfaces,
      functions,
      types,
      enums,
      imports,
      exports,
      isService: fileName.includes('service') || content.includes('@service'),
      isController: fileName.includes('controller') || content.includes('@controller'),
      isRepository: fileName.includes('repository') || content.includes('@repository'),
      isComponent: fileName.includes('component') || content.includes('react.component'),
      isLarge: this.content.split('\n').length > 300,
      lineCount: this.content.split('\n').length,
    };
  }

  private async refactorService(result: TransformResult) {
    const analysis = this.analyzeFile();
    const baseDir = path.dirname(this.filePath);
    const serviceName = path.basename(this.filePath, '.ts').replace('Service', '');

    // Extract domain entities
    const entities = this.extractDomainEntities(analysis.classes);
    for (const [name, code] of entities) {
      const entityPath = path.join(
        baseDir,
        serviceName.toLowerCase(),
        'domain',
        'entities',
        `${name}.entity.ts`
      );
      result.files.set(entityPath, code);
      result.metrics.extractedClasses++;
    }

    // Extract value objects
    const valueObjects = this.extractValueObjects(analysis.interfaces, analysis.types);
    for (const [name, code] of valueObjects) {
      const voPath = path.join(
        baseDir,
        serviceName.toLowerCase(),
        'domain',
        'value-objects',
        `${name}.vo.ts`
      );
      result.files.set(voPath, code);
      result.metrics.extractedTypes++;
    }

    // Extract use cases from methods
    const useCases = this.extractUseCases(analysis.classes);
    for (const [name, code] of useCases) {
      const useCasePath = path.join(
        baseDir,
        serviceName.toLowerCase(),
        'application',
        'use-cases',
        `${name}.use-case.ts`
      );
      result.files.set(useCasePath, code);
      result.metrics.extractedFunctions++;
    }

    // Create repository interface and implementation
    const repository = this.generateRepository(serviceName, analysis.classes);
    const repoPath = path.join(
      baseDir,
      serviceName.toLowerCase(),
      'infrastructure',
      'repositories',
      `${serviceName}Repository.ts`
    );
    result.files.set(repoPath, repository.implementation);

    const repoInterfacePath = path.join(
      baseDir,
      serviceName.toLowerCase(),
      'domain',
      'repositories',
      `I${serviceName}Repository.ts`
    );
    result.files.set(repoInterfacePath, repository.interface);

    // Create the refactored service that uses dependency injection
    const refactoredService = this.createRefactoredService(serviceName, useCases);
    const servicePath = path.join(baseDir, serviceName.toLowerCase(), `${serviceName}Service.ts`);
    result.files.set(servicePath, refactoredService);

    // Update metrics
    for (const content of result.files.values()) {
      result.metrics.refactoredLines += content.split('\n').length;
    }
  }

  private async refactorController(result: TransformResult) {
    const analysis = this.analyzeFile();
    const baseDir = path.dirname(this.filePath);
    const controllerName = path.basename(this.filePath, '.ts').replace('Controller', '');

    // Extract route handlers
    const routeHandlers = this.extractRouteHandlers(analysis.classes);
    for (const [name, code] of routeHandlers) {
      const handlerPath = path.join(
        baseDir,
        controllerName.toLowerCase(),
        'handlers',
        `${name}.handler.ts`
      );
      result.files.set(handlerPath, code);
      result.metrics.extractedFunctions++;
    }

    // Extract DTOs
    const dtos = this.extractDTOs(analysis.interfaces);
    for (const [name, code] of dtos) {
      const dtoPath = path.join(baseDir, controllerName.toLowerCase(), 'dto', `${name}.dto.ts`);
      result.files.set(dtoPath, code);
      result.metrics.extractedInterfaces++;
    }

    // Extract validators
    const validators = this.generateValidators(dtos);
    for (const [name, code] of validators) {
      const validatorPath = path.join(
        baseDir,
        controllerName.toLowerCase(),
        'validators',
        `${name}.validator.ts`
      );
      result.files.set(validatorPath, code);
    }

    // Extract middleware
    const middleware = this.extractMiddleware(analysis.functions);
    for (const [name, code] of middleware) {
      const middlewarePath = path.join(
        baseDir,
        controllerName.toLowerCase(),
        'middleware',
        `${name}.middleware.ts`
      );
      result.files.set(middlewarePath, code);
      result.metrics.extractedFunctions++;
    }

    // Create main controller with route registration
    const mainController = this.createMainController(controllerName, routeHandlers);
    const controllerPath = path.join(
      baseDir,
      controllerName.toLowerCase(),
      `${controllerName}Controller.ts`
    );
    result.files.set(controllerPath, mainController);

    // Update metrics
    for (const content of result.files.values()) {
      result.metrics.refactoredLines += content.split('\n').length;
    }
  }

  private async refactorComponent(result: TransformResult) {
    const analysis = this.analyzeFile();
    const baseDir = path.dirname(this.filePath);
    const componentName = path.basename(this.filePath, '.tsx').replace('.ts', '');

    // Extract custom hooks
    const hooks = this.extractCustomHooks(analysis.functions);
    for (const [name, code] of hooks) {
      const hookPath = path.join(baseDir, componentName.toLowerCase(), 'hooks', `${name}.ts`);
      result.files.set(hookPath, code);
      result.metrics.extractedFunctions++;
    }

    // Extract utility functions
    const utils = this.extractUtilityFunctions(analysis.functions);
    for (const [name, code] of utils) {
      const utilPath = path.join(baseDir, componentName.toLowerCase(), 'utils', `${name}.util.ts`);
      result.files.set(utilPath, code);
      result.metrics.extractedFunctions++;
    }

    // Extract types and interfaces
    const types = this.extractComponentTypes(analysis.interfaces, analysis.types);
    if (types.size > 0) {
      const typesContent = Array.from(types.values()).join('\n\n');
      const typesPath = path.join(
        baseDir,
        componentName.toLowerCase(),
        'types',
        `${componentName}.types.ts`
      );
      result.files.set(typesPath, typesContent);
      result.metrics.extractedTypes += types.size;
    }

    // Extract styled components or styles
    const styles = this.extractStyles(this.sourceFile);
    if (styles) {
      const stylesPath = path.join(
        baseDir,
        componentName.toLowerCase(),
        'styles',
        `${componentName}.styles.ts`
      );
      result.files.set(stylesPath, styles);
    }

    // Create cleaned component
    const cleanedComponent = this.createCleanedComponent(componentName, hooks, utils, types);
    const componentPath = path.join(baseDir, componentName.toLowerCase(), `${componentName}.tsx`);
    result.files.set(componentPath, cleanedComponent);

    // Update metrics
    for (const content of result.files.values()) {
      result.metrics.refactoredLines += content.split('\n').length;
    }
  }

  private async refactorRepository(result: TransformResult) {
    const analysis = this.analyzeFile();
    const baseDir = path.dirname(this.filePath);
    const repositoryName = path.basename(this.filePath, '.ts').replace('Repository', '');

    // Extract query methods
    const queryMethods = this.extractQueryMethods(analysis.classes);

    // Create query builder for complex queries
    const queryBuilder = this.createQueryBuilder(repositoryName, queryMethods);
    const queryBuilderPath = path.join(
      baseDir,
      repositoryName.toLowerCase(),
      'query-builders',
      `${repositoryName}QueryBuilder.ts`
    );
    result.files.set(queryBuilderPath, queryBuilder);

    // Create repository interface
    const repositoryInterface = this.createRepositoryInterface(repositoryName, queryMethods);
    const interfacePath = path.join(
      baseDir,
      repositoryName.toLowerCase(),
      'interfaces',
      `I${repositoryName}Repository.ts`
    );
    result.files.set(interfacePath, repositoryInterface);

    // Create base repository with common operations
    const baseRepository = this.createBaseRepository(repositoryName);
    const basePath = path.join(
      baseDir,
      repositoryName.toLowerCase(),
      'base',
      `Base${repositoryName}Repository.ts`
    );
    result.files.set(basePath, baseRepository);

    // Create specialized repositories for different concerns
    const specializedRepos = this.createSpecializedRepositories(repositoryName, queryMethods);
    for (const [name, code] of specializedRepos) {
      const specializedPath = path.join(
        baseDir,
        repositoryName.toLowerCase(),
        'repositories',
        `${name}.repository.ts`
      );
      result.files.set(specializedPath, code);
    }

    // Update metrics
    for (const content of result.files.values()) {
      result.metrics.refactoredLines += content.split('\n').length;
    }
  }

  private async refactorLargeFile(result: TransformResult) {
    const analysis = this.analyzeFile();
    const baseDir = path.dirname(this.filePath);
    const fileName = path.basename(this.filePath, '.ts');

    // Group related functionality
    const groups = this.groupRelatedFunctionality(analysis);

    for (const [groupName, group] of groups) {
      const groupCode = this.generateGroupCode(group);
      const groupPath = path.join(baseDir, fileName.toLowerCase(), `${groupName}.ts`);
      result.files.set(groupPath, groupCode);
    }

    // Create index file that re-exports everything
    const indexFile = this.createIndexFile(groups);
    const indexPath = path.join(baseDir, fileName.toLowerCase(), 'index.ts');
    result.files.set(indexPath, indexFile);

    // Update metrics
    for (const content of result.files.values()) {
      result.metrics.refactoredLines += content.split('\n').length;
    }
  }

  private async refactorGenericFile(result: TransformResult) {
    const analysis = this.analyzeFile();

    // Apply basic improvements
    const improved = this.applyBasicImprovements(this.sourceFile);
    result.files.set(this.filePath, improved);
    result.metrics.refactoredLines = improved.split('\n').length;
  }

  // Helper methods for extraction
  private extractDomainEntities(classes: ts.ClassDeclaration[]): Map<string, string> {
    const entities = new Map<string, string>();

    for (const cls of classes) {
      if (this.isDomainEntity(cls)) {
        const name = cls.name?.getText() || 'UnnamedEntity';
        const code = this.generateEntityCode(cls);
        entities.set(name, code);
      }
    }

    return entities;
  }

  private extractValueObjects(
    interfaces: ts.InterfaceDeclaration[],
    types: ts.TypeAliasDeclaration[]
  ): Map<string, string> {
    const valueObjects = new Map<string, string>();

    for (const iface of interfaces) {
      if (this.isValueObject(iface)) {
        const name = iface.name.getText();
        const code = this.generateValueObjectCode(iface);
        valueObjects.set(name, code);
      }
    }

    for (const type of types) {
      if (this.isValueObject(type)) {
        const name = type.name.getText();
        const code = this.generateValueObjectCode(type);
        valueObjects.set(name, code);
      }
    }

    return valueObjects;
  }

  private extractUseCases(classes: ts.ClassDeclaration[]): Map<string, string> {
    const useCases = new Map<string, string>();

    for (const cls of classes) {
      const methods = cls.members.filter(ts.isMethodDeclaration);

      for (const method of methods) {
        if (this.isBusinessLogic(method)) {
          const name = this.methodToUseCaseName(method.name?.getText() || 'Unknown');
          const code = this.generateUseCaseCode(method, cls.name?.getText());
          useCases.set(name, code);
        }
      }
    }

    return useCases;
  }

  private extractRouteHandlers(classes: ts.ClassDeclaration[]): Map<string, string> {
    const handlers = new Map<string, string>();

    for (const cls of classes) {
      const methods = cls.members.filter(ts.isMethodDeclaration);

      for (const method of methods) {
        if (this.isRouteHandler(method)) {
          const name = method.name?.getText() || 'handler';
          const code = this.generateHandlerCode(method);
          handlers.set(name, code);
        }
      }
    }

    return handlers;
  }

  private extractDTOs(interfaces: ts.InterfaceDeclaration[]): Map<string, string> {
    const dtos = new Map<string, string>();

    for (const iface of interfaces) {
      if (this.isDTO(iface)) {
        const name = iface.name.getText();
        const code = this.generateDTOCode(iface);
        dtos.set(name, code);
      }
    }

    return dtos;
  }

  private extractMiddleware(functions: ts.FunctionDeclaration[]): Map<string, string> {
    const middleware = new Map<string, string>();

    for (const func of functions) {
      if (this.isMiddleware(func)) {
        const name = func.name?.getText() || 'middleware';
        const code = this.generateMiddlewareCode(func);
        middleware.set(name, code);
      }
    }

    return middleware;
  }

  private extractCustomHooks(functions: ts.FunctionDeclaration[]): Map<string, string> {
    const hooks = new Map<string, string>();

    for (const func of functions) {
      const name = func.name?.getText() || '';
      if (name.startsWith('use')) {
        const code = this.generateHookCode(func);
        hooks.set(name, code);
      }
    }

    return hooks;
  }

  private extractUtilityFunctions(functions: ts.FunctionDeclaration[]): Map<string, string> {
    const utils = new Map<string, string>();

    for (const func of functions) {
      const name = func.name?.getText() || '';
      if (!name.startsWith('use') && this.isUtilityFunction(func)) {
        const code = this.printer.printNode(ts.EmitHint.Unspecified, func, this.sourceFile);
        utils.set(name, code);
      }
    }

    return utils;
  }

  private extractComponentTypes(
    interfaces: ts.InterfaceDeclaration[],
    types: ts.TypeAliasDeclaration[]
  ): Map<string, string> {
    const componentTypes = new Map<string, string>();

    for (const iface of interfaces) {
      const name = iface.name.getText();
      if (name.includes('Props') || name.includes('State')) {
        const code = this.printer.printNode(ts.EmitHint.Unspecified, iface, this.sourceFile);
        componentTypes.set(name, code);
      }
    }

    for (const type of types) {
      const name = type.name.getText();
      const code = this.printer.printNode(ts.EmitHint.Unspecified, type, this.sourceFile);
      componentTypes.set(name, code);
    }

    return componentTypes;
  }

  private extractStyles(sourceFile: ts.SourceFile): string | null {
    // Extract styled-components or CSS-in-JS styles
    const styledImports = sourceFile.statements.filter(ts.isImportDeclaration).filter((imp) => {
      const moduleSpecifier = imp.moduleSpecifier.getText();
      return moduleSpecifier.includes('styled-components') || moduleSpecifier.includes('@emotion');
    });

    if (styledImports.length > 0) {
      // Extract all styled component definitions
      return '// Styled components extracted';
    }

    return null;
  }

  private extractQueryMethods(classes: ts.ClassDeclaration[]): Map<string, ts.MethodDeclaration> {
    const queryMethods = new Map<string, ts.MethodDeclaration>();

    for (const cls of classes) {
      const methods = cls.members.filter(ts.isMethodDeclaration);

      for (const method of methods) {
        const name = method.name?.getText() || 'query';
        if (this.isQueryMethod(method)) {
          queryMethods.set(name, method);
        }
      }
    }

    return queryMethods;
  }

  // Helper methods for code generation
  private generateEntityCode(cls: ts.ClassDeclaration): string {
    return `import { BaseEntity } from '@reporunner/core';

${this.printer.printNode(ts.EmitHint.Unspecified, cls, this.sourceFile)}

// Add domain logic here`;
  }

  private generateValueObjectCode(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration): string {
    return `// Value Object
${this.printer.printNode(ts.EmitHint.Unspecified, node, this.sourceFile)}

// Add validation and business rules here`;
  }

  private generateUseCaseCode(method: ts.MethodDeclaration, className?: string): string {
    const useCaseName = this.methodToUseCaseName(method.name?.getText() || 'Unknown');

    return `import { IUseCase } from '@reporunner/core';
import { injectable } from 'inversify';

@injectable()
export class ${useCaseName}UseCase implements IUseCase {
  constructor(
    // Add dependencies here
  ) {}

  async execute(input: any): Promise<any> {
    ${this.printer.printNode(ts.EmitHint.Unspecified, method.body || ts.factory.createBlock([]), this.sourceFile)}
  }
}`;
  }

  private generateHandlerCode(method: ts.MethodDeclaration): string {
    return `import { Request, Response, NextFunction } from 'express';

export async function ${method.name?.getText()}Handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ${this.printer.printNode(ts.EmitHint.Unspecified, method.body || ts.factory.createBlock([]), this.sourceFile)}
  } catch (error) {
    next(error);
  }
}`;
  }

  private generateDTOCode(iface: ts.InterfaceDeclaration): string {
    return `import { IsString, IsNumber, IsOptional } from 'class-validator';

${this.printer.printNode(ts.EmitHint.Unspecified, iface, this.sourceFile)}

// Add validation decorators`;
  }

  private generateMiddlewareCode(func: ts.FunctionDeclaration): string {
    return `import { Request, Response, NextFunction } from 'express';

${this.printer.printNode(ts.EmitHint.Unspecified, func, this.sourceFile)}`;
  }

  private generateHookCode(func: ts.FunctionDeclaration): string {
    return `import { useState, useEffect } from 'react';

${this.printer.printNode(ts.EmitHint.Unspecified, func, this.sourceFile)}`;
  }

  private generateRepository(serviceName: string, classes: ts.ClassDeclaration[]) {
    const interfaceCode = `export interface I${serviceName}Repository {
  // Repository methods
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
}`;

    const implementationCode = `import { BaseRepository } from '@reporunner/core';
import { injectable } from 'inversify';
import { I${serviceName}Repository } from '../domain/repositories/I${serviceName}Repository';

@injectable()
export class ${serviceName}Repository extends BaseRepository implements I${serviceName}Repository {
  async findById(id: string): Promise<any> {
    // Implementation
  }

  async findAll(): Promise<any[]> {
    // Implementation
  }

  async create(data: any): Promise<any> {
    // Implementation
  }

  async update(id: string, data: any): Promise<any> {
    // Implementation
  }

  async delete(id: string): Promise<boolean> {
    // Implementation
  }
}`;

    return { interface: interfaceCode, implementation: implementationCode };
  }

  private createRefactoredService(serviceName: string, useCases: Map<string, string>): string {
    const useCaseImports = Array.from(useCases.keys())
      .map((name) => `import { ${name}UseCase } from './application/use-cases/${name}.use-case';`)
      .join('\n');

    return `import { BaseService } from '@reporunner/core';
import { injectable, inject } from 'inversify';
import { I${serviceName}Repository } from './domain/repositories/I${serviceName}Repository';
${useCaseImports}

@injectable()
export class ${serviceName}Service extends BaseService {
  constructor(
    @inject('I${serviceName}Repository') private repository: I${serviceName}Repository,
    ${Array.from(useCases.keys())
      .map(
        (name) =>
          `@inject(${name}UseCase) private ${name.charAt(0).toLowerCase() + name.slice(1)}: ${name}UseCase`
      )
      .join(',\n    ')}
  ) {
    super();
  }

  // Delegate to use cases
}`;
  }

  private createMainController(controllerName: string, handlers: Map<string, string>): string {
    const handlerImports = Array.from(handlers.keys())
      .map((name) => `import { ${name}Handler } from './handlers/${name}.handler';`)
      .join('\n');

    return `import { Router } from 'express';
import { injectable } from 'inversify';
${handlerImports}

@injectable()
export class ${controllerName}Controller {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Register routes with handlers
    ${Array.from(handlers.keys())
      .map((name) => `// this.router.post('/path', ${name}Handler);`)
      .join('\n    ')}
  }
}`;
  }

  private createCleanedComponent(
    componentName: string,
    hooks: Map<string, string>,
    utils: Map<string, string>,
    types: Map<string, string>
  ): string {
    const hookImports = Array.from(hooks.keys())
      .map((name) => `import { ${name} } from './hooks/${name}';`)
      .join('\n');

    const utilImports = Array.from(utils.keys())
      .map((name) => `import { ${name} } from './utils/${name}.util';`)
      .join('\n');

    return `import React from 'react';
${hookImports}
${utilImports}
import { ${Array.from(types.keys()).join(', ')} } from './types/${componentName}.types';

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  // Use extracted hooks and utils
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};`;
  }

  private createQueryBuilder(
    repositoryName: string,
    queryMethods: Map<string, ts.MethodDeclaration>
  ): string {
    return `export class ${repositoryName}QueryBuilder {
  private query: any = {};

  where(field: string, value: any): this {
    this.query[field] = value;
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    // Implementation
    return this;
  }

  limit(limit: number): this {
    // Implementation
    return this;
  }

  build(): any {
    return this.query;
  }
}`;
  }

  private createRepositoryInterface(
    repositoryName: string,
    queryMethods: Map<string, ts.MethodDeclaration>
  ): string {
    const methodSignatures = Array.from(queryMethods.entries())
      .map(([name, method]) => {
        const signature = this.printer.printNode(ts.EmitHint.Unspecified, method, this.sourceFile);
        return signature.replace('{', ';').replace(/}[\s\S]*$/, '');
      })
      .join('\n  ');

    return `export interface I${repositoryName}Repository {
  ${methodSignatures}
}`;
  }

  private createBaseRepository(repositoryName: string): string {
    return `import { BaseRepository } from '@reporunner/core';

export abstract class Base${repositoryName}Repository extends BaseRepository {
  // Common repository operations
  
  protected async executeQuery<T>(query: any): Promise<T> {
    // Implementation
    throw new Error('Not implemented');
  }

  protected async executeCommand(command: any): Promise<void> {
    // Implementation
  }
}`;
  }

  private createSpecializedRepositories(
    repositoryName: string,
    queryMethods: Map<string, ts.MethodDeclaration>
  ): Map<string, string> {
    const specialized = new Map<string, string>();

    // Group methods by concern (e.g., Read, Write, Admin)
    const readMethods = Array.from(queryMethods.entries()).filter(
      ([name]) => name.startsWith('find') || name.startsWith('get') || name.startsWith('search')
    );

    const writeMethods = Array.from(queryMethods.entries()).filter(
      ([name]) =>
        name.startsWith('create') || name.startsWith('update') || name.startsWith('delete')
    );

    if (readMethods.length > 0) {
      specialized.set(
        `${repositoryName}ReadRepository`,
        this.generateSpecializedRepo(repositoryName, 'Read', readMethods)
      );
    }

    if (writeMethods.length > 0) {
      specialized.set(
        `${repositoryName}WriteRepository`,
        this.generateSpecializedRepo(repositoryName, 'Write', writeMethods)
      );
    }

    return specialized;
  }

  private generateSpecializedRepo(
    baseName: string,
    type: string,
    methods: Array<[string, ts.MethodDeclaration]>
  ): string {
    return `import { Base${baseName}Repository } from '../base/Base${baseName}Repository';
import { injectable } from 'inversify';

@injectable()
export class ${baseName}${type}Repository extends Base${baseName}Repository {
  ${methods
    .map(
      ([name, method]) => `
  async ${name}(...args: any[]): Promise<any> {
    // Implementation
  }`
    )
    .join('\n')}
}`;
  }

  private groupRelatedFunctionality(analysis: any): Map<string, any> {
    const groups = new Map<string, any>();

    // Group by functionality type
    if (analysis.interfaces.length > 0) {
      groups.set('types', { interfaces: analysis.interfaces, types: analysis.types });
    }

    if (analysis.functions.length > 0) {
      groups.set('utils', { functions: analysis.functions });
    }

    if (analysis.classes.length > 0) {
      groups.set('classes', { classes: analysis.classes });
    }

    if (analysis.enums.length > 0) {
      groups.set('enums', { enums: analysis.enums });
    }

    return groups;
  }

  private generateGroupCode(group: any): string {
    const parts: string[] = [];

    if (group.interfaces) {
      for (const iface of group.interfaces) {
        parts.push(this.printer.printNode(ts.EmitHint.Unspecified, iface, this.sourceFile));
      }
    }

    if (group.types) {
      for (const type of group.types) {
        parts.push(this.printer.printNode(ts.EmitHint.Unspecified, type, this.sourceFile));
      }
    }

    if (group.functions) {
      for (const func of group.functions) {
        parts.push(this.printer.printNode(ts.EmitHint.Unspecified, func, this.sourceFile));
      }
    }

    if (group.classes) {
      for (const cls of group.classes) {
        parts.push(this.printer.printNode(ts.EmitHint.Unspecified, cls, this.sourceFile));
      }
    }

    if (group.enums) {
      for (const enm of group.enums) {
        parts.push(this.printer.printNode(ts.EmitHint.Unspecified, enm, this.sourceFile));
      }
    }

    return parts.join('\n\n');
  }

  private createIndexFile(groups: Map<string, any>): string {
    const exports = Array.from(groups.keys())
      .map((groupName) => `export * from './${groupName}';`)
      .join('\n');

    return `// Auto-generated index file
${exports}`;
  }

  private applyBasicImprovements(sourceFile: ts.SourceFile): string {
    // Apply basic improvements like organizing imports, removing unused code, etc.
    const transformer =
      <T extends ts.Node>(context: ts.TransformationContext) =>
      (rootNode: T) => {
        function visit(node: ts.Node): ts.Node {
          // Remove console.log statements
          if (ts.isExpressionStatement(node)) {
            const expr = node.expression;
            if (ts.isCallExpression(expr)) {
              const callee = expr.expression;
              if (
                ts.isPropertyAccessExpression(callee) &&
                callee.expression.getText() === 'console'
              ) {
                return ts.factory.createNotEmittedStatement(node);
              }
            }
          }

          return ts.visitEachChild(node, visit, context);
        }

        return ts.visitNode(rootNode, visit) as T;
      };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedSourceFile = result.transformed[0] as ts.SourceFile;

    return this.printer.printFile(transformedSourceFile);
  }

  // Helper predicates
  private isDomainEntity(cls: ts.ClassDeclaration): boolean {
    const name = cls.name?.getText() || '';
    return (
      !name.includes('Controller') &&
      !name.includes('Service') &&
      !name.includes('Repository') &&
      !name.includes('DTO')
    );
  }

  private isValueObject(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration): boolean {
    const name = node.name.getText();
    return (
      name.includes('Value') ||
      name.includes('VO') ||
      name.includes('Config') ||
      name.includes('Options')
    );
  }

  private isBusinessLogic(method: ts.MethodDeclaration): boolean {
    const name = method.name?.getText() || '';
    return (
      !name.startsWith('_') &&
      !name.includes('init') &&
      !name.includes('setup') &&
      method.body !== undefined &&
      method.body.statements.length > 3
    );
  }

  private isRouteHandler(method: ts.MethodDeclaration): boolean {
    const name = method.name?.getText() || '';
    return (
      name.includes('handle') ||
      name.includes('get') ||
      name.includes('post') ||
      name.includes('put') ||
      name.includes('delete') ||
      name.includes('patch')
    );
  }

  private isDTO(iface: ts.InterfaceDeclaration): boolean {
    const name = iface.name.getText();
    return (
      name.includes('DTO') ||
      name.includes('Request') ||
      name.includes('Response') ||
      name.includes('Payload')
    );
  }

  private isMiddleware(func: ts.FunctionDeclaration): boolean {
    const name = func.name?.getText() || '';
    return (
      name.includes('middleware') || name.includes('Middleware') || func.parameters.length === 3
    ); // req, res, next
  }

  private isUtilityFunction(func: ts.FunctionDeclaration): boolean {
    const name = func.name?.getText() || '';
    return !name.startsWith('_') && func.parameters.length <= 3 && !this.isMiddleware(func);
  }

  private isQueryMethod(method: ts.MethodDeclaration): boolean {
    const name = method.name?.getText() || '';
    return (
      name.includes('find') ||
      name.includes('get') ||
      name.includes('search') ||
      name.includes('create') ||
      name.includes('update') ||
      name.includes('delete')
    );
  }

  private methodToUseCaseName(methodName: string): string {
    // Convert camelCase to PascalCase
    return methodName.charAt(0).toUpperCase() + methodName.slice(1);
  }

  private generateValidators(dtos: Map<string, string>): Map<string, string> {
    const validators = new Map<string, string>();

    for (const [name, dto] of dtos) {
      const validatorName = name.replace('DTO', 'Validator');
      const validatorCode = `import { body, ValidationChain } from 'express-validator';

export const ${validatorName}: ValidationChain[] = [
  // Add validation rules based on DTO
  body('field').isString().notEmpty(),
  // Add more validation rules
];`;

      validators.set(validatorName, validatorCode);
    }

    return validators;
  }
}
