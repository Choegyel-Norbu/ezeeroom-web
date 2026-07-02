import { useState, useEffect, useCallback } from "react";
import { getStorageItem, setStorageItem } from "@/shared/utils/safariLocalStorage";
import feedbackService from "@/shared/services/feedbackService";

const RATING_DIALOG_STORAGE_KEY = "ratingDialogShown";
const RATING_DIALOG_DELAY = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Custom hook to manage rating dialog auto-popup
 * Shows the dialog after 15 minutes if it hasn't been shown before
 */
export const useRatingDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownBefore, setHasShownBefore] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);

  // Check if dialog has been shown before
  useEffect(() => {
    const hasShown = getStorageItem(RATING_DIALOG_STORAGE_KEY) === "true";
    setHasShownBefore(hasShown);
  }, []);

  // Check if device has already given feedback
  const checkDeviceFeedback = useCallback(async () => {
    try {
      setIsCheckingDevice(true);
      
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`
      };

      const response = await feedbackService.checkDeviceFeedback(deviceInfo);
      
      // If device exists in database, don't show the popup
      if (response.deviceExists) {
        return false;
      }
      
      return true; // Device not found, can show popup
    } catch (error) {
      
      // If API call fails, show popup anyway (fallback)
      return true;
    } finally {
      setIsCheckingDevice(false);
    }
  }, []);

  // Set up auto-popup timer with device check
  useEffect(() => {
    if (hasShownBefore) return;

    const timer = setTimeout(async () => {
      const shouldShow = await checkDeviceFeedback();
      if (shouldShow) {
        setIsOpen(true);
      }
    }, RATING_DIALOG_DELAY);

    return () => clearTimeout(timer);
  }, [hasShownBefore, checkDeviceFeedback]);

  // Handle dialog close
  const handleClose = useCallback((open) => {
    setIsOpen(open);
    
    // If dialog is being closed, mark it as shown
    if (!open && !hasShownBefore) {
      setStorageItem(RATING_DIALOG_STORAGE_KEY, "true");
      setHasShownBefore(true);
    }
  }, [hasShownBefore]);

  // Manual trigger for testing or user action
  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    onOpenChange: handleClose,
    openDialog,
    hasShownBefore,
    isCheckingDevice,
  };
};
