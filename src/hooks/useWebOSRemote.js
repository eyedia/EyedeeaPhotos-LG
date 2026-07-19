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

/** Magic Remote red color button (and browser fallbacks for local testing). */
export function isWebOSRedKey(event) {
  return (
    event.keyCode === 403
    || event.key === 'ColorF0Red'
    || event.key === 'r'
    || event.key === 'R'
  );
}

/**
 * Handle webOS Magic Remote OK / Enter key.
 */
export function useWebOSOkKey(onOk) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isOkKey =
        event.key === 'Enter'
        || event.key === 'NumpadEnter'
        || event.keyCode === 13
        || event.keyCode === 417;

      if (!isOkKey) return;

      const handled = onOk();
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onOk]);
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
