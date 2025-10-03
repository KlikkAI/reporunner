#!/usr/bin/env node

const { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync } = require('node:fs');
const path = require('node:path');

/**
 * Create Integration CLI Tool
 *
 * Creates a new integration from the frontend template
 * Usage: pnpm create-integration <integration-name> <category>
 * Example: pnpm create-integration Slack communication
 */

const CATEGORIES = [
  'ai-ml',
  'communication',
  'data-storage',
  'analytics',
  'productivity',
  'developer-tools',
  'marketing',
  'finance',
  'crm',
  'e-commerce'
];

function toKebabCase(str) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function toPascalCase(str) {
  return str.replace(/(?:^|\s)(\w)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, '');
}

async function createIntegration() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    console.error('');
    console.error('Usage: pnpm create-integration <integration-name> <category>');
    console.error('');
    console.error('Example: pnpm create-integration Slack communication');
    console.error('');
    console.error('Available categories:');
    CATEGORIES.forEach(cat => console.error(`  - ${cat}`));
    process.exit(1);
  }

  const [integrationName, category] = args;
  const categoryKebab = toKebabCase(category);

  if (!CATEGORIES.includes(categoryKebab)) {
    console.error(`❌ Error: Invalid category "${category}"`);
    console.error('');
    console.error('Available categories:');
    CATEGORIES.forEach(cat => console.error(`  - ${cat}`));
    process.exit(1);
  }

  const integrationId = toKebabCase(integrationName);
  const integrationPascal = toPascalCase(integrationName);

  const templateDir = path.join(
    __dirname,
    '..',
    '..',
    'packages',
    'frontend',
    'src',
    'app',
    'data',
    'nodes',
    '_template'
  );

  const targetDir = path.join(
    __dirname,
    '..',
    '..',
    'packages',
    'frontend',
    'src',
    'app',
    'data',
    'nodes',
    categoryKebab,
    integrationId
  );

  console.log('🚀 Creating integration...');
  console.log('');
  console.log(`📦 Integration: ${integrationPascal}`);
  console.log(`🏷️  ID: ${integrationId}`);
  console.log(`📂 Category: ${categoryKebab}`);
  console.log(`📁 Target: packages/frontend/src/app/data/nodes/${categoryKebab}/${integrationId}`);
  console.log('');

  // Create target directory
  mkdirSync(targetDir, { recursive: true });

  // Copy template files
  const templateFiles = readdirSync(templateDir);

  for (const file of templateFiles) {
    const sourcePath = path.join(templateDir, file);
    const stat = statSync(sourcePath);

    if (stat.isFile() && file.endsWith('.ts')) {
      let content = readFileSync(sourcePath, 'utf-8');

      // Replace placeholders
      content = content.replace(/\{INTEGRATION_NAME\}/g, integrationPascal);
      content = content.replace(/\{integration-id\}/g, integrationId);
      content = content.replace(/\{CATEGORY\}/g, categoryKebab);

      const targetPath = path.join(targetDir, file);
      writeFileSync(targetPath, content);

      console.log(`✅ Created: ${file}`);
    }
  }

  console.log('');
  console.log('✨ Integration created successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('');
  console.log(`1. Navigate to: packages/frontend/src/app/data/nodes/${categoryKebab}/${integrationId}/`);
  console.log('');
  console.log('2. Update the integration files:');
  console.log('   - node.ts: Update icon, description, inputs/outputs');
  console.log('   - properties.ts: Add operation-specific properties');
  console.log('   - credentials.ts: Configure authentication requirements');
  console.log('   - actions.ts: Implement the actual API integration logic');
  console.log('');
  console.log('3. Register the integration in the category index:');
  console.log(`   - Add export in: src/app/data/nodes/${categoryKebab}/index.ts`);
  console.log('');
  console.log('4. Test the integration:');
  console.log('   - Add credentials in the Credentials page');
  console.log('   - Create a workflow and test the node');
  console.log('');
  console.log('📚 Template Structure:');
  console.log('   - index.ts: Exports and node registration');
  console.log('   - node.ts: Node metadata and definition');
  console.log('   - properties.ts: Dynamic UI properties');
  console.log('   - credentials.ts: Authentication configuration');
  console.log('   - actions.ts: Business logic implementation');
  console.log('');
}

createIntegration().catch(error => {
  console.error('❌ Error creating integration:', error.message);
  process.exit(1);
});
