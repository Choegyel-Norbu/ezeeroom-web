import axios from "axios";
import { getStorageItem, setStorageItem, removeStorageItem } from "@/shared/utils/safariLocalStorage";
import { API_BASE_URL } from "./firebaseConfig";
import { toast } from "sonner";
import { shouldUseCrossDomainAuth } from "@/shared/utils/authDetection";
import { 
  getAccessToken, 
  isUsingLocalStorageTokens, 
  clearTokens,
  hasValidTokens
} from "@/shared/utils/tokenStorage";

// Cookie-based authentication utilities
function clearAllCookies() {
  const cookies = document.cookie.split(";");
  
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Clear cookie for current domain
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    
    // Clear cookie for parent domain (if subdomain)
    if (window.location.hostname.includes('.')) {
      const parentDomain = window.location.hostname.substring(window.location.hostname.indexOf('.'));
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`;
    }
  }
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Enable cookies for HTTP-only authentication
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2 minute timeout (120000ms)
});

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/hotels/top-highlights',
  '/hotels/search',
  '/hotels/public',
  '/hotels/nearby',
  '/auth/firebase',
  '/auth/firebase-cross-domain',
  '/auth/status',
  '/auth/logout'
];

// Check if endpoint is public (doesn't require authentication)
const isPublicEndpoint = (url) => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Add request interceptor to handle both auth methods
api.interceptors.request.use(
  (config) => {
    const isPublic = isPublicEndpoint(config.url || '');
    
    // For public endpoints, use standard configuration
    if (isPublic) {
      config.withCredentials = true;
      return config;
    }
    
    // For authenticated endpoints, check auth method
    const usingLocalStorageTokens = isUsingLocalStorageTokens();
    
    if (usingLocalStorageTokens) {
      const accessToken = getAccessToken();
      if (accessToken) {
        config.headers['X-Access-Token'] = accessToken;
      }
      // Don't send cookies for cross-domain requests
      config.withCredentials = false;
    } else {
      // Standard cookie-based auth
      config.withCredentials = true;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (simplified - no token refresh)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle timeout errors with user-friendly message
    const isTimeoutError = error.code === 'ECONNABORTED' || 
                          error.message?.includes('timeout') ||
                          (error.code === undefined && !error.response && error.message?.includes('exceeded'));
    
    if (isTimeoutError) {
      toast.error('Request Timeout', {
        description: 'The request took too long to complete. Please check your internet connection and try again.',
        duration: 8000,
      });
      
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - trigger logout (token was invalidated on backend)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear auth state and redirect to login
      // Use the React-based logout if available; avoid window.location.href
      // which causes a full page reload and can create an infinite redirect loop
      // if the auth state is still invalid after reload.
      if (window.authLogout) {
        window.authLogout();
      } else {
        // Fallback: clear auth data without a full reload to prevent loops
        try { authService.clearAuthData(); } catch (_) { /* silent */ }
      }
      
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    // NOTE: 403 means "authenticated but not authorized" — the session IS valid,
    // the user just lacks permission for this specific resource.
    // We do NOT logout here. Only 401 (invalid/expired session) triggers logout.
    // Individual services/components should handle 403 contextually
    // (e.g., show "access denied", redirect to subscription page, etc.)
    if (error.response?.status === 403) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Authentication helper functions (simplified - no refresh logic)
export const authService = {
  // Clear all authentication data
  clearAuthData() {
    try {
      // Clear localStorage tokens if using cross-domain auth
      if (isUsingLocalStorageTokens()) {
        clearTokens();
      }
      
      // Clear all browser cookies (for cookie-based auth)
      clearAllCookies();
      
      // Clear sessionStorage
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      } catch (sessionError) {
        // Silent fail
      }
      
      // Clear any legacy refresh tracking keys
      removeStorageItem('lastTokenRefresh');
      removeStorageItem('lastAuthCheck');
      
    } catch (error) {
      // Silent fail
    }
  },

  // Logout function
  async logout() {
    try {
      // Call backend logout endpoint to invalidate token
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear all authentication data
      this.clearAuthData();
    }
  },

  // Get authentication method (for compatibility)
  getAuthMethod() {
    if (isUsingLocalStorageTokens()) {
      return "LOCALSTORAGE_TOKENS_WITH_HEADERS";
    }
    return "COOKIE_BASED";
  },

  // Check if user has valid authentication
  isAuthenticated() {
    if (isUsingLocalStorageTokens()) {
      return hasValidTokens();
    }
    // For cookie-based auth, we can't check directly - rely on server validation
    return true;
  }
};

// Make logout function available globally for interceptor
window.authLogout = () => {
  // This will be set by the AuthProvider
};

export default api;
