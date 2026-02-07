/**
 * Service Worker - Background Script
 * Handles extension lifecycle, side panel management, and text selection actions
 * @module service-worker
 * @author Mohammad Faiz
 * @version 1.3.2
 */

import { logger } from '../utils/logger.js';
import { userDetails } from '../utils/user-details.js';
import {
  CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONTEXT_MENU_IDS,
  PROMPT_TEMPLATES,
  ACTION_STORAGE_KEYS
} from '../utils/constants.js';

/**
 * Generates a UUID for action tracking
 * @returns {string} UUID string
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Sanitizes selected text to prevent XSS attacks
 * @param {string} text - Raw selected text
 * @returns {string} Sanitized text
 */
const sanitizeSelection = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .substring(0, CONFIG.VALIDATION.MAX_SELECTION_LENGTH)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Creates a prompt based on the action type
 * @param {string} action - Action type (summarize, explain, rewrite)
 * @param {string} selectedText - User's selected text
 * @returns {string} Formatted prompt
 */
const createPrompt = (action, selectedText) => {
  const sanitized = sanitizeSelection(selectedText);
  if (!sanitized) {
    return '';
  }

  const template = PROMPT_TEMPLATES[action];
  if (!template) {
    logger.warn('Unknown action type:', action);
    return sanitized;
  }

  return template + sanitized;
};

/**
 * Stores a pending action in chrome.storage.local
 * @param {string} prompt - The formatted prompt to store
 * @returns {Promise<string>} The action ID
 */
const storePendingAction = async (prompt) => {
  const action = {
    prompt,
    timestamp: Date.now(),
    id: generateUUID()
  };

  await chrome.storage.local.set({
    [ACTION_STORAGE_KEYS.PENDING_ACTION]: action
  });

  logger.debug(SUCCESS_MESSAGES.ACTION_STORED, { id: action.id });
  return action.id;
};

/**
 * Broadcasts a message to all tabs
 * @param {Object} message - Message to broadcast
 * @returns {Promise<void>}
 */
const broadcastMessage = async (message) => {
  try {
    const tabs = await chrome.tabs.query({});
    const promises = tabs.map(async (tab) => {
      try {
        if (tab.id && tab.id !== chrome.tabs.TAB_ID_NONE) {
          await chrome.tabs.sendMessage(tab.id, message);
        }
      } catch {
        // Tab might not have content script - silently ignore
      }
    });

    await Promise.allSettled(promises);
    logger.debug('Broadcast complete', { tabCount: tabs.length });
  } catch (error) {
    logger.error('Broadcast failed', error);
  }
};

/**
 * Opens the side panel using tabId (most reliable method)
 * @param {number} tabId - Chrome tab ID
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<boolean>} Success status
 */
const openSidePanelByTab = async (tabId, retryCount = 0) => {
  try {
    if (typeof tabId !== 'number' || tabId < 0 || tabId === chrome.tabs.TAB_ID_NONE) {
      throw new Error('Invalid tab ID');
    }

    await chrome.sidePanel.open({ tabId });

    logger.info(SUCCESS_MESSAGES.PANEL_OPENED, { method: 'tabId', tabId });
    return true;
  } catch (error) {
    logger.debug(ERROR_MESSAGES.PANEL_OPEN_RETRY, { attempt: retryCount + 1, error: error.message });

    if (retryCount < CONFIG.TIMEOUTS.MAX_RETRY_ATTEMPTS) {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.TIMEOUTS.RETRY_DELAY)
      );
      return openSidePanelByTab(tabId, retryCount + 1);
    }

    logger.error(ERROR_MESSAGES.PANEL_OPEN, error);
    return false;
  }
};

/**
 * Opens the side panel using windowId (fallback method)
 * @param {number} windowId - Chrome window ID
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<boolean>} Success status
 */
const openSidePanelByWindow = async (windowId, retryCount = 0) => {
  try {
    if (typeof windowId !== 'number' || windowId < 0 || windowId === chrome.windows.WINDOW_ID_NONE) {
      throw new Error(ERROR_MESSAGES.INVALID_TAB);
    }

    await chrome.sidePanel.open({ windowId });

    logger.info(SUCCESS_MESSAGES.PANEL_OPENED, { method: 'windowId', windowId });
    return true;
  } catch (error) {
    logger.debug(ERROR_MESSAGES.PANEL_OPEN_RETRY, { attempt: retryCount + 1 });

    if (retryCount < CONFIG.TIMEOUTS.MAX_RETRY_ATTEMPTS) {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.TIMEOUTS.RETRY_DELAY)
      );
      return openSidePanelByWindow(windowId, retryCount + 1);
    }

    logger.error(ERROR_MESSAGES.PANEL_OPEN, error);
    return false;
  }
};

