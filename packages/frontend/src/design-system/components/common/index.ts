// Common Design System Components
import type React from 'react';

export { default as EnhancedNodeToolbar } from './EnhancedNodeToolbar';
export { default as PropertyField } from './PropertyField';

// Badge interface
export interface NodeBadge {
  id: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  backgroundColor?: string;
  color: string;
  icon?: React.ReactNode;
  text?: string;
}

// Helper functions for badges
export const createStatusBadge = (
  status: 'success' | 'error' | 'info' | 'warning',
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right'
): NodeBadge => {
  const colors = {
    success: { bg: '#52c41a', text: '#fff' },
    error: { bg: '#ff4d4f', text: '#fff' },
    info: { bg: '#1890ff', text: '#fff' },
    warning: { bg: '#faad14', text: '#fff' },
  };
  const colorPair = colors[status] || colors.info;

  return {
    id: `badge-${status}-${position}`,
    position,
    backgroundColor: colorPair.bg,
    color: colorPair.text,
  };
};

export const createTextBadge = (
  text: string,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-left',
  color: string = '#fff',
  backgroundColor: string = '#1890ff'
): NodeBadge => {
  return {
    id: `badge-text-${text.toLowerCase().replace(/\s/g, '-')}-${position}`,
    position,
    backgroundColor,
    color,
    text,
  };
};
