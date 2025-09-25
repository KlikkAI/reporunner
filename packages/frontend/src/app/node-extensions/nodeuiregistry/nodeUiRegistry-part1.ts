/**
 * Enhanced Node UI Registry
 * Integrates with ComponentFactory for advanced component management and lazy loading
 */

import type { ComponentType } from 'react';
import { GmailPropertiesPanel } from '../../design-system/components/nodes/GmailNode';
import AIAgentNodeBody from './AIAgentNodeBody';
import { componentFactory } from './ComponentFactory';
import ConditionNodeBody from './ConditionNodeBody';
import GmailNodeBody from './custom-nodes/GmailNodeBody';

// Re-export types from the main types file
export type {
  CustomHandle,
  CustomNodeBodyProps,
  CustomPropertiesPanelProps,
  EnhancedNodeTypeDescription,
  NodeBadge,
  NodeTheme,
  NodeVisualConfig,
  ToolbarAction,
} from './types';

// Enhanced Registry Implementation
class NodeUIRegistry {
  private initialized = false;

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initializeComponents();
      this.initialized = true;
    }
  }

  private initializeComponents(): void {
    componentFactory.registerBodyComponent('AIAgentNodeBody', AIAgentNodeBody);
    componentFactory.registerBodyComponent('ConditionNodeBody', ConditionNodeBody);

    try {
      // Register our custom Gmail node body that matches old UI
      componentFactory.registerBodyComponent('GmailNodeBody', GmailNodeBody);

      // Keep the original for backward compatibility if needed
      componentFactory.registerBodyComponent('GmailTriggerNodeBody', GmailNodeBody);

      componentFactory.registerPropertiesPanel('GmailPropertiesPanel', GmailPropertiesPanel);

      // Verify registration immediately
      const _gmailBodyComponent = componentFactory.createNodeBody('GmailTriggerNodeBody');
      const _gmailPropertiesPanel = componentFactory.createPropertiesPanel('GmailPropertiesPanel');
    } catch (_error) {}

    // Register other specialized components with lazy loading
    componentFactory.registerLazyBodyComponent(
      'DatabaseNodeBody',
      () => import('./bodies/DatabaseNodeBody')
    );

    componentFactory.registerLazyPropertiesPanel(
      'AIAgentPropertiesPanel',
      () => import('./panels/AIAgentPropertiesPanel')
    );
  }

  // ============================================================================
  // Primary Interface Methods
  // ============================================================================

  getCustomBodyComponent(componentName?: string): ComponentType<any> | null | undefined {
    this.ensureInitialized(); // Ensure components are registered before lookup

    if (!componentName) return undefined;
    const component = componentFactory.createNodeBody(componentName);

    // Additional debug logging for Gmail specifically
    if (componentName === 'GmailTriggerNodeBody') {
    }

    return component;
  }

  getCustomPropertiesPanel(componentName?: string): ComponentType<any> | null | undefined {
    this.ensureInitialized(); // Ensure components are registered before lookup

    if (!componentName) return undefined;
    return componentFactory.createPropertiesPanel(componentName);
  }

  registerCustomBodyComponent(name: string, component: ComponentType<any>): void {
    componentFactory.registerBodyComponent(name, component);
  }

  registerCustomPropertiesPanel(name: string, component: ComponentType<any>): void {
    componentFactory.registerPropertiesPanel(name, component);
  }

// ============================================================================
// Advanced Methods
// ============================================================================
