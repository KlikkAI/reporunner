import { create } from 'zustand';
import { CredentialApiService } from '@/core/api/CredentialApiService';
import type {
  Credential,
  CredentialTestResult,
  CredentialType,
  CredentialTypeDefinition,
} from '@/core/schemas';

const credentialApiService = new CredentialApiService();

interface CredentialState {
  credentials: Credential[];
  isLoading: boolean;
  testingCredential: string | null;
  credentialTypes: CredentialTypeDefinition[];

  // Actions
  loadCredentials: () => Promise<void>;
  createCredential: (name: string, type: string, data: Record<string, unknown>) => Promise<string>;
  addCredential: (credential: any) => void;
  updateCredential: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  revokeGmailCredential: (id: string) => Promise<void>;
  testCredential: (id: string) => Promise<CredentialTestResult>;
  loadCredentialTypes: () => Promise<void>;
  getCredentialsOfType: (type: string) => Credential[];
  getCredentialsByTypes: (types: string[]) => Credential[];
  getCredentialById: (id: string) => Credential | undefined;
}

export const useCredentialStore = create<CredentialState>((set, get) => ({
  credentials: [],
  isLoading: false,
  testingCredential: null,
  credentialTypes: [],

  loadCredentials: async () => {
    set({ isLoading: true });
    try {
      const result = await credentialApiService.getCredentials();
      set({ credentials: result.items });
    } catch (error) {
      console.error('Failed to load credentials:', error);
      // Fallback to empty array on error
      set({ credentials: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createCredential: async (name, type, data) => {
    set({ isLoading: true });
    try {
      const credential = await credentialApiService.createCredential({
        type: type as CredentialType,
        name,
        integration: type,
        data,
        testOnCreate: true,
      });
      set((state) => ({
        credentials: [...state.credentials, credential],
      }));
      return credential.id;
    } catch (error) {
      console.error('Failed to create credential:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addCredential: (credential) => {
    const newCredential: Credential = {
      ...credential,
      createdAt: credential.createdAt || new Date().toISOString(),
      updatedAt: credential.updatedAt || new Date().toISOString(),
    };

    set((state) => ({
      credentials: [...state.credentials, newCredential],
    }));
  },

  updateCredential: async (id, data) => {
    set({ isLoading: true });
    try {
      const updatedCredential = await credentialApiService.updateCredential(id, {
        data,
      });
      set((state) => ({
        credentials: state.credentials.map((cred) => (cred.id === id ? updatedCredential : cred)),
      }));
    } catch (error) {
      console.error('Failed to update credential:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCredential: async (id) => {
    set({ isLoading: true });
    try {
      await credentialApiService.deleteCredential(id);
      set((state) => ({
        credentials: state.credentials.filter((cred) => cred.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete credential:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  revokeGmailCredential: async (id) => {
    set({ isLoading: true });
    try {
      const result = await credentialApiService.revokeOAuth2(id);
      if (result.message) {
        set((state) => ({
          credentials: state.credentials.filter((cred) => cred.id !== id),
        }));
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to revoke Gmail credential:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  testCredential: async (id) => {
    const credential = get().credentials.find((c) => c.id === id);
    if (!credential) {
      return {
        success: false,
        message: 'Credential not found',
        testedAt: new Date().toISOString(),
      };
    }

    set({ testingCredential: id });
    try {
      const result = await credentialApiService.testCredential(id);

      // Update credential with test result
      set((state) => ({
        credentials: state.credentials.map((cred) =>
          cred.id === id
            ? {
                ...cred,
                testedAt: new Date().toISOString(),
                isValid: result.success,
              }
            : cred
        ),
      }));

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Test failed due to network error',
        testedAt: new Date().toISOString(),
      };
    } finally {
      set({ testingCredential: null });
    }
  },

  loadCredentialTypes: async () => {
    set({ isLoading: true });
    try {
      const types = await credentialApiService.getCredentialTypes();
      set({ credentialTypes: types as any });
    } catch (error) {
      console.error('Failed to load credential types:', error);
      set({ credentialTypes: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  getCredentialsOfType: (type) => {
    return get().credentials.filter((cred) => cred.type === type);
  },

  getCredentialsByTypes: (types: string[]) => {
    return get().credentials.filter((cred) => types.includes(cred.type));
  },

  getCredentialById: (id: string) => {
    return get().credentials.find((cred) => cred.id === id);
  },
}));
