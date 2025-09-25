}

  getAllThemes(): NodeTheme[]
{
  return Array.from(this.themes.values());
}

generateCSSVariables(theme: NodeTheme)
: Record<string, string>
{
  const variables: Record<string, string> = {};

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables[`--node-color-${key}`] = value;
  });

  // Typography
  variables['--node-font-family'] = theme.typography.fontFamily;
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    variables[`--node-font-size-${key}`] = value;
  });
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    variables[`--node-font-weight-${key}`] = value.toString();
  });
  Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
    variables[`--node-line-height-${key}`] = value.toString();
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--node-spacing-${key}`] = value;
  });

  // Animations
  Object.entries(theme.animations.duration).forEach(([key, value]) => {
    variables[`--node-duration-${key}`] = value;
  });
  Object.entries(theme.animations.easing).forEach(([key, value]) => {
    variables[`--node-easing-${key}`] = value;
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    variables[`--node-shadow-${key}`] = value;
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    variables[`--node-radius-${key}`] = value;
  });

  return variables;
}

applyCSSVariables(theme: NodeTheme)
: void
{
  if (typeof document === 'undefined') return;

  const variables = this.generateCSSVariables(theme);
  const root = document.documentElement;

  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

private
emitThemeChangeEvent(theme: NodeTheme)
: void
{
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('nodeThemeChange', {
      detail: { theme },
    });
    window.dispatchEvent(event);
  }
}

// Utility methods for theme switching
toggleTheme();
: void
{
  if (this.themeVariant === 'auto') {
    // When in auto mode, toggle to opposite of system preference
    this.setThemeVariant(this.systemPrefersDark ? 'light' : 'dark');
  } else {
    // Toggle between light and dark
    this.setThemeVariant(this.themeVariant === 'light' ? 'dark' : 'light');
  }
}

isSystemDark();
: boolean
{
  return this.systemPrefersDark;
}

isCurrentThemeDark();
: boolean
{
  return (
      this.currentTheme.name === 'dark' || (this.themeVariant === 'auto' && this.systemPrefersDark)
    );
}

// Theme event listeners
onThemeChange(callback: (theme: NodeTheme) => void)
: () => void
{
    const handler = (event: CustomEvent) => {
      callback(event.detail.theme);
    };

    if (typeof window !== 'undefined') {
