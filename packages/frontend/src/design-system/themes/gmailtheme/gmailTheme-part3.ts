{
  text: '!', color;
  : '#fff',
    backgroundColor: '#dc2626',
    position: 'top-right' as
  const,
}
,

  emailCount:
{
  text: '', // Dynamic
    color;
  : '#4285f4',
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    position: 'top-left' as
  const,
}
,
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
        color: '#ea4335',
      },
    },

    primary: {
      color: '#fff',
      backgroundColor: '#ea4335',
      border: 'none',
      borderRadius: '6px',
      hover: {
        backgroundColor: '#d93025',
      },
    },
  },
};

export default gmailTheme;
