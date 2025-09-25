window.addEventListener('nodeThemeChange', handler as EventListener);

// Return cleanup function
return () => {
        window.removeEventListener('nodeThemeChange', handler as EventListener);
      };
}

return () => {}; // Noop cleanup for SSR
}

  // CSS class utilities
  getThemeClass(): string
{
  return `node-theme-${this.currentTheme.name}`;
}

getThemeDataAttribute();
: Record<string, string>
{
  return {
      'data-theme': this.currentTheme.name,
      'data-theme-variant': this.themeVariant,
    };
}
}

// Export singleton instance
export const themeManager = new ThemeManager();

// Export class for testing
export { ThemeManager };
