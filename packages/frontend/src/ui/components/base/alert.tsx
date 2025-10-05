import type React from 'react';
import { cn } from '../../utils/styles';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  /**
   * Type of alert to display
   */
  type: AlertType;

  /**
   * Title text for the alert
   */
  title?: React.ReactNode;

  /**
   * Main message content
   */
  message: React.ReactNode;

  /**
   * Optional additional details to display in collapsible section
   */
  details?: React.ReactNode;

  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
}

export const Alert = ({ type, title, message, details, icon }: AlertProps) => {
  const styles = {
    info: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-600/30',
      text: 'text-blue-300',
      accent: 'text-blue-400',
    },
    success: {
      bg: 'bg-green-900/20',
      border: 'border-green-600/30',
      text: 'text-green-300',
      accent: 'text-green-400',
    },
    warning: {
      bg: 'bg-orange-900/20',
      border: 'border-orange-600/30',
      text: 'text-orange-300',
      accent: 'text-orange-400',
    },
    error: {
      bg: 'bg-red-900/20',
      border: 'border-red-600/30',
      text: 'text-red-300',
      accent: 'text-red-400',
    },
  };

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: <span className="text-lg">✅</span>,
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: <span className="text-lg">❌</span>,
  };

  const displayIcon = icon || defaultIcons[type];

  return (
    <div
      className={cn('rounded border p-4', styles[type].bg, styles[type].border, styles[type].text)}
    >
      <div className="flex items-start space-x-2">
        {displayIcon && <div className={cn('mt-0.5', styles[type].accent)}>{displayIcon}</div>}
        <div className="flex-1">
          {title && <p className="text-sm font-medium">{title}</p>}
          <div className="text-sm mt-1">{message}</div>
          {details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer hover:underline">View Details</summary>
              <div className="mt-1">{details}</div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
