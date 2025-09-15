/**
 * Class Name Utilities
 * 
 * UI-specific utility functions for handling CSS classes and styling
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Combines class names conditionally
 * Similar to clsx but optimized for our design system
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Creates variant classes based on props
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  variants: T
) {
  return (props: { [K in keyof T]?: keyof T[K] }) => {
    return Object.entries(props)
      .map(([key, value]) => {
        if (value && variants[key]) {
          return variants[key][value as string];
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  };
}