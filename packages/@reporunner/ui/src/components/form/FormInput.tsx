import type React from 'react';
import { forwardRef } from 'react';
import { cn } from '../../utils/styles';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text to display below input
   */
  helperText?: React.ReactNode;

  /**
   * Additional wrapper class names
   */
  wrapperClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, helperText, wrapperClassName, type = 'text', disabled, ...props }, ref) => {
    return (
      <div className={wrapperClassName}>
        <input
          type={type}
          className={cn(
            'w-full px-3 py-2 bg-gray-700 border text-white text-sm',
            'rounded focus:ring-2 focus:outline-none transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
              : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20',
            className
          )}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('mt-1 text-xs', error ? 'text-red-400' : 'text-gray-400')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
