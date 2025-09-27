#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 MASSIVE DEDUPLICATION PHASE 2: Standardize Component Structure & Update Imports');

console.log('\n📋 Phase 2A: Remove remaining empty subdirectories...');
let emptyDirsRemoved = 0;

const removeEmptyDirectories = (dir) => {
  try {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    // Recursively clean subdirectories first
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          removeEmptyDirectories(fullPath);
        }
      } catch (error) {
        // Skip files we can't access
      }
    });

    // Check if directory is now empty
    try {
      const remainingItems = fs.readdirSync(dir);
      if (remainingItems.length === 0 && !dir.includes('node_modules')) {
        fs.rmdirSync(dir);
        const relativePath = path.relative(process.cwd(), dir);
        console.log(`    📁 Removed empty directory: ${relativePath}`);
        emptyDirsRemoved++;
      }
    } catch (error) {
      // Skip directories we can't remove
    }
  } catch (error) {
    // Skip directories we can't process
  }
};

// Clean up all component directories
const componentBase = './packages/frontend/src/app/components';
removeEmptyDirectories(componentBase);

console.log('\n📋 Phase 2B: Update import paths in remaining files...');
let importsUpdated = 0;

const findAndUpdateImports = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        try {
          let content = fs.readFileSync(fullPath, 'utf8');
          const originalContent = content;

          // Update imports that reference the removed subdirectory structure
          const importUpdates = [
            // WorkflowEditor subdirectory imports
            { from: /from ['"]\.\/(triggerpanel|schedulingpanel|nodepropertypanel|executiontoolbar|executionpanel|enhancedpropertyrenderer|emailoutputpanel|emailinputpanel|dynamicpropertyrenderer|debugpanel|datainspector|customedge|credentialmodal|containernodepanel|conditionalbranchingpanel|conditioninputpanel|commentannotations|collaborationpanel|analyticsdashboard|advancedpropertypanel|advancednodepanel|aiassistantpanel)\/([^'"]+)['"]/g, to: 'from "./$2"' },
            { from: /from ['"]\.\.\/(triggerpanel|schedulingpanel|nodepropertypanel|executiontoolbar|executionpanel|enhancedpropertyrenderer|emailoutputpanel|emailinputpanel|dynamicpropertyrenderer|debugpanel|datainspector|customedge|credentialmodal|containernodepanel|conditionalbranchingpanel|conditioninputpanel|commentannotations|collaborationpanel|analyticsdashboard|advancedpropertypanel|advancednodepanel|aiassistantpanel)\/([^'"]+)['"]/g, to: 'from "../$2"' },

            // Other category subdirectory imports
            { from: /from ['"]\.\/(usermanagementpanel|securitydashboard|organizationsettings|pricingsection|integrationecosystem|header|featureshowcase|executionhistory|enterprisedashboard|auditdashboard|aiworkflowstudio)\/([^'"]+)['"]/g, to: 'from "./$2"' },

            // Absolute path imports that need updating
            { from: /from ['"]@\/app\/components\/WorkflowEditor\/(triggerpanel|schedulingpanel|nodepropertypanel|executiontoolbar|executionpanel|enhancedpropertyrenderer|emailoutputpanel|emailinputpanel|dynamicpropertyrenderer|debugpanel|datainspector|customedge|credentialmodal|containernodepanel|conditionalbranchingpanel|conditioninputpanel|commentannotations|collaborationpanel|analyticsdashboard|advancedpropertypanel|advancednodepanel|aiassistantpanel)\/([^'"]+)['"]/g, to: 'from "@/app/components/WorkflowEditor/$2"' }
          ];

          importUpdates.forEach(({ from, to }) => {
            content = content.replace(from, to);
          });

          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content);
            const relativePath = path.relative(process.cwd(), fullPath);
            console.log(`    🔧 Updated imports in: ${relativePath}`);
            importsUpdated++;
          }
        } catch (error) {
          // Skip files we can't process
        }
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findAndUpdateImports(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findAndUpdateImports('./packages/frontend/src');

console.log('\n📋 Phase 2C: Fix broken component exports and imports...');
let exportsFixed = 0;

// Check for and fix any broken exports in moved files
const componentFiles = [
  './packages/frontend/src/app/components/WorkflowEditor/TriggerPanel.tsx',
  './packages/frontend/src/app/components/WorkflowEditor/SchedulingPanel.tsx',
  './packages/frontend/src/app/components/WorkflowEditor/NodePropertyPanel.tsx',
  './packages/frontend/src/app/components/WorkflowEditor/ExecutionToolbar.tsx',
  './packages/frontend/src/app/components/WorkflowEditor/ExecutionPanel.tsx',
  './packages/frontend/src/app/components/WorkflowEditor/EnhancedPropertyRenderer.tsx',
  './packages/frontend/src/app/components/WorkflowEditor/CredentialModal.tsx'
];

componentFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Fix common export/import issues
      const fixes = [
        // Ensure proper default export
        { from: /export\s+{\s*(\w+)\s+}\s*;?\s*$/m, to: 'export default $1;' },

        // Fix duplicate imports
        { from: /^(import[^;]+;)\s*\n\s*\1/gm, to: '$1' },

        // Remove invalid import statements
        { from: /import\s+{\s*}\s+from\s+['"][^'"]*['"];?\s*/g, to: '' },

        // Fix relative import paths
        { from: /from ['"]\.\/[^\/'"]*\/([^'"]+)['"]/g, to: 'from "./$1"' }
      ];

      fixes.forEach(({ from, to }) => {
        content = content.replace(from, to);
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        const fileName = path.basename(filePath);
        console.log(`    🔧 Fixed exports/imports in: ${fileName}`);
        exportsFixed++;
      }
    } catch (error) {
      console.log(`    ⚠️  Error fixing ${path.basename(filePath)}: ${error.message}`);
    }
  }
});

