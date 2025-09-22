/**
 * Theme Utilities
 *
 * Utilities for working with themes and design tokens
 */

import { colors, spacing, typography } from '../tokens';

/**
 * Get color value from token path
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = colors;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || path;
}

/**
 * Get spacing value from token
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key];
}

/**
 * Get typography value from token path
 */
export function getTypography(category: keyof typeof typography, key: string): string {
  return (typography[category] as any)?.[key] || '';
}

/**
 * Theme mode utilities
 */
export const themeUtils = {
  isDark: () => document.documentElement.classList.contains('dark'),
  setDark: () => document.documentElement.classList.add('dark'),
  setLight: () => document.documentElement.classList.remove('dark'),
  toggle: () => document.documentElement.classList.toggle('dark'),
};
