// Node Extensions Initialization
// Initialize component factory and registry for node UI extensions

export * from './ComponentFactory';
export * from './nodeUiRegistry';
export * from './types';

// Auto-initialize the component factory when this module is imported
import './ComponentFactory';
import './nodeUiRegistry';