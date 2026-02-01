/**
 * Production Logger Utility
 * Conditional logging based on environment
 */

const IS_PRODUCTION = !chrome.runtime.getManifest().version.includes('dev');

export const logger = {
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.log('[Arena Companion]', ...args);
    }
  },
  
  warn: (...args) => {
    if (!IS_PRODUCTION) {
      console.warn('[Arena Companion]', ...args);
    }
  },
  
  error: (...args) => {
    console.error('[Arena Companion]', ...args);
  }
};
