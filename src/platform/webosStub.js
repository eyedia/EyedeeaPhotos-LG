/**
 * Minimal webOS TV platform stub for browser dev.
 * Replace dist/webOSTVjs/webOSTV.js with official LG SDK file when packaging for TV.
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
