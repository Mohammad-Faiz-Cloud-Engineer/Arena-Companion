/**
 * Application Constants
 * Centralized configuration for Arena Companion
 * @module constants
 * @author Mohammad Faiz
 * @version 1.6.0
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
  REWRITE: 'rewrite',
  QUIZ_ME: 'quizMe',
  PROOFREAD: 'proofread'
});

/**
 * Prompt templates for text actions
 * @readonly
 */
export const PROMPT_TEMPLATES = Object.freeze({
  summarize: 'Please summarize the selection using precise and concise language. Use headers and bulleted lists in the summary, to make it scannable. Maintain the meaning and factual accuracy.\n\n',
  explain: 'Explain this concept in simple terms:\n\n',
  rewrite: 'Rewrite and improve the following text:\n\n',
  quizMe: 'Please quiz me on this selection. Ask me a variety of types of questions, for example multiple choice, true or false, and short answer. Wait for my response before moving on to the next question.\n\n',
  proofread: 'Please proofread the selection for spelling and grammar errors. Identify any mistakes and provide a corrected version of the text. Maintain the meaning and factual accuracy and output the list of proposed corrections first, followed by the final, corrected version of the text.\n\n'
});

/**
 * Arena domain patterns used by the extension
 * @readonly
 */
export const ARENA_HOST_PATTERNS = Object.freeze([
  'https://arena.ai/*',
  'https://*.arena.ai/*'
]);

/**
 * Storage keys for pending actions
 * @readonly
 */
export const ACTION_STORAGE_KEYS = Object.freeze({
  PENDING_ACTION: 'arena_companion_pending_action'
});

/**
 * Main application configuration
 * @readonly
 */
export const CONFIG = Object.freeze({
  ARENA_URL: 'https://arena.ai/',
  STORAGE_KEYS: Object.freeze({
    USER_DETAILS: 'arena_companion_user_details',
    LAST_VISIT: 'arena_companion_last_visit'
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
    RETRY_DELAY: 500,
    MAX_RETRY_ATTEMPTS: 5
  }),
  STORAGE: Object.freeze({
    MAX_SIZE_BYTES: 5242880
  }),
  VALIDATION: Object.freeze({
    MAX_STRING_LENGTH: 10000,
    MAX_SELECTION_LENGTH: 50000,
    MAX_DOWNLOAD_FILENAME_LENGTH: 240,
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
  PROMPT_INJECTION_FAILED: 'Failed to inject prompt',
  INVALID_SELECTION: 'Invalid text selection'
});

/**
 * Success messages for logging
 * @readonly
 */
export const SUCCESS_MESSAGES = Object.freeze({
  PANEL_OPENED: 'Side panel opened successfully',
  PROMPT_INJECTED: 'Prompt injected successfully',
  ACTION_STORED: 'Pending action stored'
});
