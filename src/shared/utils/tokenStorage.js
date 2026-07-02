/**
 * Token Storage Utilities for Cross-Domain Auth
 * Handles localStorage token management for iOS Safari
 * 
 * SIMPLIFIED: Backend now provides a single token with no expiration.
 * Token is only invalidated when user manually logs out.
 */

import { getStorageItem, setStorageItem, removeStorageItem } from './safariLocalStorage';

// Token storage keys (simplified - no expiry tracking)
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'yakrooms_access_token',
  TOKEN_TYPE: 'yakrooms_token_type' // 'localStorage' or 'cookie'
};

/**
 * Store token from cross-domain auth response
 * @param {Object} tokenData - Token data from backend
 * @param {string} tokenData.token - The authentication token
 */
export const storeTokens = (tokenData) => {
  try {
    // Store the single token (backend may send as 'token' or 'accessToken' for backward compatibility)
    const token = tokenData.token || tokenData.accessToken;
    if (token) {
      setStorageItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    }
    
    // Mark that we're using localStorage tokens
    setStorageItem(TOKEN_KEYS.TOKEN_TYPE, 'localStorage');
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get stored token
 * No expiry check needed - token is valid until user logs out
 */
export const getAccessToken = () => {
  try {
    return getStorageItem(TOKEN_KEYS.ACCESS_TOKEN) || null;
  } catch (error) {
    return null;
  }
};

/**
 * Get stored refresh token (deprecated - kept for backward compatibility)
 * Backend no longer uses refresh tokens, returns null
 */
export const getRefreshToken = () => {
  return null;
};

/**
 * Check if we have a valid token
 * No expiry check - token is valid until manual logout
 */
export const hasValidTokens = () => {
  const token = getAccessToken();
  return token !== null;
};

/**
 * Check if token needs refresh (deprecated)
 * Backend tokens don't expire, always returns false
 */
export const shouldRefreshToken = () => {
  return false;
};

/**
 * Clear stored token
 */
export const clearTokens = () => {
  try {
    removeStorageItem(TOKEN_KEYS.ACCESS_TOKEN);
    removeStorageItem(TOKEN_KEYS.TOKEN_TYPE);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if we're using localStorage tokens (vs cookies)
 * This checks both stored token type AND current platform detection
 */
export const isUsingLocalStorageTokens = () => {
  const tokenType = getStorageItem(TOKEN_KEYS.TOKEN_TYPE);
  
  // If we have stored token type, use that (most reliable)
  if (tokenType === 'localStorage') {
    return true;
  }
  
  // If we have actual token stored, we're using localStorage
  const hasStoredToken = getStorageItem(TOKEN_KEYS.ACCESS_TOKEN);
  if (hasStoredToken) {
    return true;
  }
  
  // Only for authenticated requests when we don't have stored tokens yet,
  // check current platform detection inline
  try {
    // Inline iOS WebKit detection to avoid circular imports
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Only apply iOS detection if we're on iOS
    if (!isIOS) {
      return false;
    }
    
    // Check if API is cross-domain
    const currentDomain = window.location.hostname;
    const apiDomain = 'ezeeroom-production.up.railway.app'; // Hardcoded to avoid circular import
    
    const getCurrentETLD = (domain) => {
      const parts = domain.split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }
      return domain;
    };
    
    const currentETLD = getCurrentETLD(currentDomain);
    const apiETLD = getCurrentETLD(apiDomain);
    const isCrossDomain = currentETLD !== apiETLD;
    
    return isCrossDomain;
  } catch (error) {
    // Platform detection failed
    return false;
  }
};

/**
 * Update tokens from refresh response (deprecated)
 * Backend no longer uses refresh tokens - this is kept for backward compatibility
 * but simply stores the new token if provided
 */
export const updateTokensFromRefresh = (refreshData) => {
  try {
    const token = refreshData.token || refreshData.accessToken;
    if (token) {
      setStorageItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get token info for debugging
 */
export const getTokenInfo = () => {
  try {
    const accessToken = getStorageItem(TOKEN_KEYS.ACCESS_TOKEN);
    const tokenType = getStorageItem(TOKEN_KEYS.TOKEN_TYPE);
    
    return {
      hasToken: !!accessToken,
      // Deprecated fields kept for backward compatibility
      hasAccessToken: !!accessToken,
      hasRefreshToken: false,
      accessTokenExpiry: null,
      refreshTokenExpiry: null,
      accessTokenExpired: false,
      refreshTokenExpired: false,
      tokenType,
      isUsingLocalStorage: tokenType === 'localStorage'
    };
  } catch (error) {
    return null;
  }
};
