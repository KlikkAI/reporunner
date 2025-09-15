/**
 * Design System Utils - UI-specific utilities
 * 
 * This module provides UI-specific utility functions for the design system
 */

export * from './classNames';
export * from './responsive';
export * from './theme';

// Re-export main utilities for convenience
export { cn, createVariants } from './classNames';
export { breakpoints, mediaQuery, useBreakpoint } from './responsive';
export { getColor, getSpacing, getTypography, themeUtils } from './theme';