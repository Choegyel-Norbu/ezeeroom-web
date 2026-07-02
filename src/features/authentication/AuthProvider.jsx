import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  getAuthData,
  setAuthData,
  clearAuthData
} from "@/shared/utils/safariLocalStorage";
import api, { authService } from "@/shared/services/Api";
import axios from "axios";
import { API_BASE_URL } from "@/shared/services/firebaseConfig";
import subscriptionService from "@/shared/services/subscriptionService";
import { hasValidTokens, clearTokens, isUsingLocalStorageTokens } from "@/shared/utils/tokenStorage";

// === Constants ===
const AUTH_STORAGE_KEYS = {
  USER_ID: 'userId',
  EMAIL: 'email',
  ROLES: 'roles', 
  ACTIVE_ROLE: 'activeRole',
  USER_NAME: 'userName',
  PICTURE_URL: 'pictureURL',
  REGISTER_FLAG: 'registerFlag',
  CLIENT_DETAIL_SET: 'clientDetailSet',
  HOTEL_ID: 'hotelId',
  HOTEL_IDS: 'hotelIds',
  SELECTED_HOTEL_ID: 'selectedHotelId',
  USER_HOTELS: 'userHotels',
  TOP_HOTEL_IDS: 'topHotelIds',
  REDIRECT_URL: 'redirectUrl',
  LAST_AUTH_CHECK: 'lastAuthCheck',
  SUBSCRIPTION_ID: 'subscriptionId',
  SUBSCRIPTION_PAYMENT_STATUS: 'subscriptionPaymentStatus',
  SUBSCRIPTION_PLAN: 'subscriptionPlan',
  SUBSCRIPTION_IS_ACTIVE: 'subscriptionIsActive',
  SUBSCRIPTION_IS_EXPIRED: 'subscriptionIsExpired',
  SUBSCRIPTION_NEXT_BILLING_DATE: 'subscriptionNextBillingDate',
  SUBSCRIPTION_EXPIRATION_NOTIFICATION: 'subscriptionExpirationNotification',
  SUBSCRIPTION_FETCHED_SESSION: 'subscriptionFetchedSession'
};

// === Utility to generate session identifier ===
const generateSessionId = () => {
  try {
    // Use sessionStorage to get/set session ID (clears when tab closes)
    let sessionId = sessionStorage.getItem('yakrooms_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('yakrooms_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    // Fallback to timestamp-based ID
    return `session_${Date.now()}`;
  }
};

// === Utility to check if subscription was fetched in current session ===
const isSubscriptionFetchedInSession = (userId) => {
  try {
    const sessionId = generateSessionId();
    const fetchedSession = getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_FETCHED_SESSION);
    return fetchedSession === `${userId}_${sessionId}`;
  } catch (error) {
    return false;
  }
};

// === Utility to mark subscription as fetched in current session ===
const markSubscriptionFetchedInSession = (userId) => {
  try {
    const sessionId = generateSessionId();
    setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_FETCHED_SESSION, `${userId}_${sessionId}`);
  } catch (error) {
  }
};