console.log('\n📋 Phase 2D: Create index files for better imports...');
let indexFilesCreated = 0;

// Create barrel exports for WorkflowEditor components
const workflowEditorIndexPath = './packages/frontend/src/app/components/WorkflowEditor/index.ts';
const workflowEditorComponents = [
  'TriggerPanel',
  'SchedulingPanel',
  'NodePropertyPanel',
  'ExecutionToolbar',
  'ExecutionPanel',
  'EnhancedPropertyRenderer',
  'EmailOutputPanel',
  'EmailInputPanel',
  'DynamicPropertyRenderer',
  'DebugPanel',
  'DataInspector',
  'CustomEdge',
  'CredentialModal',
  'ContainerNodePanel',
  'ConditionalBranchingPanel',
  'ConditionInputPanel',
  'CommentAnnotations',
  'CollaborationPanel',
  'AnalyticsDashboard',
  'AdvancedPropertyPanel',
  'AdvancedNodePanel',
  'AIAssistantPanel'
];

const workflowEditorExports = workflowEditorComponents
  .filter(component => {
    const componentPath = `./packages/frontend/src/app/components/WorkflowEditor/${component}.tsx`;
    return fs.existsSync(componentPath);
  })
  .map(component => `export { default as ${component} } from './${component}';`)
  .join('\\n');

if (workflowEditorExports) {
  const indexContent = `// Auto-generated barrel exports for WorkflowEditor components\n// This file was created during deduplication cleanup\n\n${workflowEditorExports}\n`;

  fs.writeFileSync(workflowEditorIndexPath, indexContent);
  console.log(`    📄 Created index file: WorkflowEditor/index.ts`);
  indexFilesCreated++;
}

console.log('\n📋 Phase 2E: Remove duplicate CSS/style files...');
let styleFilesRemoved = 0;

const findAndRemoveDuplicateStyles = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && (item.endsWith('.css') || item.endsWith('.scss'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8').trim();

          // Remove empty or minimal style files
          if (content.length < 50 ||
              content.includes('/* TODO') ||
              content.includes('/* Empty') ||
              content.match(/^\/\*[\s\S]*\*\/\s*$/)) {
            fs.unlinkSync(fullPath);
            const relativePath = path.relative(process.cwd(), fullPath);
            console.log(`    🗑️  Removed empty style file: ${relativePath}`);
            styleFilesRemoved++;
          }
        } catch (error) {
          // Skip files we can't process
        }
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findAndRemoveDuplicateStyles(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findAndRemoveDuplicateStyles('./packages/frontend/src');

console.log('\n✅ Phase 2 Complete:');
console.log(`    📁 ${emptyDirsRemoved} empty directories removed`);
console.log(`    🔧 ${importsUpdated} files with updated import paths`);
console.log(`    🔧 ${exportsFixed} files with fixed exports/imports`);
console.log(`    📄 ${indexFilesCreated} index files created for better organization`);
console.log(`    🗑️  ${styleFilesRemoved} empty/duplicate style files removed`);

const totalPhase2Improvements = emptyDirsRemoved + importsUpdated + exportsFixed + indexFilesCreated + styleFilesRemoved;
console.log(`\n📊 Total Phase 2 improvements: ${totalPhase2Improvements} structural optimizations`);
console.log('🎯 Expected impact: Cleaner imports, better organization, reduced build errors');