/**
 * Shared Node Icon Component
 * Handles different icon types consistently across all nodes
 */

import type React from 'react';

interface NodeIconProps {
  icon: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  fallbackIcon?: string;
}

const NodeIcon: React.FC<NodeIconProps> = ({
  icon,
  displayName,
  size = 'md',
  fallbackIcon = '📦',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 text-lg',
    md: 'w-6 h-6 text-2xl',
    lg: 'w-8 h-8 text-3xl',
  };

  return (
    <div className="flex items-center justify-center">
      {icon.startsWith('http') || icon.startsWith('/') ? (
        <>
          <img
            src={icon}
            alt={displayName}
            className={sizeClasses[size].split(' ').slice(0, 2).join(' ')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling;
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
          <span className={`hidden ${sizeClasses[size].split(' ')[2]}`}>{fallbackIcon}</span>
        </>
      ) : (
        <span className={sizeClasses[size].split(' ')[2]}>{icon || fallbackIcon}</span>
      )}
    </div>
  );
};

export default NodeIcon;
