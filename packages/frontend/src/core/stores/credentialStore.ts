import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CredentialApiService } from '@/core/api/CredentialApiService';
import type { Credential, CredentialTypeDefinition } from '@/core/schemas';

const credentialApiService = new CredentialApiService();

interface CredentialState {
  credentials: Credential[];
  credentialTypes: CredentialTypeDefinition[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCredentials: () => Promise<void>;
  fetchCredentialTypes: () => Promise<void>;
  createCredential: (
    credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateCredential: (id: string, updates: Partial<Credential>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  testCredential: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useCredentialStore = create<CredentialState>()(
  persist(
    (set, get) => ({
      credentials: [],
      credentialTypes: [],
      isLoading: false,
      error: null,

      fetchCredentials: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await credentialApiService.getCredentials();
          set({ credentials: response.data, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch credentials';
          set({ error: message, isLoading: false });
        }
      },

      fetchCredentialTypes: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await credentialApiService.getCredentialTypes();
          set({ credentialTypes: response.data, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch credential types';
          set({ error: message, isLoading: false });
        }
      },

      createCredential: async (credential) => {
        try {
          set({ isLoading: true, error: null });
          const response = await credentialApiService.createCredential(credential);
          const { credentials } = get();
          set({
            credentials: [...credentials, response.data],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create credential';
          set({ error: message, isLoading: false });
        }
      },

      updateCredential: async (id, updates) => {
        try {
          set({ isLoading: true, error: null });
          const response = await credentialApiService.updateCredential(id, updates);
          const { credentials } = get();
          set({
            credentials: credentials.map((cred) => (cred.id === id ? response.data : cred)),
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update credential';
          set({ error: message, isLoading: false });
        }
      },

      deleteCredential: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await credentialApiService.deleteCredential(id);
          const { credentials } = get();
          set({
            credentials: credentials.filter((cred) => cred.id !== id),
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete credential';
          set({ error: message, isLoading: false });
        }
      },

      testCredential: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const response = await credentialApiService.testCredential(id);
          set({ isLoading: false });
          return response.data.success;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to test credential';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'credential-store',
      partialize: (state) => ({
        credentials: state.credentials,
        credentialTypes: state.credentialTypes,
      }),
    }
  )
);
