/**
 * User Details Management Module
 * Handles user data with professional error handling and validation
 * @author Mohammad Faiz
 */

import { storage } from './storage.js';
import { CONFIG } from './constants.js';
import { logger } from './logger.js';

/**
 * Validates user details structure
 * @param {Object} details - User details object
 * @returns {boolean} Validation result
 */
const validateUserDetails = (details) => {
  if (!details || typeof details !== 'object') {
    return false;
  }
  
  const hasValidName = typeof details.name === 'string';
  const hasValidEmail = typeof details.email === 'string';
  const hasValidLastActive = details.lastActive === null || typeof details.lastActive === 'string';
  
  return hasValidName && hasValidEmail && hasValidLastActive;
};

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} Validation result
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return true; // Empty is valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const userDetails = {
  /**
   * Initializes user details with default values
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const existing = await this.get();
      
      // Only initialize if no valid data exists
      if (!existing.name && !existing.email) {
        await storage.set({
          [CONFIG.STORAGE_KEYS.USER_DETAILS]: CONFIG.DEFAULTS.USER_DETAILS
        });
        logger.info('User details initialized with defaults');
      }
    } catch (error) {
      logger.error('Failed to initialize user details', error);
      throw error;
    }
  },

  /**
   * Retrieves user details from storage
   * @returns {Promise<Object>} User details object
   */
  async get() {
    try {
      const result = await storage.get(CONFIG.STORAGE_KEYS.USER_DETAILS);
      const details = result[CONFIG.STORAGE_KEYS.USER_DETAILS];
      
      if (!details || !validateUserDetails(details)) {
        logger.warn('Invalid user details found, returning defaults');
        return { ...CONFIG.DEFAULTS.USER_DETAILS };
      }
      
      return details;
    } catch (error) {
      logger.error('Failed to get user details', error);
      return { ...CONFIG.DEFAULTS.USER_DETAILS };
    }
  },

  /**
   * Saves user details to storage
   * @param {Object} details - User details object
   * @returns {Promise<void>}
   */
  async save(details) {
    try {
      if (!validateUserDetails(details)) {
        throw new Error('Invalid user details format');
      }
      
      if (details.email && !validateEmail(details.email)) {
        throw new Error('Invalid email format');
      }
      
      const dataToSave = {
        name: details.name.trim(),
        email: details.email.trim(),
        lastActive: new Date().toISOString()
      };
      
      await storage.set({
        [CONFIG.STORAGE_KEYS.USER_DETAILS]: dataToSave
      });
      
      logger.info('User details saved successfully');
    } catch (error) {
      logger.error('Failed to save user details', error);
      throw error;
    }
  },

  /**
   * Updates last visit timestamp
   * @returns {Promise<void>}
   */
  async updateLastVisit() {
    try {
      const timestamp = new Date().toISOString();
      await storage.set({
        [CONFIG.STORAGE_KEYS.LAST_VISIT]: timestamp
      });
      logger.info('Last visit updated');
    } catch (error) {
      logger.error('Failed to update last visit', error);
      // Don't throw - this is non-critical
    }
  },

  /**
   * Clears user details from storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await storage.remove(CONFIG.STORAGE_KEYS.USER_DETAILS);
      logger.info('User details cleared');
    } catch (error) {
      logger.error('Failed to clear user details', error);
      throw error;
    }
  }
};
