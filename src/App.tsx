/**
 * App Root Component
 * Sets up routing and auth initialization
 * Router only renders after auth state is determined to prevent flash
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore, useIsInitialized } from '@/auth';
import { LoadingOverlay } from '@/components/ui/spinner';
import { router } from '@/router';

function App() {
  const isInitialized = useIsInitialized();
  const initialize = useAuthStore((state) => state.initialize);
  
  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Don't render router until auth state is determined
  // This prevents any flash of wrong page
  if (!isInitialized) {
    return <LoadingOverlay message="Loading..." />;
  }
  
  return <RouterProvider router={router} />;
}

export default App;
