import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import internetConnectionDetector from '../utils/internetConnection';
import CustomOfflineToast from './CustomOfflineToast';

const InternetConnectionMonitor = () => {
  const [isOnline, setIsOnline] = useState(internetConnectionDetector.getConnectionStatus());
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    const handleConnectionChange = (online) => {
      setIsOnline(online);
      
      if (!online) {
        // Show custom offline toast
        setShowOfflineToast(true);
      } else {
        // Hide custom offline toast when connection is restored
        setShowOfflineToast(false);
        
        // Show brief success message using Sonner
        toast.success("Connection Restored", {
          description: "You're back online",
          duration: 3000,
        });
      }
    };

    // Add callback to the detector
    internetConnectionDetector.addCallback(handleConnectionChange);

    // Cleanup on unmount
    return () => {
      internetConnectionDetector.removeCallback(handleConnectionChange);
    };
  }, []);

  const handleCloseOfflineToast = () => {
    setShowOfflineToast(false);
  };

  return (
    <>
      <CustomOfflineToast 
        isVisible={showOfflineToast} 
        onClose={handleCloseOfflineToast}
      />
    </>
  );
};

export default InternetConnectionMonitor;
