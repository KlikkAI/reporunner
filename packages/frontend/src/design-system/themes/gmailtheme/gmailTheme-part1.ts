/**
 * Gmail-Specific Theme Configuration
 * Provides authentic Gmail branding and color schemes for Gmail nodes
 */

import type { NodeTheme } from '../../app/node-extensions/types';

export const gmailTheme: NodeTheme = {
  name: 'gmail',

  colors: {
    primary: '#ea4335', // Gmail Red
    secondary: '#4285f4', // Google Blue
    accent: '#34a853', // Google Green
    background: '#fff', // White background
    border: '#ea4335', // Gmail Red border
    text: '#1f2937', // Dark gray text
    textSecondary: '#6b7280', // Medium gray text
    success: '#34a853', // Green for success states
    warning: '#fbbc04', // Google Yellow for warnings
    error: '#ea4335', // Gmail Red for errors
    info: '#4285f4', // Google Blue for info
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      md: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
  },

  animations: {
    duration: {
      fast: '0.1s',
      normal: '0.2s',
      slow: '0.3s',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

/**
 * Gmail Animation Keyframes for CSS-in-JS
 */
export const gmailAnimations = {
  pulse: `
    @keyframes gmail-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

  glow: `
    @keyframes gmail-glow {
      0%, 100% { 
        box-shadow: 0 0 5px rgba(234, 67, 53, 0.3);
