/**
 * Theme System Export
 * Centralized exports for the node theme system
 */

export {
  default as gmailTheme,
  gmailAnimations,
  gmailBadges,
  gmailClasses,
  gmailToolbarTheme,
  gmailVisualStates,
} from '../../../design-system/themes/gmailTheme';
// Re-export types for convenience
export type {
  NodeAnimationConfig,
  NodeColorScheme,
  NodeSpacing,
  NodeTheme,
  NodeTypography,
  ThemeManager as IThemeManager,
  ThemeVariant,
} from '../types';
export { darkTheme } from './darkTheme';
export { defaultTheme } from './defaultTheme';
export { ThemeManager, themeManager } from './ThemeManager';

// CSS variables hook for React components
import { useEffect, useState } from 'react';
import type { NodeTheme } from '../types';
import { defaultTheme } from './defaultTheme';
import { themeManager } from './ThemeManager';

/**
 * React hook for accessing current node theme
 */
export function useNodeTheme(): {
  theme: NodeTheme;
  setTheme: (name: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  variant: string;
} {
  const [theme, setThemeState] = useState<NodeTheme>(
    themeManager.getCurrentTheme() || defaultTheme
  );
  const [variant, setVariant] = useState(themeManager.getThemeVariant());

  useEffect(() => {
    const cleanup = themeManager.onThemeChange((newTheme) => {
      setThemeState(newTheme);
      setVariant(themeManager.getThemeVariant());
    });

    return cleanup;
  }, []);

  const setTheme = (name: string) => {
    themeManager.setCurrentTheme(name);
  };

  const toggleTheme = () => {
    themeManager.toggleTheme();
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: themeManager.isCurrentThemeDark(),
    variant,
  };
}

/**
 * Higher-order component for theme context
 */
import { createContext, type ReactNode, useContext } from 'react';

const NodeThemeContext = createContext<{
  theme: NodeTheme;
  setTheme: (name: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
} | null>(null);

export function NodeThemeProvider({ children }: { children: ReactNode }) {
  const themeData = useNodeTheme();

  return (
    <NodeThemeContext.Provider value={themeData}>
      <div className={themeManager.getThemeClass()} {...themeManager.getThemeDataAttribute()}>
        {children}
      </div>
    </NodeThemeContext.Provider>
  );
}

export function useNodeThemeContext() {
  const context = useContext(NodeThemeContext);
  if (!context) {
    throw new Error('useNodeThemeContext must be used within NodeThemeProvider');
  }
  return context;
}
