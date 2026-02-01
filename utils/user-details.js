/**
 * User Details Management Module
 * Handles user data with professional error handling and validation
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
  
  return hasValidName && hasValidEmail;
};

export const userDetails = {
  /**
   * Retrieves user details from storage
   * @returns {Promise<Object>} User details object
   */
  async get() {
    try {
      const result = await storage.get(CONFIG.STORAGE_KEYS.USER_DETAILS);
      const details = result[CONFIG.STORAGE_KEYS.USER_DETAILS] || CONFIG.DEFAULTS.USER_DETAILS;
      
      if (!validateUserDetails(details)) {
        logger.warn('Invalid user details found, returning defaults');
        return CONFIG.DEFAULTS.USER_DETAILS;
      }
      
      return details;
    } catch (error) {
      logger.error('Failed to get user details', error);
      return CONFIG.DEFAULTS.USER_DETAILS;
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
      
      const dataToSave = {
        ...details,
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
      await storage.set({
        [CONFIG.STORAGE_KEYS.LAST_VISIT]: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update last visit', error);
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
