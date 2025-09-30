/**
 * Design System Generators Index
 *
 * Central export point for all code generation utilities,
 * providing pattern-based component and page generation.
 */

export type {
  CardConfig,
  FormItemConfig,
  GeneratorConfig,
  ListConfig,
  TableConfig,
} from './ComponentGenerator';
export { ComponentGenerator, ComponentPatterns } from './ComponentGenerator';

// Types
export type {
  FormPageConfig,
  ListPageConfig,
  PageAction,
  PageConfig,
  PageSectionConfig,
  Statistic,
  StatsPageConfig,
} from './PageGenerator';
// Generators
export { PageGenerator, PageTemplates } from './PageGenerator';
