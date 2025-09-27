// Base theme configuration that provides common structure and default values
import type {
  NodeColorScheme,
  NodeTypography,
  NodeSpacing,
  NodeAnimationConfig,
  NodeTheme
} from '@/app/node-extensions/types';

// Base theme configuration shared across all themes
export const baseThemeConfig: Omit<NodeTheme, 'name' | 'colors' | 'shadows'> = {
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '18px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  },
};

// Theme creation utility
export function createTheme(
  name: string,
  colors: NodeColorScheme,
  shadows: { sm: string; md: string; lg: string; xl: string }
): NodeTheme {
  return {
    name,
    colors,
    shadows,
    ...baseThemeConfig,
  };
}