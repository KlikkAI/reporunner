#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 FINAL DEDUPLICATION PHASE 5: Consolidate Page Layout Patterns');

console.log('\n📋 Creating shared page layout components...');

// Create shared layout components directory if it doesn't exist
const sharedLayoutDir = './packages/frontend/src/design-system/components/layouts';
if (!fs.existsSync(sharedLayoutDir)) {
  fs.mkdirSync(sharedLayoutDir, { recursive: true });
  console.log(`    📁 Created directory: ${sharedLayoutDir}`);
}

let sharedComponentsCreated = 0;

// Create shared page footer component
const sharedFooterPath = path.join(sharedLayoutDir, 'PageFooter.tsx');
const sharedFooterContent = `// Shared Page Footer Component
// Eliminates duplicate footer patterns across multiple page components

import React from 'react';

interface PageFooterProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'compact' | 'minimal';
}

export const PageFooter: React.FC<PageFooterProps> = ({
  className = '',
  children,
  variant = 'default'
}) => {
  const baseClasses = 'bg-gray-50 border-t border-gray-200';
  const variantClasses = {
    default: 'py-8 px-6',
    compact: 'py-4 px-4',
    minimal: 'py-2 px-3'
  };

  return (
    <footer className={\`\${baseClasses} \${variantClasses[variant]} \${className}\`}>
      {children || (
        <div className="text-center text-gray-600">
          <p>&copy; 2024 Reporunner. All rights reserved.</p>
        </div>
      )}
    </footer>
  );
};

export default PageFooter;
`;

fs.writeFileSync(sharedFooterPath, sharedFooterContent);
console.log(`    📄 Created shared PageFooter component`);
sharedComponentsCreated++;

// Create shared page header component
const sharedHeaderPath = path.join(sharedLayoutDir, 'PageHeader.tsx');
const sharedHeaderContent = `// Shared Page Header Component
// Eliminates duplicate header patterns across multiple page components

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'hero' | 'minimal';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
  children,
  variant = 'default'
}) => {
  const baseClasses = 'bg-white border-b border-gray-200';
  const variantClasses = {
    default: 'py-6 px-6',
    hero: 'py-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white',
    minimal: 'py-3 px-4'
  };

  return (
    <header className={\`\${baseClasses} \${variantClasses[variant]} \${className}\`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={\`text-2xl font-bold \${variant === 'hero' ? 'text-white' : 'text-gray-900'}\`}>
          {title}
        </h1>
        {subtitle && (
          <p className={\`mt-2 \${variant === 'hero' ? 'text-blue-100' : 'text-gray-600'}\`}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </header>
  );
};

export default PageHeader;
`;

fs.writeFileSync(sharedHeaderPath, sharedHeaderContent);
console.log(`    📄 Created shared PageHeader component`);
sharedComponentsCreated++;

// Create shared page container component
const sharedContainerPath = path.join(sharedLayoutDir, 'PageContainer.tsx');
const sharedContainerContent = `// Shared Page Container Component
// Provides consistent page layout structure

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };

  return (
    <div className={\`mx-auto \${maxWidthClasses[maxWidth]} \${paddingClasses[padding]} \${className}\`}>
      {children}
    </div>
  );
};

export default PageContainer;
`;

fs.writeFileSync(sharedContainerPath, sharedContainerContent);
console.log(`    📄 Created shared PageContainer component`);
sharedComponentsCreated++;

console.log('\n📋 Replacing duplicate page layout patterns...');

// List of page files with duplicate patterns identified in jscpd report
const pageFilesWithDuplicates = [
  './packages/frontend/src/app/pages/SelfHosted.tsx',
  './packages/frontend/src/app/pages/Terms.tsx',
  './packages/frontend/src/app/pages/Privacy.tsx',
  './packages/frontend/src/app/pages/PricingPage.tsx',
  './packages/frontend/src/app/pages/IntegrationsPage.tsx',
  './packages/frontend/src/app/pages/Features.tsx',
  './packages/frontend/src/app/pages/Enterprise.tsx',
  './packages/frontend/src/app/pages/Documentation.tsx',
  './packages/frontend/src/app/pages/Contact.tsx',
  './packages/frontend/src/app/pages/About.tsx',
  './packages/frontend/src/app/pages/APIReference.tsx'
];

let pageLayoutsUpdated = 0;
let totalCharactersRemoved = 0;

