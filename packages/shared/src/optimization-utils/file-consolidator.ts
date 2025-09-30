/**
 * File consolidation utilities
 * Helps prevent file splitting anti-patterns
 */

export interface FileSection {
  name: string;
  content: string;
  exports?: string[];
}

export class FileConsolidator {
  static combineFiles(sections: FileSection[]): string {
    const imports = new Set<string>();
    const combinedContent: string[] = [];
    const allExports: string[] = [];

    sections.forEach((section) => {
      // Extract imports
      const importMatches = section.content.match(/import.*?from.*?;/g);
      if (importMatches) {
        importMatches.forEach((imp) => imports.add(imp));
      }

      // Clean content (remove imports and isolated exports)
      const cleanContent = section.content
        .replace(/import.*?from.*?;\n?/g, '')
        .replace(/^export \{[^}]*\};?\n?/gm, '');

      combinedContent.push(`// === ${section.name} ===\n${cleanContent}`);

      if (section.exports) {
        allExports.push(...section.exports);
      }
    });

    // Combine everything
    const result = [
      Array.from(imports).join('\n'),
      '',
      combinedContent.join('\n\n'),
      '',
      `export { ${allExports.join(', ')} };`,
    ].join('\n');

    return result;
  }
}
