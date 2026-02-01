/**
 * Side Panel Main Script
 * Handles iframe loading, refresh functionality, and user interactions
 * @author Mohammad Faiz
 */

import { logger } from '../../utils/logger.js';
import { userDetails } from '../../utils/user-details.js';
import { CONFIG, ERROR_MESSAGES } from '../../utils/constants.js';

// DOM Elements - Cached for performance
let arenaFrame = null;
let loadingOverlay = null;
let refreshBtn = null;
let loadTimeout = null;

/**
 * Initializes DOM element references
 * @throws {Error} If required DOM elements are not found
 */
const initializeDOMReferences = () => {
  arenaFrame = document.getElementById('arenaFrame');
  loadingOverlay = document.getElementById('loadingOverlay');
  refreshBtn = document.getElementById('refreshBtn');
  
  if (!arenaFrame || !loadingOverlay || !refreshBtn) {
    throw new Error(ERROR_MESSAGES.MISSING_DOM_ELEMENTS);
  }
};

/**
 * Hides the loading overlay with smooth transition
 */
const hideLoadingOverlay = () => {
  if (!loadingOverlay) return;
  
  // Clear any existing timeout
  if (loadTimeout) {
    clearTimeout(loadTimeout);
    loadTimeout = null;
  }
  
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
 * Debounced refresh function to prevent rapid clicks
 */
let refreshDebounceTimer = null;
const refreshArenaFrame = () => {
  if (refreshDebounceTimer) {
    logger.debug('Refresh debounced');
    return;
  }
  
  try {
    if (!arenaFrame) {
      logger.error('Arena frame not initialized');
      return;
    }
    
    showLoadingOverlay();
    arenaFrame.src = CONFIG.ARENA_URL;
    logger.info('Arena frame refreshed');
    
    // Debounce for 1 second
    refreshDebounceTimer = setTimeout(() => {
      refreshDebounceTimer = null;
    }, 1000);
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
  
  // Update user activity in background
  userDetails.updateLastVisit().catch(err => 
    logger.debug('Failed to update last visit', err)
  );
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
  
  arenaFrame.addEventListener('load', handleIframeLoad, { once: false });
  arenaFrame.addEventListener('error', handleIframeError, { once: false });

  // Timeout fallback for loading overlay
  loadTimeout = setTimeout(hideLoadingOverlay, CONFIG.TIMEOUTS.LOADING_OVERLAY);
};

/**
 * Initializes refresh button with keyboard support
 */
const initializeRefreshButton = () => {
  if (!refreshBtn) return;
  
  refreshBtn.addEventListener('click', refreshArenaFrame, { passive: true });
  
  // Keyboard accessibility
  refreshBtn.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      refreshArenaFrame();
    }
  }, { passive: false });
};

/**
 * Handles visibility change to optimize performance
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    logger.debug('Side panel hidden');
  } else {
    logger.debug('Side panel visible');
    // Update user activity when panel becomes visible
    userDetails.updateLastVisit().catch(err => 
      logger.debug('Failed to update last visit', err)
    );
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
  if (loadTimeout) {
    clearTimeout(loadTimeout);
  }
  if (refreshDebounceTimer) {
    clearTimeout(refreshDebounceTimer);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    
    // Initial user activity update (non-blocking)
    userDetails.updateLastVisit().catch(err => 
      logger.debug('Failed to update last visit', err)
    );
    
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
