/**
 * Design System Themes
 * Theme definitions for different node types and contexts
 */

// Re-export theme manager and hook from app/node-extensions
export {
  darkTheme,
  defaultTheme,
  ThemeManager,
  themeManager,
  useNodeTheme,
} from '../../app/node-extensions/themes';
export { default as gmailTheme } from './gmailTheme';

// TODO: Move other theme files here as they are identified
