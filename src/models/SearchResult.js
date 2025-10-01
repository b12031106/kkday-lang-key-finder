/**
 * SearchResult Model
 * Represents a search match with relevance scoring from Fuse.js
 */

const TranslationEntry = require('./TranslationEntry');

class SearchResult {
  /**
   * Create a SearchResult
   * @param {TranslationEntry} item - The matched translation entry
   * @param {number} score - Relevance score (0 = perfect match, 1 = no match)
   * @param {number} refIndex - Original index in the search dataset
   */
  constructor(item, score, refIndex = 0) {
    this.item = item;
    this.score = score;
    this.refIndex = refIndex;

    // Validate required fields
    this.validate();
  }

  /**
   * Validate the search result
   * @throws {Error} If validation fails
   */
  validate() {
    if (!(this.item instanceof TranslationEntry)) {
      throw new Error('SearchResult item must be a TranslationEntry instance');
    }

    if (this.score === null || this.score === undefined) {
      throw new Error('SearchResult score must be a number');
    }

    if (typeof this.score !== 'number') {
      throw new Error('SearchResult score must be a number');
    }

    if (this.score < 0 || this.score > 1) {
      throw new Error('SearchResult score must be between 0 and 1');
    }

    if (this.refIndex !== undefined && this.refIndex !== null) {
      if (typeof this.refIndex !== 'number' || this.refIndex < 0 || !Number.isInteger(this.refIndex)) {
        throw new Error('SearchResult refIndex must be a non-negative integer');
      }
    }
  }

  /**
   * Create SearchResult from Fuse.js result
   * @param {Object} fuseResult - Fuse.js search result object
   * @returns {SearchResult} New SearchResult instance
   */
  static fromFuseResult(fuseResult) {
    if (!fuseResult || typeof fuseResult !== 'object') {
      throw new Error('Invalid Fuse result provided to SearchResult.fromFuseResult');
    }

    if (!fuseResult.item) {
      throw new Error('Fuse result must contain an item property');
    }

    // Create TranslationEntry from the item
    const translationEntry = TranslationEntry.fromObject(fuseResult.item);

    // Extract score (default to 0 if not provided)
    const score = typeof fuseResult.score === 'number' ? fuseResult.score : 0;

    // Extract refIndex (default to 0 if not provided)
    const refIndex = typeof fuseResult.refIndex === 'number' ? fuseResult.refIndex : 0;

    return new SearchResult(translationEntry, score, refIndex);
  }

  /**
   * Create array of SearchResult from Fuse.js results
   * @param {Array} fuseResults - Array of Fuse.js search results
   * @returns {Array<SearchResult>} Array of SearchResult instances
   */
  static fromFuseResults(fuseResults) {
    if (!Array.isArray(fuseResults)) {
      throw new Error('SearchResult.fromFuseResults expects an array');
    }

    return fuseResults
      .filter(result => {
        // Filter out invalid results
        try {
          return result && typeof result === 'object' && result.item;
        } catch (error) {
          return false;
        }
      })
      .map(result => SearchResult.fromFuseResult(result));
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      item: this.item.toObject(),
      score: this.score,
      refIndex: this.refIndex
    };
  }

  /**
   * Get relevance percentage (higher is better)
   * @returns {number} Relevance as percentage (0-100)
   */
  getRelevancePercentage() {
    return Math.round((1 - this.score) * 100);
  }

  /**
   * Check if this result is considered a good match
   * @param {number} threshold - Score threshold (default 0.3)
   * @returns {boolean} True if good match
   */
  isGoodMatch(threshold = 0.3) {
    return this.score <= threshold;
  }

  /**
   * Compare this result with another for sorting
   * @param {SearchResult} other - Other SearchResult to compare with
   * @returns {number} Comparison result (-1, 0, 1)
   */
  compare(other) {
    if (!(other instanceof SearchResult)) {
      throw new Error('Can only compare with another SearchResult');
    }

    // Lower score = better match = should come first
    if (this.score < other.score) {
      return -1;
    }
    if (this.score > other.score) {
      return 1;
    }

    // If scores are equal, compare by key alphabetically
    return this.item.key.localeCompare(other.item.key);
  }

  /**
   * Check if this is a perfect match
   * @returns {boolean} True if score is 0 (perfect match)
   */
  isPerfectMatch() {
    return this.score === 0;
  }

  /**
   * Get confidence level based on score
   * @returns {string} Confidence level
   */
  getConfidenceLevel() {
    if (this.score === 0) {
      return 'perfect';
    }
    if (this.score < 0.2) {
      return 'high';
    }
    if (this.score < 0.4) {
      return 'medium';
    }
    if (this.score < 0.6) {
      return 'low';
    }
    return 'very_low';
  }

  /**
   * Sort array of SearchResult by score (best first)
   * @param {Array<SearchResult>} results - Array of SearchResult
   * @returns {Array<SearchResult>} Sorted copy of the array
   */
  static sortByScore(results) {
    if (!Array.isArray(results)) {
      throw new Error('Input must be an array');
    }
    // Create a copy and sort by score ascending (lower is better)
    return [...results].sort((a, b) => a.score - b.score);
  }

  /**
   * Filter results by threshold
   * @param {Array<SearchResult>} results - Array of SearchResult
   * @param {number} threshold - Score threshold (default 0.3)
   * @returns {Array<SearchResult>} Filtered array
   */
  static filterByThreshold(results, threshold = 0.3) {
    if (!Array.isArray(results)) {
      throw new Error('Input must be an array');
    }
    return results.filter(result => result.score <= threshold);
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    const matchType = this.isPerfectMatch() ? ' (perfect)' : '';
    return `SearchResult{item: ${this.item.key}, score: ${this.score}${matchType}, relevance: ${this.getRelevancePercentage()}%}`;
  }
}

module.exports = SearchResult;