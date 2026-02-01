/**
 * Storage Management Module
 * Professional wrapper for chrome.storage.local with error handling and data sanitization
 * @author Mohammad Faiz
 */

import { logger } from './logger.js';
import { CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * Sanitizes input data to prevent XSS and injection attacks
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    // Remove potentially dangerous characters and limit length
    return data
      .replace(/[<>'"&]/g, '')
      .substring(0, CONFIG.VALIDATION.MAX_STRING_LENGTH);
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (typeof data === 'object') {
    const sanitized = Array.isArray(data) ? [] : {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Validates data structure for storage
 * @param {*} data - Data to validate
 * @returns {boolean} Validation result
 */
const validateData = (data) => {
  if (data === null || data === undefined) {
    return false;
  }
  
  try {
    const stringified = JSON.stringify(data);
    if (stringified.length > CONFIG.STORAGE.MAX_SIZE_BYTES) {
      logger.warn('Data exceeds recommended storage size');
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks available storage quota
 * @returns {Promise<{usage: number, quota: number}>} Storage usage info
 */
const checkStorageQuota = async () => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  } catch (error) {
    logger.debug('Storage quota check failed', error);
    return { usage: 0, quota: 0 };
  }
};

export const storage = Object.freeze({
  /**
   * Retrieves data from chrome.storage.local
   * @param {string|string[]} keys - Storage key(s) to retrieve
   * @returns {Promise<Object>} Retrieved data
   */
  async get(keys) {
    try {
      if (!keys) {
        throw new Error(ERROR_MESSAGES.KEYS_REQUIRED);
      }
      const result = await chrome.storage.local.get(keys);
      logger.debug('Storage read:', keys);
      return result;
    } catch (error) {
      logger.error(ERROR_MESSAGES.STORAGE_READ, error);
      throw new Error(ERROR_MESSAGES.STORAGE_READ);
    }
  },

  /**
   * Stores data in chrome.storage.local with sanitization
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async set(items) {
    try {
      if (!items || typeof items !== 'object' || Array.isArray(items)) {
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }
      
      if (!validateData(items)) {
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }
      
      const sanitizedItems = sanitizeData(items);
      await chrome.storage.local.set(sanitizedItems);
      logger.debug('Storage write:', Object.keys(sanitizedItems));
    } catch (error) {
      if (error.message && error.message.includes('QUOTA_BYTES')) {
        logger.error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED, error);
        throw new Error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
      }
      logger.error(ERROR_MESSAGES.STORAGE_WRITE, error);
      throw new Error(ERROR_MESSAGES.STORAGE_WRITE);
    }
  },

  /**
   * Removes data from chrome.storage.local
   * @param {string|string[]} keys - Storage key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    try {
      if (!keys) {
        throw new Error(ERROR_MESSAGES.KEYS_REQUIRED);
      }
      await chrome.storage.local.remove(keys);
      logger.debug('Storage remove:', keys);
    } catch (error) {
      logger.error('Failed to remove from storage', error);
      throw error;
    }
  },

  /**
   * Clears all data from chrome.storage.local
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await chrome.storage.local.clear();
      logger.info('Storage cleared');
    } catch (error) {
      logger.error('Failed to clear storage', error);
      throw error;
    }
  },

  /**
   * Gets storage usage statistics
   * @returns {Promise<{usage: number, quota: number}>} Storage usage info
   */
  async getUsage() {
    return checkStorageQuota();
  }
});
