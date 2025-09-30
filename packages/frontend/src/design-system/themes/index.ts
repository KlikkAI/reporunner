/**
 * Design System Themes
 * Theme definitions for different node types and contexts
 */

export { default as gmailTheme } from './gmailTheme';

// Re-export theme manager and hook from app/node-extensions
export {
  darkTheme,
  defaultTheme,
  themeManager,
  ThemeManager,
  useNodeTheme,
} from '../../app/node-extensions/themes';

// TODO: Move other theme files here as they are identified
