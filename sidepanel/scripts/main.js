/**
 * Side Panel Main Script
 * Handles iframe loading, refresh functionality, and user interactions
 */

import { logger } from '../../utils/logger.js';
import { userDetails } from '../../utils/user-details.js';
import { CONFIG } from '../../utils/constants.js';

// DOM Elements
const arenaFrame = document.getElementById('arenaFrame');
const loadingOverlay = document.getElementById('loadingOverlay');
const refreshBtn = document.getElementById('refreshBtn');

/**
 * Hides the loading overlay with smooth transition
 */
const hideLoadingOverlay = () => {
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    setTimeout(() => {
      loadingOverlay.style.display = 'none';
    }, 200);
  }
};

/**
 * Shows the loading overlay
 */
const showLoadingOverlay = () => {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
    loadingOverlay.classList.remove('hidden');
  }
};

/**
 * Refreshes the Arena AI iframe
 */
const refreshArenaFrame = () => {
  try {
    showLoadingOverlay();
    arenaFrame.src = CONFIG.ARENA_URL;
    logger.info('Arena frame refreshed');
  } catch (error) {
    logger.error('Failed to refresh frame', error);
    hideLoadingOverlay();
  }
};

/**
 * Initializes iframe event listeners
 */
const initializeIframe = () => {
  // Handle iframe load event
  arenaFrame.addEventListener('load', () => {
    hideLoadingOverlay();
    logger.info('Arena Companion loaded successfully');
  });

  // Handle iframe error
  arenaFrame.addEventListener('error', (error) => {
    logger.error('Failed to load Arena Companion', error);
    hideLoadingOverlay();
  });

  // Timeout fallback for loading overlay
  setTimeout(() => {
    hideLoadingOverlay();
  }, 5000);
};

/**
 * Initializes refresh button
 */
const initializeRefreshButton = () => {
  refreshBtn.addEventListener('click', refreshArenaFrame);
};

/**
 * Updates user activity timestamp
 */
const updateUserActivity = async () => {
  try {
    await userDetails.updateLastVisit();
  } catch (error) {
    logger.error('Failed to update user activity', error);
  }
};

/**
 * Initializes the side panel
 */
const initialize = async () => {
  try {
    logger.info('Initializing side panel');
    
    initializeIframe();
    initializeRefreshButton();
    await updateUserActivity();
    
    logger.info('Side panel initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize side panel', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
