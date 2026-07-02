import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import InstallPrompt from './components/InstallPrompt';

const PWARegistration = () => {
  useEffect(() => {
    // registerSW returns an updateSW function that activates the waiting
    // service worker and then reloads the page. Calling window.location.reload()
    // directly does NOT activate the new SW, which causes onNeedRefresh to fire
    // again after the reload — creating an infinite refresh loop.
    const updateSW = registerSW({
      onNeedRefresh() {
        // Activate the new service worker and reload once
        updateSW(true);
      },
      onOfflineReady() {
        // App is ready to work offline
      },
    });
  }, []);

  return <InstallPrompt />;
};

export default PWARegistration;