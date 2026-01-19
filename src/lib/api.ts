/**
 * API Client with JWT authentication support
 * Handles token injection, 401 interception, and automatic token refresh
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token storage - kept in memory for security, with optional localStorage persistence
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Refresh state to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiException extends Error {
  status: number;
  errors?: Record<string, string[]>;
  
  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.errors = errors;
  }
}

// Token management functions
export const tokenManager = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  
  setTokens: (access: string, refresh: string, persist = true) => {
    accessToken = access;
    refreshToken = refresh;
    
    if (persist) {
      try {
        // Only store refresh token in localStorage for persistence across sessions
        // Access token stays in memory only for security
        localStorage.setItem('refreshToken', refresh);
      } catch {
        // localStorage might be unavailable (private browsing, etc.)
        console.warn('Could not persist refresh token');
      }
    }
  },
  
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
    try {
      localStorage.removeItem('refreshToken');
    } catch {
      // Ignore localStorage errors
    }
  },
  
  loadPersistedToken: (): string | null => {
    try {
      const token = localStorage.getItem('refreshToken');
      if (token) {
        refreshToken = token;
      }
      return token;
    } catch {
      return null;
    }
  },
  
  hasTokens: () => Boolean(accessToken || refreshToken),
};

// Attempt to refresh the access token
async function refreshAccessToken(): Promise<boolean> {
  const currentRefreshToken = refreshToken;
  
  if (!currentRefreshToken) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });
    
    if (!response.ok) {
      tokenManager.clearTokens();
      return false;
    }
    
    const data = await response.json();
    tokenManager.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    tokenManager.clearTokens();
    return false;
  }
}

// Coordinated refresh - ensures only one refresh happens at a time
async function coordinatedRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  
  return refreshPromise;
}

// Main API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if we have an access token
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 - attempt token refresh and retry
  if (response.status === 401 && retry && refreshToken) {
    const refreshed = await coordinatedRefresh();
    
    if (refreshed) {
      // Retry the original request with new token
      return apiRequest<T>(endpoint, options, false);
    }
    
    // Refresh failed - clear tokens and throw
    tokenManager.clearTokens();
    throw new ApiException(401, 'Session expired. Please login again.');
  }
  
  // Parse response
  let data: T;
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = (await response.text()) as unknown as T;
  }
  
  if (!response.ok) {
    const errorData = data as unknown as { message?: string; errors?: Record<string, string[]> };
    throw new ApiException(
      response.status,
      errorData.message || `Request failed with status ${response.status}`,
      errorData.errors
    );
  }
  
  return data;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
