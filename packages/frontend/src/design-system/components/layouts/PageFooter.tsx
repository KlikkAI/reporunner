// Shared Page Footer Component
// Eliminates duplicate footer patterns across multiple page components

import type React from 'react';

export interface PageFooterProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'compact' | 'minimal';
}

export const PageFooter: React.FC<PageFooterProps> = ({
  className = '',
  children,
  variant = 'default',
}) => {
  const baseClasses = 'bg-gray-50 border-t border-gray-200';
  const variantClasses = {
    default: 'py-8 px-6',
    compact: 'py-4 px-4',
    minimal: 'py-2 px-3',
  };

  return (
    <footer className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children || (
        <div className="text-center text-gray-600">
          <p>&copy; 2024 Reporunner. All rights reserved.</p>
        </div>
      )}
    </footer>
  );
};

export default PageFooter;
