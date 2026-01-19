/**
 * Authentication state store using Zustand
 * Manages user state, authentication status, and provides actions
 */

import { create } from 'zustand';
import { authService } from './authService';
import type { User, LoginCredentials, RegisterData } from './authService';
import { ApiException } from '@/lib/api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  // State
  user: User | null;
  status: AuthStatus;
  error: string | null;
  isInitialized: boolean;
  
  // Computed
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  status: 'idle',
  error: null,
  isInitialized: false,
  
  // Computed getters (these update reactively based on status)
  get isAuthenticated() {
    return get().status === 'authenticated';
  },
  get isLoading() {
    return get().status === 'loading';
  },
  
  // Actions
  login: async (credentials: LoginCredentials) => {
    set({ status: 'loading', error: null });
    
    try {
      const user = await authService.login(credentials);
      set({ 
        user, 
        status: 'authenticated', 
        error: null 
      });
    } catch (error) {
      const message = error instanceof ApiException 
        ? error.message 
        : 'Login failed. Please try again.';
      
      set({ 
        user: null, 
        status: 'unauthenticated', 
        error: message 
      });
      
      throw error;
    }
  },
  
  register: async (data: RegisterData) => {
    set({ status: 'loading', error: null });
    
    try {
      await authService.register(data);
      // After successful registration, don't auto-login
      // Let user login manually for better security UX
      set({ 
        status: 'unauthenticated', 
        error: null 
      });
    } catch (error) {
      const message = error instanceof ApiException 
        ? error.message 
        : 'Registration failed. Please try again.';
      
      set({ 
        status: 'unauthenticated', 
        error: message 
      });
      
      throw error;
    }
  },
  
  logout: async () => {
    set({ status: 'loading' });
    
    try {
      await authService.logout();
    } finally {
      // Always clear state, even if server logout fails
      set({ 
        user: null, 
        status: 'unauthenticated', 
        error: null 
      });
    }
  },
  
  initialize: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }
    
    set({ status: 'loading' });
    
    try {
      const user = await authService.restoreSession();
      
      if (user) {
        set({ 
          user, 
          status: 'authenticated', 
          isInitialized: true 
        });
      } else {
        set({ 
          user: null, 
          status: 'unauthenticated', 
          isInitialized: true 
        });
      }
    } catch {
      set({ 
        user: null, 
        status: 'unauthenticated', 
        isInitialized: true 
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
}));

// Selector hooks for better performance (only re-render when specific value changes)
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => state.status === 'authenticated');
export const useIsAuthLoading = () => useAuthStore((state) => state.status === 'loading');
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized);

export default useAuthStore;
