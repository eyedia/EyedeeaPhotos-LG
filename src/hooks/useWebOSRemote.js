import { useEffect } from 'react';

/**
 * Handle webOS Magic Remote back key and browser Backspace fallback.
 */
export function useWebOSBackKey(onBack) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isBackKey =
        event.key === 'Backspace'
        || event.key === 'Escape'
        || event.keyCode === 461
        || event.keyCode === 10009;

      if (!isBackKey) return;

      const handled = onBack();
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onBack]);
}

export function launchWebOSApp() {
  if (typeof window === 'undefined' || !window.webOS?.platform?.tv) {
    return;
  }

  try {
    window.webOS.platformBack?.();
  } catch {
    // Optional platform hook
  }
}
