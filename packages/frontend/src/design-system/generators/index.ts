/**
 * Design System Generators Index
 *
 * Central export point for all code generation utilities,
 * providing pattern-based component and page generation.
 */

// Generators
export { PageGenerator, PageTemplates } from './PageGenerator';
export { ComponentGenerator, ComponentPatterns } from './ComponentGenerator';

// Types
export type {
  PageAction,
  Statistic,
  PageConfig,
  PageSectionConfig,
  StatsPageConfig,
  FormPageConfig,
  ListPageConfig,
} from './PageGenerator';

export type {
  GeneratorConfig,
  CardConfig,
  ListConfig,
  TableConfig,
  FormItemConfig,
} from './ComponentGenerator';