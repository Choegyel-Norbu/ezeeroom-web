/**
 * iOS WebKit Cross-Domain Authentication Detection
 * Determines if we need to use localStorage tokens instead of cookies
 * Applies to ALL iOS browsers (Safari, Chrome, Firefox, etc.) due to WebKit restrictions
 */

import { API_BASE_URL } from '@/shared/services/firebaseConfig';

/**
 * Detect if we're running on iOS (any browser)
 * All iOS browsers use WebKit and have the same cookie restrictions
 */
export const isIOS = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad|iphone|ipod/.test(userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Detect if we're running on iOS Safari specifically
 */
export const isIOSSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOSDevice = isIOS();
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|edgios/.test(userAgent);
  
  return isIOSDevice && isSafari;
};

/**
 * Detect if we're running on iOS Chrome
 */
export const isIOSChrome = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOSDevice = isIOS();
  const isChrome = /crios/.test(userAgent) || (/chrome/.test(userAgent) && isIOSDevice);
  
  return isIOSDevice && isChrome;
};

/**
 * Detect if we're running on any iOS WebKit browser
 * This includes Safari, Chrome, Firefox, Edge, etc. on iOS
 */
export const isIOSWebKit = () => {
  return isIOS(); // All iOS browsers use WebKit and have cookie restrictions
};

/**
 * Detect if we're running on macOS Safari (laptop/desktop)
 * macOS Safari DOES support secure cookies with SameSite=None; Secure
 * This is different from iOS Safari which blocks third-party cookies
 */
export const isMacOSSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMacOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints === 0;
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|edgios/.test(userAgent);
  
  return isMacOS && isSafari;
};

/**
 * Detect if API is on different domain (cross-domain scenario)
 */
export const isCrossDomain = () => {
  try {
    const currentDomain = window.location.hostname;
    const apiUrl = new URL(API_BASE_URL);
    const apiDomain = apiUrl.hostname;
    
    // Extract eTLD+1 (registrable domain) for comparison
    const getCurrentETLD = (domain) => {
      const parts = domain.split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }
      return domain;
    };
    
    const currentETLD = getCurrentETLD(currentDomain);
    const apiETLD = getCurrentETLD(apiDomain);
    
    return currentETLD !== apiETLD;
  } catch (error) {
    // Default to cross-domain for safety
    return true;
  }
};

/**
 * Determine if we should use cross-domain auth flow
 * Applies ONLY to iOS browsers (mobile devices), NOT macOS Safari
 * 
 * macOS Safari (laptop/desktop) supports secure cookies with SameSite=None; Secure
 * iOS Safari blocks third-party cookies due to ITP, requiring localStorage tokens
 */
export const shouldUseCrossDomainAuth = () => {
  const iosWebKitCheck = isIOSWebKit();
  const crossDomainCheck = isCrossDomain();
  const result = iosWebKitCheck && crossDomainCheck;
  
  // macOS Safari should use cookies, not localStorage tokens
  // This check ensures we don't accidentally trigger cross-domain auth for macOS
  if (isMacOSSafari()) {
    return false; // macOS Safari supports secure cookies
  }
  
  return result;
};

/**
 * Get appropriate auth endpoint based on detection
 */
export const getAuthEndpoint = () => {
  return shouldUseCrossDomainAuth() ? '/auth/firebase-cross-domain' : '/auth/firebase';
};

/**
 * Determine if requests should use credentials (withCredentials: true)
 * macOS Safari supports SameSite=None; Secure cookies even in cross-domain
 * iOS devices need localStorage tokens for cross-domain (no credentials)
 */
export const shouldUseCredentials = () => {
  // macOS Safari always uses credentials (supports cross-domain cookies)
  if (isMacOSSafari()) {
    return true;
  }
  
  // iOS devices only use credentials for same-domain
  // For cross-domain, they use localStorage tokens (no credentials)
  const useCrossDomain = shouldUseCrossDomainAuth();
  return !useCrossDomain;
};

/**
 * Get auth method description for logging
 */
export const getAuthMethodDescription = () => {
  if (shouldUseCrossDomainAuth()) {
    const iosSafari = isIOSSafari();
    const iosChrome = isIOSChrome();
    
    if (iosSafari) {
      return 'iOS Safari cross-domain: Using localStorage tokens with X-Access-Token headers';
    } else if (iosChrome) {
      return 'iOS Chrome cross-domain: Using localStorage tokens with X-Access-Token headers';
    } else {
      return 'iOS WebKit cross-domain: Using localStorage tokens with X-Access-Token headers';
    }
  }
  
  // Explicitly mention macOS Safari uses cookies
  if (isMacOSSafari()) {
    return 'macOS Safari: Using secure HTTP-only cookies (SameSite=None; Secure)';
  }
  
  return 'Standard flow: Using HTTP-only cookies';
};
