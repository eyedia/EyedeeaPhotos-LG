/**
 * Minimal webOS TV platform stub for browser dev.
 * Replace with official webOSTV.js from LG SDK when packaging for TV.
 */
(function initWebOSStub(global) {
  if (global.webOS) {
    return;
  }

  global.webOS = {
    platform: {
      tv: typeof navigator !== 'undefined' && /Web0S|webOS|LG Browser/i.test(navigator.userAgent),
    },
    platformBack: function platformBack() {},
    service: {
      request: function request(_uri, _options) {},
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
