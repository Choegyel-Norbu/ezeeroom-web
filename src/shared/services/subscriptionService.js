import api from "./Api";
import { API_BASE_URL } from "./firebaseConfig";

/**
 * Subscription Service
 * Handles all subscription-related API operations following the backend endpoint structure
 */
class SubscriptionService {
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - The subscription data
   * @param {number} subscriptionData.userId - User ID
   * @param {string} subscriptionData.subscriptionPlan - Subscription plan (TRIAL, PRO)
   * @param {string} subscriptionData.paymentStatus - Payment status (PENDING, PAID, FAILED)
   * @param {string} subscriptionData.trialStartDate - Trial start date (ISO string)
   * @param {string} subscriptionData.trialEndDate - Trial end date (ISO string)
   * @param {string} subscriptionData.nextBillingDate - Next billing date (ISO string)
   * @param {string|null} subscriptionData.cancelDate - Cancel date (ISO string or null)
   * @param {string|null} subscriptionData.lastPaymentDate - Last payment date (ISO string or null)
   * @param {string} subscriptionData.notes - Additional notes
   * @returns {Promise<Object>} Response data
   */
  async createSubscription(subscriptionData) {
    try {
      const response = await api.post("/subscriptions", subscriptionData);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get subscriptions by user ID (hotel-based)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of subscription data
   */
  async getSubscriptionsByUserId(userId) {
    try {
      const response = await api.get(`/subscriptions/user/${userId}`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get subscription by user ID (backward compatibility - returns first active subscription)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Subscription data
   */
  async getSubscriptionByUserId(userId) {
    try {
      const subscriptions = await this.getSubscriptionsByUserId(userId);
      
      // Return the first active subscription or the first subscription if none are active
      const activeSubscription = subscriptions.find(sub => sub.isActive) || subscriptions[0];
      
      if (!activeSubscription) {
        throw new Error('No subscription found for user');
      }
      
      return activeSubscription;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription data
   */
  async getSubscriptionById(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription data
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}`, updateData);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Initiate subscription payment
   * @param {Object} paymentRequest - Payment request data
   * @param {number} paymentRequest.hotelId - Hotel ID
   * @param {number} paymentRequest.userId - User ID
   * @param {string} paymentRequest.subscriptionPlan - Subscription plan (PRO)
   * @param {number} paymentRequest.amount - Payment amount
   * @param {string} paymentRequest.notes - Payment notes
   * @param {string} baseUrl - Base URL for payment callback (optional)
   * @returns {Promise<Object>} Payment initiation response
   */
  async initiateSubscriptionPayment(paymentRequest, baseUrl = "https://www.ezeeroom.bt") {
    try {
      const params = new URLSearchParams();
      if (baseUrl) {
        params.append('baseUrl', baseUrl);
      }
      
      const url = `/payment/initiate${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.post(url, paymentRequest);
      
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Handle payment callback/webhook
   * @param {Object} callbackData - Payment callback data
   * @returns {Promise<Object>} Callback processing result
   */
  async handlePaymentCallback(callbackData) {
    try {
      const response = await api.post("/payment/callback", callbackData);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transactionId) {
    try {
      const response = await api.get(`/payment/status/${transactionId}`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {number} subscriptionId - Subscription ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionId, reason = "User requested cancellation") {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Reactivate subscription
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Reactivation result
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/reactivate`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get subscription analytics/statistics
   * @param {number} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Subscription analytics
   */
  async getSubscriptionAnalytics(userId = null) {
    try {
      const url = userId ? `/subscriptions/analytics?userId=${userId}` : "/subscriptions/analytics";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get subscription history
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Subscription history
   */
  async getSubscriptionHistory(userId) {
    try {
      const response = await api.get(`/subscriptions/user/${userId}`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get subscription for specific hotel
   * @param {number} userId - User ID
   * @param {number} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Subscription data for the specific hotel
   */
  async getSubscriptionForHotel(userId, hotelId) {
    try {
      const subscriptions = await this.getSubscriptionsByUserId(userId);
      
      // Find subscription for the specific hotel
      const hotelSubscription = subscriptions.find(sub => 
        sub.hotelId && sub.hotelId.toString() === hotelId.toString()
      );
      
      if (hotelSubscription) {
        return hotelSubscription;
      } else {
        return null;
      }
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Validate subscription status
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Validation result
   */
  async validateSubscriptionStatus(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/validate`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get upcoming renewals (for admin/analytics)
   * @param {number} days - Number of days ahead to check (default: 7)
   * @returns {Promise<Array>} Upcoming renewals
   */
  async getUpcomingRenewals(days = 7) {
    try {
      const response = await api.get(`/subscriptions/renewals/upcoming?days=${days}`);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Send subscription reminder
   * @param {number} subscriptionId - Subscription ID
   * @param {string} reminderType - Type of reminder (EXPIRATION, PAYMENT_DUE, etc.)
   * @returns {Promise<Object>} Reminder result
   */
  async sendSubscriptionReminder(subscriptionId, reminderType = "EXPIRATION") {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/reminder`, { 
        reminderType 
      });
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }
}

// Create and export a singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;

// Also export the class for testing purposes
export { SubscriptionService };
