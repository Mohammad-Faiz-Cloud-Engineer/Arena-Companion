/**
 * Production Logger Utility
 * Conditional logging based on environment
 * @author Mohammad Faiz
 */

const IS_PRODUCTION = (() => {
  try {
    const manifest = chrome.runtime.getManifest();
    return !manifest.version.includes('dev');
  } catch {
    return true; // Default to production if manifest unavailable
  }
})();

/**
 * Formats log arguments for consistent output
 * @param {...*} args - Arguments to format
 * @returns {Array} Formatted arguments
 */
const formatLogArgs = (...args) => {
  const timestamp = new Date().toISOString();
  return [`[Arena Companion ${timestamp}]`, ...args];
};

export const logger = Object.freeze({
  /**
   * Logs informational messages (development only)
   * @param {...*} args - Arguments to log
   */
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.log(...formatLogArgs(...args));
    }
  },
  
  /**
   * Logs warning messages (development only)
   * @param {...*} args - Arguments to log
   */
  warn: (...args) => {
    if (!IS_PRODUCTION) {
      console.warn(...formatLogArgs(...args));
    }
  },
  
  /**
   * Logs error messages (always logged)
   * @param {...*} args - Arguments to log
   */
  error: (...args) => {
    console.error(...formatLogArgs(...args));
  }
});
