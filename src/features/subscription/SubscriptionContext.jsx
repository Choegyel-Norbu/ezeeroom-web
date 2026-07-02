import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/features/authentication/AuthProvider";
import subscriptionService from "@/shared/services/subscriptionService";
import { toast } from "sonner";

// === Subscription Context Setup ===
const SubscriptionContext = createContext(null);

// === Subscription Plans Configuration ===
export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    id: 'TRIAL',
    name: 'Free Trial',
    price: 0,
    currency: 'Nu.',
    duration: 1, // months
    features: [
      'Access to all platform features',
      'Hotel management dashboard',
      'Guest booking system',
      'Basic analytics & reports',
      'Mobile app access',
    ],
    limitations: [
      'Limited to trial period',
      'No premium support',
    ]
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: 499,
    annualPrice: 4990,
    currency: 'Nu.',
    duration: 1, // month
    maxRooms: 10,
    maxStaff: 2,
    // Features shown on the Basic card. `included: false` renders as a muted, dashed item.
    features: [
      { label: 'Booking calendar & availability', included: true },
      { label: 'Room management', included: true },
      { label: 'Admin & time-based booking', included: true },
      { label: 'QR check-in & CID verification', included: true },
      { label: 'Up to 2 staff accounts', included: true },
      { label: 'Up to 10 rooms', included: true },
      { label: 'Hotel listing & profile', included: true },
      { label: 'Analytics & reports', included: false },
      { label: 'Leave management', included: false },
      { label: 'Report downloads', included: false },
    ],
    limitations: []
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 999,
    annualPrice: 8990,
    currency: 'Nu.',
    duration: 1, // month
    // Features shown on the Pro card. All included.
    features: [
      { label: 'Everything in Basic', included: true },
      { label: 'Booking analytics & trend charts', included: true },
      { label: 'Monthly performance reports', included: true },
      { label: 'PDF / CSV report downloads', included: true },
      { label: 'Staff leave management', included: true },
      { label: 'Unlimited staff accounts', included: true },
      { label: 'Unlimited rooms', included: true },
      { label: 'Guest reviews & ratings', included: true },
      { label: 'All role access (MANAGER, FRONTDESK…)', included: true },
      { label: 'Priority support', included: true },
    ],
    limitations: []
  }
};

// === Payment Status Constants ===
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

// === Subscription Status Constants ===
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  TRIAL: 'TRIAL'
};

