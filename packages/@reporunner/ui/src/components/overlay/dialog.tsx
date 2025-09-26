import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseComponentProps } from '../../types/component';
import { Button } from '../base/button';

/**
 * Dialog component props
 */
export interface DialogProps extends BaseComponentProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Dialog title
   */
  title?: React.ReactNode;

  /**
   * Dialog description
   */
  description?: React.ReactNode;

  /**
   * Dialog content
   */
  children?: React.ReactNode;

  /**
   * Dialog footer content
   */
  footer?: React.ReactNode;

  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;

  /**
   * Maximum width of dialog
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Custom animation variants
   */
  variants?: Record<string, any>;
}

/**
 * Modal dialog component with animations
 */
export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  maxWidth = 'md',
  variants,
  className,
  ...props
}: DialogProps) => {
  // Default animation variants
  const defaultVariants = {
    overlay: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    content: {
      hidden: {
        opacity: 0,
        scale: 0.95,
        y: -20
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          damping: 25,
          stiffness: 300
        }
      }
    }
  };

  const activeVariants = variants || defaultVariants;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <>
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/50"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={activeVariants.overlay}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild>
                <motion.div
                  className={cn(
                    'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
                    'bg-white rounded-lg shadow-xl focus:outline-none',
                    'flex flex-col max-h-[85vh]',
                    {
                      'w-full max-w-xs': maxWidth === 'xs',
                      'w-full max-w-sm': maxWidth === 'sm',
                      'w-full max-w-md': maxWidth === 'md',
                      'w-full max-w-lg': maxWidth === 'lg',
                      'w-full max-w-xl': maxWidth === 'xl',
                      'w-[95vw]': maxWidth === 'full',
                    },
                    className
                  )}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={activeVariants.content}
                  {...props}
                >
                  {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                      {title && (
                        <DialogPrimitive.Title className="text-lg font-semibold">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      
                      {showCloseButton && (
                        <DialogPrimitive.Close asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </Button>
                        </DialogPrimitive.Close>
                      )}
                    </div>
                  )}

                  <div className="flex-1 px-6 py-4 overflow-y-auto">
                    {description && (
                      <DialogPrimitive.Description className="mb-4 text-sm text-gray-500">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                    {children}
                  </div>

                  {footer && (
                    <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};