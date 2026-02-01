/**
 * Service Worker - Background Script
 * Handles extension lifecycle and side panel management
 * @author Mohammad Faiz
 */

import { logger } from '../utils/logger.js';
import { userDetails } from '../utils/user-details.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Opens the side panel for the current window
 * @param {number} windowId - Chrome window ID
 * @returns {Promise<void>}
 */
const openSidePanel = async (windowId) => {
  try {
    if (typeof windowId !== 'number' || windowId < 0) {
      throw new Error(ERROR_MESSAGES.INVALID_TAB);
    }
    
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
    if (!tab?.windowId) {
      logger.error(ERROR_MESSAGES.INVALID_TAB);
      return;
    }
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
    const { reason } = details;
    
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
      logger.info('Extension installed');
      await userDetails.initialize();
    } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
      const version = chrome.runtime.getManifest().version;
      logger.info(`Extension updated to version ${version}`);
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

/**
 * Handle service worker errors
 */
self.addEventListener('error', (event) => {
  logger.error('Service worker error', event.error);
});

/**
 * Handle unhandled promise rejections
 */
self.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
});

logger.info('Service worker initialized');
