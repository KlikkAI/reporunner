import { ComponentPropsWithoutRef, ElementType } from 'react';

/**
 * Generic component props with 'as' prop for polymorphic components
 */
export type PolymorphicComponentProps<
  E extends ElementType,
  P = {}
> = Omit<ComponentPropsWithoutRef<E>, keyof P> &
  P & {
    as?: E;
  };

/**
 * Component size variants
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component color variants
 */
export type ComponentColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/**
 * Component variant types
 */
export type ComponentVariant = 'filled' | 'outlined' | 'ghost' | 'text';

/**
 * Base component props shared across all components
 */
export interface BaseComponentProps {
  /**
   * CSS class names
   */
  className?: string;

  /**
   * Component size
   */
  size?: ComponentSize;

  /**
   * Component color theme
   */
  color?: ComponentColor;

  /**
   * Component variant
   */
  variant?: ComponentVariant;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Whether the component is in loading state
   */
  loading?: boolean;

  /**
   * Whether the component is in error state
   */
  error?: boolean;

  /**
   * Data attributes
   */
  [key: `data-${string}`]: unknown;
}

/**
 * Base form field props
 */
export interface BaseFieldProps extends BaseComponentProps {
  /**
   * Field name
   */
  name: string;

  /**
   * Field label
   */
  label?: string;

  /**
   * Help text
   */
  helperText?: string;

  /**
   * Error message
   */
  errorMessage?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is read-only
   */
  readOnly?: boolean;

  /**
   * Field placeholder
   */
  placeholder?: string;
}

/**
 * Common layout props
 */
export interface LayoutProps {
  /**
   * Gap between items
   */
  gap?: number | string;

  /**
   * Padding
   */
  padding?: number | string;

  /**
   * Margin
   */
  margin?: number | string;

  /**
   * Width
   */
  width?: number | string;

  /**
   * Height
   */
  height?: number | string;

  /**
   * Maximum width
   */
  maxWidth?: number | string;

  /**
   * Maximum height
   */
  maxHeight?: number | string;

  /**
   * Whether to render as full width
   */
  fullWidth?: boolean;

  /**
   * Whether to render as full height
   */
  fullHeight?: boolean;
}

/**
 * Common flex layout props
 */
export interface FlexProps extends LayoutProps {
  /**
   * Flex direction
   */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';

  /**
   * Flex wrap
   */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';

  /**
   * Justify content
   */
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';

  /**
   * Align items
   */
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';

  /**
   * Flex grow
   */
  grow?: boolean | number;

  /**
   * Flex shrink
   */
  shrink?: boolean | number;
}

/**
 * Common grid layout props
 */
export interface GridProps extends LayoutProps {
  /**
   * Number of columns
   */
  columns?: number | string;

  /**
   * Number of rows
   */
  rows?: number | string;

  /**
   * Column gap
   */
  columnGap?: number | string;

  /**
   * Row gap
   */
  rowGap?: number | string;

  /**
   * Grid template columns
   */
  templateColumns?: string;

  /**
   * Grid template rows
   */
  templateRows?: string;

  /**
   * Grid template areas
   */
  templateAreas?: string;

  /**
   * Grid auto flow
   */
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
}

/**
 * Common animation props
 */
export interface AnimationProps {
  /**
   * Animation duration in milliseconds
   */
  duration?: number;

  /**
   * Animation delay in milliseconds
   */
  delay?: number;

  /**
   * Animation easing function
   */
  easing?: string;

  /**
   * Whether to animate on mount
   */
  animateOnMount?: boolean;

  /**
   * Whether to animate on exit
   */
  animateOnExit?: boolean;

  /**
   * Custom animation variants
   */
  variants?: Record<string, any>;
}