/**
 * Node Extensions Themes
 * Central export for theme management and React hooks
 */

import { useEffect, useState } from 'react';
import type { NodeTheme } from '../types';
import { defaultTheme } from './defaultTheme';
import { ThemeManager, themeManager } from './ThemeManager';

export { darkTheme } from './darkTheme';
export { defaultTheme } from './defaultTheme';
export { themeManager, ThemeManager };

/**
 * React hook for accessing and subscribing to theme changes
 */
export function useNodeTheme() {
  const [theme, setTheme] = useState<NodeTheme>(themeManager.getCurrentTheme());

  useEffect(() => {
    // Subscribe to theme changes
    const cleanup = themeManager.onThemeChange((newTheme) => {
      setTheme(newTheme);
    });

    return cleanup;
  }, []);

  return {
    theme,
    setTheme: (name: string) => themeManager.setCurrentTheme(name),
    toggleTheme: () => themeManager.toggleTheme(),
    isCurrentThemeDark: () => themeManager.isCurrentThemeDark(),
  };
}

/**
 * Default theme export for components that need a fallback
 */
export { defaultTheme as default };
