/**
 * Cross-Platform LocalStorage Utilities
 * Handles localStorage issues across different browsers and platforms
 */

// Cross-browser localStorage wrapper
class CrossBrowserStorage {
  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
    this.platform = this.detectPlatform();
    this.isPWA = this.checkPWAContext();
    this.isAndroid = this.checkAndroidDevice();
    this.isIOS = this.checkIOSDevice();
    this.quotaExceededCount = 0;
    this.isPrivateBrowsing = this.checkPrivateBrowsing();
    this.maxQuotaRetries = 3;
    
    // Initialize storage cleanup on quota issues
    this.initializeQuotaManagement();
  }

  // Detect platform
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (this.isPWA) return 'pwa';
    if (userAgent.includes('msie') || userAgent.includes('trident')) return 'ie';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('edge')) return 'edge';
    if (userAgent.includes('chrome')) return 'chrome';
    
    return 'unknown';
  }

  // Check if localStorage is available and working
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if we're in a PWA context
  checkPWAContext() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Check if we're on Android
  checkAndroidDevice() {
    return /Android/.test(navigator.userAgent);
  }

  // Check if we're on iOS
  checkIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Check if we're in private browsing mode
  checkPrivateBrowsing() {
    try {
      // Safari private browsing check
      if (this.platform === 'safari') {
        const testKey = '__private_test_' + Date.now();
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return false;
      }

      // Firefox private browsing check
      if (this.platform === 'firefox') {
        return 'MozAppearance' in document.documentElement.style && !window.indexedDB;
      }

      // Chrome incognito check (less reliable)
      if (this.platform === 'chrome') {
        return !window.requestFileSystem && !window.webkitRequestFileSystem;
      }

      return false;
    } catch (error) {
      // If localStorage.setItem throws, we're likely in private browsing
      return true;
    }
  }

  // Initialize quota management
  initializeQuotaManagement() {
    // Set up periodic cleanup for old data
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupOldData();
      }, 24 * 60 * 60 * 1000); // Daily cleanup
    }
  }

  // Clean up old data to free space
  cleanupOldData() {
    try {
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      // Only clean up non-essential keys
      const protectedKeys = [
        'userId', 'email', 'roles', 'activeRole', 'userName', 'pictureURL',
        'registerFlag', 'clientDetailSet', 'hotelId', 'topHotelIds'
      ];
      
      if (this.storageAvailable) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && !protectedKeys.includes(key)) {
            // Check if it's a timestamped entry
            if (key.includes('_timestamp_')) {
              const timestamp = parseInt(key.split('_timestamp_')[1], 10);
              if (timestamp && (now - timestamp) > maxAge) {
                localStorage.removeItem(key);
              }
            }
          }
        }
      }
    } catch (error) {
      // Silently handle cleanup errors
    }
  }

  // Platform-specific storage strategies
  getStorageStrategy() {
    switch (this.platform) {
      case 'ie':
        return {
          primary: 'localStorage',
          fallback: 'sessionStorage',
          backup: 'memory',
          reason: 'IE has limited storage support'
        };
      
      case 'safari':
        if (this.isIOS) {
          return {
            primary: 'localStorage',
            fallback: 'sessionStorage',
            backup: 'memory',
            reason: 'iOS Safari has private browsing restrictions'
          };
        } else {
          return {
            primary: 'localStorage',
            fallback: 'sessionStorage',
            backup: 'memory',
            reason: 'macOS Safari has good storage support'
          };
        }
      
      case 'firefox':
        return {
          primary: 'localStorage',
          fallback: 'sessionStorage',
          backup: 'memory',
          reason: 'Firefox has excellent storage support'
        };
      
      case 'pwa':
        return {
          primary: 'localStorage',
          fallback: 'sessionStorage',
          backup: 'memory',
          reason: 'PWA storage varies by platform'
        };
      
      case 'chrome':
      case 'edge':
      default:
        return {
          primary: 'localStorage',
          fallback: 'sessionStorage',
          backup: 'memory',
          reason: 'Chrome/Edge have excellent storage support'
        };
    }
  }

  // Memory storage fallback
  memoryStorage = new Map();

  // Safe getter with cross-platform handling and type conversion
  getItem(key, defaultValue = '') {
    const strategy = this.getStorageStrategy();
    
    if (!this.storageAvailable) {
      // Try sessionStorage fallback
      try {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue !== null) {
          return this.parseValue(sessionValue, defaultValue);
        }
      } catch (sessionError) {
        // Silently handle sessionStorage errors
      }
      
      // Try memory storage as last resort
      if (this.memoryStorage.has(key)) {
        return this.memoryStorage.get(key);
      }
      
      return defaultValue;
    }

    try {
      const value = localStorage.getItem(key);
      return this.parseValue(value, defaultValue);
    } catch (error) {
      // Platform-specific error recovery
      return this.handleStorageError(key, defaultValue, strategy);
    }
  }

  // Parse value with type conversion
  parseValue(value, defaultValue) {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return defaultValue;
    }

    // Handle empty strings
    if (value === '') {
      return defaultValue;
    }

    // Handle JSON parsing
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch (parseError) {
        return defaultValue;
      }
    }

    // Handle boolean values
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }

    // Handle number values
    if (!isNaN(value) && value !== '') {
      const num = Number(value);
      if (Number.isInteger(num)) {
        return num;
      }
      if (!Number.isNaN(num)) {
        return num;
      }
    }

    return value;
  }

  // Handle storage errors with platform-specific recovery
  handleStorageError(key, defaultValue, strategy) {
    // Try sessionStorage fallback
    if (strategy.fallback === 'sessionStorage') {
      try {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue !== null) {
          return this.parseValue(sessionValue, defaultValue);
        }
      } catch (sessionError) {
        // Silently handle sessionStorage errors
      }
    }
    
    // Try memory storage as last resort
    if (strategy.backup === 'memory' && this.memoryStorage.has(key)) {
      return this.memoryStorage.get(key);
    }
    
    return defaultValue;
  }

  // Safe setter with cross-platform handling
  setItem(key, value) {
    const strategy = this.getStorageStrategy();
    
    if (!this.storageAvailable || this.isPrivateBrowsing) {
      return this.setItemFallback(key, value, strategy);
    }

    try {
      const stringValue = this.stringifyValue(value);
      localStorage.setItem(key, stringValue);
      
      // Reset quota exceeded count on successful write
      this.quotaExceededCount = 0;
      
      // Platform-specific backup strategies
      this.createBackup(key, stringValue, strategy);
      
      return true;
    } catch (error) {
      // Handle quota exceeded specifically
      if (this.isQuotaExceededError(error)) {
        return this.handleQuotaExceeded(key, value, strategy);
      }
      
      return this.setItemFallback(key, value, strategy);
    }
  }

  // Stringify value for storage
  stringifyValue(value) {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return '';
    }

    // Handle complex objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return value.toString();
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value.toString();
    }

    // Default string handling
    return String(value);
  }

  // Create backup copies
  createBackup(key, value, strategy) {
    // SessionStorage backup
    if (strategy.fallback === 'sessionStorage') {
      try {
        sessionStorage.setItem(key, value);
      } catch (sessionError) {
        // Silently handle backup errors
      }
    }
    
    // Memory backup
    if (strategy.backup === 'memory') {
      try {
        this.memoryStorage.set(key, this.parseValue(value));
      } catch (memoryError) {
        // Silently handle backup errors
      }
    }
  }

  // Fallback setter
  setItemFallback(key, value, strategy) {
    const stringValue = this.stringifyValue(value);
    
    // Try sessionStorage fallback
    if (strategy.fallback === 'sessionStorage') {
      try {
        sessionStorage.setItem(key, stringValue);
        return true;
      } catch (sessionError) {
        // Silently handle sessionStorage errors
      }
    }
    
    // Try memory storage as last resort
    if (strategy.backup === 'memory') {
      try {
        this.memoryStorage.set(key, this.parseValue(stringValue));
        return true;
      } catch (memoryError) {
        // Silently handle memory storage errors
      }
    }
    
    return false;
  }

  // Safe remover
  removeItem(key) {
    const strategy = this.getStorageStrategy();
    
    if (!this.storageAvailable) {
      return this.removeItemFallback(key, strategy);
    }

    try {
      localStorage.removeItem(key);
      
      // Remove from all backup storages
      this.removeFromBackups(key, strategy);
      
      return true;
    } catch (error) {
      return this.removeItemFallback(key, strategy);
    }
  }

  // Remove from backup storages
  removeFromBackups(key, strategy) {
    // Remove from sessionStorage
    if (strategy.fallback === 'sessionStorage') {
      try {
        sessionStorage.removeItem(key);
      } catch (sessionError) {
        // Silently handle errors
      }
    }
    
    // Remove from memory storage
    if (strategy.backup === 'memory') {
      try {
        this.memoryStorage.delete(key);
      } catch (memoryError) {
        // Silently handle errors
      }
    }
  }

  // Fallback remover
  removeItemFallback(key, strategy) {
    // Try sessionStorage fallback
    if (strategy.fallback === 'sessionStorage') {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (sessionError) {
        // Silently handle errors
      }
    }
    
    // Try memory storage
    if (strategy.backup === 'memory') {
      try {
        this.memoryStorage.delete(key);
        return true;
      } catch (memoryError) {
        // Silently handle errors
      }
    }
    
    return false;
  }

  // Safe clearer
  clear() {
    const strategy = this.getStorageStrategy();
    
    if (!this.storageAvailable) {
      return this.clearFallback(strategy);
    }

    try {
      localStorage.clear();
      
      // Clear all backup storages
      this.clearBackups(strategy);
      
      return true;
    } catch (error) {
      return this.clearFallback(strategy);
    }
  }

  // Clear backup storages
  clearBackups(strategy) {
    // Clear sessionStorage
    if (strategy.fallback === 'sessionStorage') {
      try {
        sessionStorage.clear();
      } catch (sessionError) {
        // Silently handle errors
      }
    }
    
    // Clear memory storage
    if (strategy.backup === 'memory') {
      try {
        this.memoryStorage.clear();
      } catch (memoryError) {
        // Silently handle errors
      }
    }
  }

  // Fallback clearer
  clearFallback(strategy) {
    // Try sessionStorage fallback
    if (strategy.fallback === 'sessionStorage') {
      try {
        sessionStorage.clear();
        return true;
      } catch (sessionError) {
        // Silently handle errors
      }
    }
    
    // Try memory storage
    if (strategy.backup === 'memory') {
      try {
        this.memoryStorage.clear();
        return true;
      } catch (memoryError) {
        // Silently handle errors
      }
    }
    
    return false;
  }

  // Get all items (for debugging)
  getAllItems() {
    if (!this.storageAvailable) {
      return {};
    }

    try {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = this.getItem(key);
        }
      }
      return items;
    } catch (error) {
      return {};
    }
  }

  // Check if key exists
  hasItem(key) {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }

  // Get storage size
  getStorageSize() {
    if (!this.storageAvailable) {
      return 0;
    }

    try {
      let size = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          size += key.length + (value ? value.length : 0);
        }
      }
      return size;
    } catch (error) {
      return 0;
    }
  }

  // Cross-platform storage validation
  validateStorage() {
    const strategy = this.getStorageStrategy();
    
    try {
      const testKey = '__cross_platform_test__';
      const testValue = 'cross_platform_test_value';
      
      // Test primary storage
      this.setItem(testKey, testValue);
      const retrieved = this.getItem(testKey);
      this.removeItem(testKey);
      
      if (retrieved !== testValue) {
        return { 
          valid: false, 
          reason: `${strategy.primary} not working properly on ${this.platform}`,
          strategy 
        };
      }
      
      return { 
        valid: true, 
        reason: `Cross-platform storage working correctly on ${this.platform}`,
        strategy 
      };
    } catch (error) {
      return { 
        valid: false, 
        reason: `Cross-platform storage validation failed on ${this.platform}: ${error.message}`,
        strategy 
      };
    }
  }

  // Check if error is quota exceeded
  isQuotaExceededError(error) {
    return error && (
      error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.message.includes('quota') ||
      error.message.includes('storage')
    );
  }

  // Handle quota exceeded errors
  handleQuotaExceeded(key, value, strategy) {
    this.quotaExceededCount++;
    
    if (this.quotaExceededCount <= this.maxQuotaRetries) {
      // Try to free up space
      this.cleanupOldData();
      
      // Try again after cleanup
      try {
        const stringValue = this.stringifyValue(value);
        localStorage.setItem(key, stringValue);
        return true;
      } catch (retryError) {
        // Silently handle retry errors
      }
    }
    
    // Fallback to other storage methods
    return this.setItemFallback(key, value, strategy);
  }

  // Enhanced browser detection with version info
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'unknown';
    let version = '0';
    
    if (userAgent.includes('Firefox/')) {
      browser = 'firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '0';
    } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg')) {
      browser = 'chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '0';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
      browser = 'safari';
      version = userAgent.match(/Version\/(\d+)/)?.[1] || '0';
    } else if (userAgent.includes('Edg')) {
      browser = 'edge';
      version = userAgent.match(/Edg\/(\d+)/)?.[1] || '0';
    }
    
    return { browser, version: parseInt(version, 10) };
  }

  // Get storage capacity info
  async getStorageInfo() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          usagePercent: Math.round((estimate.usage / estimate.quota) * 100)
        };
      }
    } catch (error) {
      // Silently handle errors
    }
    
    return {
      quota: 'unknown',
      usage: 'unknown',
      available: 'unknown',
      usagePercent: 'unknown'
    };
  }

  // Get platform information
  getPlatformInfo() {
    const browserInfo = this.getBrowserInfo();
    
    return {
      platform: this.platform,
      browser: browserInfo.browser,
      browserVersion: browserInfo.version,
      isPWA: this.isPWA,
      isAndroid: this.isAndroid,
      isIOS: this.isIOS,
      isPrivateBrowsing: this.isPrivateBrowsing,
      storageAvailable: this.storageAvailable,
      quotaExceededCount: this.quotaExceededCount,
      strategy: this.getStorageStrategy()
    };
  }
}

