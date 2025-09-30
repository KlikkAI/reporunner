import { cn } from './classNames';

/**
 * Shared input styling utilities to ensure consistent appearance
 * across all property renderers and form components
 */

// Base input styles for consistent appearance
export const baseInputStyles = cn(
  'w-full bg-gray-800 border-gray-600 text-gray-200',
  'focus:border-blue-500 focus:ring-blue-500',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'placeholder:text-gray-400'
);

// Select dropdown styles
export const selectStyles = cn(baseInputStyles, 'min-h-[32px]');

// Multi-select styles
export const multiSelectStyles = cn(selectStyles, 'min-h-[40px]');

// Textarea styles for larger text inputs
export const textareaStyles = cn(baseInputStyles, 'min-h-[80px] resize-vertical');

// Color input styles
export const colorInputStyles = cn(
  'w-12 h-8 rounded border-2 border-gray-600',
  'cursor-pointer disabled:cursor-not-allowed'
);

// Number input styles
export const numberInputStyles = cn(baseInputStyles, 'text-right');

// Boolean/checkbox styles
export const checkboxStyles = cn(
  'h-4 w-4 text-blue-600 bg-gray-800 border-gray-600',
  'focus:ring-blue-500 focus:ring-2',
  'disabled:opacity-50'
);

// Switch styles for toggle inputs
export const switchStyles = cn(
  'relative inline-flex h-6 w-11 items-center rounded-full',
  'border-2 border-transparent',
  'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed'
);

// Date picker styles
export const datePickerStyles = cn(
  baseInputStyles,
  '[&_.ant-picker]:bg-gray-800 [&_.ant-picker]:border-gray-600',
  '[&_.ant-picker-input>input]:text-gray-200'
);

// File input styles
export const fileInputStyles = cn(
  'block w-full text-sm text-gray-200',
  'file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0',
  'file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700',
  'hover:file:bg-blue-100 file:disabled:opacity-50'
);

// Button styles for property actions
export const propertyButtonStyles = cn(
  'inline-flex items-center px-3 py-1.5 text-sm font-medium',
  'border border-gray-600 rounded-md',
  'bg-gray-700 text-gray-200 hover:bg-gray-600',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  'disabled:opacity-50 disabled:cursor-not-allowed'
);

// Icon button styles for small actions
export const iconButtonStyles = cn(
  'inline-flex items-center justify-center w-8 h-8',
  'border border-gray-600 rounded-md',
  'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  'disabled:opacity-50 disabled:cursor-not-allowed'
);

// Validation states
export const getValidationStyles = (hasError?: boolean, isValid?: boolean) => {
  if (hasError) {
    return 'border-red-500 focus:border-red-500 focus:ring-red-500';
  }
  if (isValid) {
    return 'border-green-500 focus:border-green-500 focus:ring-green-500';
  }
  return '';
};
