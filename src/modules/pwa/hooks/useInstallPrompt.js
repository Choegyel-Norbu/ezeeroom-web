import { useState, useEffect } from 'react';

/**
 * Detects if the current device is a mobile device
 * Uses a combination of user agent check and screen width
 * @returns {boolean} - True if mobile device, false otherwise
 */
const isMobileDevice = () => {
    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent);

    // Check screen width (typically mobile devices are < 768px)
    const isMobileWidth = window.innerWidth <= 768;

    // Check for touch capability (most mobile devices have touch)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Consider it mobile if user agent matches OR (small screen AND has touch)
    return isMobileUserAgent || (isMobileWidth && hasTouch);
};

/**
 * Custom hook to handle PWA install prompt
 * Captures the beforeinstallprompt event and provides methods to trigger installation
 * Note: Install prompt is only shown on mobile devices
 */
const useInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Only show install prompt on mobile devices
        if (!isMobileDevice()) {
            return;
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Store the event so it can be triggered later
            setDeferredPrompt(e);
            setIsInstallable(true);

        };

        // Listen for successful installation
        const handleAppInstalled = () => {
            
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    /**
     * Show the install prompt to the user
     * @returns {Promise<boolean>} - Returns true if user accepted, false if dismissed
     */
    const promptInstall = async () => {
        if (!deferredPrompt) {
            
            return false;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // Clear the deferredPrompt for next time
        setDeferredPrompt(null);
        setIsInstallable(false);

        return outcome === 'accepted';
    };

    return {
        isInstallable,
        isInstalled,
        promptInstall,
    };
};

export default useInstallPrompt;
