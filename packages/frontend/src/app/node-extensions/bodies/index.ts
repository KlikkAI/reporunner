/**
 * Specialized Node Body Components
 * Export all specialized node body components
 */

// New specialized components
export { default as DatabaseNodeBody } from './DatabaseNodeBody';

// TransformNodeBody moved to ../custom-nodes/TransformNodeBody.tsx

// Component registration helper
import { registerCustomBodyComponent } from '../nodeUiRegistry';
import DatabaseNodeBody from './DatabaseNodeBody';

/**
 * Register all specialized node body components
 */
export function registerSpecializedComponents(): void {
  // Register new components
  registerCustomBodyComponent('DatabaseNodeBody', DatabaseNodeBody);
}

// Auto-register when imported
registerSpecializedComponents();
