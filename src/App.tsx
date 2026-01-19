/**
 * App Root Component
 * Sets up routing, auth initialization, and global providers
 * Router only renders after auth state is determined to prevent flash
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore, useIsInitialized } from '@/auth';
import { LoadingOverlay } from '@/components/ui/spinner';
import { router } from '@/router';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
  
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
