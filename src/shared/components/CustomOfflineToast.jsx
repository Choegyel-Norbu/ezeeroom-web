import React, { useState, useEffect } from 'react';

const CustomOfflineToast = ({ isVisible, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div
        className={`
          bg-neutral-950 border-l-4 border-l-amber-400 border border-neutral-800 rounded-md
          transition-all duration-300 ease-out
          ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
        `}
      >
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white leading-snug">No Internet Connection</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  {isOnline ? 'Connection detected — ready to reconnect.' : 'Check your network and try again.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors mt-0.5"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-7 text-[12px] font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
            >
              {isOnline ? 'Reconnect' : 'Try Again'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-7 text-[12px] font-medium border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomOfflineToast;
