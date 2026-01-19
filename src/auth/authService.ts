/**
 * Authentication API service
 * Handles all auth-related API calls
 */

import { api, tokenManager, ApiException } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

interface AuthResponse {
  status: string;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RegisterResponse {
  status: string;
  message: string;
  user: User;
}

interface RefreshResponse {
  status: string;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens
    tokenManager.setTokens(response.accessToken, response.refreshToken);
    
    return response.user;
  },
  
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.user;
  },
  
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },
  
  /**
   * Refresh the access token using stored refresh token
   */
  async refreshToken(): Promise<boolean> {
    const currentRefreshToken = tokenManager.getRefreshToken();
    
    if (!currentRefreshToken) {
      return false;
    }
    
    try {
      const response = await api.post<RefreshResponse>('/auth/refresh', {
        refreshToken: currentRefreshToken,
      });
      
      tokenManager.setTokens(response.accessToken, response.refreshToken);
      return true;
    } catch {
      tokenManager.clearTokens();
      return false;
    }
  },
  
  /**
   * Logout - revoke refresh token on server and clear local tokens
   */
  async logout(): Promise<void> {
    const currentRefreshToken = tokenManager.getRefreshToken();
    
    // Clear tokens immediately for instant UI feedback
    tokenManager.clearTokens();
    
    // Attempt to revoke on server (fire and forget)
    if (currentRefreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken: currentRefreshToken });
      } catch {
        // Ignore errors - tokens are already cleared locally
      }
    }
  },
  
  /**
   * Try to restore session from persisted refresh token
   */
  async restoreSession(): Promise<User | null> {
    // Load refresh token from localStorage
    const refreshToken = tokenManager.loadPersistedToken();
    
    if (!refreshToken) {
      return null;
    }
    
    try {
      // Get new access token
      const refreshed = await this.refreshToken();
      
      if (!refreshed) {
        return null;
      }
      
      // Fetch user profile
      return await this.getCurrentUser();
    } catch (error) {
      // Session restoration failed
      tokenManager.clearTokens();
      
      if (error instanceof ApiException && error.status === 401) {
        return null;
      }
      
      throw error;
    }
  },
};

export default authService;
