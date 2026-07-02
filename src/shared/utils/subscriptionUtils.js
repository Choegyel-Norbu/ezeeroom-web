/**
 * Utility functions for subscription management
 */

/**
 * Calculate the number of days until a given date
 * @param {string|Date} targetDate - The target date (ISO string or Date object)
 * @returns {number} - Number of days until the target date (negative if past)
 */
export const calculateDaysUntil = (targetDate) => {
  if (!targetDate) return null;
  
  const target = new Date(targetDate);
  const now = new Date();
  
  // Reset time to start of day for accurate day calculation
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get a human-readable time until expiration
 * @param {string|Date} expirationDate - The expiration date
 * @returns {string} - Human-readable time string
 */
export const getTimeUntilExpiration = (expirationDate) => {
  const days = calculateDaysUntil(expirationDate);
  
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `Expires in ${days} days`;
  if (days <= 30) return `Expires in ${Math.ceil(days / 7)} weeks`;
  
  return `Expires in ${Math.ceil(days / 30)} months`;
};

/**
 * Check if a subscription is expiring soon (within 7 days)
 * @param {string|Date} expirationDate - The expiration date
 * @returns {boolean} - True if expiring within 7 days
 */
export const isExpiringSoon = (expirationDate) => {
  const days = calculateDaysUntil(expirationDate);
  return days !== null && days >= 0 && days <= 7;
};

/**
 * Check if a subscription is expired
 * @param {string|Date} expirationDate - The expiration date
 * @returns {boolean} - True if expired
 */
export const isExpired = (expirationDate) => {
  const days = calculateDaysUntil(expirationDate);
  return days !== null && days < 0;
};
