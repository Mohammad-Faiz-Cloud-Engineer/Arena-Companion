/**
 * Application Constants
 * Centralized configuration for Arena Companion
 * @author Mohammad Faiz
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
    OVERLAY_TRANSITION: 200
  })
});

export const ERROR_MESSAGES = Object.freeze({
  STORAGE_READ: 'Failed to read from storage',
  STORAGE_WRITE: 'Failed to write to storage',
  PANEL_OPEN: 'Failed to open side panel',
  INVALID_DATA: 'Invalid data format',
  INVALID_EMAIL: 'Invalid email format',
  MISSING_DOM_ELEMENTS: 'Required DOM elements not found',
  INVALID_TAB: 'Invalid tab object received',
  KEYS_REQUIRED: 'Keys parameter is required'
});
