/**
 * Application Constants
 * Centralized configuration for Arena Companion
 */

export const CONFIG = {
  ARENA_URL: 'https://arena.ai/',
  STORAGE_KEYS: {
    USER_DETAILS: 'arena_user_details',
    LAST_VISIT: 'arena_last_visit',
    PREFERENCES: 'arena_preferences'
  },
  DEFAULTS: {
    USER_DETAILS: {
      name: '',
      email: '',
      lastActive: null
    }
  }
};

export const ERROR_MESSAGES = {
  STORAGE_READ: 'Failed to read from storage',
  STORAGE_WRITE: 'Failed to write to storage',
  PANEL_OPEN: 'Failed to open side panel',
  INVALID_DATA: 'Invalid data format'
};
