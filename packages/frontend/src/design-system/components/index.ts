/**
 * Design System Components Index
 *
 * Central export point for all design system components,
 * providing a unified interface for the component library.
 */

export type {
  BaseComponentConfig,
  ComponentConfig,
  ConditionalRule,
  DataConfig,
  EventHandler,
  FieldConfig,
  FormConfig,
  LayoutConfig,
  StylingConfig,
} from '../factories/ComponentFactory';
export { ComponentFactory } from '../factories/ComponentFactory';
// Types
export type {
  ConditionalConfig,
  PropertyContext,
  PropertyEventConfig,
  PropertyOption,
  PropertyRendererConfig,
  PropertyStylingConfig,
  PropertyType,
  ValidationConfig,
  ValidationRule,
} from '../factories/PropertyRendererFactory';
// Factories
export { PropertyRendererFactory } from '../factories/PropertyRendererFactory';
// Base Components
export { default as BasePage } from './BasePage';
export type {
  ContainerLayoutProps,
  DynamicLayoutProps,
  FlexLayoutProps,
  ResponsiveGridProps,
  SectionLayoutProps,
  StackLayoutProps,
} from './DynamicLayout';
export {
  ContainerLayout,
  DynamicLayout,
  FlexLayout,
  LayoutPatterns,
  ResponsiveGrid,
  SectionLayout,
  StackLayout,
} from './DynamicLayout';
// TODO: Implement PageSection component
// export { default as PageSection } from './PageSection';
// Advanced Components
export { PropertyRenderer } from './PropertyRenderer';
export { default as StatsCard } from './StatsCard';
export type { UniversalFormProps } from './UniversalForm';
export { FormGenerators, UniversalForm, useFormBuilder } from './UniversalForm';
