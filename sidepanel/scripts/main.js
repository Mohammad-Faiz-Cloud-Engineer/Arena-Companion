/**
 * Side Panel Main Script
 * Handles iframe loading, refresh functionality, user interactions, and prompt forwarding
 * @author Mohammad Faiz
 * @version 1.3.0
 */

import { logger } from '../../utils/logger.js';
import { userDetails } from '../../utils/user-details.js';
import { CONFIG, ERROR_MESSAGES, ACTION_STORAGE_KEYS } from '../../utils/constants.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = ACTION_STORAGE_KEYS?.PENDING_ACTION || 'arena_companion_pending_action';
const ACTION_EXPIRY_MS = CONFIG?.TIMEOUTS?.ACTION_EXPIRY || 30000;
const POLL_INTERVAL = CONFIG?.TIMEOUTS?.STORAGE_POLL_INTERVAL || 500;

// ============================================================================
// DOM REFERENCES
// ============================================================================

let arenaFrame = null;
let loadingOverlay = null;
let refreshBtn = null;
let loadTimeout = null;
let refreshDebounceTimer = null;
let pollInterval = null;

// Track processed actions to prevent duplicates
const processedActionIds = new Set();

// ============================================================================
// DOM INITIALIZATION
// ============================================================================

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

// ============================================================================
// LOADING OVERLAY
// ============================================================================

/**
 * Hides the loading overlay with smooth transition
 */
const hideLoadingOverlay = () => {
  if (!loadingOverlay) return;

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
  void loadingOverlay.offsetWidth; // Force reflow
  loadingOverlay.classList.remove('hidden');
};

// ============================================================================
// IFRAME MANAGEMENT
// ============================================================================

/**
 * Debounced refresh function to prevent rapid clicks
 */
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

  // Check for pending actions after iframe loads
  checkPendingActions();

  userDetails.updateLastVisit().catch((err) =>
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

  loadTimeout = setTimeout(hideLoadingOverlay, CONFIG.TIMEOUTS.LOADING_OVERLAY);
};

// ============================================================================
// PROMPT FORWARDING
// ============================================================================

/**
 * Forwards a prompt to the Arena.AI iframe
 * @param {string} prompt - Prompt to forward
 * @param {string} actionId - Action ID for tracking
 */
const forwardToIframe = (prompt, actionId) => {
  if (!arenaFrame || !arenaFrame.contentWindow) {
    logger.warn('Iframe not ready for message forwarding');
    return false;
  }

  try {
    // Post message to iframe
    arenaFrame.contentWindow.postMessage(
      {
        type: 'ARENA_COMPANION_INJECT_PROMPT',
        prompt,
        actionId,
        timestamp: Date.now()
      },
      'https://arena.ai'
    );

    logger.debug('Prompt forwarded to iframe', { actionId });
    return true;
  } catch (error) {
    logger.error('Failed to forward prompt to iframe', error);
    return false;
  }
};

/**
 * Checks for pending actions in storage
 */
/**
 * Checks for pending actions in storage
 * @deprecated Content script now handles this directly to prevent race conditions
 */
const checkPendingActions = async () => {
  // Logic removed to prevent race condition with content script
  // The content script inside the iframe handles storage polling directly
  return;
};

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handles messages from the background script
 */
const handleMessage = (message, sender, sendResponse) => {
  if (message.type === 'INJECT_PROMPT') {
    logger.debug('Received INJECT_PROMPT in sidepanel');

    // Check if already processed
    if (processedActionIds.has(message.actionId)) {
      sendResponse({ success: false, reason: 'Already processed' });
      return true;
    }

    processedActionIds.add(message.actionId);
    const success = forwardToIframe(message.prompt, message.actionId);
    sendResponse({ success });
    return true;
  }

  return false;
};

// ============================================================================
// REFRESH BUTTON
// ============================================================================

/**
 * Initializes refresh button with keyboard support
 */
const initializeRefreshButton = () => {
  if (!refreshBtn) return;

  refreshBtn.addEventListener('click', refreshArenaFrame, { passive: true });

  refreshBtn.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        refreshArenaFrame();
      }
    },
    { passive: false }
  );
};

// ============================================================================
// VISIBILITY HANDLING
// ============================================================================

/**
 * Handles visibility change to optimize performance
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    logger.debug('Side panel hidden');
  } else {
    logger.debug('Side panel visible');

    // Check for pending actions when panel becomes visible
    checkPendingActions();

    userDetails.updateLastVisit().catch((err) =>
      logger.debug('Failed to update last visit', err)
    );
  }
};

// ============================================================================
// CLEANUP
// ============================================================================

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
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  chrome.runtime.onMessage.removeListener(handleMessage);
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the side panel
 * @returns {Promise<void>}
 */
const initialize = async () => {
  try {
    logger.info('Initializing side panel v1.3.0');

    initializeDOMReferences();
    initializeIframe();
    initializeRefreshButton();

    // Set up message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true
    });

    // Start polling for pending actions
    pollInterval = setInterval(checkPendingActions, POLL_INTERVAL);

    // Initial check
    checkPendingActions();

    // Initial user activity update
    userDetails.updateLastVisit().catch((err) =>
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

// Clean up processed action IDs periodically to prevent memory leaks
setInterval(() => {
  if (processedActionIds.size > 100) {
    const idsToKeep = Array.from(processedActionIds).slice(-50);
    processedActionIds.clear();
    idsToKeep.forEach((id) => processedActionIds.add(id));
    logger.debug('Cleaned up processed action IDs');
  }
}, 60000);
