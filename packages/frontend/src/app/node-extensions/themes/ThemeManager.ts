/**
 * Theme Manager
 * Centralized theme management for node UI components
 */

import type { NodeTheme, ThemeManager as IThemeManager, ThemeVariant } from '../types'
import { defaultTheme } from './defaultTheme'
import { darkTheme } from './darkTheme'
import gmailTheme from '../../../design-system/themes/gmailTheme'

class ThemeManager implements IThemeManager {
  private themes: Map<string, NodeTheme> = new Map()
  private currentTheme: NodeTheme = defaultTheme
  private themeVariant: ThemeVariant = 'auto'
  private systemPrefersDark = false
  private mediaQuery: MediaQueryList | null = null

  constructor() {
    // Register default themes
    this.registerTheme(defaultTheme)
    this.registerTheme(darkTheme)
    
    // Register specialized themes
    this.registerTheme(gmailTheme)

    // Set up system theme detection
    this.initializeSystemThemeDetection()
  }

  private initializeSystemThemeDetection(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemPrefersDark = this.mediaQuery.matches

      // Listen for system theme changes
      this.mediaQuery.addEventListener('change', (e) => {
        this.systemPrefersDark = e.matches
        if (this.themeVariant === 'auto') {
          this.updateAutoTheme()
        }
      })

      // Set initial theme based on auto mode
      if (this.themeVariant === 'auto') {
        this.updateAutoTheme()
      }
    }
  }

  private updateAutoTheme(): void {
    const themeName = this.systemPrefersDark ? 'dark' : 'default'
    const theme = this.themes.get(themeName)
    if (theme) {
      this.currentTheme = theme
      this.applyCSSVariables(theme)
      this.emitThemeChangeEvent(theme)
    }
  }

  registerTheme(theme: NodeTheme): void {
    this.themes.set(theme.name, theme)
  }

  getTheme(name: string): NodeTheme | null {
    return this.themes.get(name) || null
  }

  getCurrentTheme(): NodeTheme {
    return this.currentTheme
  }

  setCurrentTheme(name: string): void {
    const theme = this.themes.get(name)
    if (theme) {
      this.currentTheme = theme
      this.themeVariant = name as ThemeVariant
      this.applyCSSVariables(theme)
      this.emitThemeChangeEvent(theme)
    } else {
      console.warn(`Theme "${name}" not found`)
    }
  }

  setThemeVariant(variant: ThemeVariant): void {
    this.themeVariant = variant
    
    switch (variant) {
      case 'light':
        this.setCurrentTheme('default')
        break
      case 'dark':
        this.setCurrentTheme('dark')
        break
      case 'auto':
        this.updateAutoTheme()
        break
    }
  }

  getThemeVariant(): ThemeVariant {
    return this.themeVariant
  }

  getAllThemes(): NodeTheme[] {
    return Array.from(this.themes.values())
  }

  generateCSSVariables(theme: NodeTheme): Record<string, string> {
    const variables: Record<string, string> = {}

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables[`--node-color-${key}`] = value
    })

    // Typography
    variables['--node-font-family'] = theme.typography.fontFamily
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      variables[`--node-font-size-${key}`] = value
    })
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      variables[`--node-font-weight-${key}`] = value.toString()
    })
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      variables[`--node-line-height-${key}`] = value.toString()
    })

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      variables[`--node-spacing-${key}`] = value
    })

    // Animations
    Object.entries(theme.animations.duration).forEach(([key, value]) => {
      variables[`--node-duration-${key}`] = value
    })
    Object.entries(theme.animations.easing).forEach(([key, value]) => {
      variables[`--node-easing-${key}`] = value
    })

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      variables[`--node-shadow-${key}`] = value
    })

    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      variables[`--node-radius-${key}`] = value
    })

    return variables
  }

  applyCSSVariables(theme: NodeTheme): void {
    if (typeof document === 'undefined') return

    const variables = this.generateCSSVariables(theme)
    const root = document.documentElement

    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }

  private emitThemeChangeEvent(theme: NodeTheme): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('nodeThemeChange', {
        detail: { theme }
      })
      window.dispatchEvent(event)
    }
  }

  // Utility methods for theme switching
  toggleTheme(): void {
    if (this.themeVariant === 'auto') {
      // When in auto mode, toggle to opposite of system preference
      this.setThemeVariant(this.systemPrefersDark ? 'light' : 'dark')
    } else {
      // Toggle between light and dark
      this.setThemeVariant(this.themeVariant === 'light' ? 'dark' : 'light')
    }
  }

  isSystemDark(): boolean {
    return this.systemPrefersDark
  }

  isCurrentThemeDark(): boolean {
    return this.currentTheme.name === 'dark' || 
           (this.themeVariant === 'auto' && this.systemPrefersDark)
  }

  // Theme event listeners
  onThemeChange(callback: (theme: NodeTheme) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.theme)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('nodeThemeChange', handler as EventListener)
      
      // Return cleanup function
      return () => {
        window.removeEventListener('nodeThemeChange', handler as EventListener)
      }
    }

    return () => {} // Noop cleanup for SSR
  }

  // CSS class utilities
  getThemeClass(): string {
    return `node-theme-${this.currentTheme.name}`
  }

  getThemeDataAttribute(): Record<string, string> {
    return {
      'data-theme': this.currentTheme.name,
      'data-theme-variant': this.themeVariant
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager()

// Export class for testing
export { ThemeManager }