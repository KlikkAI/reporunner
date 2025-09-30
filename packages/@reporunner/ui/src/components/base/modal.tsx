import type React from 'react';
import { cn } from '../../utils/styles';

export interface ModalProps {
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;

  /**
   * Called when the modal needs to be closed
   */
  onClose: () => void;

  /**
   * Title of the modal
   */
  title?: React.ReactNode;

  /**
   * Description text below the title
   */
  description?: React.ReactNode;

  /**
   * Icon to display in the header
   */
  icon?: React.ReactNode;

  /**
   * Actions to display in the header next to close button
   */
  headerActions?: React.ReactNode;

  /**
   * Content of the modal
   */
  children: React.ReactNode;

  /**
   * Additional class names to apply to the modal container
   */
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  headerActions,
  children,
  className,
}: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={cn(
          'bg-gray-900 border border-gray-700 rounded-lg w-full h-5/6 flex flex-col',
          'max-w-4xl',
          className
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {icon && (
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xl">
                {icon}
              </div>
            )}
            {(title || description) && (
              <div>
                {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
                {description && <p className="text-sm text-gray-400">{description}</p>}
              </div>
            )}
            {headerActions}
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
