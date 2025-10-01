/**
 * ExtensionState Model
 * Manages overall extension state and user interactions
 */

const TranslationEntry = require('./TranslationEntry');
const SearchResult = require('./SearchResult');

class ExtensionState {
  /**
   * Create an ExtensionState
   * @param {Object} options - Initial state options
   */
  constructor(options = {}) {
    this.isActive = options.isActive || false;
    this.dataSource = options.dataSource || [];
    this.searchQuery = options.searchQuery || '';
    this.searchResults = options.searchResults || [];
    this.isElementPickerActive = options.isElementPickerActive || false;
    this.errorMessage = options.errorMessage || '';

    // Validate initial state
    this.validate();
  }

  /**
   * Validate the extension state
   * @throws {Error} If validation fails
   */
  validate() {
    if (typeof this.isActive !== 'boolean') {
      throw new Error('ExtensionState isActive must be a boolean');
    }

    if (!Array.isArray(this.dataSource)) {
      throw new Error('ExtensionState dataSource must be an array');
    }

    // Validate each item in dataSource
    this.dataSource.forEach((item, index) => {
      if (!(item instanceof TranslationEntry)) {
        throw new Error(`ExtensionState dataSource[${index}] must be a TranslationEntry`);
      }
    });

    if (typeof this.searchQuery !== 'string') {
      throw new Error('ExtensionState searchQuery must be a string');
    }

    if (!Array.isArray(this.searchResults)) {
      throw new Error('ExtensionState searchResults must be an array');
    }

    // Validate each item in searchResults
    this.searchResults.forEach((result, index) => {
      if (!(result instanceof SearchResult)) {
        throw new Error(`ExtensionState searchResults[${index}] must be a SearchResult`);
      }
    });

    if (typeof this.isElementPickerActive !== 'boolean') {
      throw new Error('ExtensionState isElementPickerActive must be a boolean');
    }

    if (typeof this.errorMessage !== 'string') {
      throw new Error('ExtensionState errorMessage must be a string');
    }
  }

  /**
   * Create initial inactive state
   * @returns {ExtensionState} New inactive state
   */
  static createInactive() {
    return new ExtensionState({
      isActive: false,
      errorMessage: '擴充功能未啟用'
    });
  }

  /**
   * Create error state
   * @param {string} errorMessage - Error message
   * @returns {ExtensionState} New error state
   */
  static createError(errorMessage) {
    return new ExtensionState({
      isActive: false,
      errorMessage: errorMessage || '發生未知錯誤'
    });
  }

  /**
   * Create active state with data
   * @param {Array<TranslationEntry>} translationData - Translation data
   * @returns {ExtensionState} New active state
   */
  static createActive(translationData) {
    const validData = Array.isArray(translationData) ? translationData : [];
    return new ExtensionState({
      isActive: true,
      dataSource: validData,
      errorMessage: ''
    });
  }

  /**
   * Set translation data
   * @param {Array<TranslationEntry>} data - Translation data
   */
  setTranslationData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Translation data must be an array');
    }

    this.dataSource = data.filter(item => item instanceof TranslationEntry);
    this.validate();
  }

  /**
   * Set search query and clear previous results
   * @param {string} query - Search query
   */
  setSearchQuery(query) {
    if (typeof query !== 'string') {
      throw new Error('Search query must be a string');
    }

    this.searchQuery = query;
    this.searchResults = []; // Clear previous results
  }

  /**
   * Set search results
   * @param {Array<SearchResult>} results - Search results
   */
  setSearchResults(results) {
    if (!Array.isArray(results)) {
      throw new Error('Search results must be an array');
    }

    this.searchResults = results.filter(result => result instanceof SearchResult);
    this.validate();
  }

  /**
   * Activate element picker mode
   */
  activateElementPicker() {
    this.isElementPickerActive = true;
  }

  /**
   * Deactivate element picker mode
   */
  deactivateElementPicker() {
    this.isElementPickerActive = false;
  }

  /**
   * Set error message
   * @param {string} message - Error message
   */
  setError(message) {
    this.errorMessage = typeof message === 'string' ? message : '';
  }

  /**
   * Clear error message
   */
  clearError() {
    this.errorMessage = '';
  }

  /**
   * Check if extension has translation data
   * @returns {boolean} True if has data
   */
  hasData() {
    return this.dataSource.length > 0;
  }

  /**
   * Check if there are search results
   * @returns {boolean} True if has results
   */
  hasSearchResults() {
    return this.searchResults.length > 0;
  }

  /**
   * Check if there's an error
   * @returns {boolean} True if has error
   */
  hasError() {
    return this.errorMessage.length > 0;
  }

  /**
   * Check if currently searching
   * @returns {boolean} True if has query but no results yet
   */
  isSearching() {
    return this.searchQuery.length > 0 && this.searchResults.length === 0;
  }

  /**
   * Get current state summary
   * @returns {string} State summary
   */
  getStateSummary() {
    if (!this.isActive) {
      return 'Inactive';
    }

    if (this.hasError()) {
      return 'Error';
    }

    if (!this.hasData()) {
      return 'No Data';
    }

    if (this.isElementPickerActive) {
      return 'Element Picker Active';
    }

    if (this.isSearching()) {
      return 'Searching';
    }

    if (this.hasSearchResults()) {
      return `${this.searchResults.length} Results Found`;
    }

    return 'Ready';
  }

  /**
   * Reset to clean active state
   */
  reset() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isElementPickerActive = false;
    this.errorMessage = '';
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      isActive: this.isActive,
      hasData: this.hasData(),
      dataCount: this.dataSource.length,
      searchQuery: this.searchQuery,
      searchResultCount: this.searchResults.length,
      isElementPickerActive: this.isElementPickerActive,
      errorMessage: this.errorMessage,
      stateSummary: this.getStateSummary()
    };
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `ExtensionState{active: ${this.isActive}, state: "${this.getStateSummary()}", data: ${this.dataSource.length} items}`;
  }
}

module.exports = ExtensionState;