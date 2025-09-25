}
      50%
{
  box - shadow;
  : 0 0 20px rgba(234, 67, 53, 0.6), 
                    0 0 30px rgba(234, 67, 53, 0.4)
}
}
  `,

  spin: `
@keyframes
gmail - spin;
{
  from;
  {
    transform: rotate(0deg);
  }
  to;
  {
    transform: rotate(360deg);
  }
}
`,

  slideIn: `;
@keyframes
gmail-slide-in {
      from { 
        transform: translateY(-10px);
opacity: 0;
}
      to
{
  transform: translateY(0);
  opacity: 1;
}
}
  `,
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
  success: 'gmail-success',
};

/**
 * Gmail Node Visual States
 */
export const gmailVisualStates = {
  default: {
    borderColor: '#ea4335',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },

  selected: {
    borderColor: '#ea4335',
    borderWidth: '2px',
    boxShadow: '0 4px 12px rgba(234, 67, 53, 0.15)',
  },

  connected: {
    borderColor: '#34a853',
    backgroundColor: '#f0fdf4',
    boxShadow: '0 2px 4px rgba(52, 168, 83, 0.1)',
  },

  disconnected: {
    borderColor: '#fbbc04',
    backgroundColor: '#fffbeb',
    boxShadow: '0 2px 4px rgba(251, 188, 4, 0.1)',
  },

  error: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)',
  },

  polling: {
    borderColor: '#4285f4',
    animation: 'gmail-pulse 2s infinite',
  },
};

/**
 * Gmail Badge Configurations
 */
export const gmailBadges = {
  connected: {
    text: '✓',
    color: '#fff',
    backgroundColor: '#34a853',
    position: 'top-right' as const,
  },

  polling: {
    text: '⟳',
    color: '#fff',
    backgroundColor: '#4285f4',
    position: 'bottom-right' as const,
    animation: 'gmail-spin 2s linear infinite',
  },
