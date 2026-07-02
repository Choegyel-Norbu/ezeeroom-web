import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Component to handle root path issues and Safari compatibility
 * This ensures proper routing behavior across different browsers
 */
const RootPathHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Detect Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    

    // Handle any URL fragments or query parameters that might interfere
    if (location.hash && location.hash.includes('#/')) {
      // Handle old hash-based routing if present
      const newPath = location.hash.replace('#/', '/');
      navigate(newPath, { replace: true });
      return;
    }

    // Only process Safari-specific fixes once to prevent infinite loops
    if ((isSafari || isIOS) && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      
      // Handle Safari-specific routing issues
      if (location.pathname === '/' && location.search === '' && location.hash === '') {
        // Just log that we're on Safari - no navigation needed
      }
    }
  }, [location.pathname, location.search, location.hash, navigate]); // Removed location object to prevent loops

  return null;
};

export default RootPathHandler;
