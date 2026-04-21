/**
 * Service Worker - Background Script
 * Handles extension lifecycle, side panel management, and text selection actions
 * @module service-worker
 * @author Mohammad Faiz
 * @version 1.4.0
 */

import { logger } from '../utils/logger.js';
import { userDetails } from '../utils/user-details.js';
import {
  ARENA_HOST_PATTERNS,
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

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join('')
    ].join('-');
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Normalizes selected text before it is sent through extension messaging
 * @param {string} text - Raw selected text
 * @returns {string} Normalized text
 */
const sanitizeSelection = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const sanitized = text
    .normalize('NFKC')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  return sanitized.substring(0, CONFIG.VALIDATION.MAX_SELECTION_LENGTH);
};

const isValidTabId = (tabId) =>
  Number.isInteger(tabId) && tabId >= 0 && tabId !== chrome.tabs.TAB_ID_NONE;

const isValidWindowId = (windowId) =>
  Number.isInteger(windowId) && windowId >= 0 && windowId !== chrome.windows.WINDOW_ID_NONE;

const sanitizeDownloadFilename = (filename) => {
  if (filename === undefined || filename === null || filename === '') {
    return undefined;
  }

  if (typeof filename !== 'string') {
    throw new Error('Invalid download filename');
  }

  const normalized = filename
    .trim()
    .replace(/[\\]+/g, '/')
    .replace(/^\/+/, '');

  if (
    !normalized ||
    normalized.length > CONFIG.VALIDATION.MAX_DOWNLOAD_FILENAME_LENGTH ||
    /[\x00-\x1F\x7F]/.test(normalized)
  ) {
    throw new Error('Invalid download filename');
  }

  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Invalid download filename');
  }

  return normalized;
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
 * Delivers a message to Arena contexts in the active window and the extension runtime
 * @param {Object} message - Message to broadcast
 * @returns {Promise<void>}
 */
const broadcastMessage = async (message, windowId) => {
  try {
    const tabs = await chrome.tabs.query(
      isValidWindowId(windowId)
        ? { windowId, url: ARENA_HOST_PATTERNS }
        : { currentWindow: true, url: ARENA_HOST_PATTERNS }
    );
    const promises = tabs.map(async (tab) => {
      try {
        if (isValidTabId(tab.id)) {
          await chrome.tabs.sendMessage(tab.id, message);
        }
      } catch (error) {
        // Tab might not have content script - log at debug level
        logger.debug('Failed to send message to tab', { tabId: tab.id, error: error.message });
      }
    });

    const runtimeBroadcast = chrome.runtime.sendMessage(message).catch((error) => {
      logger.debug('Runtime broadcast skipped', error);
    });

    await Promise.allSettled([...promises, runtimeBroadcast]);
    logger.debug('Broadcast complete', { tabCount: tabs.length, windowId });
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
    if (!isValidTabId(tabId)) {
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
    if (!isValidWindowId(windowId)) {
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
  if (isValidTabId(tabId)) {
    const success = await openSidePanelByTab(tabId);
    if (success) return true;
  }

  // Method 2: Try using windowId
  if (isValidWindowId(windowId)) {
    const success = await openSidePanelByWindow(windowId);
    if (success) return true;
  }

  // Method 3: Get active tab and try with that
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (isValidTabId(tabs[0]?.id)) {
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
  const broadcastTimeouts = [];
  let injectionListener = null;
  
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

    // 6. Optimized broadcast with Promise.allSettled for better performance
    await broadcastMessage(message, tabInfo.windowId);
    logger.info('Initial broadcast sent', { action, actionId });

    // Track if action was processed to cancel delayed broadcasts
    let actionProcessed = false;

    // Listen for successful injection to cancel delayed broadcasts
    injectionListener = (msg) => {
      if (msg.type === 'PROMPT_INJECTED' && msg.actionId === actionId) {
        actionProcessed = true;
        broadcastTimeouts.forEach(clearTimeout);
        broadcastTimeouts.length = 0;
      }
    };
    chrome.runtime.onMessage.addListener(injectionListener);

    // Schedule delayed broadcasts with cancellation support
    const broadcastDelays = [1000, 2000, 3000, 5000];
    broadcastDelays.forEach((delay) => {
      const timeoutId = setTimeout(() => {
        if (!actionProcessed) {
          broadcastMessage(message, tabInfo.windowId).then(() => {
            logger.debug(`Delayed broadcast sent at ${delay}ms`);
          }).catch((err) => {
            logger.debug('Delayed broadcast failed', err);
          });
        }
      }, delay);
      broadcastTimeouts.push(timeoutId);
    });

    // Cleanup listener and timeouts after max delay
    setTimeout(() => {
      if (injectionListener) {
        chrome.runtime.onMessage.removeListener(injectionListener);
        injectionListener = null;
      }
      // Clear any remaining timeouts
      broadcastTimeouts.forEach(clearTimeout);
      broadcastTimeouts.length = 0;
    }, 6000);

    await userDetails.updateLastVisit().catch((err) =>
      logger.debug('Failed to update last visit', err)
    );
  } catch (error) {
    logger.error('Text action failed', error);
    // Clear any pending broadcasts on error
    broadcastTimeouts.forEach(clearTimeout);
    broadcastTimeouts.length = 0;
    
    // Remove listener if it was added
    if (injectionListener) {
      chrome.runtime.onMessage.removeListener(injectionListener);
    }
    
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
    if (!isValidTabId(tab?.id) && !isValidWindowId(tab?.windowId)) {
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

      if (!isValidTabId(tabInfo.tabId) && !isValidWindowId(tabInfo.windowId)) {
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
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
            // Validate URL to prevent arbitrary downloads
            const downloadUrl = message.url;
            if (!downloadUrl || typeof downloadUrl !== 'string') {
              throw new Error('Invalid download URL');
            }
            let parsedUrl;
            try {
              parsedUrl = new URL(downloadUrl);
            } catch {
              throw new Error('Malformed download URL');
            }
            if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
              throw new Error('Only HTTP/HTTPS downloads are allowed');
            }
            const filename = sanitizeDownloadFilename(message.filename);
            const saveAs = typeof message.saveAs === 'boolean' ? message.saveAs : false;
            const downloadId = await chrome.downloads.download({
              url: downloadUrl,
              filename,
              saveAs
            });
            logger.info('Download started', { downloadId });
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

logger.info('Service worker initialized v1.4.0');
