/**
 * Auth initialization provider
 * Initializes auth state on app mount
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  
  useEffect(() => {
    // Initialize auth state on mount
    // This attempts to restore session from persisted refresh token
    initialize();
  }, [initialize]);
  
  return <>{children}</>;
}

export default AuthProvider;
