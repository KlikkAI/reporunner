import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with conflict resolution
 * Combines clsx for conditional classes and tailwind-merge for class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type-safe className builder with variants
 */
export type VariantProps<T> = T extends (...args: any[]) => any ? Parameters<T>[0] : never;

/**
 * Focus ring utility for accessibility
 */
export const focusRing =
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

/**
 * Common transition classes
 */
export const transitions = {
  default: 'transition-colors duration-200 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  bounce: 'transition-all duration-200 ease-out',
} as const;