const defaultSubscriptionState = {
  subscription: null,
  paymentHistory: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const SubscriptionProvider = ({ children }) => {
  const { 
    userId, 
    hotelId, 
    isAuthenticated,
    roles,
    subscriptionId,
    subscriptionPaymentStatus,
    subscriptionPlan,
    subscriptionIsActive,
    subscriptionNextBillingDate,
    subscriptionExpirationNotification,
    fetchSubscriptionData,
    updateSubscriptionCache
  } = useAuth();

  const [subscriptionState, setSubscriptionState] = useState(defaultSubscriptionState);

  // === GET SUBSCRIPTION DETAILS FROM CACHE ===
  const fetchSubscriptionDetails = useCallback(async (forceRefresh = false) => {
    if (!userId || !isAuthenticated) return null;

    // Check if user has permission to access subscription data
    // Only HOTEL_ADMIN (hotel owner) and MANAGER roles can access subscription data
    const allowedRoles = ['HOTEL_ADMIN', 'MANAGER'];
    const hasPermission = roles.some(role => allowedRoles.includes(role));
    
    if (!hasPermission) {
      // User role does not have permission to access subscription data
      
      setSubscriptionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Access denied: Subscription data is only available for hotel owners and managers',
        subscription: null
      }));
      
      return null;
    }

    // Use cached data from AuthProvider (localStorage)
    const cachedSubscriptionData = {
      id: subscriptionId,
      subscriptionId: subscriptionId,
      paymentStatus: subscriptionPaymentStatus,
      subscriptionPlan: subscriptionPlan,
      isActive: subscriptionIsActive,
      nextBillingDate: subscriptionNextBillingDate,
      expirationNotification: subscriptionExpirationNotification
    };

    // Only fetch from API if forcing refresh or no cached data exists
    if (forceRefresh || !subscriptionId) {
      // Fetching subscription data from API
      const apiData = await fetchSubscriptionData(userId, forceRefresh);
      
      if (apiData) {
        setSubscriptionState(prev => ({
          ...prev,
          subscription: apiData,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        }));
        return apiData;
      }
    }

    // Use cached data
    setSubscriptionState(prev => ({
      ...prev,
      subscription: cachedSubscriptionData,
      isLoading: false,
      error: null,
      lastUpdated: Date.now()
    }));
    
    return cachedSubscriptionData;
  }, [userId, isAuthenticated, subscriptionId, subscriptionPaymentStatus, subscriptionPlan, subscriptionIsActive, subscriptionNextBillingDate, subscriptionExpirationNotification, fetchSubscriptionData, roles]);

  // === FETCH PAYMENT HISTORY (memoized) ===
  const fetchPaymentHistory = useCallback(async () => {
    if (!userId || !isAuthenticated) return [];

    try {
      // Fetching payment history
      const history = await subscriptionService.getSubscriptionHistory(userId);
      
      setSubscriptionState(prev => ({
        ...prev,
        paymentHistory: Array.isArray(history) ? history : []
      }));

      return history;
    } catch (error) {
      
      toast.error("Failed to load payment history.");
      return [];
    }
  }, [userId, isAuthenticated]);

  // === CREATE SUBSCRIPTION (memoized) ===
  const createSubscription = useCallback(async (subscriptionData) => {
    if (!userId || !isAuthenticated) {
      throw new Error("User must be authenticated to create subscription");
    }

    setSubscriptionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Creating new subscription
      
      const newSubscription = await subscriptionService.createSubscription({
        ...subscriptionData,
        userId: parseInt(userId)
      });

      setSubscriptionState(prev => ({
        ...prev,
        subscription: newSubscription,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      }));

      // Note: AuthProvider subscription data will be updated automatically
      // through the session-based caching mechanism when needed

      toast.success("Subscription created successfully!");
      return newSubscription;
    } catch (error) {

      setSubscriptionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to create subscription'
      }));

      const errorMessage = error.response?.data?.message || "Failed to create subscription. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  }, [userId, isAuthenticated, fetchSubscriptionData]);

  // === INITIATE PAYMENT (memoized) ===
  const initiatePayment = useCallback(async (paymentData, baseUrl = "https://www.ezeeroom.bt") => {
    if (!userId || !hotelId) {
      throw new Error("User ID and Hotel ID are required for payment initiation");
    }

    setSubscriptionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 🔐 SECURITY FIX: Remove client-provided amount
      // Backend should determine subscription price based on plan type
      // Sending plan type only, not the amount (prevents price manipulation)
      const paymentRequest = {
        hotelId: parseInt(hotelId),
        userId: parseInt(userId),
        subscriptionPlan: paymentData.subscriptionPlan || 'PRO',
        // ❌ REMOVED: amount (vulnerable to price tampering)
        // Backend will fetch the correct amount for the subscription plan
        // Old code (vulnerable):
        // amount: paymentData.amount || 1000.00,
        notes: paymentData.notes || "Subscription payment"
      };

      const paymentResponse = await subscriptionService.initiateSubscriptionPayment(paymentRequest, baseUrl);

      setSubscriptionState(prev => ({ ...prev, isLoading: false }));

      // Handle payment redirect - don't redirect automatically, return response for handling
      if (paymentResponse.success) {
        
        // Update subscription data if provided in response
        if (paymentResponse.subscription) {
          setSubscriptionState(prev => ({
            ...prev,
            subscription: paymentResponse.subscription,
            lastUpdated: Date.now()
          }));
          
          // Note: AuthProvider subscription data will be updated automatically
          // through the session-based caching mechanism when needed
        }
      }

      return paymentResponse;
    } catch (error) {

      setSubscriptionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initiate payment'
      }));

      // Provide more specific error messages based on error type
      let errorMessage = "Failed to initiate payment. Please try again.";
      
      if (error.response?.status === 400) {
        errorMessage = "Invalid payment request. Please check your information and try again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Payment service not available. Please try again later.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred. Please try again later or contact support.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  }, [userId, hotelId, fetchSubscriptionData]);

  // === UPDATE SUBSCRIPTION (memoized) ===
  const updateSubscription = useCallback(async (subscriptionId, updateData) => {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required for update");
    }

    setSubscriptionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Updating subscription
      
      const updatedSubscription = await subscriptionService.updateSubscription(subscriptionId, updateData);

      setSubscriptionState(prev => ({
        ...prev,
        subscription: updatedSubscription,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      }));

      // Note: AuthProvider subscription data will be updated automatically
      // through the session-based caching mechanism when needed

      toast.success("Subscription updated successfully!");
      return updatedSubscription;
    } catch (error) {

      setSubscriptionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update subscription'
      }));

      const errorMessage = error.response?.data?.message || "Failed to update subscription. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchSubscriptionData, userId]);

  // === CANCEL SUBSCRIPTION (memoized) ===
  const cancelSubscription = useCallback(async (subscriptionId, reason = "User requested cancellation") => {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required for cancellation");
    }

    setSubscriptionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Cancelling subscription
      
      const cancellationResult = await subscriptionService.cancelSubscription(subscriptionId, reason);

      // Refresh subscription data after cancellation
      await fetchSubscriptionDetails(true);

      toast.success("Subscription cancelled successfully!");
      return cancellationResult;
    } catch (error) {
      // Failed to cancel subscription
      
      setSubscriptionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to cancel subscription'
      }));

      const errorMessage = error.response?.data?.message || "Failed to cancel subscription. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchSubscriptionDetails]);

  // === REACTIVATE SUBSCRIPTION (memoized) ===
  const reactivateSubscription = useCallback(async (subscriptionId) => {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required for reactivation");
    }

    setSubscriptionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Reactivating subscription
      
      const reactivationResult = await subscriptionService.reactivateSubscription(subscriptionId);

      // Refresh subscription data after reactivation
      await fetchSubscriptionDetails(true);

      toast.success("Subscription reactivated successfully!");
      return reactivationResult;
    } catch (error) {

      setSubscriptionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to reactivate subscription'
      }));

      const errorMessage = error.response?.data?.message || "Failed to reactivate subscription. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchSubscriptionDetails]);

  // === GET PAYMENT STATUS (memoized) ===
  const getPaymentStatus = useCallback(async (transactionId) => {
    if (!transactionId) {
      throw new Error("Transaction ID is required");
    }

    try {
      // Checking payment status
      const paymentStatus = await subscriptionService.getPaymentStatus(transactionId);
      return paymentStatus;
    } catch (error) {
      // Failed to get payment status
      throw error;
    }
  }, []);

  // === UTILITY FUNCTIONS (memoized) ===
  const getSubscriptionStatus = useCallback(() => {
    if (!subscriptionPlan) return SUBSCRIPTION_STATUS.INACTIVE;
    
    if (subscriptionIsActive === true) {
      return subscriptionPlan === 'TRIAL' ? SUBSCRIPTION_STATUS.TRIAL : SUBSCRIPTION_STATUS.ACTIVE;
    } else if (subscriptionIsActive === false) {
      return SUBSCRIPTION_STATUS.EXPIRED;
    }
    
    return SUBSCRIPTION_STATUS.INACTIVE;
  }, [subscriptionPlan, subscriptionIsActive]);

  const isSubscriptionActive = useCallback(() => {
    return subscriptionIsActive === true;
  }, [subscriptionIsActive]);

  const isTrialActive = useCallback(() => {
    return subscriptionIsActive === true && subscriptionPlan === 'TRIAL';
  }, [subscriptionIsActive, subscriptionPlan]);

  const isProActive = useCallback(() => {
    return subscriptionIsActive === true && subscriptionPlan === 'PRO';
  }, [subscriptionIsActive, subscriptionPlan]);

  const isExpired = useCallback(() => {
    return subscriptionIsActive === false && subscriptionPlan;
  }, [subscriptionIsActive, subscriptionPlan]);

  const getDaysUntilExpiration = useCallback(() => {
    if (!subscriptionNextBillingDate) return null;
    
    const expirationDate = new Date(subscriptionNextBillingDate);
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [subscriptionNextBillingDate]);

  const getSubscriptionPlan = useCallback((planId) => {
    return SUBSCRIPTION_PLANS[planId] || null;
  }, []);

  // === AUTO-FETCH SUBSCRIPTION DATA (only if no cached data) ===
  useEffect(() => {
    if (userId && isAuthenticated && !subscriptionId && !subscriptionState.subscription) {
      // No cached subscription data found, fetching from API
      fetchSubscriptionDetails();
    } else if (userId && isAuthenticated && subscriptionId && !subscriptionState.subscription) {
      // Using cached subscription data
      fetchSubscriptionDetails();
    }
  }, [userId, isAuthenticated, subscriptionId, fetchSubscriptionDetails, subscriptionState.subscription]);

  // === MEMOIZED CONTEXT VALUE ===
  const contextValue = useMemo(() => ({
    // State
    subscription: subscriptionState.subscription,
    paymentHistory: subscriptionState.paymentHistory,
    isLoading: subscriptionState.isLoading,
    error: subscriptionState.error,
    lastUpdated: subscriptionState.lastUpdated,

    // Auth-based subscription data
    subscriptionId,
    subscriptionPaymentStatus,
    subscriptionPlan,
    subscriptionIsActive,
    subscriptionNextBillingDate,
    subscriptionExpirationNotification,

    // Actions
    fetchSubscriptionDetails,
    fetchPaymentHistory,
    createSubscription,
    initiatePayment,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    getPaymentStatus,
    updateSubscriptionCache,

    // Utility functions
    getSubscriptionStatus,
    isSubscriptionActive,
    isTrialActive,
    isProActive,
    isExpired,
    getDaysUntilExpiration,
    getSubscriptionPlan,

    // Constants
    SUBSCRIPTION_PLANS,
    PAYMENT_STATUS,
    SUBSCRIPTION_STATUS,
  }), [
    subscriptionState,
    subscriptionId,
    subscriptionPaymentStatus,
    subscriptionPlan,
    subscriptionIsActive,
    subscriptionNextBillingDate,
    subscriptionExpirationNotification,
    fetchSubscriptionDetails,
    fetchPaymentHistory,
    createSubscription,
    initiatePayment,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    getPaymentStatus,
    getSubscriptionStatus,
    isSubscriptionActive,
    isTrialActive,
    isProActive,
    isExpired,
    getDaysUntilExpiration,
    getSubscriptionPlan,
  ]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

export default SubscriptionContext;
