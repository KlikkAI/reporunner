#!/usr/bin/env ts-node

/**
 * Migration Script: Remove Duplicate Use Cases and Update Imports
 *
 * This script automates the migration from 326 duplicate use-case files
 * to the new shared utilities and base classes.
 *
 * Run with: npx ts-node scripts/migrate-to-shared.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationSummary {
  filesRemoved: number;
  filesUpdated: number;
  importsReplaced: number;
  directories: string[];
}

class SharedMigrationTool {
  private summary: MigrationSummary = {
    filesRemoved: 0,
    filesUpdated: 0,
    importsReplaced: 0,
    directories: []
  };

  // Files that can be completely removed (empty implementations)
  private readonly REMOVABLE_FILES = [
    'If.use-case.ts',
    'Log.use-case.ts',
    'Error.use-case.ts',
    'AppError.use-case.ts',
    'ToString.use-case.ts',
    'Trim.use-case.ts',
    'Slice.use-case.ts',
    'Split.use-case.ts',
    'Replace.use-case.ts',
    'Substring.use-case.ts',
    'StartsWith.use-case.ts',
    'EndsWith.use-case.ts',
    'Includes.use-case.ts',
    'IndexOf.use-case.ts',
    'LastIndexOf.use-case.ts',
    'Map.use-case.ts',
    'Filter.use-case.ts',
    'ForEach.use-case.ts',
    'Find.use-case.ts',
    'Some.use-case.ts',
    'Push.use-case.ts',
    'Join.use-case.ts',
    'IsArray.use-case.ts',
    'JSON.use-case.ts',
    'Json.use-case.ts',
    'Parse.use-case.ts',
    'Stringify.use-case.ts',
    'Date.use-case.ts',
    'ToISOString.use-case.ts',
    'Number.use-case.ts',
    'ParseInt.use-case.ts',
    'ParseFloat.use-case.ts',
    'IsNaN.use-case.ts',
    'Min.use-case.ts',
    'Floor.use-case.ts'
  ];

  // Import replacements mapping
  private readonly IMPORT_REPLACEMENTS = {
    // String utilities
    "import { TrimUseCase }": "import { StringUtils }",
    "import { SliceUseCase }": "import { StringUtils }",
    "import { SplitUseCase }": "import { StringUtils }",
    "import { ReplaceUseCase }": "import { StringUtils }",
    "import { ToStringUseCase }": "import { StringUtils }",

    // Array utilities
    "import { MapUseCase }": "import { ArrayUtils }",
    "import { FilterUseCase }": "import { ArrayUtils }",
    "import { ForEachUseCase }": "import { ArrayUtils }",
    "import { FindUseCase }": "import { ArrayUtils }",

    // Conditional utilities
    "import { IfUseCase }": "import { ConditionalUtils }",

    // Logging utilities
    "import { LogUseCase }": "import { LoggingUtils }",
    "import { ErrorUseCase }": "import { LoggingUtils }",

    // JSON utilities
    "import { JsonUseCase }": "import { JsonUtils }",
    "import { ParseUseCase }": "import { JsonUtils }",
    "import { StringifyUseCase }": "import { JsonUtils }",

    // Date utilities
    "import { DateUseCase }": "import { DateUtils }",
    "import { ToISOStringUseCase }": "import { DateUtils }"
  };

  async run(): Promise<void> {
    console.log('🚀 Starting migration to @reporunner/shared...\n');

    const domainsPath = path.join(process.cwd(), 'packages/backend/src/domains');

    if (!fs.existsSync(domainsPath)) {
      console.error('❌ Domains directory not found:', domainsPath);
      return;
    }

    await this.migrateDomains(domainsPath);
    this.printSummary();
  }

  private async migrateDomains(domainsPath: string): Promise<void> {
    const domains = fs.readdirSync(domainsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📁 Found ${domains.length} domains:`, domains.join(', '));

    for (const domain of domains) {
      await this.migrateDomain(path.join(domainsPath, domain), domain);
    }
  }

  private async migrateDomain(domainPath: string, domainName: string): Promise<void> {
    console.log(`\n🔄 Processing domain: ${domainName}`);

    const servicesPath = path.join(domainPath, 'services');
    if (fs.existsSync(servicesPath)) {
      await this.migrateServices(servicesPath, domainName);
    }

    const controllersPath = path.join(domainPath, 'controllers');
    if (fs.existsSync(controllersPath)) {
      await this.migrateControllers(controllersPath, domainName);
    }
  }

  private async migrateServices(servicesPath: string, domainName: string): Promise<void> {
    const services = fs.readdirSync(servicesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const service of services) {
      const applicationPath = path.join(servicesPath, service, 'application');
      if (fs.existsSync(applicationPath)) {
        await this.migrateApplicationUseCases(applicationPath, domainName, service);
      }
    }
  }

  private async migrateApplicationUseCases(applicationPath: string, domainName: string, serviceName: string): Promise<void> {
    const files = fs.readdirSync(applicationPath)
      .filter(file => file.endsWith('.use-case.ts'));

    console.log(`  📝 Found ${files.length} use-case files in ${domainName}/${serviceName}`);

    let removedCount = 0;
    let updatedCount = 0;

    for (const file of files) {
      const filePath = path.join(applicationPath, file);

      if (this.REMOVABLE_FILES.includes(file)) {
        if (await this.shouldRemoveFile(filePath)) {
          fs.unlinkSync(filePath);
          removedCount++;
          this.summary.filesRemoved++;
          console.log(`    ❌ Removed: ${file}`);
        }
      } else {
        const updated = await this.updateFileImports(filePath);
        if (updated) {
          updatedCount++;
          this.summary.filesUpdated++;
          console.log(`    ✏️  Updated: ${file}`);
        }
      }
    }

    console.log(`  ✅ ${domainName}/${serviceName}: ${removedCount} removed, ${updatedCount} updated`);
  }

  private async shouldRemoveFile(filePath: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if file is a placeholder (contains "Not implemented" or is very small)
      const isPlaceholder = content.includes('Not implemented') ||
                           content.includes('TODO: Implement') ||
                           content.length < 500; // Very small files are likely empty

      // Check if file is just a re-export
      const isReExport = content.includes('export {') &&
                        content.includes('from') &&
                        content.split('\n').length < 5;

      return isPlaceholder || isReExport;
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error);
      return false;
    }
  }

  private async updateFileImports(filePath: string): Promise<boolean> {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // Replace imports
      for (const [oldImport, newImport] of Object.entries(this.IMPORT_REPLACEMENTS)) {
        if (content.includes(oldImport)) {
          content = content.replace(oldImport, newImport + ' from "@reporunner/shared"');
          updated = true;
          this.summary.importsReplaced++;
        }
      }

      // Add shared import if utilities are used
      if (this.usesSharedUtilities(content) && !content.includes('@reporunner/shared')) {
        const importLine = 'import { StringUtils, ArrayUtils, ConditionalUtils, LoggingUtils, JsonUtils, DateUtils } from "@reporunner/shared";\n';
        content = importLine + content;
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
      }

      return updated;
    } catch (error) {
      console.error(`❌ Error updating file ${filePath}:`, error);
      return false;
    }
  }

  private usesSharedUtilities(content: string): boolean {
    const utilityPatterns = [
      /\.trim\(\)/,
      /\.slice\(/,
      /\.split\(/,
      /\.replace\(/,
      /\.map\(/,
      /\.filter\(/,
      /JSON\.parse/,
      /JSON\.stringify/,
      /console\.log/,
      /new Date\(\)/
    ];

    return utilityPatterns.some(pattern => pattern.test(content));
  }

  private async migrateControllers(controllersPath: string, domainName: string): Promise<void> {
    const files = fs.readdirSync(controllersPath)
      .filter(file => file.endsWith('Controller.ts'));

    for (const file of files) {
      const filePath = path.join(controllersPath, file);
      let content = fs.readFileSync(filePath, 'utf8');

      // Add BaseController import and extension
      if (!content.includes('BaseController')) {
        content = content.replace(
          /export class (\w+Controller)/,
          'import { BaseController } from "@reporunner/shared";\n\nexport class $1 extends BaseController'
        );

        fs.writeFileSync(filePath, content, 'utf8');
        this.summary.filesUpdated++;
        console.log(`  ✏️  Updated controller: ${file}`);
      }
    }
  }

  private printSummary(): void {
    console.log('\n🎉 Migration completed!\n');
    console.log('📊 Summary:');
    console.log(`  Files removed: ${this.summary.filesRemoved}`);
    console.log(`  Files updated: ${this.summary.filesUpdated}`);
    console.log(`  Imports replaced: ${this.summary.importsReplaced}`);

    const reductionPercentage = Math.round((this.summary.filesRemoved / 326) * 100);
    console.log(`\n💡 Code reduction: ${this.summary.filesRemoved}/326 files (${reductionPercentage}%)`);

    console.log('\n✅ Next steps:');
    console.log('  1. Install the shared package: npm install @reporunner/shared');
    console.log('  2. Update remaining use-cases to extend base classes');
    console.log('  3. Test the application thoroughly');
    console.log('  4. Update documentation');
  }
}

// Run the migration
if (require.main === module) {
  const migrationTool = new SharedMigrationTool();
  migrationTool.run().catch(console.error);
}