/**
 * Application Router Configuration
 * Sets up all routes with proper authentication guards
 */

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, AuthRedirect } from '@/components/RouteGuards';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import JournalPage from '@/pages/JournalPage';

export const router = createBrowserRouter([
  // Public routes (redirect to /journal if already authenticated)
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  
  // Protected routes (redirect to /login if not authenticated)
  {
    path: '/journal',
    element: (
      <ProtectedRoute>
        <JournalPage />
      </ProtectedRoute>
    ),
  },
  
  // Root redirect - waits for auth state before redirecting
  {
    path: '/',
    element: <AuthRedirect />,
  },
  
  // Catch-all redirect - waits for auth state before redirecting
  {
    path: '*',
    element: <AuthRedirect />,
  },
]);

export default router;
