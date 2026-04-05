/**
 * Safe localStorage wrapper with error handling
 */

export const storage = {
  /**
   * Get item from localStorage
   * @param {string} key
   * @param {any} defaultValue
   * @returns {any}
   */
  get(key, defaultValue = null) {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   * @param {string} key
   * @param {any} value
   * @returns {boolean} Success status
   */
  set(key, value) {
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key
   * @returns {boolean} Success status
   */
  remove(key) {
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all localStorage
   * @returns {boolean} Success status
   */
  clear() {
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  isAvailable() {
    if (typeof window === 'undefined') return false;

    try {
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default storage;
