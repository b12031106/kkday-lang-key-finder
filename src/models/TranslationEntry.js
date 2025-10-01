/**
 * TranslationEntry Model
 * Represents a single translation key-value pair extracted from page global variables
 */

class TranslationEntry {
  /**
   * Create a TranslationEntry
   * @param {string} key - The translation identifier (e.g., "lang_key_common")
   * @param {string} val - The translated text value (e.g., "常用文字")
   */
  constructor(key, val) {
    this.key = key;
    this.val = val;

    // Validate required fields
    this.validate();
  }

  /**
   * Validate the translation entry
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.key || typeof this.key !== 'string') {
      throw new Error('TranslationEntry key must be a non-empty string');
    }

    // Allow empty string values but still require string type
    if (this.val === null || this.val === undefined) {
      throw new Error('TranslationEntry value must be a string');
    }

    if (typeof this.val !== 'string') {
      throw new Error('TranslationEntry value must be a string');
    }
  }

  /**
   * Create TranslationEntry from object
   * @param {Object} obj - Object with key and val properties
   * @returns {TranslationEntry} New TranslationEntry instance
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid object provided');
    }

    return new TranslationEntry(obj.key, obj.val);
  }

  /**
   * Create array of TranslationEntry from array of objects
   * @param {Array} objects - Array of objects with key and val properties
   * @returns {Array<TranslationEntry>} Array of TranslationEntry instances
   */
  static fromArray(objects) {
    if (!Array.isArray(objects)) {
      throw new Error('Input must be an array');
    }

    // Map all objects, will throw if any are invalid
    return objects.map(obj => {
      if (!obj || typeof obj !== 'object') {
        throw new Error('Array elements must be objects');
      }
      return new TranslationEntry(obj.key, obj.val);
    });
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      key: this.key,
      val: this.val
    };
  }

  /**
   * Check if this entry matches a search query
   * @param {string} query - Search query
   * @returns {boolean} True if matches
   */
  matches(query) {
    if (!query || typeof query !== 'string') {
      return false;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const normalizedKey = this.key.toLowerCase();
    const normalizedVal = this.val.toLowerCase();

    return normalizedKey.includes(normalizedQuery) ||
           normalizedVal.includes(normalizedQuery);
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    // Truncate long values for readability
    const displayVal = this.val.length > 50 ?
      this.val.substring(0, 47) + '...' :
      this.val;

    return `[TranslationEntry: ${this.key} = "${displayVal}"]`;
  }
}

module.exports = TranslationEntry;