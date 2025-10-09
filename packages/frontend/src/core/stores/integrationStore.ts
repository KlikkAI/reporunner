import { create } from 'zustand';
import { integrationService } from '@/app/services/integrationService';
import { nodeRegistry } from '@/core';
import { config } from '../config/environment';
import type { Integration } from '../types/integration';

interface IntegrationState {
  integrations: Integration[];
  connectedIntegrations: Integration[];
  isLoading: boolean;

  loadIntegrations: () => Promise<void>;
  connectIntegration: (id: string, config: Record<string, unknown>) => Promise<void>;
  disconnectIntegration: (id: string) => Promise<void>;
}

export const useIntegrationStore = create<IntegrationState>((set) => ({
  integrations: [],
  connectedIntegrations: [],
  isLoading: false,

  loadIntegrations: async () => {
    // Pure Registry System: Check if integrations already loaded to prevent unnecessary calls
    const currentState = useIntegrationStore.getState();
    if (currentState.integrations.length > 0) {
      return;
    }

    set({ isLoading: true });
    try {
      // Load integrations from the main node registry
      // For now, create mock integrations based on registered node types
      const nodeTypes = nodeRegistry.getAllNodeTypeDescriptions();
      const allIntegrations: Integration[] = nodeTypes.map((nodeType) => ({
        id: nodeType.name,
        name: nodeType.displayName,
        description: nodeType.description,
        icon: nodeType.icon || '⚡',
        category: nodeType.categories?.[0] || 'Business & Productivity',
        version: 1.0,
        status: 'available',
        nodeTypes: [
          {
            id: nodeType.name,
            name: nodeType.displayName,
            description: nodeType.description,
            type: 'action',
          },
        ],
      }));

      // Real API call to get connection status
      try {
        const connectionStatuses: any = {}; // Placeholder - would need API support for batch status

        const integrationsWithStatus = allIntegrations.map((integration: Integration) => ({
          ...integration,
          isConnected: (connectionStatuses as any)[integration.id]?.connected,
          connectionConfig: (connectionStatuses as any)[integration.id]?.config,
        }));

        set({
          integrations: integrationsWithStatus,
          connectedIntegrations: integrationsWithStatus.filter((i: any) => i.isConnected),
        });
      } catch (error: any) {
        // Handle 404 errors gracefully - endpoint might not exist yet
        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        } else {
        }
        // Fallback to local integrations without connection status
        set({
          integrations: allIntegrations,
          connectedIntegrations: [],
        });
      }
    } catch (_error) {
      set({ integrations: [], connectedIntegrations: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  connectIntegration: async (id, integrationConfig) => {
    set({ isLoading: true });
    try {
      // Real API call to connect integration
      await integrationService.connectIntegration(id, integrationConfig);

      set((state) => {
        const updatedIntegrations = state.integrations.map((i) =>
          i.id === id ? { ...i, isConnected: true, connectionConfig: integrationConfig } : i
        );

        return {
          integrations: updatedIntegrations,
          connectedIntegrations: updatedIntegrations.filter((i) => i.isConnected),
        };
      });
    } finally {
      set({ isLoading: false });
    }
  },

  disconnectIntegration: async (id) => {
    set({ isLoading: true });
    try {
      // Real API call to disconnect integration
      await integrationService.disconnectIntegration(id);

      set((state) => {
        const updatedIntegrations = state.integrations.map((i) =>
          i.id === id ? { ...i, isConnected: false, connectionConfig: undefined } : i
        );

        return {
          integrations: updatedIntegrations,
          connectedIntegrations: updatedIntegrations.filter((i) => i.isConnected),
        };
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
