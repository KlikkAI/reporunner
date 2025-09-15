/**
 * Gmail-Specific Theme Configuration
 * Provides authentic Gmail branding and color schemes for Gmail nodes
 */

import type { NodeTheme } from '../../app/node-extensions/types'

export const gmailTheme: NodeTheme = {
  name: 'gmail',
  displayName: 'Gmail',
  
  colors: {
    primary: '#ea4335',      // Gmail Red
    secondary: '#4285f4',    // Google Blue
    accent: '#34a853',       // Google Green
    background: '#fff',      // White background
    border: '#ea4335',       // Gmail Red border
    text: '#1f2937',         // Dark gray text
    textSecondary: '#6b7280', // Medium gray text
    success: '#34a853',      // Green for success states
    warning: '#fbbc04',      // Google Yellow for warnings
    error: '#ea4335',        // Gmail Red for errors
    info: '#4285f4'          // Google Blue for info
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem'    // 20px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem'    // 48px
  },

  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px'
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
}

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
      }
      50% { 
        box-shadow: 0 0 20px rgba(234, 67, 53, 0.6), 
                    0 0 30px rgba(234, 67, 53, 0.4);
      }
    }
  `,
  
  spin: `
    @keyframes gmail-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,

  slideIn: `
    @keyframes gmail-slide-in {
      from { 
        transform: translateY(-10px);
        opacity: 0;
      }
      to { 
        transform: translateY(0);
        opacity: 1;
      }
    }
  `
}

/**
 * Gmail CSS Classes for Styled Components
 */
export const gmailClasses = {
  node: 'gmail-trigger-node',
  connected: 'gmail-connected',
  disconnected: 'gmail-disconnected',
  polling: 'gmail-polling',
  error: 'gmail-error',
  success: 'gmail-success'
}

/**
 * Gmail Node Visual States
 */
export const gmailVisualStates = {
  default: {
    borderColor: '#ea4335',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  
  selected: {
    borderColor: '#ea4335',
    borderWidth: '2px',
    boxShadow: '0 4px 12px rgba(234, 67, 53, 0.15)'
  },
  
  connected: {
    borderColor: '#34a853',
    backgroundColor: '#f0fdf4',
    boxShadow: '0 2px 4px rgba(52, 168, 83, 0.1)'
  },
  
  disconnected: {
    borderColor: '#fbbc04',
    backgroundColor: '#fffbeb',
    boxShadow: '0 2px 4px rgba(251, 188, 4, 0.1)'
  },
  
  error: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
  },
  
  polling: {
    borderColor: '#4285f4',
    animation: 'gmail-pulse 2s infinite'
  }
}

/**
 * Gmail Badge Configurations
 */
export const gmailBadges = {
  connected: {
    text: '✓',
    color: '#fff',
    backgroundColor: '#34a853',
    position: 'top-right' as const
  },
  
  polling: {
    text: '⟳',
    color: '#fff', 
    backgroundColor: '#4285f4',
    position: 'bottom-right' as const,
    animation: 'gmail-spin 2s linear infinite'
  },
  
  error: {
    text: '!',
    color: '#fff',
    backgroundColor: '#dc2626', 
    position: 'top-right' as const
  },
  
  emailCount: {
    text: '', // Dynamic
    color: '#4285f4',
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    position: 'top-left' as const
  }
}

/**
 * Gmail Toolbar Theme
 */
export const gmailToolbarTheme = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(234, 67, 53, 0.2)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(8px)',
  
  buttons: {
    default: {
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '6px',
      hover: {
        backgroundColor: 'rgba(234, 67, 53, 0.1)',
        color: '#ea4335'
      }
    },
    
    primary: {
      color: '#fff',
      backgroundColor: '#ea4335',
      border: 'none',
      borderRadius: '6px',
      hover: {
        backgroundColor: '#d93025'
      }
    }
  }
}

export default gmailTheme