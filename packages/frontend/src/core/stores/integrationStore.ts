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
      console.log('Integrations already loaded, skipping API calls');
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

      if (config.features.enableMockData) {
        // Add some mock connected integrations for testing
        const integrationsWithMockConnections = allIntegrations.map((integration: Integration) => {
          // Connect a few popular integrations by default for demo purposes
          if (['slack', 'gmail', 'google-drive', 'github', 'trello'].includes(integration.id)) {
            return { ...integration, isConnected: true };
          }
          return integration;
        });

        set({
          integrations: integrationsWithMockConnections,
          connectedIntegrations: integrationsWithMockConnections.filter((i: any) => i.isConnected),
        });
      } else {
        // Real API call to get connection status
        try {
          const connectionStatuses = await integrationService.getIntegrationStatuses();

          const integrationsWithStatus = allIntegrations.map((integration: Integration) => ({
            ...integration,
            isConnected: connectionStatuses[integration.id]?.connected || false,
            connectionConfig: connectionStatuses[integration.id]?.config,
          }));

          set({
            integrations: integrationsWithStatus,
            connectedIntegrations: integrationsWithStatus.filter((i: any) => i.isConnected),
          });
        } catch (error: any) {
          // Handle 404 errors gracefully - endpoint might not exist yet
          if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            console.warn('Integration status endpoint not available (404), using local data');
          } else {
            console.warn('Failed to load integration statuses, using local data:', error);
          }
          // Fallback to local integrations without connection status
          set({
            integrations: allIntegrations,
            connectedIntegrations: [],
          });
        }
      }

      // Log registry statistics for development
      if (config.features.enableDebug) {
        const stats = {
          totalNodeTypes: nodeRegistry.getAllNodeTypes().length,
          totalCredentialTypes: nodeRegistry.getAllCredentialTypes().length,
        };
        console.log('Node Registry Stats:', stats);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
      set({ integrations: [], connectedIntegrations: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  connectIntegration: async (id, integrationConfig) => {
    set({ isLoading: true });
    try {
      if (config.features.enableMockData) {
        // Mock connection
        console.log('Connecting integration (mock):', id, integrationConfig);
      } else {
        // Real API call to connect integration
        await integrationService.connectIntegration(id, integrationConfig);
      }

      set((state) => {
        const updatedIntegrations = state.integrations.map((i) =>
          i.id === id ? { ...i, isConnected: true, connectionConfig: integrationConfig } : i
        );

        return {
          integrations: updatedIntegrations,
          connectedIntegrations: updatedIntegrations.filter((i) => i.isConnected),
        };
      });
    } catch (error) {
      console.error('Failed to connect integration:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  disconnectIntegration: async (id) => {
    set({ isLoading: true });
    try {
      if (config.features.enableMockData) {
        // Mock disconnection
        console.log('Disconnecting integration (mock):', id);
      } else {
        // Real API call to disconnect integration
        await integrationService.disconnectIntegration(id);
      }

      set((state) => {
        const updatedIntegrations = state.integrations.map((i) =>
          i.id === id ? { ...i, isConnected: false, connectionConfig: undefined } : i
        );

        return {
          integrations: updatedIntegrations,
          connectedIntegrations: updatedIntegrations.filter((i) => i.isConnected),
        };
      });
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
