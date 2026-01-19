/**
 * Route protection components
 * ProtectedRoute - requires authentication
 * PublicOnlyRoute - only accessible when not authenticated (login, register)
 * AuthRedirect - redirects based on auth state after initialization
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth';
import { LoadingOverlay } from '@/components/ui/spinner';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute
 * Redirects to /login if user is not authenticated
 * Shows loading state during auth initialization
 */
export function ProtectedRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const location = useLocation();
  
  // Still initializing - show loading
  if (!isInitialized || isLoading) {
    return <LoadingOverlay message="Checking authentication..." />;
  }
  
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Authenticated - render children
  return <>{children}</>;
}

/**
 * PublicOnlyRoute
 * Redirects authenticated users away from public pages (login, register)
 * Shows loading state during auth initialization
 */
export function PublicOnlyRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  
  // Still initializing - show loading
  if (!isInitialized || isLoading) {
    return <LoadingOverlay message="Loading..." />;
  }
  
  // Already authenticated - redirect to journal
  if (isAuthenticated) {
    return <Navigate to="/journal" replace />;
  }
  
  // Not authenticated - render children (login/register pages)
  return <>{children}</>;
}

/**
 * AuthRedirect
 * Redirects to appropriate page based on auth state
 * Used for root path and catch-all routes to prevent flash of wrong page
 */
export function AuthRedirect() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  
  // Still initializing - show loading (prevents flash of login page)
  if (!isInitialized || isLoading) {
    return <LoadingOverlay message="Loading..." />;
  }
  
  // Redirect based on auth state
  return <Navigate to={isAuthenticated ? '/journal' : '/login'} replace />;
}
