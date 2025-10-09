// Shared Page Header Component
// Eliminates duplicate header patterns across multiple page components

import type React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'hero' | 'minimal';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
  children,
  variant = 'default',
}) => {
  const baseClasses = 'bg-white border-b border-gray-200';
  const variantClasses = {
    default: 'py-6 px-6',
    hero: 'py-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white',
    minimal: 'py-3 px-4',
  };

  return (
    <header className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-2xl font-bold ${variant === 'hero' ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-2 ${variant === 'hero' ? 'text-blue-100' : 'text-gray-600'}`}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </header>
  );
};

export default PageHeader;
