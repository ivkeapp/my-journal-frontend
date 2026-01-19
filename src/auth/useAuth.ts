/**
 * useAuth hook - primary interface for auth in components
 * Provides a clean API abstracting store details
 */

import { useCallback } from 'react';
import { useAuthStore, useUser, useAuthStatus, useAuthError, useIsAuthenticated, useIsAuthLoading, useIsInitialized } from './authStore';
import type { LoginCredentials, RegisterData } from './authService';

export function useAuth() {
  const user = useUser();
  const status = useAuthStatus();
  const error = useAuthError();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsAuthLoading();
  const isInitialized = useIsInitialized();
  
  const store = useAuthStore();
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    await store.login(credentials);
  }, [store]);
  
  const register = useCallback(async (data: RegisterData) => {
    await store.register(data);
  }, [store]);
  
  const logout = useCallback(async () => {
    await store.logout();
  }, [store]);
  
  const clearError = useCallback(() => {
    store.clearError();
  }, [store]);
  
  return {
    // State
    user,
    status,
    error,
    isAuthenticated,
    isLoading,
    isInitialized,
    
    // Actions
    login,
    register,
    logout,
    clearError,
  };
}

export default useAuth;
