/**
 * Security Utilities
 * 
 * Provides cryptographic and security-related utilities for preventing
 * price manipulation and ensuring request integrity.
 * 
 * ⚠️ SECURITY NOTE: This is CLIENT-SIDE security - defense in depth only.
 * PRIMARY security MUST be implemented on the backend.
 */

/**
 * Generates a unique transaction ID for tracking and audit purposes
 * Format: TXN_[timestamp]_[random]
 * 
 * @returns {string} Unique transaction ID
 */
export const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `TXN_${timestamp}_${random}`;
};

/**
 * Generates a fingerprint of booking request for integrity verification
 * This helps detect if the request was modified in transit.
 * 
 * ⚠️ NOTE: This is NOT cryptographically secure on its own.
 * Backend must implement proper HMAC signing with secret keys.
 * 
 * @param {Object} bookingData - The booking data to fingerprint
 * @returns {string} Request fingerprint
 */
export const generateRequestFingerprint = (bookingData) => {
  // Create a stable string representation of the booking data
  const dataString = JSON.stringify({
    roomId: bookingData.roomId,
    hotelId: bookingData.hotelId,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    checkInTime: bookingData.checkInTime,
    bookHour: bookingData.bookHour,
    guests: bookingData.guests,
    numberOfRooms: bookingData.numberOfRooms,
    timeBased: bookingData.timeBased,
    timestamp: bookingData.timestamp || Date.now()
  });
  
  // Simple hash (browser-compatible, not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `FP_${Math.abs(hash).toString(36)}`;
};

/**
 * Sanitizes booking data before sending to server
 * Removes any price-related fields that should be calculated server-side
 * 
 * @param {Object} payload - The booking payload
 * @returns {Object} Sanitized payload
 */
export const sanitizeBookingPayload = (payload) => {
  const sanitized = { ...payload };
  
  // Remove client-calculated prices (these will be ignored by secure backend)
  // Keep them commented out as documentation
  delete sanitized.totalPrice;
  delete sanitized.txnTotalPrice;
  
  // Add security metadata
  sanitized.clientTimestamp = Date.now();
  sanitized.clientFingerprint = generateRequestFingerprint(payload);
  
  return sanitized;
};

/**
 * Validates that a booking response price matches expected calculation
 * This is for client-side UX validation only, not security.
 * 
 * @param {Object} serverResponse - Response from server
 * @param {number} expectedPrice - Price we calculated for display
 * @returns {Object} Validation result { isValid, message, discrepancy }
 */
export const validateServerPricing = (serverResponse, expectedPrice) => {
  const serverPrice = serverResponse.totalPrice || serverResponse.txnTotalPrice;
  
  if (!serverPrice) {
    return {
      isValid: false,
      message: "Server did not return pricing information",
      discrepancy: null
    };
  }
  
  // Allow small floating-point discrepancies (within 1 unit)
  const discrepancy = Math.abs(serverPrice - expectedPrice);
  const isValid = discrepancy <= 1;
  
  if (!isValid) {
    
  }
  
  return {
    isValid,
    message: isValid 
      ? "Price validated successfully" 
      : `Price mismatch: Expected ${expectedPrice}, got ${serverPrice}`,
    discrepancy
  };
};

/**
 * Creates security headers for sensitive requests
 * 
 * @param {Object} requestData - The request data
 * @returns {Object} Headers object
 */
export const createSecurityHeaders = (requestData) => {
  return {
    'X-Client-Timestamp': Date.now().toString(),
    'X-Transaction-ID': generateTransactionId(),
    'X-Request-Fingerprint': generateRequestFingerprint(requestData)
  };
};

/**
 * Detects suspicious booking patterns (client-side early warning)
 * Backend MUST implement comprehensive fraud detection
 * 
 * @param {Object} bookingData - Booking data to analyze
 * @returns {Object} { suspicious, reasons[] }
 */
export const detectSuspiciousPattern = (bookingData) => {
  const reasons = [];
  
  // Check for common tampering indicators
  if (bookingData.totalPrice === 1 || bookingData.totalPrice === 10 || bookingData.totalPrice === 100) {
    reasons.push("Suspiciously round price value");
  }
  
  if (bookingData.guests > 50) {
    reasons.push("Unusually high guest count");
  }
  
  if (bookingData.numberOfRooms > 20) {
    reasons.push("Unusually high room count");
  }
  
  // Check for invalid dates
  if (bookingData.checkInDate && bookingData.checkOutDate) {
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    
    if (checkOut <= checkIn) {
      reasons.push("Invalid date range");
    }
    
    const daysDiff = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      reasons.push("Unusually long booking duration");
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons
  };
};

/**
 * Logs security events to console (development) and optionally to backend
 * 
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 */
export const logSecurityEvent = (eventType, details) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    
  }
  
  // In production, send to backend for monitoring
  // Uncomment when backend endpoint is ready:
  /*
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(err => );
  }
  */
};

/**
 * Validates environment for secure operations
 * Checks for common security issues in the client environment
 * 
 * @returns {Object} { secure, warnings[] }
 */
export const validateSecureEnvironment = () => {
  const warnings = [];
  
  // Check if HTTPS is being used (except localhost)
  if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
    warnings.push('Not using HTTPS - connection is not secure');
  }
  
  // Check for common debugging tools (could indicate tampering)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    // React DevTools is fine in development
    if (process.env.NODE_ENV === 'production') {
      warnings.push('Developer tools detected in production');
    }
  }
  
  return {
    secure: warnings.length === 0,
    warnings
  };
};

/**
 * Rate limiting helper (client-side)
 * Prevents rapid repeated requests (basic protection)
 * 
 * @param {string} key - Unique key for the action
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if action is allowed
 */
export const checkRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    const attempts = stored ? JSON.parse(stored) : [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { key, attempts: recentAttempts.length });
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(storageKey, JSON.stringify(recentAttempts));
    
    return true;
  } catch (error) {
    // If localStorage fails, allow the action (fail open)
    
    return true;
  }
};

/**
 * Clears rate limit for a specific key
 * Useful after successful operations
 * 
 * @param {string} key - The rate limit key to clear
 */
export const clearRateLimit = (key) => {
  const storageKey = `rateLimit_${key}`;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    
  }
};

export default {
  generateTransactionId,
  generateRequestFingerprint,
  sanitizeBookingPayload,
  validateServerPricing,
  createSecurityHeaders,
  detectSuspiciousPattern,
  logSecurityEvent,
  validateSecureEnvironment,
  checkRateLimit,
  clearRateLimit
};

