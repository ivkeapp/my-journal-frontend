/**
 * Application Router Configuration
 * Sets up all routes with proper authentication guards
 */

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, AuthRedirect } from '@/components/RouteGuards';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { JournalListPage, DraftsPage, JournalEditorPage } from '@/features/journal';

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
        <JournalListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/journal/new',
    element: (
      <ProtectedRoute>
        <JournalEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/journal/:id',
    element: (
      <ProtectedRoute>
        <JournalEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/drafts',
    element: (
      <ProtectedRoute>
        <DraftsPage />
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
