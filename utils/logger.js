/**
 * Production Logger Utility
 * Conditional logging based on environment with performance optimization
 * @module logger
 * @author Mohammad Faiz
 * @version 1.4.0
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
 * @param {string} level - Log level
 * @param {...*} args - Arguments to format
 * @returns {Array} Formatted arguments
 */
const formatLogArgs = (level, ...args) => {
  const timestamp = new Date().toISOString();
  return [`[Arena Companion][${level}][${timestamp}]`, ...args];
};

/**
 * Sanitizes log data to prevent sensitive information leakage
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
const sanitizeLogData = (data, visited = new WeakSet()) => {
  if (typeof data === 'string') {
    // Mask potential sensitive patterns
    return data
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')
      .replace(/\b(?:Bearer|Token)\s+[A-Za-z0-9._-]+/gi, '[TOKEN_REDACTED]')
      .replace(/\b[A-Za-z0-9]{32,}\b/g, '[KEY_REDACTED]');
  }
  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeLogData(data.message, visited)
    };
  }
  if (typeof data === 'object' && data !== null) {
    if (visited.has(data)) {
      return '[CIRCULAR]';
    }
    visited.add(data);

    const sanitized = Array.isArray(data) ? [] : {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Redact sensitive keys
        if (/password|token|secret|key|auth/i.test(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeLogData(data[key], visited);
        }
      }
    }
    visited.delete(data);
    return sanitized;
  }
  return data;
};

export const logger = Object.freeze({
  /**
   * Logs informational messages (development only)
   * @param {...*} args - Arguments to log
   */
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.log(...formatLogArgs('INFO', ...args.map(sanitizeLogData)));
    }
  },
  
  /**
   * Logs warning messages (development only)
   * @param {...*} args - Arguments to log
   */
  warn: (...args) => {
    if (!IS_PRODUCTION) {
      console.warn(...formatLogArgs('WARN', ...args.map(sanitizeLogData)));
    }
  },
  
  /**
   * Logs error messages (always logged)
   * @param {...*} args - Arguments to log
   */
  error: (...args) => {
    console.error(...formatLogArgs('ERROR', ...args.map(sanitizeLogData)));
  },
  
  /**
   * Logs debug messages (development only, verbose)
   * @param {...*} args - Arguments to log
   */
  debug: (...args) => {
    if (!IS_PRODUCTION) {
      console.debug(...formatLogArgs('DEBUG', ...args.map(sanitizeLogData)));
    }
  }
});
