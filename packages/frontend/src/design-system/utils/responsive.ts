/**
 * Responsive Utilities
 *
 * Utilities for handling responsive design and breakpoints
 */

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Media query helper for responsive design
 */
export function mediaQuery(breakpoint: keyof typeof breakpoints) {
  return `@media (min-width: ${breakpoints[breakpoint]})`;
}

/**
 * Check if screen matches breakpoint (client-side only)
 */
export function useBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`).matches;
}
