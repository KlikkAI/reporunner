/**
 * Main entry point for node registration
 * This file imports all node definitions and registers them with the NodeRegistry
 *
 * 🎯 100% Registry Migration Complete
 * All 17 node types now registered in the lean n8n-inspired architecture
 */

import './definitions' // Auto-registers all node types

// Export registry and types for use in other parts of the application
export { nodeRegistry } from './registry'
export * from './types'
export * from './definitions'