// === Utility to parse roles from storage ===
const parseRolesFromStorage = (rolesString) => {
  try {
    if (!rolesString) return [];
    
    // If it's already an array, return it
    if (Array.isArray(rolesString)) return rolesString;
    
    // If it's a single string (not JSON), wrap it in an array
    if (typeof rolesString === 'string' && !rolesString.startsWith('[')) {
      return [rolesString];
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(rolesString);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    // If parsing fails, try to treat it as a single role string
    if (typeof rolesString === 'string') {
      return [rolesString];
    }
    return [];
  }
};

// === Utility to stringify roles for storage ===
const stringifyRolesForStorage = (roles) => {
  try {
    if (!Array.isArray(roles)) return '[]';
    return JSON.stringify(roles);
  } catch (error) {
    return '[]';
  }
};

// === Utility to parse user hotels from storage ===
const parseUserHotelsFromStorage = (userHotelsString) => {
  try {
    if (!userHotelsString) return [];
    
    // If it's already an array, return it
    if (Array.isArray(userHotelsString)) return userHotelsString;
    
    // Try to parse as JSON
    const parsed = JSON.parse(userHotelsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

// === Utility to stringify user hotels for storage ===
const stringifyUserHotelsForStorage = (userHotels) => {
  try {
    if (!Array.isArray(userHotels)) return '[]';
    return JSON.stringify(userHotels);
  } catch (error) {
    return '[]';
  }
};

// === Utility to parse hotel IDs from storage ===
const parseHotelIdsFromStorage = (hotelIdsString) => {
  try {
    if (!hotelIdsString) return [];
    
    // If it's already an array, return it
    if (Array.isArray(hotelIdsString)) return hotelIdsString;
    
    // If it's a single string (not JSON), wrap it in an array
    if (typeof hotelIdsString === 'string' && !hotelIdsString.startsWith('[')) {
      return [hotelIdsString];
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(hotelIdsString);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    // If parsing fails, try to treat it as a single ID string
    if (typeof hotelIdsString === 'string') {
      return [hotelIdsString];
    }
    return [];
  }
};

// === Utility to stringify hotel IDs for storage ===
const stringifyHotelIdsForStorage = (hotelIds) => {
  try {
    if (!Array.isArray(hotelIds)) return '[]';
    return JSON.stringify(hotelIds);
  } catch (error) {
    return '[]';
  }
};

// === Utility to parse top hotel IDs from storage ===
const parseTopHotelIdsFromStorage = (topHotelIdsString) => {
  try {
    if (!topHotelIdsString) return [];
    
    // If it's already an array, return it
    if (Array.isArray(topHotelIdsString)) return topHotelIdsString;
    
    // If it's a single string (not JSON), wrap it in an array
    if (typeof topHotelIdsString === 'string' && !topHotelIdsString.startsWith('[')) {
      return [topHotelIdsString];
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(topHotelIdsString);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    // If parsing fails, try to treat it as a single ID string
    if (typeof topHotelIdsString === 'string') {
      return [topHotelIdsString];
    }
    return [];
  }
};

// === Utility to stringify top hotel IDs for storage ===
const stringifyTopHotelIdsForStorage = (topHotelIds) => {
  try {
    if (!Array.isArray(topHotelIds)) return '[]';
    return JSON.stringify(topHotelIds);
  } catch (error) {
    return '[]';
  }
};

// === Context Setup ===
const AuthContext = createContext(null);

const defaultAuthState = {
  isAuthenticated: false,
  email: "",
  roles: [],
  activeRole: null,
  clientDetailSet: false,
  userName: "",
  registerFlag: false,
  pictureURL: "",
  userId: "",
  flag: false,
  hotelId: null,
  hotelIds: [],
  selectedHotelId: null,
  userHotels: [],
  topHotelIds: [],
  isValidatingAuth: false,
  subscriptionId: null,
  subscriptionPaymentStatus: null,
  subscriptionPlan: null,
  subscriptionIsActive: null,
  subscriptionIsExpired: null,
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state from localStorage with dual authentication support
  const [authState, setAuthState] = useState(() => {
    try {
      // Check if we have basic user data stored (indicates previous authentication)
      const userId = getStorageItem(AUTH_STORAGE_KEYS.USER_ID);
      const email = getStorageItem(AUTH_STORAGE_KEYS.EMAIL);
      
      // For cross-domain auth, also check if we have valid tokens
      const usingTokens = isUsingLocalStorageTokens();
      const hasTokens = usingTokens ? hasValidTokens() : true; // Skip token check for cookie auth
      
      // If we have user data and valid auth method, assume authenticated
      const hasUserData = userId && email && hasTokens;

      const authData = {
        isAuthenticated: hasUserData,
        email: email || "",
        roles: parseRolesFromStorage(getStorageItem(AUTH_STORAGE_KEYS.ROLES)),
        activeRole: getStorageItem(AUTH_STORAGE_KEYS.ACTIVE_ROLE),
        clientDetailSet: getStorageItem(AUTH_STORAGE_KEYS.CLIENT_DETAIL_SET) === "true",
        userName: getStorageItem(AUTH_STORAGE_KEYS.USER_NAME) || "",
        registerFlag: getStorageItem(AUTH_STORAGE_KEYS.REGISTER_FLAG) === "true",
        pictureURL: getStorageItem(AUTH_STORAGE_KEYS.PICTURE_URL) || "",
        userId: userId || "",
        flag: false,
        hotelId: getStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID) || null,
        hotelIds: parseHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS)),
        selectedHotelId: getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID) || null,
        userHotels: parseUserHotelsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS)),
        topHotelIds: parseTopHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS)),
        isValidatingAuth: hasUserData, // Will validate with server if we think we're authenticated
        subscriptionId: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID) || null,
        subscriptionPaymentStatus: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PAYMENT_STATUS) || null,
        subscriptionPlan: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PLAN) || null,
        subscriptionIsActive: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_ACTIVE) === "true" ? true : 
                             getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_ACTIVE) === "false" ? false : null,
        subscriptionIsExpired: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_EXPIRED) === "true" ? true : 
                              getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_EXPIRED) === "false" ? false : null,
        subscriptionNextBillingDate: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_NEXT_BILLING_DATE) || null,
        subscriptionExpirationNotification: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_EXPIRATION_NOTIFICATION) === "true",
      };

      return authData;
    } catch (error) {
      return defaultAuthState;
    }
  });

  const [lastLogin, setLastLogin] = useState(() => {
    const stored = getStorageItem("lastLogin");
    return stored ? new Date(stored) : null;
  });

  // === FETCH SUBSCRIPTION DATA (optimized for initial load only) ===
  const fetchSubscriptionData = useCallback(async (userId, forceRefresh = false, selectedHotelId = null) => {
    try {
      if (!userId) return null;
      
      // Check if user has permission to access subscription data
      // Only HOTEL_ADMIN (hotel owner) and MANAGER roles can access subscription data
      const allowedRoles = ['HOTEL_ADMIN', 'MANAGER'];
      const hasPermission = authState.roles.some(role => allowedRoles.includes(role));
      
      if (!hasPermission) {
        return null;
      }
      
      // Use selectedHotelId if provided, otherwise use current selectedHotelId from auth state
      const hotelIdToUse = selectedHotelId || authState.selectedHotelId;
      
      if (!hotelIdToUse) {
        return null;
      }
      
      // Check if subscription data already exists in localStorage and not forcing refresh
      if (!forceRefresh && getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID)) {
        // Return cached data from localStorage
        const cachedData = {
          id: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID),
          subscriptionId: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID),
          paymentStatus: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PAYMENT_STATUS),
          subscriptionPlan: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PLAN),
          isActive: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_ACTIVE) === "true",
          isExpired: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_EXPIRED) === "true",
          nextBillingDate: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_NEXT_BILLING_DATE),
          expirationNotification: getStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_EXPIRATION_NOTIFICATION) === "true"
        };
        
        return cachedData;
      }
      
      // Use the subscription service to get subscription for specific hotel
      const hotelSubscription = await subscriptionService.getSubscriptionForHotel(userId, hotelIdToUse);
      
      if (hotelSubscription) {
        // Update localStorage with subscription data
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PAYMENT_STATUS, hotelSubscription.paymentStatus);
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PLAN, hotelSubscription.subscriptionPlan);
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_ACTIVE, Boolean(hotelSubscription.isActive).toString());
        // Store isExpired from API (can be isExpired or expired field)
        const isExpired = hotelSubscription.isExpired !== undefined ? hotelSubscription.isExpired : hotelSubscription.expired;
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_EXPIRED, Boolean(isExpired).toString());
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_NEXT_BILLING_DATE, hotelSubscription.nextBillingDate || '');
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_EXPIRATION_NOTIFICATION, Boolean(hotelSubscription.expirationNotification).toString());
        
        // Store subscription ID if available
        if (hotelSubscription.id || hotelSubscription.subscriptionId) {
          setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID, (hotelSubscription.id || hotelSubscription.subscriptionId).toString());
        }
        
        // Mark as fetched in current session
        markSubscriptionFetchedInSession(userId);
        
        // Update auth state
        setAuthState(prev => ({
          ...prev,
          subscriptionId: hotelSubscription.id || hotelSubscription.subscriptionId || null,
          subscriptionPaymentStatus: hotelSubscription.paymentStatus,
          subscriptionPlan: hotelSubscription.subscriptionPlan,
          subscriptionIsActive: hotelSubscription.isActive,
          subscriptionIsExpired: isExpired,
          subscriptionNextBillingDate: hotelSubscription.nextBillingDate,
          subscriptionExpirationNotification: hotelSubscription.expirationNotification,
        }));
        
        return hotelSubscription;
      } else {
        // Clear subscription data from localStorage and state
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID);
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PAYMENT_STATUS);
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PLAN);
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_ACTIVE);
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_EXPIRED);
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_NEXT_BILLING_DATE);
        removeStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_EXPIRATION_NOTIFICATION);
        
        // Update auth state to clear subscription data
        setAuthState(prev => ({
          ...prev,
          subscriptionId: null,
          subscriptionPaymentStatus: null,
          subscriptionPlan: null,
          subscriptionIsActive: null,
          subscriptionIsExpired: null,
          subscriptionNextBillingDate: null,
          subscriptionExpirationNotification: false,
        }));
        
        return null;
      }
    } catch (error) {
      // Don't clear auth state for subscription errors, just handle silently
      if (error.response?.status === 404 || error.response?.status === 403) {
        // 404: No subscription found for this hotel - normal for new hotels
        // 403: User doesn't have permission to view subscriptions yet - normal for freshly created hotels
      }
      
      return null;
    }
  }, [authState.roles, authState.selectedHotelId]);

  // === UPDATE SUBSCRIPTION CACHE (for when user subscribes) ===
  const updateSubscriptionCache = useCallback((subscriptionData) => {
    try {
      // Update localStorage with new subscription data
      setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PAYMENT_STATUS, subscriptionData.paymentStatus);
      setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_PLAN, subscriptionData.subscriptionPlan);
      setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_ACTIVE, Boolean(subscriptionData.isActive).toString());
      // Store isExpired from API (can be isExpired or expired field)
      const isExpired = subscriptionData.isExpired !== undefined ? subscriptionData.isExpired : subscriptionData.expired;
      setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_IS_EXPIRED, Boolean(isExpired).toString());
      setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_NEXT_BILLING_DATE, subscriptionData.nextBillingDate || '');
      setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_EXPIRATION_NOTIFICATION, Boolean(subscriptionData.expirationNotification).toString());
      
      // Store subscription ID if available
      if (subscriptionData.id || subscriptionData.subscriptionId) {
        setStorageItem(AUTH_STORAGE_KEYS.SUBSCRIPTION_ID, (subscriptionData.id || subscriptionData.subscriptionId).toString());
      }
      
      // Update auth state
      setAuthState(prev => ({
        ...prev,
        subscriptionId: subscriptionData.id || subscriptionData.subscriptionId || null,
        subscriptionPaymentStatus: subscriptionData.paymentStatus,
        subscriptionPlan: subscriptionData.subscriptionPlan,
        subscriptionIsActive: subscriptionData.isActive,
        subscriptionIsExpired: isExpired,
        subscriptionNextBillingDate: subscriptionData.nextBillingDate,
        subscriptionExpirationNotification: subscriptionData.expirationNotification,
      }));
      
    } catch (error) {
    }
  }, []);

  // === FETCH USER HOTELS (memoized) ===
  const fetchUserHotels = useCallback(async (userId) => {
    try {
      if (!userId) return [];
      
      const response = await api.get(`/hotels/user/${userId}/all`);
      
      if (response.status === 200 && response.data) {
        const hotels = Array.isArray(response.data) ? response.data : [response.data];
        
        // Update localStorage with user hotels
        setStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS, stringifyUserHotelsForStorage(hotels));
        
        // Update auth state
        setAuthState(prev => ({
          ...prev,
          userHotels: hotels,
        }));
        
        return hotels;
      } else {
        throw new Error('Invalid user hotels response');
      }
    } catch (error) {
      // Don't clear auth state for hotel fetch errors, handle silently
      if (error.response?.status === 404) {
        // No hotels found for this user - this is normal
      }
      
      return [];
    }
  }, []);

  // === VALIDATE AUTH STATUS WITH SERVER (memoized) ===
  // Note: This is only called once on app load to verify the stored auth is still valid
  const validateAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isValidatingAuth: true }));

      // Call backend to validate current authentication status
      const usingTokens = isUsingLocalStorageTokens();
      let statusConfig = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (usingTokens) {
        // For cross-domain auth, don't send cookies but let request interceptor add X-Access-Token
        statusConfig.withCredentials = false;
      } else {
        // For cookie-based auth
        statusConfig.withCredentials = true;
      }
      
      const response = await axios.get(`${API_BASE_URL}/auth/status`, statusConfig);

      if (response.status === 200 && response.data.success && response.data.user) {
        const userData = response.data.user;
        const roles = userData.roles || [];
        const initialActiveRole = getStorageItem(AUTH_STORAGE_KEYS.ACTIVE_ROLE) ||
                                 (roles.includes('HOTEL_ADMIN') ? 'HOTEL_ADMIN' :
                                  roles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' :
                                  roles.includes('STAFF') ? 'STAFF' :
                                  roles.includes('GUEST') ? 'GUEST' :
                                  roles[0] || null);

        // Update localStorage with current user data
        setStorageItem(AUTH_STORAGE_KEYS.USER_ID, userData.id);
        setStorageItem(AUTH_STORAGE_KEYS.EMAIL, userData.email);
        setStorageItem(AUTH_STORAGE_KEYS.ROLES, stringifyRolesForStorage(roles));
        setStorageItem(AUTH_STORAGE_KEYS.ACTIVE_ROLE, initialActiveRole);
        setStorageItem(AUTH_STORAGE_KEYS.USER_NAME, userData.name || "");
        setStorageItem(AUTH_STORAGE_KEYS.PICTURE_URL, userData.profilePicUrl || "");
        setStorageItem(AUTH_STORAGE_KEYS.CLIENT_DETAIL_SET, Boolean(userData.detailSet).toString());
        setStorageItem(AUTH_STORAGE_KEYS.LAST_AUTH_CHECK, Date.now().toString());

        // Handle hotelIds array from server response
        if (userData.hotelIds && Array.isArray(userData.hotelIds)) {
          setStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS, stringifyHotelIdsForStorage(userData.hotelIds));
          // Set the first hotelId as the primary hotelId for backward compatibility
          if (userData.hotelIds.length > 0) {
            setStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID, userData.hotelIds[0]);
            // Initialize selectedHotelId if not already set
            const existingSelectedHotelId = getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID);
            if (!existingSelectedHotelId) {
              setStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID, userData.hotelIds[0]);
            }
          }
        } else if (userData.hotelId) {
          // Fallback to single hotelId if hotelIds array is not provided
          setStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID, userData.hotelId);
          setStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS, stringifyHotelIdsForStorage([userData.hotelId]));
          // Initialize selectedHotelId if not already set
          const existingSelectedHotelId = getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID);
          if (!existingSelectedHotelId) {
            setStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID, userData.hotelId);
          }
        }

        // Update auth state
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          email: userData.email,
          userId: userData.id,
          userName: userData.name || "",
          roles: roles,
          activeRole: initialActiveRole,
          pictureURL: userData.profilePicUrl || "",
          clientDetailSet: Boolean(userData.detailSet),
          hotelId: userData.hotelIds && userData.hotelIds.length > 0 ? userData.hotelIds[0] : (userData.hotelId || prev.hotelId),
          hotelIds: userData.hotelIds && Array.isArray(userData.hotelIds) ? userData.hotelIds : (userData.hotelId ? [userData.hotelId] : prev.hotelIds),
          selectedHotelId: getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID) || prev.selectedHotelId,
          isValidatingAuth: false,
        }));

        // Fetch subscription data only for HOTEL_ADMIN/MANAGER roles on initial validation
        if (userData.id && (roles.includes('HOTEL_ADMIN') || roles.includes('MANAGER'))) {
          await fetchSubscriptionData(userData.id);
        }

        return true;
      } else {
        throw new Error('Invalid authentication response');
      }
    } catch (error) {
      // Check if it's a 401/403 (authentication expired) or other error
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Clear auth state for expired/invalid authentication
        if (isUsingLocalStorageTokens()) {
          clearTokens();
        }
        
        setAuthState({
          ...defaultAuthState,
          topHotelIds: parseTopHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS)),
          hotelIds: parseHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS)),
          selectedHotelId: null,
          userHotels: parseUserHotelsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS))
        });
        
        // Clear user data but preserve top hotel IDs, hotel IDs, and user hotels
        const authKeys = Object.values(AUTH_STORAGE_KEYS).filter(key => 
          key !== 'topHotelIds' && key !== 'hotelIds' && key !== 'userHotels' && key !== 'lastAuthCheck'
        );
        authKeys.forEach(key => {
          removeStorageItem(key);
        });
        
        // Also clear cookies for 403
        if (error.response?.status === 403) {
          try {
            authService.clearAuthData();
          } catch (clearError) {
            // Silent fail
          }
        }
      } else {
        // For other errors (network issues, etc.), just clear validation flag
        setAuthState(prev => ({ ...prev, isValidatingAuth: false }));
      }
      
      return false;
    }
  }, [fetchSubscriptionData]);

  // === LOGOUT (memoized) ===
  const logout = useCallback(async () => {
    try {
      // Preserve top hotel IDs, hotel IDs, and user hotels during logout
      const topHotelIds = getStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS);
      const hotelIds = getStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS);
      const userHotels = getStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS);
      
      // Call backend logout endpoint to invalidate token
      try {
        const usingTokens = isUsingLocalStorageTokens();
        let logoutConfig = {
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        if (usingTokens) {
          // For cross-domain auth, don't send cookies but let request interceptor add X-Access-Token
          logoutConfig.withCredentials = false;
        } else {
          // For cookie-based auth
          logoutConfig.withCredentials = true;
        }
        
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, logoutConfig);
      } catch (logoutError) {
        // Continue with local cleanup even if API call fails
      }
      
      // Clear localStorage tokens if using cross-domain auth
      if (isUsingLocalStorageTokens()) {
        clearTokens();
      }
      
      // Clear all auth data from localStorage except top hotel IDs, hotel IDs, and user hotels
      const authKeys = Object.values(AUTH_STORAGE_KEYS).filter(key => 
        key !== 'topHotelIds' && key !== 'hotelIds' && key !== 'userHotels' && key !== 'lastAuthCheck'
      );
      authKeys.forEach(key => {
        removeStorageItem(key);
      });
      
      // Clear session-based subscription fetch flag
      try {
        sessionStorage.removeItem('yakrooms_session_id');
      } catch (sessionError) {
        // Silent fail
      }
      
      // Clear all cookies (redundant but safer)
      try {
        authService.clearAuthData();
      } catch (clearError) {
        // Silent fail
      }
      
      // Restore top hotel IDs, hotel IDs, and user hotels after clearing
      if (topHotelIds) {
        setStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS, topHotelIds);
      }
      if (hotelIds) {
        setStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS, hotelIds);
      }
      if (userHotels) {
        setStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS, userHotels);
      }
      
      setAuthState({
        ...defaultAuthState,
        topHotelIds: parseTopHotelIdsFromStorage(topHotelIds),
        hotelIds: parseHotelIdsFromStorage(hotelIds),
        selectedHotelId: null,
        userHotels: parseUserHotelsFromStorage(userHotels)
      });
      
      navigate("/");
      
    } catch (error) {
      // Fallback cleanup if logout fails
      try {
        // Clear localStorage
        const authKeys = Object.values(AUTH_STORAGE_KEYS).filter(key => 
          key !== 'topHotelIds' && key !== 'hotelIds' && key !== 'userHotels' && key !== 'lastAuthCheck'
        );
        authKeys.forEach(key => {
          removeStorageItem(key);
        });
        
        setAuthState({
          ...defaultAuthState,
          topHotelIds: parseTopHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS)),
          hotelIds: parseHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS)),
          selectedHotelId: null,
          userHotels: parseUserHotelsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS))
        });
        navigate("/");
      } catch (fallbackError) {
        window.location.href = '/';
      }
    }
  }, [navigate]);

  // === Set global logout function for API interceptor ===
  useEffect(() => {
    window.authLogout = logout;
    return () => {
      window.authLogout = () => {};
    };
  }, [logout]);

  // === Auto-validate authentication status on app load ===
  useEffect(() => {
    const validateAuthentication = async () => {
      try {
        // Only validate if we think we're authenticated or if we're in validation state
        if (!authState.isAuthenticated && !authState.isValidatingAuth) return;
        
        await validateAuthStatus();
      } catch (error) {
        // Silent fail
      }
    };
    
    // Validate once on app load
    validateAuthentication();
    
    // No periodic validation needed - token doesn't expire
  }, []); // Empty deps - run only once on mount

  // === Listen to storage changes (cross-tab sync) ===
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Sync user data changes across tabs
      if (e.key === AUTH_STORAGE_KEYS.USER_ID) {
        const userId = e.newValue;
        
        if (!userId) {
          // User logged out in another tab
          logout();
        } else {
          // Sync auth state with other tabs
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            email: getStorageItem(AUTH_STORAGE_KEYS.EMAIL),
            roles: parseRolesFromStorage(getStorageItem(AUTH_STORAGE_KEYS.ROLES)),
            activeRole: getStorageItem(AUTH_STORAGE_KEYS.ACTIVE_ROLE),
            userName: getStorageItem(AUTH_STORAGE_KEYS.USER_NAME),
            userId: getStorageItem(AUTH_STORAGE_KEYS.USER_ID),
            pictureURL: getStorageItem(AUTH_STORAGE_KEYS.PICTURE_URL),
            clientDetailSet: getStorageItem(AUTH_STORAGE_KEYS.CLIENT_DETAIL_SET) === "true",
            registerFlag: getStorageItem(AUTH_STORAGE_KEYS.REGISTER_FLAG) === "true",
            hotelId: getStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID) || null,
            hotelIds: parseHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS)),
            selectedHotelId: getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID) || null,
            userHotels: parseUserHotelsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.USER_HOTELS)),
            topHotelIds: parseTopHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS)),
          }));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);

  // === LOGIN (memoized) ===
  const login = useCallback(async (authData) => {
    try {
      const authMethod = authData.authMethod || 'cookie';

      // Validate required fields for both auth methods
      if (!authData.userid || !authData.email) {
        throw new Error("Missing required authentication data: userid and email are required");
      }

      // Handle roles - convert to array if it's a single role or already an array
      const roles = Array.isArray(authData.roles) ? authData.roles : 
                   Array.isArray(authData.role) ? authData.role :
                   authData.roles ? [authData.roles] :
                   authData.role ? [authData.role] : [];

      // Determine initial active role
      const initialActiveRole = authData.activeRole || 
                               (roles.includes('HOTEL_ADMIN') ? 'HOTEL_ADMIN' :
                                roles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' :
                                roles.includes('STAFF') ? 'STAFF' :
                                roles.includes('GUEST') ? 'GUEST' :
                                roles[0] || null);

      // Store auth data using Safari-specific utilities (works for both auth methods)
      setStorageItem(AUTH_STORAGE_KEYS.USER_ID, authData.userid);
      setStorageItem(AUTH_STORAGE_KEYS.EMAIL, authData.email);
      setStorageItem(AUTH_STORAGE_KEYS.ROLES, stringifyRolesForStorage(roles));
      setStorageItem(AUTH_STORAGE_KEYS.ACTIVE_ROLE, initialActiveRole);
      setStorageItem(AUTH_STORAGE_KEYS.USER_NAME, authData.userName || "");
      setStorageItem(AUTH_STORAGE_KEYS.PICTURE_URL, authData.pictureURL || "");
      setStorageItem(AUTH_STORAGE_KEYS.REGISTER_FLAG, Boolean(authData.flag).toString());
      setStorageItem(AUTH_STORAGE_KEYS.CLIENT_DETAIL_SET, Boolean(authData.detailSet).toString());
      setStorageItem(AUTH_STORAGE_KEYS.LAST_AUTH_CHECK, Date.now().toString());

      // Handle hotelIds array from authData
      if (authData.hotelIds && Array.isArray(authData.hotelIds)) {
        setStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS, stringifyHotelIdsForStorage(authData.hotelIds));
        // Set the first hotelId as the primary hotelId for backward compatibility
        if (authData.hotelIds.length > 0) {
          setStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID, authData.hotelIds[0]);
          // Initialize selectedHotelId if not already set
          const existingSelectedHotelId = getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID);
          if (!existingSelectedHotelId) {
            setStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID, authData.hotelIds[0]);
          }
        }
      } else if (authData.hotelId) {
        // Fallback to single hotelId if hotelIds array is not provided
        setStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID, authData.hotelId);
        setStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS, stringifyHotelIdsForStorage([authData.hotelId]));
        // Initialize selectedHotelId if not already set
        const existingSelectedHotelId = getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID);
        if (!existingSelectedHotelId) {
          setStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID, authData.hotelId);
        }
      }

      const existingHotelId = getStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID);
      const existingHotelIds = parseHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.HOTEL_IDS));

      const newAuthState = {
        isAuthenticated: true,
        email: authData.email,
        userId: authData.userid,
        userName: authData.userName || "",
        roles: roles,
        activeRole: initialActiveRole,
        pictureURL: authData.pictureURL || "",
        registerFlag: Boolean(authData.flag),
        clientDetailSet: Boolean(authData.detailSet),
        flag: true,
        hotelId: authData.hotelIds && authData.hotelIds.length > 0 ? authData.hotelIds[0] : (authData.hotelId || existingHotelId || null),
        hotelIds: authData.hotelIds && Array.isArray(authData.hotelIds) ? authData.hotelIds : (authData.hotelId ? [authData.hotelId] : existingHotelIds),
        selectedHotelId: getStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID) || (authData.hotelIds && authData.hotelIds.length > 0 ? authData.hotelIds[0] : authData.hotelId),
        topHotelIds: parseTopHotelIdsFromStorage(getStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS)),
        isValidatingAuth: false, // Auth is validated since we just logged in
      };

      setAuthState(newAuthState);

      // Fetch subscription data only for HOTEL_ADMIN/MANAGER roles after login
      if (newAuthState.userId && (roles.includes('HOTEL_ADMIN') || roles.includes('MANAGER'))) {
        try {
          await fetchSubscriptionData(newAuthState.userId);
        } catch (subscriptionError) {
          // Don't fail login if subscription fetch fails
        }
      }

      // Navigate only if not a first-time registration
      if (!authData.flag) {
        // Check if there's a stored redirect URL
        const redirectUrl = getStorageItem(AUTH_STORAGE_KEYS.REDIRECT_URL);
        if (redirectUrl) {
          // Clear the redirect URL after using it
          removeStorageItem(AUTH_STORAGE_KEYS.REDIRECT_URL);
          
          // If user is on landing page and redirect URL is a hotel details page, don't navigate
          const isOnLandingPage = location.pathname === "/";
          const isHotelDetailsPage = redirectUrl.includes("/hotel/");
          
          if (isOnLandingPage && isHotelDetailsPage) {
            // Stay on landing page, don't navigate to hotel details
          } else {
            navigate(redirectUrl);
          }
        } else {
          navigate("/");
        }
      }

      const now = new Date();
      setLastLogin(now);
      setStorageItem("lastLogin", now.toISOString());

    } catch (error) {
      throw error; // Re-throw to allow handling in the calling component
    }
  }, [navigate, location, fetchSubscriptionData]);

  // === SET HOTEL ID (memoized) ===
  const setHotelId = useCallback((hotelId) => {
    try {
      const hotelIdString = hotelId?.toString() || null;
      setStorageItem(AUTH_STORAGE_KEYS.HOTEL_ID, hotelIdString);
      setAuthState(prev => ({
        ...prev,
        hotelId: hotelIdString,
      }));
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === SET SELECTED HOTEL ID (memoized) ===
  const setSelectedHotelId = useCallback(async (hotelId) => {
    try {
      const hotelIdString = hotelId?.toString() || null;
      setStorageItem(AUTH_STORAGE_KEYS.SELECTED_HOTEL_ID, hotelIdString);
      setAuthState(prev => ({
        ...prev,
        selectedHotelId: hotelIdString,
      }));
      
      // Refresh subscription data for the new hotel if user has permission
      if (hotelIdString && authState.userId && authState.roles) {
        const allowedRoles = ['HOTEL_ADMIN', 'MANAGER'];
        const hasPermission = authState.roles.some(role => allowedRoles.includes(role));
        
        if (hasPermission) {
          await fetchSubscriptionData(authState.userId, true, hotelIdString);
        }
      }
    } catch (error) {
      // Silent fail
    }
  }, [authState.userId, authState.roles, fetchSubscriptionData]);

  // === GET SELECTED HOTEL (memoized) ===
  const getSelectedHotel = useCallback(() => {
    const selectedHotelId = authState.selectedHotelId;
    if (!selectedHotelId || !authState.userHotels || !Array.isArray(authState.userHotels)) {
      return null;
    }
    return authState.userHotels.find(hotel => hotel.id?.toString() === selectedHotelId) || null;
  }, [authState.selectedHotelId, authState.userHotels]);

  // === SET REDIRECT URL (memoized) ===
  const setRedirectUrl = useCallback((url) => {
    try {
      if (url) {
        setStorageItem(AUTH_STORAGE_KEYS.REDIRECT_URL, url);
      } else {
        removeStorageItem(AUTH_STORAGE_KEYS.REDIRECT_URL);
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === SET ROLES (memoized) ===
  const setRoles = useCallback((roles) => {
    try {
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      setStorageItem(AUTH_STORAGE_KEYS.ROLES, stringifyRolesForStorage(rolesArray));
      setAuthState(prev => ({
        ...prev,
        roles: rolesArray,
      }));
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === ADD ROLE (memoized) ===
  const addRole = useCallback((role) => {
    try {
      setAuthState(prev => {
        const newRoles = [...prev.roles];
        if (!newRoles.includes(role)) {
          newRoles.push(role);
          setStorageItem(AUTH_STORAGE_KEYS.ROLES, stringifyRolesForStorage(newRoles));
        }
        return { ...prev, roles: newRoles };
      });
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === REMOVE ROLE (memoized) ===
  const removeRole = useCallback((role) => {
    try {
      setAuthState(prev => {
        const newRoles = prev.roles.filter(r => r !== role);
        setStorageItem(AUTH_STORAGE_KEYS.ROLES, stringifyRolesForStorage(newRoles));
        return { ...prev, roles: newRoles };
      });
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === GET PRIMARY ROLE (memoized) ===
  const getPrimaryRole = useCallback(() => {
    const roles = authState.roles;
    if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
    if (roles.includes('HOTEL_ADMIN')) return 'HOTEL_ADMIN';
    if (roles.includes('STAFF')) return 'STAFF';
    if (roles.includes('GUEST')) return 'GUEST';
    return roles[0] || null;
  }, [authState.roles]);

  // === SET ACTIVE ROLE (memoized) ===
  const setActiveRole = useCallback((role) => {
    try {
      // Validate that the role exists in user's roles
      if (!authState.roles.includes(role)) {
        return;
      }
      
      setStorageItem(AUTH_STORAGE_KEYS.ACTIVE_ROLE, role);
      setAuthState(prev => ({
        ...prev,
        activeRole: role,
      }));
    } catch (error) {
      // Silent fail
    }
  }, [authState.roles]);

  // === GET CURRENT ACTIVE ROLE (memoized) ===
  const getCurrentActiveRole = useCallback(() => {
    // If no active role is set, use the primary role
    if (!authState.activeRole) {
      const primaryRole = getPrimaryRole();
      if (primaryRole) {
        setActiveRole(primaryRole);
        return primaryRole;
      }
      return null;
    }
    return authState.activeRole;
  }, [authState.activeRole, getPrimaryRole, setActiveRole]);

  // === SWITCH TO ROLE (memoized) ===
  const switchToRole = useCallback((role) => {
    if (authState.roles.includes(role)) {
      setActiveRole(role);
      return true;
    }
    return false;
  }, [authState.roles, setActiveRole]);

  // === BACKWARD COMPATIBILITY: Get primary role as 'role' ===
  const role = getCurrentActiveRole();

  // === UPDATE USER PROFILE (new method) ===
  const updateUserProfile = useCallback((updates) => {
    try {
      const allowedUpdates = ['userName', 'pictureURL', 'clientDetailSet'];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (allowedUpdates.includes(key)) {
          const storageKey = key === 'userName' ? AUTH_STORAGE_KEYS.USER_NAME :
                            key === 'pictureURL' ? AUTH_STORAGE_KEYS.PICTURE_URL :
                            AUTH_STORAGE_KEYS.CLIENT_DETAIL_SET;
          
          setStorageItem(storageKey, value);
        }
      });

      setAuthState(prev => ({
        ...prev,
        ...updates
      }));
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === SET TOP HOTEL IDS (memoized) ===
  const setTopHotelIds = useCallback((hotelIds) => {
    try {
      const hotelIdsArray = Array.isArray(hotelIds) ? hotelIds : [hotelIds];
      setStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS, stringifyTopHotelIdsForStorage(hotelIdsArray));
      setAuthState(prev => ({
        ...prev,
        topHotelIds: hotelIdsArray,
      }));
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === ADD TOP HOTEL ID (memoized) ===
  const addTopHotelId = useCallback((hotelId) => {
    try {
      setAuthState(prev => {
        const newTopHotelIds = [...prev.topHotelIds];
        if (!newTopHotelIds.includes(hotelId)) {
          newTopHotelIds.push(hotelId);
          // Keep only top 3
          if (newTopHotelIds.length > 3) {
            newTopHotelIds.shift();
          }
          setStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS, stringifyTopHotelIdsForStorage(newTopHotelIds));
        }
        return { ...prev, topHotelIds: newTopHotelIds };
      });
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === REMOVE TOP HOTEL ID (memoized) ===
  const removeTopHotelId = useCallback((hotelId) => {
    try {
      setAuthState(prev => {
        const newTopHotelIds = prev.topHotelIds.filter(id => id !== hotelId);
        setStorageItem(AUTH_STORAGE_KEYS.TOP_HOTEL_IDS, stringifyTopHotelIdsForStorage(newTopHotelIds));
        return { ...prev, topHotelIds: newTopHotelIds };
      });
    } catch (error) {
      // Silent fail
    }
  }, []);

  // === CHECK ROLE (memoized) ===
  const hasRole = useCallback((roleToCheck) => {
    return authState.roles.includes(roleToCheck);
  }, [authState.roles]);

  // === CHECK ANY ROLE (memoized) ===
  const hasAnyRole = useCallback((rolesToCheck) => {
    return rolesToCheck.some(role => authState.roles.includes(role));
  }, [authState.roles]);

  // === CHECK ALL ROLES (memoized) ===
  const hasAllRoles = useCallback((rolesToCheck) => {
    return rolesToCheck.every(role => authState.roles.includes(role));
  }, [authState.roles]);

  // === CHECK IF HOTEL IS TOP HOTEL (memoized) ===
  const isTopHotel = useCallback((hotelIdToCheck) => {
    if (!hotelIdToCheck || !authState.topHotelIds || !Array.isArray(authState.topHotelIds)) {
      return false;
    }
    return authState.topHotelIds.includes(hotelIdToCheck.toString());
  }, [authState.topHotelIds]);

  // === CHECK IF USER HAS ACCESS TO HOTEL (memoized) ===
  const hasHotelAccess = useCallback((hotelIdToCheck) => {
    if (!hotelIdToCheck || !authState.hotelIds || !Array.isArray(authState.hotelIds)) {
      return false;
    }
    return authState.hotelIds.includes(hotelIdToCheck.toString());
  }, [authState.hotelIds]);

  // === GET PRIMARY HOTEL ID (memoized) ===
  const getPrimaryHotelId = useCallback(() => {
    if (authState.hotelIds && authState.hotelIds.length > 0) {
      return authState.hotelIds[0];
    }
    return authState.hotelId || null;
  }, [authState.hotelIds, authState.hotelId]);

  // === MEMOIZED CONTEXT VALUE ===
  const contextValue = useMemo(() => ({
    // State
    isAuthenticated: authState.isAuthenticated,
    email: authState.email,
    userId: authState.userId,
    userName: authState.userName,
    roles: authState.roles,
    activeRole: authState.activeRole,
    role, // Backward compatibility
    pictureURL: authState.pictureURL,
    registerFlag: authState.registerFlag,
    clientDetailSet: authState.clientDetailSet,
    flag: authState.flag,
    hotelId: authState.hotelId,
    hotelIds: authState.hotelIds,
    selectedHotelId: authState.selectedHotelId,
    userHotels: authState.userHotels,
    topHotelIds: authState.topHotelIds,
    isValidatingAuth: authState.isValidatingAuth,
    subscriptionPaymentStatus: authState.subscriptionPaymentStatus,
    subscriptionPlan: authState.subscriptionPlan,
    subscriptionIsActive: authState.subscriptionIsActive,
    subscriptionIsExpired: authState.subscriptionIsExpired,
    subscriptionNextBillingDate: authState.subscriptionNextBillingDate,
    subscriptionExpirationNotification: authState.subscriptionExpirationNotification,
    lastLogin,

    // Actions
    login,
    logout,
    setHotelId,
    setSelectedHotelId,
    getSelectedHotel,
    fetchUserHotels,
    setRedirectUrl,
    setRoles,
    addRole,
    removeRole,
    setActiveRole,
    getCurrentActiveRole,
    switchToRole,
    updateUserProfile,
    setTopHotelIds,
    addTopHotelId,
    removeTopHotelId,
    fetchSubscriptionData,
    updateSubscriptionCache,

    // Role checks
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isTopHotel,
    hasHotelAccess,
    getPrimaryHotelId,
  }), [
    authState,
    lastLogin,
    login,
    logout,
    setHotelId,
    setSelectedHotelId,
    getSelectedHotel,
    fetchUserHotels,
    setRedirectUrl,
    setRoles,
    addRole,
    removeRole,
    setActiveRole,
    getCurrentActiveRole,
    switchToRole,
    updateUserProfile,
    setTopHotelIds,
    addTopHotelId,
    removeTopHotelId,
    fetchSubscriptionData,
    updateSubscriptionCache,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isTopHotel,
    hasHotelAccess,
    getPrimaryHotelId,
  ]);


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
