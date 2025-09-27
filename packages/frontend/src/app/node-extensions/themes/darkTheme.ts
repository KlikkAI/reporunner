/**
 * Dark Node Theme
 * Modern dark theme optimized for low-light environments
 */

import type { NodeTheme } from '../types';

import { createTheme } from '@/design-system/tokens/baseTheme';

export const darkTheme: NodeTheme = createTheme(
  'dark',
  {
    primary: '#40a9ff',
    secondary: '#9254de',
    accent: '#36cfc9',
    background: '#1f1f1f',
    border: '#434343',
    text: '#ffffff',
    textSecondary: '#a6a6a6',
    success: '#73d13d',
    warning: '#ffc53d',
    error: '#ff7875',
    info: '#40a9ff',
  },
  {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
  }
);
