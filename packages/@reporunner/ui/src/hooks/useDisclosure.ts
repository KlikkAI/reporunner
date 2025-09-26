import { useCallback, useState } from 'react';

export interface UseDisclosureProps {
  defaultIsOpen?: boolean;
  onOpen?(): void;
  onClose?(): void;
}

/**
 * Hook for managing show/hide states with callbacks
 */
export function useDisclosure(props: UseDisclosureProps = {}) {
  const { defaultIsOpen = false, onOpen, onClose } = props;
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}