/**
 * Opens side panel with multiple fallback methods
 * @param {Object} options - Options containing tabId and/or windowId
 * @returns {Promise<boolean>} Success status
 */
const openSidePanel = async ({ tabId, windowId }) => {
  // Method 1: Try using tabId first (most reliable from context menu)
  if (tabId && typeof tabId === 'number') {
    const success = await openSidePanelByTab(tabId);
    if (success) return true;
  }

  // Method 2: Try using windowId
  if (windowId && typeof windowId === 'number') {
    const success = await openSidePanelByWindow(windowId);
    if (success) return true;
  }

  // Method 3: Get active tab and try with that
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      const success = await openSidePanelByTab(tabs[0].id);
      if (success) return true;
    }
  } catch (error) {
    logger.error('Active tab fallback failed', error);
  }

  return false;
};

/**
 * Handles text selection actions (summarize, explain, rewrite)
 * @param {string} action - Action type
 * @param {string} selectedText - Selected text from the page
 * @param {Object} tabInfo - Tab information with tabId and windowId
 * @returns {Promise<void>}
 */
const handleTextAction = async (action, selectedText, tabInfo) => {
  try {
    logger.info('Handling text action', { action, tabInfo });

    // 1. OPEN SIDE PANEL FIRST (Critical order) - Use tabId for reliability
    const panelOpened = await openSidePanel(tabInfo);
    if (!panelOpened) {
      throw new Error(ERROR_MESSAGES.PANEL_OPEN);
    }

    // 2. Create and validate prompt
    const prompt = createPrompt(action, selectedText);
    if (!prompt) {
      logger.warn(ERROR_MESSAGES.INVALID_SELECTION);
      return;
    }

    // 3. Store pending action with UUID and timestamp IMMEDIATELY
    // The content script will poll storage and find this
    const actionId = await storePendingAction(prompt);
    logger.info('Action stored in storage:', actionId);

    // 4. Wait for side panel iframe to start loading
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 5. Broadcast message to content scripts
    const message = {
      type: 'INJECT_PROMPT',
      prompt,
      actionId,
      timestamp: Date.now()
    };

    // 6. Optimized broadcast with Promise.all for better performance
    await broadcastMessage(message);
    logger.info('Initial broadcast sent', { action, actionId });

    // Schedule delayed broadcasts using Promise-based approach
    const broadcastDelays = [1000, 2000, 3000, 5000];
    const delayedBroadcasts = broadcastDelays.map((delay) =>
      new Promise((resolve) => {
        setTimeout(async () => {
          await broadcastMessage(message);
          logger.debug(`Delayed broadcast sent at ${delay}ms`);
          resolve();
        }, delay);
      })
    );

    // Non-blocking user activity update
    userDetails.updateLastVisit().catch((err) =>
      logger.debug('Failed to update last visit', err)
    );
  } catch (error) {
    logger.error('Text action failed', error);
    // Try to at least open the panel as recovery
    try {
      await openSidePanel(tabInfo);
    } catch (recoveryError) {
      logger.error('Recovery failed', recoveryError);
    }
  }
};

/**
 * Creates all context menus for the extension
 */
const createContextMenus = () => {
  try {
    chrome.contextMenus.removeAll(() => {
      // Menu 1: Open Arena Companion (always visible)
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.OPEN_COMPANION,
        title: 'Open Arena Companion',
        contexts: ['all']
      });

      // Menu 2: Arena Tools (parent - only when text selected)
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.ARENA_TOOLS,
        title: 'Arena Tools',
        contexts: ['selection']
      });

      // Child: Summarize
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.SUMMARIZE,
        parentId: CONTEXT_MENU_IDS.ARENA_TOOLS,
        title: 'Summarize',
        contexts: ['selection']
      });

      // Child: Explain
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.EXPLAIN,
        parentId: CONTEXT_MENU_IDS.ARENA_TOOLS,
        title: 'Explain',
        contexts: ['selection']
      });

      // Child: Rewrite
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.REWRITE,
        parentId: CONTEXT_MENU_IDS.ARENA_TOOLS,
        title: 'Rewrite',
        contexts: ['selection']
      });

      // Child: Quiz Me
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.QUIZ_ME,
        parentId: CONTEXT_MENU_IDS.ARENA_TOOLS,
        title: 'Quiz Me',
        contexts: ['selection']
      });

      // Child: Proofread
      chrome.contextMenus.create({
        id: CONTEXT_MENU_IDS.PROOFREAD,
        parentId: CONTEXT_MENU_IDS.ARENA_TOOLS,
        title: 'Proofread',
        contexts: ['selection']
      });

      logger.info('Context menus created successfully');
    });
  } catch (error) {
    logger.error('Failed to create context menus', error);
  }
};

