/**
 * SearchService
 * Service for performing fuzzy search on translation data using Fuse.js
 */

const Fuse = require('fuse.js');
const TranslationEntry = require('../models/TranslationEntry');
const SearchResult = require('../models/SearchResult');

class SearchService {
  /**
   * Create a new SearchService instance
   * @param {Array<TranslationEntry>} translationData - Translation data to search
   * @param {Object} options - Fuse.js configuration options
   */
  constructor(translationData = [], options = {}) {
    this.translationData = this.validateTranslationData(translationData);
    this.fuseOptions = this.mergeOptions(options);
    this.fuseInstance = null;
    this.initializeFuse();
  }

  /**
   * Validate translation data array
   * @param {Array} data - Data to validate
   * @returns {Array<TranslationEntry>} Validated data
   */
  validateTranslationData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Translation data must be an array');
    }

    return data.filter(item => item instanceof TranslationEntry);
  }

  /**
   * Merge user options with default Fuse.js options
   * @param {Object} userOptions - User-provided options
   * @returns {Object} Merged options
   */
  mergeOptions(userOptions) {
    const defaultOptions = {
      keys: ['val'], // Search in translation values
      threshold: 0.3, // 0 = perfect match, 1 = match anything
      location: 0, // Where in the text to expect the pattern
      distance: 100, // How far from location the match can be
      maxPatternLength: 32, // Maximum pattern length
      minMatchCharLength: 1, // Minimum character match length
      includeScore: true, // Include match score in results
      includeMatches: false, // Include match indices
      findAllMatches: false, // Find all matches, not just the first
      isCaseSensitive: false, // Case insensitive search
      shouldSort: true, // Sort results by score
      tokenize: false, // Split search pattern by spaces
      matchAllTokens: false // All tokens must match
    };

    return { ...defaultOptions, ...userOptions };
  }

  /**
   * Initialize Fuse.js instance
   */
  initializeFuse() {
    try {
      // Convert TranslationEntry objects to plain objects for Fuse.js
      const searchableData = this.translationData.map(entry => entry.toObject());
      this.fuseInstance = new Fuse(searchableData, this.fuseOptions);
    } catch (error) {
      throw new Error(`Failed to initialize search service: ${error.message}`);
    }
  }

  /**
   * Update translation data and reinitialize search
   * @param {Array<TranslationEntry>} newData - New translation data
   */
  updateData(newData) {
    this.translationData = this.validateTranslationData(newData);
    this.initializeFuse();
  }

  /**
   * Perform fuzzy search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array<SearchResult>} Search results
   */
  search(query, options = {}) {
    if (!query || typeof query !== 'string') {
      throw new Error('Search query must be a non-empty string');
    }

    if (!this.fuseInstance) {
      throw new Error('Search service not properly initialized');
    }

    const searchOptions = {
      limit: options.limit || 10,
      threshold: options.threshold || this.fuseOptions.threshold
    };

    try {
      // Perform search with Fuse.js
      const fuseResults = this.fuseInstance.search(query, searchOptions);

      // Convert Fuse.js results to SearchResult objects
      const searchResults = SearchResult.fromFuseResults(fuseResults);

      // Apply additional filtering if needed
      if (options.minRelevance) {
        return searchResults.filter(result =>
          result.getRelevancePercentage() >= options.minRelevance
        );
      }

      return searchResults;

    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Search with automatic query preprocessing
   * @param {string} query - Raw search query
   * @param {Object} options - Search options
   * @returns {Array<SearchResult>} Search results
   */
  smartSearch(query, options = {}) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    // Preprocess query
    const processedQuery = this.preprocessQuery(query);

    if (processedQuery.length === 0) {
      return [];
    }

    return this.search(processedQuery, options);
  }

  /**
   * Preprocess search query
   * @param {string} query - Raw query
   * @returns {string} Processed query
   */
  preprocessQuery(query) {
    if (!query || typeof query !== 'string') {
      return '';
    }

    return query
      .trim() // Remove leading/trailing whitespace
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .toLowerCase(); // Convert to lowercase for better matching
  }

  /**
   * Get search suggestions based on query
   * @param {string} query - Partial query
   * @param {number} limit - Maximum suggestions
   * @returns {Array<string>} Search suggestions
   */
  getSuggestions(query, limit = 5) {
    if (!query || typeof query !== 'string' || query.length < 2) {
      return [];
    }

    const results = this.search(query, { limit: limit * 2 });

    // Extract unique values that contain the query
    const suggestions = new Set();

    results.forEach(result => {
      const value = result.item.val;
      if (value.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(value);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Find exact matches
   * @param {string} query - Exact query to match
   * @returns {Array<SearchResult>} Exact matches
   */
  findExactMatches(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const exactMatches = this.translationData.filter(entry =>
      entry.val.toLowerCase() === query.toLowerCase() ||
      entry.key.toLowerCase() === query.toLowerCase()
    );

    return exactMatches.map((entry, index) =>
      new SearchResult(entry, 0, index) // Score 0 for exact matches
    );
  }

  /**
   * Get statistics about the search data
   * @returns {Object} Search data statistics
   */
  getStatistics() {
    return {
      totalEntries: this.translationData.length,
      averageKeyLength: this.calculateAverageLength('key'),
      averageValueLength: this.calculateAverageLength('val'),
      uniqueKeys: new Set(this.translationData.map(entry => entry.key)).size,
      uniqueValues: new Set(this.translationData.map(entry => entry.val)).size,
      longestKey: this.findLongest('key'),
      longestValue: this.findLongest('val')
    };
  }

  /**
   * Calculate average length of key or value
   * @param {string} field - 'key' or 'val'
   * @returns {number} Average length
   */
  calculateAverageLength(field) {
    if (this.translationData.length === 0) {
      return 0;
    }

    const totalLength = this.translationData.reduce(
      (sum, entry) => sum + entry[field].length, 0
    );

    return Math.round(totalLength / this.translationData.length);
  }

  /**
   * Find longest key or value
   * @param {string} field - 'key' or 'val'
   * @returns {string} Longest string
   */
  findLongest(field) {
    if (this.translationData.length === 0) {
      return '';
    }

    return this.translationData.reduce(
      (longest, entry) =>
        entry[field].length > longest.length ? entry[field] : longest,
      ''
    );
  }

  /**
   * Test search performance
   * @param {string} query - Test query
   * @param {number} iterations - Number of iterations
   * @returns {Object} Performance metrics
   */
  testPerformance(query, iterations = 100) {
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      this.search(query);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;

    return {
      totalTime: Math.round(totalTime),
      averageTime: Math.round(averageTime * 100) / 100,
      iterations: iterations,
      query: query,
      dataSize: this.translationData.length
    };
  }

  /**
   * Create a SearchService instance with mock data
   * @param {number} dataSize - Number of mock entries
   * @returns {SearchService} SearchService instance
   */
  static createWithMockData(dataSize = 50) {
    const mockData = [];
    const commonWords = ['按鈕', '標題', '描述', '錯誤', '成功', '警告', '資訊', '幫助'];
    const actions = ['提交', '取消', '確認', '刪除', '編輯', '查看', '搜尋', '篩選'];

    for (let i = 0; i < dataSize; i++) {
      const word = commonWords[i % commonWords.length];
      const action = actions[i % actions.length];

      mockData.push(new TranslationEntry(
        `lang_key_${word}_${i}`,
        `${action}${word}${i > 10 ? ` ${i}` : ''}`
      ));
    }

    return new SearchService(mockData);
  }
}

module.exports = SearchService;