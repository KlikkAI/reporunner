/**
 * BasePage Component
 *
 * A reusable base component for application pages
 */

import type React from 'react';
import { cn } from '../utils';

export interface BasePageProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerActions?: React.ReactNode;
  fullHeight?: boolean;
}

export const BasePage: React.FC<BasePageProps> = ({
  children,
  title,
  description,
  className,
  headerActions,
  fullHeight = false,
}) => {
  return (
    <div className={cn('flex flex-col', fullHeight ? 'h-full' : 'min-h-screen', className)}>
      {(title || description || headerActions) && (
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>}
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
            {headerActions && <div className="flex items-center space-x-3">{headerActions}</div>}
          </div>
        </div>
      )}

      <div className="flex-1 bg-gray-50">{children}</div>
    </div>
  );
};

export default BasePage;
