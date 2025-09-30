/**
 * Default Node Theme
 * Professional light theme with modern design principles
 */

import { createTheme } from '@/design-system/tokens/baseTheme';
import type { NodeTheme } from '../types';

export const defaultTheme: NodeTheme = createTheme(
  'default',
  {
    primary: '#1890ff',
    secondary: '#722ed1',
    accent: '#13c2c2',
    background: '#ffffff',
    border: '#d9d9d9',
    text: '#262626',
    textSecondary: '#8c8c8c',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
  },
  {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  }
);
