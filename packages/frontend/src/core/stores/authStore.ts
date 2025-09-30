import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthApiService } from '@/core/api/AuthApiService';
import type {
  LoginCredentials,
  RegisterRequest as RegisterData,
  UserProfile as User,
} from '@/core/schemas';

const authApiService = new AuthApiService();

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  updateProfile: (
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>
  ) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const authResponse = await authApiService.login(credentials);
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const authResponse = await authApiService.register(userData);
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApiService.logout();
        } catch (_error) {
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      getCurrentUser: async () => {
        if (!authApiService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const user = await authApiService.getProfile();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Only clear auth state if the error is authentication-related
          // Don't clear if it's a network error or temporary issue
          if (error.status === 401 || error.code === 'TOKEN_REFRESH_ERROR') {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message || 'Failed to get user profile',
            });
            // Clear invalid token
            authApiService.clearAuthData();
          } else {
            // For other errors (network, server), keep the user logged in
            set({
              isLoading: false,
              error: error.message || 'Failed to get user profile',
            });
          }
        }
      },

      updateProfile: async (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>) => {
        if (!get().user) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authApiService.updateProfile(updates);
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Profile update failed',
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApiService.changePassword({ currentPassword, newPassword });
          set({
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Password change failed',
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