// Create singleton instance
const crossBrowserStorage = new CrossBrowserStorage();

// Export utility functions
export const getStorageItem = (key, defaultValue = '') => {
  return crossBrowserStorage.getItem(key, defaultValue);
};

export const setStorageItem = (key, value) => {
  return crossBrowserStorage.setItem(key, value);
};

export const removeStorageItem = (key) => {
  return crossBrowserStorage.removeItem(key);
};

export const clearStorage = () => {
  return crossBrowserStorage.clear();
};

export const getAllStorageItems = () => {
  return crossBrowserStorage.getAllItems();
};

export const hasStorageItem = (key) => {
  return crossBrowserStorage.hasItem(key);
};

export const getStorageSize = () => {
  return crossBrowserStorage.getStorageSize();
};

export const validateStorage = () => {
  return crossBrowserStorage.validateStorage();
};

export const getPlatformInfo = () => {
  return crossBrowserStorage.getPlatformInfo();
};

// Enhanced storage information
export const getStorageInfo = async () => {
  return await crossBrowserStorage.getStorageInfo();
};

// Force cleanup of old data
export const cleanupStorage = () => {
  return crossBrowserStorage.cleanupOldData();
};

// Check if we're in private browsing
export const isPrivateBrowsing = () => {
  return crossBrowserStorage.isPrivateBrowsing;
};

