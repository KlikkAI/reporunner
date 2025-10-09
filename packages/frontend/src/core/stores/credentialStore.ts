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
  testingCredential: string | null;

  // Actions
  fetchCredentials: () => Promise<void>;
  loadCredentials: () => Promise<void>; // Alias for fetchCredentials (backward compatibility)
  fetchCredentialTypes: () => Promise<void>;
  loadCredentialTypes: () => Promise<void>; // Alias for fetchCredentialTypes (backward compatibility)
  createCredential: (
    credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateCredential: (id: string, updates: Partial<Credential>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  testCredential: (id: string) => Promise<boolean>;
  revokeGmailCredential: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCredentialStore = create<CredentialState>()(
  persist(
    (set, get) => ({
      credentials: [],
      credentialTypes: [],
      isLoading: false,
      error: null,
      testingCredential: null,

      fetchCredentials: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await credentialApiService.getCredentials();
          set({ credentials: response.items, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch credentials';
          set({ error: message, isLoading: false });
        }
      },

      loadCredentials: async () => {
        const { fetchCredentials } = get();
        await fetchCredentials();
      },

      fetchCredentialTypes: async () => {
        try {
          set({ isLoading: true, error: null });
          const credentialTypes: any = await credentialApiService.getCredentialTypes();
          set({ credentialTypes, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch credential types';
          set({ error: message, isLoading: false });
        }
      },

      loadCredentialTypes: async () => {
        const { fetchCredentialTypes } = get();
        await fetchCredentialTypes();
      },

      createCredential: async (credential) => {
        try {
          set({ isLoading: true, error: null });
          const newCredential = await credentialApiService.createCredential({
            ...credential,
            testOnCreate: false, // Add required field with default value
          } as any);
          const { credentials } = get();
          set({
            credentials: [...credentials, newCredential],
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
          const updatedCredential = await credentialApiService.updateCredential(id, updates as any);
          const { credentials } = get();
          set({
            credentials: credentials.map((cred) => (cred.id === id ? updatedCredential : cred)),
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
          set({ isLoading: true, error: null, testingCredential: id });
          const result = await credentialApiService.testCredential(id);
          set({ isLoading: false, testingCredential: null });
          return result.success;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to test credential';
          set({ error: message, isLoading: false, testingCredential: null });
          return false;
        }
      },

      revokeGmailCredential: async (id) => {
        try {
          set({ isLoading: true, error: null });
          // For Gmail credentials, we need to call a special revoke endpoint
          await credentialApiService.deleteCredential(id);
          const { credentials } = get();
          set({
            credentials: credentials.filter((cred) => cred.id !== id),
            isLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to revoke Gmail credential';
          set({ error: message, isLoading: false });
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
