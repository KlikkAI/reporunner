import { useEffect, useRef } from 'react';

type EventType = keyof WindowEventMap;
type Handler<T extends EventType> = (event: WindowEventMap[T]) => void;

/**
 * Hook that manages event listeners with cleanup
 */
export function useEventListener<T extends EventType>(
  eventName: T,
  handler: Handler<T>,
  element: Window | Document | HTMLElement | null = window,
  options?: boolean | AddEventListenerOptions
) {
  // Create a ref that stores handler
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element;

    if (!targetElement?.addEventListener) return;

    // Create event listener that calls handler function stored in ref
    const listener: typeof handler = event => savedHandler.current(event);
    targetElement.addEventListener(eventName, listener as EventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, listener as EventListener);
    };
  }, [eventName, element, options]);
}