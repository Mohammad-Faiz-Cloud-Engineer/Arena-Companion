/**
 * Side Panel Main Script
 * Handles iframe loading, refresh functionality, user interactions, and prompt forwarding
 * @module main
 * @author Mohammad Faiz
 * @version 1.5.0
 */

import { logger } from '../../utils/logger.js';
import { userDetails } from '../../utils/user-details.js';
import { CONFIG, ERROR_MESSAGES } from '../../utils/constants.js';

// ============================================================================
// DOM REFERENCES
// ============================================================================

let arenaFrame = null;
let loadingOverlay = null;
let refreshBtn = null;
let loadTimeout = null;
let refreshDebounceTimer = null;
let redirectResetTimer = null;
let eventController = null;

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

const scheduleLoadTimeout = () => {
  if (loadTimeout) {
    clearTimeout(loadTimeout);
  }

  loadTimeout = setTimeout(hideLoadingOverlay, CONFIG.TIMEOUTS.LOADING_OVERLAY);
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
    scheduleLoadTimeout();
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

  scheduleLoadTimeout();
};

// ============================================================================
// PROMPT FORWARDING
// ============================================================================

/**
 * Forwards a prompt to the Arena.AI iframe
 * @param {string} prompt - Prompt to forward
 * @param {string} actionId - Action ID for tracking
 * @returns {boolean} Success status
 */
const forwardToIframe = (prompt, actionId) => {
  if (!arenaFrame || !arenaFrame.contentWindow) {
    logger.warn('Iframe not ready for message forwarding');
    return false;
  }

  try {
    const targetOrigin = new URL(arenaFrame.src || CONFIG.ARENA_URL).origin;
    arenaFrame.contentWindow.postMessage(
      {
        type: 'ARENA_COMPANION_INJECT_PROMPT',
        prompt,
        actionId,
        timestamp: Date.now()
      },
      targetOrigin
    );

    logger.debug('Prompt forwarded to iframe', { actionId });
    return true;
  } catch (error) {
    logger.error('Failed to forward prompt to iframe', error);
    return false;
  }
};

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handles messages from the background script
 */
const handleMessage = (message, _sender, sendResponse) => {
  if (message.type === 'INJECT_PROMPT') {
    logger.debug('Received INJECT_PROMPT in sidepanel');

    if (
      typeof message.prompt !== 'string' ||
      !message.prompt.trim() ||
      typeof message.actionId !== 'string'
    ) {
      sendResponse({ success: false, reason: 'Invalid payload' });
      return true;
    }

    const success = forwardToIframe(message.prompt, message.actionId);
    sendResponse({ success });
    return true;
  }

  return false;
};

// ============================================================================
// REFRESH BUTTON
// ============================================================================

let hoverTimer = null;
let isRedirectMode = false;

const REFRESH_ICON_PATH = 'M13.65 2.35C12.2 0.9 10.21 0 8 0 3.58 0 0.01 3.58 0.01 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z';
const EXTERNAL_LINK_ICON_PATH = 'M9 2L9 3L12.3 3L6 9.3L6.7 10L13 3.7L13 7L14 7L14 2L9 2ZM3 3C2.4 3 2 3.4 2 4L2 13C2 13.6 2.4 14 3 14L12 14C12.6 14 13 13.6 13 13L13 9L12 9L12 13L3 13L3 4L7 4L7 3L3 3Z';

const setRefreshButtonContent = ({ ariaLabel, title, description, pathData }) => {
  if (!refreshBtn) {
    return;
  }

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS(svgNamespace, 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);

  const descriptionSpan = document.createElement('span');
  descriptionSpan.id = 'refreshDescription';
  descriptionSpan.className = 'sr-only';
  descriptionSpan.textContent = description;

  refreshBtn.setAttribute('aria-label', ariaLabel);
  refreshBtn.setAttribute('title', title);
  refreshBtn.replaceChildren(svg, descriptionSpan);
};

/**
 * Opens Arena.AI in a new tab
 */
const openInNewTab = async () => {
  try {
    await chrome.tabs.create({ url: CONFIG.ARENA_URL });
    logger.info('Opened Arena.AI in new tab');
  } catch (error) {
    logger.error('Failed to open Arena.AI in new tab', error);
  }
};

/**
 * Switches button to redirect mode
 */
const switchToRedirectMode = () => {
  if (!refreshBtn || isRedirectMode) return;
  
  isRedirectMode = true;
  refreshBtn.classList.add('redirect-mode');
  setRefreshButtonContent({
    ariaLabel: 'Open Arena.AI in new tab',
    title: 'Open in new tab',
    description: 'Click to open Arena.AI in new tab',
    pathData: EXTERNAL_LINK_ICON_PATH
  });
  
  logger.debug('Switched to redirect mode');
};

/**
 * Switches button back to refresh mode
 */
const switchToRefreshMode = () => {
  if (!refreshBtn || !isRedirectMode) return;
  
  isRedirectMode = false;
  refreshBtn.classList.remove('redirect-mode');
  setRefreshButtonContent({
    ariaLabel: 'Refresh Arena Companion',
    title: 'Refresh',
    description: 'Click to reload Arena AI interface',
    pathData: REFRESH_ICON_PATH
  });
  
  logger.debug('Switched to refresh mode');
};

/**
 * Handles button click based on current mode
 */
const handleButtonClick = () => {
  if (isRedirectMode) {
    void openInNewTab();
  } else {
    refreshArenaFrame();
  }
};

const handleRefreshButtonKeydown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleButtonClick();
  }
};

const handleRefreshButtonMouseEnter = () => {
  hoverTimer = setTimeout(() => {
    switchToRedirectMode();
  }, 1000);
};

const handleRefreshButtonMouseLeave = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  if (redirectResetTimer) {
    clearTimeout(redirectResetTimer);
  }

  redirectResetTimer = setTimeout(() => {
    switchToRefreshMode();
    redirectResetTimer = null;
  }, 300);
};

/**
 * Initializes refresh button with keyboard support and hover functionality
 */
const initializeRefreshButton = () => {
  if (!refreshBtn) return;

  if (!eventController) {
    eventController = new AbortController();
  }

  const { signal } = eventController;
  switchToRefreshMode();

  // Click handler
  refreshBtn.addEventListener('click', handleButtonClick, { passive: true, signal });

  // Keyboard support
  refreshBtn.addEventListener('keydown', handleRefreshButtonKeydown, { passive: false, signal });

  // Hover to switch to redirect mode (after 1 second)
  refreshBtn.addEventListener('mouseenter', handleRefreshButtonMouseEnter, { signal });

  // Mouse leave - cancel timer or switch back
  refreshBtn.addEventListener('mouseleave', handleRefreshButtonMouseLeave, { signal });
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
  if (eventController) {
    eventController.abort();
    eventController = null;
  }
  if (arenaFrame) {
    arenaFrame.removeEventListener('load', handleIframeLoad);
    arenaFrame.removeEventListener('error', handleIframeError);
  }
  if (loadTimeout) {
    clearTimeout(loadTimeout);
    loadTimeout = null;
  }
  if (refreshDebounceTimer) {
    clearTimeout(refreshDebounceTimer);
    refreshDebounceTimer = null;
  }
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  if (redirectResetTimer) {
    clearTimeout(redirectResetTimer);
    redirectResetTimer = null;
  }
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
    logger.info('Initializing side panel v1.5.0');

    initializeDOMReferences();
    initializeIframe();
    initializeRefreshButton();

    // Set up message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true,
      signal: eventController.signal
    });

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
