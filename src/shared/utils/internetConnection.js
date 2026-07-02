/**
 * Internet Connection Detection Utility
 * Detects when the user goes offline and triggers callbacks
 */

class InternetConnectionDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks(false);
    });
  }

  // Add callback function to be called when connection status changes
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  // Remove callback function
  removeCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  // Notify all callbacks about connection status change
  notifyCallbacks(isOnline) {
    this.callbacks.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        
      }
    });
  }

  // Get current connection status
  getConnectionStatus() {
    return this.isOnline;
  }

  // Test actual internet connectivity (not just browser online status)
  async testConnectivity() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const internetConnectionDetector = new InternetConnectionDetector();

export default internetConnectionDetector;
