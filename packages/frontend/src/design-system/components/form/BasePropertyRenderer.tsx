import React from 'react';
import type { ReactNode } from 'react';

interface BasePropertyRendererProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Base property renderer component that provides consistent layout and styling
 * for all property input types. Eliminates duplication across property renderers.
 */
export const BasePropertyRenderer: React.FC<BasePropertyRendererProps> = ({
  label,
  description,
  error,
  required,
  className = '',
  children,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-200">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {children}

      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default BasePropertyRenderer;