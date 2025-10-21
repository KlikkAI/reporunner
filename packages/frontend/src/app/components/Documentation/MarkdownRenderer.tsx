/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with syntax highlighting, custom styling,
 * and additional features like copy buttons for code blocks.
 */

import { Check, Copy } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Code block component with copy functionality
 */
const CodeBlock: React.FC<{ children: string; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'text';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
      <pre
        className={`language-${language} bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto`}
      >
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom code block rendering
          code({ node, className, children, ...props }: any) {
            const inline = props.inline;
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            return !inline && match ? (
              <CodeBlock className={className}>{codeString}</CodeBlock>
            ) : (
              <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },

          // Custom heading rendering with anchor links
          h1({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-');
            return (
              <h1 id={id} className="scroll-mt-20 group" {...props}>
                {children}
                <a
                  href={`#${id}`}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500 no-underline"
                >
                  #
                </a>
              </h1>
            );
          },

          h2({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-');
            return (
              <h2 id={id} className="scroll-mt-20 group" {...props}>
                {children}
                <a
                  href={`#${id}`}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500 no-underline"
                >
                  #
                </a>
              </h2>
            );
          },

          h3({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-');
            return (
              <h3 id={id} className="scroll-mt-20 group" {...props}>
                {children}
                <a
                  href={`#${id}`}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500 no-underline"
                >
                  #
                </a>
              </h3>
            );
          },

          // Custom link rendering (external links open in new tab)
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-blue-600 hover:text-blue-800 underline"
                {...props}
              >
                {children}
                {isExternal && <span className="ml-1">↗</span>}
              </a>
            );
          },

          // Custom table rendering
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-6">
                <table
                  className="min-w-full divide-y divide-gray-200 border border-gray-300"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },

          th({ children, ...props }) {
            return (
              <th
                className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                {...props}
              >
                {children}
              </th>
            );
          },

          td({ children, ...props }) {
            return (
              <td
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200"
                {...props}
              >
                {children}
              </td>
            );
          },

          // Custom blockquote rendering
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Custom list rendering
          ul({ children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-2 my-4" {...props}>
                {children}
              </ul>
            );
          },

          ol({ children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-2 my-4" {...props}>
                {children}
              </ol>
            );
          },

          li({ children, ...props }) {
            return (
              <li className="text-gray-700" {...props}>
                {children}
              </li>
            );
          },

          // Custom paragraph rendering
          p({ children, ...props }) {
            return (
              <p className="my-4 text-gray-700 leading-relaxed" {...props}>
                {children}
              </p>
            );
          },

          // Custom horizontal rule
          hr({ ...props }) {
            return <hr className="my-8 border-t-2 border-gray-200" {...props} />;
          },

          // Task list items (GitHub Flavored Markdown)
          input({ type, checked, ...props }) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-2 cursor-not-allowed"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