// Browser-specific storage test
export const testStorageCompatibility = () => {
  return crossBrowserStorage.validateStorage();
};


// Authentication storage helpers
export const getAuthData = () => {
  const authKeys = ['token', 'userId', 'email', 'roles', 'activeRole', 'userName', 'pictureURL', 'registerFlag', 'clientDetailSet', 'hotelId', 'topHotelIds'];
  const authData = {};
  
  authKeys.forEach(key => {
    authData[key] = getStorageItem(key);
  });
  
  return authData;
};

export const setAuthData = (authData) => {
  Object.entries(authData).forEach(([key, value]) => {
    setStorageItem(key, value);
  });
};

export const clearAuthData = () => {
  const authKeys = [
    'token', 'accessToken', 'refreshToken', 'tokenExpiry', // Token keys
    'userId', 'email', 'roles', 'activeRole', 'userName', 'pictureURL', 
    'registerFlag', 'clientDetailSet', 'hotelId', 'topHotelIds',
    'lastTokenRefresh', 'lastAuthCheck' // Include API service keys
  ];
  
  authKeys.forEach(key => {
    removeStorageItem(key);
  });
};

// Safe storage operations with retries
export const setStorageItemSafe = async (key, value, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const success = setStorageItem(key, value);
    if (success) return true;
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
  }
  
  return false;
};

// Batch storage operations
export const setStorageItems = (items) => {
  const results = {};
  Object.entries(items).forEach(([key, value]) => {
    results[key] = setStorageItem(key, value);
  });
  return results;
};

// Get multiple storage items
export const getStorageItems = (keys) => {
  const results = {};
  keys.forEach(key => {
    results[key] = getStorageItem(key);
  });
  return results;
};

export default crossBrowserStorage;