/**
 * Handles extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab?.id && !tab?.windowId) {
      logger.error(ERROR_MESSAGES.INVALID_TAB);
      return;
    }
    await openSidePanel({ tabId: tab.id, windowId: tab.windowId });
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

    createContextMenus();
  } catch (error) {
    logger.error('Installation handler error', error);
  }
});

/**
 * Handle context menu clicks - CRITICAL: Pass tabId for reliable panel opening
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // Extract both tabId and windowId for maximum reliability
    const tabInfo = {
      tabId: tab?.id,
      windowId: tab?.windowId
    };

    if (!tabInfo.tabId && !tabInfo.windowId) {
      logger.error(ERROR_MESSAGES.INVALID_TAB);
      return;
    }

    const { menuItemId, selectionText } = info;

    logger.debug('Context menu clicked', { menuItemId, tabInfo, hasSelection: !!selectionText });

    switch (menuItemId) {
      case CONTEXT_MENU_IDS.OPEN_COMPANION:
        await openSidePanel(tabInfo);
        logger.info('Side panel opened via context menu');
        break;

      case CONTEXT_MENU_IDS.SUMMARIZE:
        await handleTextAction('summarize', selectionText, tabInfo);
        break;

      case CONTEXT_MENU_IDS.EXPLAIN:
        await handleTextAction('explain', selectionText, tabInfo);
        break;

      case CONTEXT_MENU_IDS.REWRITE:
        await handleTextAction('rewrite', selectionText, tabInfo);
        break;

      case CONTEXT_MENU_IDS.QUIZ_ME:
        await handleTextAction('quizMe', selectionText, tabInfo);
        break;

      case CONTEXT_MENU_IDS.PROOFREAD:
        await handleTextAction('proofread', selectionText, tabInfo);
        break;

      default:
        logger.debug('Unknown menu item clicked', menuItemId);
    }
  } catch (error) {
    logger.error('Context menu handler error', error);
  }
});

/**
 * Service worker activation
 */
self.addEventListener('activate', (event) => {
  logger.info('Service worker activated');
  event.waitUntil(
    clients.claim().then(() => {
      logger.debug('Service worker claimed all clients');
    })
  );
});

/**
 * Handle service worker errors
 */
self.addEventListener('error', (event) => {
  logger.error('Service worker error', event.error);
  event.preventDefault();
});

/**
 * Handle unhandled promise rejections
 */
self.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
  event.preventDefault();
});

/**
 * Handle messages from content scripts or popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.debug('Message received', message);

  (async () => {
    try {
      switch (message.type) {
        case 'GET_USER_DETAILS': {
          const details = await userDetails.get();
          sendResponse({ success: true, data: details });
          break;
        }

        case 'SAVE_USER_DETAILS': {
          await userDetails.save(message.data);
          sendResponse({ success: true });
          break;
        }

        case 'DOWNLOAD_FILE': {
          try {
            const downloadId = await chrome.downloads.download({
              url: message.url,
              filename: message.filename || undefined,
              saveAs: message.saveAs || false
            });
            logger.info('Download started', { downloadId, url: message.url });
            sendResponse({ success: true, downloadId });
          } catch (downloadError) {
            logger.error('Download failed', downloadError);
            sendResponse({ success: false, error: downloadError.message });
          }
          break;
        }

        case 'PROMPT_INJECTED': {
          logger.info(SUCCESS_MESSAGES.PROMPT_INJECTED, {
            actionId: message.actionId
          });
          sendResponse({ success: true });
          break;
        }

        case 'PROMPT_INJECTION_FAILED': {
          logger.error(ERROR_MESSAGES.PROMPT_INJECTION_FAILED, {
            actionId: message.actionId,
            error: message.error
          });
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error('Message handler error', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});

// Recreate context menus on startup
createContextMenus();

logger.info('Service worker initialized v1.3.2');
