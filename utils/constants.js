/**
 * Application Constants
 * Centralized configuration for Arena Companion
 * @module constants
 * @author Mohammad Faiz
 * @version 1.3.1
 */

/**
 * Context Menu IDs for text selection actions
 * @readonly
 */
export const CONTEXT_MENU_IDS = Object.freeze({
  OPEN_COMPANION: 'openArenaCompanion',
  ARENA_TOOLS: 'arenaTools',
  SUMMARIZE: 'summarize',
  EXPLAIN: 'explain',
  REWRITE: 'rewrite'
});

/**
 * Prompt templates for text actions
 * @readonly
 */
export const PROMPT_TEMPLATES = Object.freeze({
  summarize: 'Summarize the following text:\n\n',
  explain: 'Explain this concept in simple terms:\n\n',
  rewrite: 'Rewrite and improve the following text:\n\n'
});

/**
 * Textarea selectors for Arena.AI input detection
 * Ordered by specificity and likelihood of match
 * @readonly
 */
export const TEXTAREA_SELECTORS = Object.freeze([
  'textarea[placeholder*="message" i]',
  'textarea[placeholder*="chat" i]',
  'textarea[placeholder*="type" i]',
  'textarea[placeholder*="ask" i]',
  'textarea[aria-label*="message" i]',
  'textarea[aria-label*="chat" i]',
  'textarea[aria-label*="input" i]',
  'textarea.svelte-1ed2p3z',
  'textarea[data-testid*="input"]',
  'textarea[role="textbox"]',
  'div[contenteditable="true"][role="textbox"]',
  'div[contenteditable="true"]',
  'textarea'
]);

/**
 * Send button selectors for Arena.AI
 * @readonly
 */
export const BUTTON_SELECTORS = Object.freeze([
  'button[aria-label*="send" i]',
  'button[aria-label*="submit" i]',
  'button[title*="send" i]',
  'button[title*="submit" i]',
  'button:has(svg[data-testid="send"])',
  'button:has(svg):not([aria-label*="stop" i]):not([aria-label*="cancel" i])',
  'button.primary',
  'button[type="submit"]',
  'form button:last-of-type'
]);

/**
 * Storage keys for pending actions
 * @readonly
 */
export const ACTION_STORAGE_KEYS = Object.freeze({
  PENDING_ACTION: 'arena_companion_pending_action',
  PROCESSED_IDS: 'arena_companion_processed_ids'
});

/**
 * Main application configuration
 * @readonly
 */
export const CONFIG = Object.freeze({
  ARENA_URL: 'https://arena.ai/',
  STORAGE_KEYS: Object.freeze({
    USER_DETAILS: 'arena_companion_user_details',
    LAST_VISIT: 'arena_companion_last_visit',
    PREFERENCES: 'arena_companion_preferences'
  }),
  DEFAULTS: Object.freeze({
    USER_DETAILS: Object.freeze({
      name: '',
      email: '',
      lastActive: null
    })
  }),
  TIMEOUTS: Object.freeze({
    LOADING_OVERLAY: 5000,
    OVERLAY_TRANSITION: 200,
    DEBOUNCE_DELAY: 300,
    // Text action specific timeouts
    SIDE_PANEL_LOAD: 3000,
    RETRY_DELAY: 500,
    MAX_RETRY_ATTEMPTS: 5,
    TEXTAREA_SEARCH_DELAY: 500,
    MAX_TEXTAREA_ATTEMPTS: 10,
    STORAGE_POLL_INTERVAL: 500,
    ACTION_EXPIRY: 30000,
    BROADCAST_DELAY: 1000,
    MESSAGE_TIMEOUT: 10000
  }),
  STORAGE: Object.freeze({
    MAX_SIZE_BYTES: 5242880,
    QUOTA_BYTES_PER_ITEM: 8192
  }),
  VALIDATION: Object.freeze({
    MAX_STRING_LENGTH: 10000,
    MAX_SELECTION_LENGTH: 50000,
    // RFC 5322 compliant email regex (simplified but robust)
    EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    MAX_NAME_LENGTH: 255,
    MAX_EMAIL_LENGTH: 320
  })
});

/**
 * Error messages for user-facing and logging purposes
 * @readonly
 */
export const ERROR_MESSAGES = Object.freeze({
  STORAGE_READ: 'Failed to read from storage',
  STORAGE_WRITE: 'Failed to write to storage',
  PANEL_OPEN: 'Failed to open side panel',
  PANEL_OPEN_RETRY: 'Side panel open failed, retrying...',
  INVALID_DATA: 'Invalid data format',
  INVALID_EMAIL: 'Invalid email format',
  MISSING_DOM_ELEMENTS: 'Required DOM elements not found',
  INVALID_TAB: 'Invalid tab object received',
  KEYS_REQUIRED: 'Keys parameter is required',
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded',
  INVALID_USER_DETAILS: 'Invalid user details format',
  // Text action specific errors
  TEXTAREA_NOT_FOUND: 'Could not find input textarea',
  BUTTON_NOT_FOUND: 'Could not find send button',
  PROMPT_INJECTION_FAILED: 'Failed to inject prompt',
  ACTION_EXPIRED: 'Action expired, discarding',
  INVALID_SELECTION: 'Invalid text selection'
});

/**
 * Success messages for logging
 * @readonly
 */
export const SUCCESS_MESSAGES = Object.freeze({
  PANEL_OPENED: 'Side panel opened successfully',
  PROMPT_INJECTED: 'Prompt injected successfully',
  MESSAGE_SENT: 'Message sent to Arena.AI',
  ACTION_STORED: 'Pending action stored',
  ACTION_CLEARED: 'Pending action cleared'
});
