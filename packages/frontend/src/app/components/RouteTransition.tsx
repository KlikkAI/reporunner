import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteTransition component to prevent white flash during route changes
 * Ensures dark background persists during navigation
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Ensure dark mode persists on route change
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }

    // Force dark background on body during transition
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.transition = 'none';

    // Small timeout to ensure styles are applied
    const timer = setTimeout(() => {
      document.body.style.transition = '';
    }, 0);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return <>{children}</>;
}
