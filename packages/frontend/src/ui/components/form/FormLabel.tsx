import type React from 'react';
import { cn } from '../../utils/styles';

export interface FormLabelProps {
  /**
   * The label text to display
   */
  children: React.ReactNode;

  /**
   * Whether this field is required
   */
  required?: boolean;

  /**
   * HTML for attribute to link with input
   */
  htmlFor?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const FormLabel = ({ children, required, htmlFor, className }: FormLabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-gray-300 mb-2', className)}
    >
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
};
