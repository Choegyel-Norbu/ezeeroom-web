import api from "./Api";

/**
 * Feedback Service
 * Handles all feedback-related API operations
 */
class FeedbackService {
  /**
   * Submit a feedback rating
   * @param {Object} feedbackData - The feedback data
   * @param {number} feedbackData.rating - Rating from 1-10
   * @param {string} feedbackData.comment - Optional comment
   * @param {number|null} feedbackData.userId - User ID (null for anonymous)
   * @param {boolean} feedbackData.isAnonymous - Whether feedback is anonymous
   * @param {Object} feedbackData.deviceInfo - Basic device information for tracking
   * @returns {Promise<Object>} Response data
   */
  async submitFeedback(feedbackData) {
    try {
      const response = await api.post("/feedbacks", feedbackData);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get feedback statistics (if endpoint exists)
   * @returns {Promise<Object>} Feedback statistics
   */
  async getFeedbackStats() {
    try {
      const response = await api.get("/feedbacks/stats");
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Check if device has already given feedback
   * @param {Object} deviceInfo - Device information
   * @param {string} deviceInfo.userAgent - User agent string
   * @param {string} deviceInfo.platform - Platform information
   * @param {string} deviceInfo.language - Language preference
   * @param {string} deviceInfo.screenResolution - Screen resolution
   * @returns {Promise<Object>} Device check response
   */
  async checkDeviceFeedback(deviceInfo) {
    try {
      const response = await api.post("/feedbacks/check-device", deviceInfo);
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get recent feedbacks (if endpoint exists)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Recent feedbacks
   */
  async getRecentFeedbacks(params = {}) {
    try {
      const response = await api.get("/feedbacks", { params });
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }
}

// Create and export a singleton instance
const feedbackService = new FeedbackService();
export default feedbackService;