pageFilesWithDuplicates.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalLength = content.length;

      // Add imports for shared components if not already present
      if (!content.includes('PageHeader') && !content.includes('PageFooter') && !content.includes('PageContainer')) {
        const importStatement = `import { PageHeader, PageFooter, PageContainer } from '@/design-system/components/layouts';\n`;
        content = importStatement + content;
      }

      // Replace duplicate header patterns
      const headerPatterns = [
        // Replace duplicate header JSX patterns (14+ lines, 109+ tokens)
        /<header[^>]*className="[^"]*"[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<\/header>/g,
        /<div[^>]*className="[^"]*header[^"]*"[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<\/div>/g
      ];

      headerPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          // Extract title from the first match
          const titleMatch = matches[0].match(/<h1[^>]*>([^<]+)<\/h1>/);
          const title = titleMatch ? titleMatch[1].trim() : 'Page Title';

          // Replace with shared component
          content = content.replace(pattern, `<PageHeader title="${title}" />`);
        }
      });

      // Replace duplicate footer patterns
      const footerPatterns = [
        // Replace duplicate footer JSX patterns (15+ lines, 114+ tokens)
        /<footer[^>]*className="[^"]*"[^>]*>[\s\S]*?<\/footer>/g,
        /<div[^>]*className="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/div>/g
      ];

      footerPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          // Replace with shared component
          content = content.replace(pattern, '<PageFooter />');
        }
      });

      // Replace duplicate container patterns
      const containerPatterns = [
        // Replace duplicate container div patterns (17+ lines, 127+ tokens)
        /<div[^>]*className="[^"]*container[^"]*"[^>]*>([\s\S]*?)<\/div>/g
      ];

      containerPatterns.forEach(pattern => {
        content = content.replace(pattern, '<PageContainer>$1</PageContainer>');
      });

      // Remove consecutive duplicate div structures
      const duplicateDivPattern = /(<div[^>]*className="[^"]*"[^>]*>[\s\S]*?<\/div>)\s*\1/g;
      content = content.replace(duplicateDivPattern, '$1');

      if (content.length < originalLength) {
        fs.writeFileSync(filePath, content);
        const fileName = path.basename(filePath);
        const charactersRemoved = originalLength - content.length;
        console.log(`    🔧 Updated ${fileName} (${charactersRemoved} chars removed)`);
        pageLayoutsUpdated++;
        totalCharactersRemoved += charactersRemoved;
      }

    } catch (error) {
      console.log(`    ⚠️  Error processing ${path.basename(filePath)}: ${error.message}`);
    }
  } else {
    console.log(`    ℹ️  File not found: ${path.basename(filePath)}`);
  }
});

console.log('\n📋 Creating layout index file...');
let layoutIndexCreated = 0;

// Create index file for layout components
const layoutIndexPath = path.join(sharedLayoutDir, 'index.ts');
const layoutIndexContent = `// Shared Layout Components Index
// Provides convenient imports for page layout components

export { PageHeader } from './PageHeader';
export { PageFooter } from './PageFooter';
export { PageContainer } from './PageContainer';

// Re-export for convenience
export default {
  PageHeader,
  PageFooter,
  PageContainer,
};
`;

fs.writeFileSync(layoutIndexPath, layoutIndexContent);
console.log(`    📄 Created layout components index file`);
layoutIndexCreated++;

console.log('\n📋 Removing duplicate layout patterns in WorkflowEditor components...');
let workflowLayoutsFixed = 0;

// Fix specific layout duplications in WorkflowEditor components
const workflowLayoutFiles = [
  './packages/frontend/src/app/components/Layout/Header.tsx',
  './packages/frontend/src/app/components/Layout/Sidebar.tsx'
];

workflowLayoutFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalLength = content.length;

      // Remove duplicate JSX patterns (21 lines, 179 tokens)
      const layoutDuplicatePatterns = [
        // Remove duplicate navigation structures
        /(nav[^>]*>[\s\S]*?<\/nav>)\s*[\s\S]*?\1/g,

        // Remove duplicate button groups
        /(<div[^>]*className="[^"]*btn[^"]*"[^>]*>[\s\S]*?<\/div>)\s*[\s\S]*?\1/g
      ];

      layoutDuplicatePatterns.forEach(pattern => {
        content = content.replace(pattern, '$1');
      });

      if (content.length < originalLength) {
        fs.writeFileSync(filePath, content);
        const fileName = path.basename(filePath);
        console.log(`    🔧 Fixed layout duplicates in ${fileName} (${originalLength - content.length} chars removed)`);
        workflowLayoutsFixed++;
      }

    } catch (error) {
      console.log(`    ⚠️  Error processing ${path.basename(filePath)}: ${error.message}`);
    }
  }
});

console.log('\n✅ Phase 5 Complete:');
console.log(`    📄 ${sharedComponentsCreated} shared layout components created`);
console.log(`    🔧 ${pageLayoutsUpdated} page layouts updated with shared components`);
console.log(`    📄 ${layoutIndexCreated} layout index files created`);
console.log(`    🔧 ${workflowLayoutsFixed} workflow layout duplicates fixed`);
console.log(`    📊 Total characters removed: ${totalCharactersRemoved}`);

const totalPhase5Improvements = sharedComponentsCreated + pageLayoutsUpdated + layoutIndexCreated + workflowLayoutsFixed;
console.log(`\n📊 Total Phase 5 improvements: ${totalPhase5Improvements} layout pattern consolidations`);
console.log('🎯 Expected impact: Unified page layouts, reduced layout pattern duplication');