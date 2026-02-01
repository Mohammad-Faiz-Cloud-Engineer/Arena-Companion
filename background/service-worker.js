/**
 * Service Worker - Background Script
 * Handles extension lifecycle and side panel management
 */

import { logger } from '../utils/logger.js';
import { userDetails } from '../utils/user-details.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Opens the side panel for the current window
 * @param {number} windowId - Chrome window ID
 */
const openSidePanel = async (windowId) => {
  try {
    await chrome.sidePanel.open({ windowId });
    await userDetails.updateLastVisit();
    logger.info('Side panel opened successfully');
  } catch (error) {
    logger.error(ERROR_MESSAGES.PANEL_OPEN, error);
  }
};

/**
 * Handles extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await openSidePanel(tab.windowId);
  } catch (error) {
    logger.error('Failed to handle action click', error);
  }
});

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      logger.info('Extension installed');
      
      // Initialize default storage
      await userDetails.save({
        name: '',
        email: '',
        lastActive: null
      });
    } else if (details.reason === 'update') {
      logger.info('Extension updated to version', chrome.runtime.getManifest().version);
    }
  } catch (error) {
    logger.error('Installation handler error', error);
  }
});

/**
 * Service worker activation
 */
self.addEventListener('activate', (event) => {
  logger.info('Service worker activated');
  event.waitUntil(clients.claim());
});

logger.info('Service worker initialized');
