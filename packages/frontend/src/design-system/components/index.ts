/**
 * Design System Components Index
 *
 * Central export point for all design system components,
 * providing a unified interface for the component library.
 */

// Base Components
export { default as BasePage } from './BasePage';
export { default as PageSection } from './PageSection';
export { default as StatsCard } from './StatsCard';

// Advanced Components
export { PropertyRenderer } from './PropertyRenderer';
export { UniversalForm, useFormBuilder, FormGenerators } from './UniversalForm';
export {
  DynamicLayout,
  ResponsiveGrid,
  FlexLayout,
  StackLayout,
  ContainerLayout,
  SectionLayout,
  LayoutPatterns,
} from './DynamicLayout';

// Factories
export { PropertyRendererFactory } from '../factories/PropertyRendererFactory';
export { ComponentFactory } from '../factories/ComponentFactory';

// Types
export type {
  PropertyRendererConfig,
  PropertyContext,
  PropertyType,
  PropertyOption,
  ValidationConfig,
  ValidationRule,
  ConditionalConfig,
  PropertyStylingConfig,
  PropertyEventConfig,
} from '../factories/PropertyRendererFactory';

export type {
  ComponentConfig,
  BaseComponentConfig,
  ConditionalRule,
  EventHandler,
  LayoutConfig,
  FormConfig,
  FieldConfig,
  DataConfig,
  StylingConfig,
} from '../factories/ComponentFactory';

export type {
  DynamicLayoutProps,
  ResponsiveGridProps,
  FlexLayoutProps,
  StackLayoutProps,
  ContainerLayoutProps,
  SectionLayoutProps,
} from './DynamicLayout';

export type {
  UniversalFormProps,
} from './UniversalForm';