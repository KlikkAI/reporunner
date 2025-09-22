import React from 'react';
import { cn } from '../utils';

export interface JsonViewerProps {
  data: any;
  theme?: 'light' | 'dark';
  collapsed?: number;
  enableClipboard?: boolean;
  className?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  theme = 'dark',
  collapsed = 2,
  enableClipboard = true,
  className,
  maxHeight = '400px',
  showLineNumbers = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const formatJson = (obj: any, depth = 0): string => {
    if (depth >= collapsed) {
      return '...';
    }

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return `"${obj}"`;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map((item) => formatJson(item, depth + 1)).join(', ');
      return `[${items}]`;
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';

      const pairs = keys
        .map((key) => {
          const value = formatJson(obj[key], depth + 1);
          return `"${key}": ${value}`;
        })
        .join(', ');

      return `{${pairs}}`;
    }

    return String(obj);
  };

  const jsonString = formatJson(data);

  return (
    <div
      className={cn(
        'relative border rounded-lg overflow-hidden',
        theme === 'dark'
          ? 'bg-gray-900 border-gray-600 text-gray-300'
          : 'bg-gray-50 border-gray-300 text-gray-800',
        className
      )}
    >
      {enableClipboard && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleCopy}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            )}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <pre
        className={cn('p-4 text-xs overflow-auto font-mono', showLineNumbers && 'pl-8')}
        style={{ maxHeight }}
      >
        {jsonString}
      </pre>
    </div>
  );
};

export default JsonViewer;
