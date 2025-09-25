/**
 * Theme Manager
 * Centralized theme management for node UI components
 */

import gmailTheme from '../../../design-system/themes/gmailTheme';
import type { ThemeManager as IThemeManager, NodeTheme, ThemeVariant } from '../types';
import { darkTheme } from './darkTheme';
import { defaultTheme } from './defaultTheme';

class ThemeManager implements IThemeManager {
  private themes: Map<string, NodeTheme> = new Map();
  private currentTheme: NodeTheme = defaultTheme;
  private themeVariant: ThemeVariant = 'auto';
  private systemPrefersDark = false;
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    // Register default themes
    this.registerTheme(defaultTheme);
    this.registerTheme(darkTheme);

    // Register specialized themes
    this.registerTheme(gmailTheme);

    // Set up system theme detection
    this.initializeSystemThemeDetection();
  }

  private initializeSystemThemeDetection(): void {
    if (window?.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark = this.mediaQuery.matches;

      // Listen for system theme changes
      this.mediaQuery.addEventListener('change', (e) => {
        this.systemPrefersDark = e.matches;
        if (this.themeVariant === 'auto') {
          this.updateAutoTheme();
        }
      });

      // Set initial theme based on auto mode
      if (this.themeVariant === 'auto') {
        this.updateAutoTheme();
      }
    }
  }

  private updateAutoTheme(): void {
    const themeName = this.systemPrefersDark ? 'dark' : 'default';
    const theme = this.themes.get(themeName);
    if (theme) {
      this.currentTheme = theme;
      this.applyCSSVariables(theme);
      this.emitThemeChangeEvent(theme);
    }
  }

  registerTheme(theme: NodeTheme): void {
    this.themes.set(theme.name, theme);
  }

  getTheme(name: string): NodeTheme | null {
    return this.themes.get(name) || null;
  }

  getCurrentTheme(): NodeTheme {
    return this.currentTheme;
  }

  setCurrentTheme(name: string): void {
    const theme = this.themes.get(name);
    if (theme) {
      this.currentTheme = theme;
      this.themeVariant = name as ThemeVariant;
      this.applyCSSVariables(theme);
      this.emitThemeChangeEvent(theme);
    } else {
    }
  }

  setThemeVariant(variant: ThemeVariant): void {
    this.themeVariant = variant;

    switch (variant) {
      case 'light':
        this.setCurrentTheme('default');
        break;
      case 'dark':
        this.setCurrentTheme('dark');
        break;
      case 'auto':
        this.updateAutoTheme();
        break;
    }
  }

  getThemeVariant(): ThemeVariant {
    return this.themeVariant;
