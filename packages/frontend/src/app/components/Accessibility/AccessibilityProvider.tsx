/**
 * Accessibility Provider
 * Provides accessibility enhancements and utilities across the application
 * Phase C: Polish & User Experience - Accessibility improvements
 */

import { App, ConfigProvider, theme } from 'antd';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (selector: string) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  colorBlindMode: 'none',
  screenReaderMode: false,
  keyboardNavigation: true,
  focusIndicators: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (_error) {
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings((prev) => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }));
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
    applyAccessibilityStyles(settings);
  }, [settings, applyAccessibilityStyles]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Apply accessibility styles to document
  const applyAccessibilityStyles = (settings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    root.style.fontSize = fontSizeMap[settings.fontSize];

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Color blind mode
    root.className = root.className.replace(/colorblind-\w+/g, '');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${settings.colorBlindMode}`);
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  };

  // Custom theme based on accessibility settings
  const getThemeConfig = () => {
    const baseTheme = {
      algorithm: settings.highContrast ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        fontSize:
          settings.fontSize === 'small'
            ? 12
            : settings.fontSize === 'large'
              ? 16
              : settings.fontSize === 'extra-large'
                ? 18
                : 14,
        borderRadius: settings.reducedMotion ? 2 : 6,
        motionDurationSlow: settings.reducedMotion ? '0s' : '0.3s',
        motionDurationMid: settings.reducedMotion ? '0s' : '0.2s',
        motionDurationFast: settings.reducedMotion ? '0s' : '0.1s',
      },
    };

    // High contrast adjustments
    if (settings.highContrast) {
      baseTheme.token = {
        ...baseTheme.token,
        colorPrimary: '#0066cc',
        colorSuccess: '#00aa00',
        colorWarning: '#ff8800',
        colorError: '#cc0000',
        colorBgContainer: '#000000',
        colorText: '#ffffff',
        colorBorder: '#ffffff',
      };
    }

    return baseTheme;
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    focusElement,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <Helmet>
        <style>
          {`
            /* Screen reader only content */
            .sr-only {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }

            /* High contrast mode */
            .high-contrast {
              --ant-color-bg-base: #000000;
              --ant-color-text-base: #ffffff;
              --ant-color-border: #ffffff;
            }

            .high-contrast * {
              background-color: var(--ant-color-bg-base) !important;
              color: var(--ant-color-text-base) !important;
              border-color: var(--ant-color-border) !important;
            }

            .high-contrast button {
              background-color: #0066cc !important;
              color: #ffffff !important;
              border: 2px solid #ffffff !important;
            }

            .high-contrast button:hover {
              background-color: #0088ff !important;
            }

            /* Reduced motion */
            .reduced-motion * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }

            /* Enhanced focus indicators */
            .enhanced-focus *:focus {
              outline: 3px solid #0066cc !important;
              outline-offset: 2px !important;
              box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3) !important;
            }

            /* Keyboard navigation */
            .keyboard-navigation *:focus-visible {
              outline: 3px solid #0066cc;
              outline-offset: 2px;
            }

            /* Color blind filters */
            .colorblind-protanopia {
              filter: url('#protanopia-filter');
            }

            .colorblind-deuteranopia {
              filter: url('#deuteranopia-filter');
            }

            .colorblind-tritanopia {
              filter: url('#tritanopia-filter');
            }

            /* Skip links */
            .skip-link {
              position: absolute;
              top: -40px;
              left: 6px;
              background: #0066cc;
              color: white;
              padding: 8px;
              text-decoration: none;
              border-radius: 4px;
              z-index: 10000;
            }

            .skip-link:focus {
              top: 6px;
            }

            /* Improved button accessibility */
            button[aria-expanded="true"]::after {
              content: " (expanded)";
            }

            button[aria-expanded="false"]::after {
              content: " (collapsed)";
            }

            /* Loading states */
            [aria-busy="true"] {
              cursor: wait;
            }

            /* Error states */
            [aria-invalid="true"] {
              border-color: #cc0000 !important;
              box-shadow: 0 0 0 2px rgba(204, 0, 0, 0.2) !important;
            }
          `}
        </style>

        {/* Color blind SVG filters */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="protanopia-filter">
              <feColorMatrix
                values="0.567, 0.433, 0,     0, 0
                                   0.558, 0.442, 0,     0, 0
                                   0,     0.242, 0.758, 0, 0
                                   0,     0,     0,     1, 0"
              />
            </filter>
            <filter id="deuteranopia-filter">
              <feColorMatrix
                values="0.625, 0.375, 0,   0, 0
                                   0.7,   0.3,   0,   0, 0
                                   0,     0.3,   0.7, 0, 0
                                   0,     0,     0,   1, 0"
              />
            </filter>
            <filter id="tritanopia-filter">
              <feColorMatrix
                values="0.95, 0.05,  0,     0, 0
                                   0,    0.433, 0.567, 0, 0
                                   0,    0.475, 0.525, 0, 0
                                   0,    0,     0,     1, 0"
              />
            </filter>
          </defs>
        </svg>
      </Helmet>

      <ConfigProvider theme={getThemeConfig()}>
        <App>
          {/* Skip navigation link */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

          {children}
        </App>
      </ConfigProvider>
    </AccessibilityContext.Provider>
  );
};

// Accessibility Settings Panel Component
export const AccessibilitySettings: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { settings, updateSettings } = useAccessibility();

  return (
    <div>
      {/* This would be implemented as a settings panel */}
      {/* For brevity, showing the structure */}
    </div>
  );
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const { settings } = useAccessibility();

  useEffect(() => {
    if (!settings.keyboardNavigation) { return; }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Implement keyboard shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            document.querySelector<HTMLElement>('.main-navigation')?.focus();
            break;
          case '2':
            event.preventDefault();
            document.querySelector<HTMLElement>('#main-content')?.focus();
            break;
          case '3':
            event.preventDefault();
            document.querySelector<HTMLElement>('.sidebar')?.focus();
            break;
        }
      }

      // Escape key handling
      if (event.key === 'Escape') {
        const activeModal = document.querySelector('.ant-modal');
        if (activeModal) {
          const closeButton = activeModal.querySelector<HTMLElement>('.ant-modal-close');
          closeButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation]);
};

// Hook for screen reader announcements
export const useScreenReaderAnnouncements = () => {
  const { announceToScreenReader } = useAccessibility();

  const announceNavigation = (pageName: string) => {
    announceToScreenReader(`Navigated to ${pageName} page`);
  };

  const announceAction = (action: string) => {
    announceToScreenReader(`${action} completed`);
  };

  const announceError = (error: string) => {
    announceToScreenReader(`Error: ${error}`, 'assertive');
  };

  const announceSuccess = (message: string) => {
    announceToScreenReader(`Success: ${message}`);
  };

  return {
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
  };
};
