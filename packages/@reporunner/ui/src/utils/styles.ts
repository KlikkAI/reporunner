import { ComponentSize, ComponentColor, ComponentVariant } from '../types/component';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get base component classes based on props
 */
export function getBaseClasses({
  size = 'md',
  color = 'primary',
  variant = 'filled',
  disabled,
  loading,
  error,
}: {
  size?: ComponentSize;
  color?: ComponentColor;
  variant?: ComponentVariant;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
} = {}) {
  return cn(
    // Base styles
    'font-sans rounded-md transition-all duration-200 ease-in-out',
    
    // Size variations
    {
      'text-xs px-2 py-1 h-6': size === 'xs',
      'text-sm px-3 py-1.5 h-8': size === 'sm',
      'text-base px-4 py-2 h-10': size === 'md',
      'text-lg px-5 py-2.5 h-12': size === 'lg',
      'text-xl px-6 py-3 h-14': size === 'xl',
    },
    
    // Color and variant combinations
    {
      // Filled variant
      'text-white': variant === 'filled',
      'bg-primary-600 hover:bg-primary-700': variant === 'filled' && color === 'primary' && !disabled,
      'bg-secondary-600 hover:bg-secondary-700': variant === 'filled' && color === 'secondary' && !disabled,
      'bg-green-600 hover:bg-green-700': variant === 'filled' && color === 'success' && !disabled,
      'bg-yellow-600 hover:bg-yellow-700': variant === 'filled' && color === 'warning' && !disabled,
      'bg-red-600 hover:bg-red-700': variant === 'filled' && color === 'error' && !disabled,
      'bg-blue-600 hover:bg-blue-700': variant === 'filled' && color === 'info' && !disabled,
      
      // Outlined variant
      'bg-transparent border': variant === 'outlined',
      'border-primary-600 text-primary-600 hover:bg-primary-50': variant === 'outlined' && color === 'primary' && !disabled,
      'border-secondary-600 text-secondary-600 hover:bg-secondary-50': variant === 'outlined' && color === 'secondary' && !disabled,
      'border-green-600 text-green-600 hover:bg-green-50': variant === 'outlined' && color === 'success' && !disabled,
      'border-yellow-600 text-yellow-600 hover:bg-yellow-50': variant === 'outlined' && color === 'warning' && !disabled,
      'border-red-600 text-red-600 hover:bg-red-50': variant === 'outlined' && color === 'error' && !disabled,
      'border-blue-600 text-blue-600 hover:bg-blue-50': variant === 'outlined' && color === 'info' && !disabled,
      
      // Ghost variant
      'bg-transparent': variant === 'ghost',
      'text-primary-600 hover:bg-primary-50': variant === 'ghost' && color === 'primary' && !disabled,
      'text-secondary-600 hover:bg-secondary-50': variant === 'ghost' && color === 'secondary' && !disabled,
      'text-green-600 hover:bg-green-50': variant === 'ghost' && color === 'success' && !disabled,
      'text-yellow-600 hover:bg-yellow-50': variant === 'ghost' && color === 'warning' && !disabled,
      'text-red-600 hover:bg-red-50': variant === 'ghost' && color === 'error' && !disabled,
      'text-blue-600 hover:bg-blue-50': variant === 'ghost' && color === 'info' && !disabled,
      
      // Text variant
      'bg-transparent hover:underline': variant === 'text',
      'text-primary-600': variant === 'text' && color === 'primary' && !disabled,
      'text-secondary-600': variant === 'text' && color === 'secondary' && !disabled,
      'text-green-600': variant === 'text' && color === 'success' && !disabled,
      'text-yellow-600': variant === 'text' && color === 'warning' && !disabled,
      'text-red-600': variant === 'text' && color === 'error' && !disabled,
      'text-blue-600': variant === 'text' && color === 'info' && !disabled,
    },
    
    // States
    {
      'opacity-50 cursor-not-allowed pointer-events-none': disabled,
      'animate-pulse cursor-wait': loading,
      'border-red-500': error && variant === 'outlined',
      'text-red-500': error && variant === 'text',
    }
  );
}

/**
 * Get form field wrapper classes
 */
export function getFieldWrapperClasses({
  error,
  disabled,
}: {
  error?: boolean;
  disabled?: boolean;
} = {}) {
  return cn(
    'flex flex-col gap-1',
    {
      'opacity-50 cursor-not-allowed': disabled,
    }
  );
}

/**
 * Get form field label classes
 */
export function getFieldLabelClasses({
  required,
  error,
}: {
  required?: boolean;
  error?: boolean;
} = {}) {
  return cn(
    'text-sm font-medium',
    {
      'text-red-500': error,
      'after:content-["*"] after:ml-0.5 after:text-red-500': required,
    }
  );
}

/**
 * Get form field helper text classes
 */
export function getFieldHelperTextClasses({
  error,
}: {
  error?: boolean;
} = {}) {
  return cn(
    'text-xs',
    {
      'text-red-500': error,
      'text-gray-500': !error,
    }
  );
}

/**
 * Get flex container classes
 */
export function getFlexClasses({
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  align = 'start',
  gap,
}: {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: number | string;
} = {}) {
  return cn(
    'flex',
    {
      'flex-row': direction === 'row',
      'flex-col': direction === 'column',
      'flex-row-reverse': direction === 'row-reverse',
      'flex-col-reverse': direction === 'column-reverse',
      'flex-nowrap': wrap === 'nowrap',
      'flex-wrap': wrap === 'wrap',
      'flex-wrap-reverse': wrap === 'wrap-reverse',
      'justify-start': justify === 'start',
      'justify-end': justify === 'end',
      'justify-center': justify === 'center',
      'justify-between': justify === 'between',
      'justify-around': justify === 'around',
      'justify-evenly': justify === 'evenly',
      'items-start': align === 'start',
      'items-end': align === 'end',
      'items-center': align === 'center',
      'items-baseline': align === 'baseline',
      'items-stretch': align === 'stretch',
    },
    gap && `gap-${gap}`
  );
}

/**
 * Get grid container classes
 */
export function getGridClasses({
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  autoFlow = 'row',
}: {
  columns?: number | string;
  rows?: number | string;
  gap?: number | string;
  columnGap?: number | string;
  rowGap?: number | string;
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
} = {}) {
  return cn(
    'grid',
    {
      [`grid-cols-${columns}`]: typeof columns === 'number',
      [`grid-rows-${rows}`]: typeof rows === 'number',
      'grid-flow-row': autoFlow === 'row',
      'grid-flow-col': autoFlow === 'column',
      'grid-flow-dense': autoFlow === 'dense',
      'grid-flow-row-dense': autoFlow === 'row dense',
      'grid-flow-col-dense': autoFlow === 'column dense',
    },
    gap && `gap-${gap}`,
    columnGap && `gap-x-${columnGap}`,
    rowGap && `gap-y-${rowGap}`,
    typeof columns === 'string' && `grid-cols-[${columns}]`,
    typeof rows === 'string' && `grid-rows-[${rows}]`
  );
}