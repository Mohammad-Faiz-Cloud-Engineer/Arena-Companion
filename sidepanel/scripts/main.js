/**
 * Side Panel Main Script
 * Handles iframe loading, refresh functionality, and user interactions
 * @author Mohammad Faiz
 */

import { logger } from '../../utils/logger.js';
import { userDetails } from '../../utils/user-details.js';
import { CONFIG } from '../../utils/constants.js';

// DOM Elements - Cached for performance
let arenaFrame = null;
let loadingOverlay = null;
let refreshBtn = null;

/**
 * Initializes DOM element references
 * @throws {Error} If required DOM elements are not found
 */
const initializeDOMReferences = () => {
  arenaFrame = document.getElementById('arenaFrame');
  loadingOverlay = document.getElementById('loadingOverlay');
  refreshBtn = document.getElementById('refreshBtn');
  
  if (!arenaFrame || !loadingOverlay || !refreshBtn) {
    throw new Error(CONFIG.ERROR_MESSAGES.MISSING_DOM_ELEMENTS);
  }
};

/**
 * Hides the loading overlay with smooth transition
 */
const hideLoadingOverlay = () => {
  if (!loadingOverlay) return;
  
  loadingOverlay.classList.add('hidden');
  setTimeout(() => {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }, CONFIG.TIMEOUTS.OVERLAY_TRANSITION);
};

/**
 * Shows the loading overlay
 */
const showLoadingOverlay = () => {
  if (!loadingOverlay) return;
  
  loadingOverlay.style.display = 'flex';
  // Force reflow for smooth animation
  void loadingOverlay.offsetWidth;
  loadingOverlay.classList.remove('hidden');
};

/**
 * Refreshes the Arena iframe
 */
const refreshArenaFrame = () => {
  try {
    if (!arenaFrame) {
      logger.error('Arena frame not initialized');
      return;
    }
    
    showLoadingOverlay();
    arenaFrame.src = CONFIG.ARENA_URL;
    logger.info('Arena frame refreshed');
  } catch (error) {
    logger.error('Failed to refresh frame', error);
    hideLoadingOverlay();
  }
};

/**
 * Handles iframe load event
 */
const handleIframeLoad = () => {
  hideLoadingOverlay();
  logger.info('Arena Companion loaded successfully');
};

/**
 * Handles iframe error event
 * @param {Event} error - Error event
 */
const handleIframeError = (error) => {
  logger.error('Failed to load Arena Companion', error);
  hideLoadingOverlay();
};

/**
 * Initializes iframe event listeners
 */
const initializeIframe = () => {
  if (!arenaFrame) return;
  
  arenaFrame.addEventListener('load', handleIframeLoad);
  arenaFrame.addEventListener('error', handleIframeError);

  // Timeout fallback for loading overlay
  setTimeout(hideLoadingOverlay, CONFIG.TIMEOUTS.LOADING_OVERLAY);
};

/**
 * Initializes refresh button
 */
const initializeRefreshButton = () => {
  if (!refreshBtn) return;
  
  refreshBtn.addEventListener('click', refreshArenaFrame, { passive: true });
};

/**
 * Updates user activity timestamp
 * @returns {Promise<void>}
 */
const updateUserActivity = async () => {
  try {
    await userDetails.updateLastVisit();
  } catch (error) {
    logger.error('Failed to update user activity', error);
    // Non-critical error, don't throw
  }
};

/**
 * Cleanup function for event listeners
 */
const cleanup = () => {
  if (arenaFrame) {
    arenaFrame.removeEventListener('load', handleIframeLoad);
    arenaFrame.removeEventListener('error', handleIframeError);
  }
  if (refreshBtn) {
    refreshBtn.removeEventListener('click', refreshArenaFrame);
  }
};

/**
 * Initializes the side panel
 * @returns {Promise<void>}
 */
const initialize = async () => {
  try {
    logger.info('Initializing side panel');
    
    initializeDOMReferences();
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
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup, { once: true });
