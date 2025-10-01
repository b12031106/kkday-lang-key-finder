/**
 * DataExtractionService
 * Service for extracting translation data from page global variables
 */

const TranslationEntry = require('../models/TranslationEntry');
const PageContext = require('../models/PageContext');

class DataExtractionService {
  /**
   * Extract translation data based on page context
   * @param {PageContext} pageContext - Page context information
   * @param {Object} globalScope - Global scope object (defaults to window/global)
   * @returns {Object} Extraction result
   */
  static async extractTranslationData(pageContext, globalScope = window) {
    if (!(pageContext instanceof PageContext)) {
      return {
        success: false,
        error: 'Invalid page context provided'
      };
    }

    if (!pageContext.isKKdayDomain) {
      return {
        success: false,
        error: 'Cannot extract data from non-KKday domain'
      };
    }

    try {
      const strategy = pageContext.getDataSourceStrategy();
      let rawData = null;
      let dataSourcePath = '';

      if (strategy === 'nuxt') {
        const result = this.extractFromNuxt(pageContext, globalScope);
        rawData = result.data;
        dataSourcePath = result.path;
      } else if (strategy === 'init_state') {
        const result = this.extractFromInitState(globalScope);
        rawData = result.data;
        dataSourcePath = result.path;
      } else {
        return {
          success: false,
          error: `Unknown extraction strategy: ${strategy}`
        };
      }

      if (!rawData) {
        return {
          success: false,
          error: 'No translation data found in global variables'
        };
      }

      // Convert raw data to TranslationEntry objects
      const translationEntries = this.convertToTranslationEntries(rawData);

      if (translationEntries.length === 0) {
        return {
          success: false,
          error: 'No valid translation entries found'
        };
      }

      return {
        success: true,
        data: translationEntries,
        dataSource: dataSourcePath,
        strategy: strategy,
        count: translationEntries.length
      };

    } catch (error) {
      return {
        success: false,
        error: `Data extraction failed: ${error.message}`
      };
    }
  }

  /**
   * Extract data from __NUXT__ global variable
   * @param {PageContext} pageContext - Page context for language detection
   * @param {Object} globalScope - Global scope object
   * @returns {Object} Extraction result
   */
  static extractFromNuxt(pageContext, globalScope) {
    const language = pageContext.language || 'zh-tw';
    const i18nKey = `$si18n_${language}`;
    const path = `__NUXT__.state['${i18nKey}']`;

    // Try to access __NUXT__.state[i18nKey]
    if (!globalScope.__NUXT__) {
      throw new Error('__NUXT__ global variable not found');
    }

    if (!globalScope.__NUXT__.state) {
      throw new Error('__NUXT__.state not found');
    }

    const i18nData = globalScope.__NUXT__.state[i18nKey];
    if (!i18nData) {
      throw new Error(`Translation data not found at ${path}`);
    }

    return {
      data: i18nData,
      path: path
    };
  }

  /**
   * Extract data from __INIT_STATE__ global variable
   * @param {Object} globalScope - Global scope object
   * @returns {Object} Extraction result
   */
  static extractFromInitState(globalScope) {
    const path = '__INIT_STATE__.lang';

    // Try to access __INIT_STATE__.lang
    if (!globalScope.__INIT_STATE__) {
      throw new Error('__INIT_STATE__ global variable not found');
    }

    const langData = globalScope.__INIT_STATE__.lang;
    if (!langData) {
      throw new Error(`Translation data not found at ${path}`);
    }

    return {
      data: langData,
      path: path
    };
  }

  /**
   * Convert raw data object to TranslationEntry array
   * @param {Object} rawData - Raw translation data object
   * @returns {Array<TranslationEntry>} Array of translation entries
   */
  static convertToTranslationEntries(rawData) {
    if (!rawData || typeof rawData !== 'object') {
      return [];
    }

    const entries = [];

    // Convert object entries to TranslationEntry format
    for (const [key, value] of Object.entries(rawData)) {
      try {
        // Only include string values
        if (typeof value === 'string' && value.trim() !== '') {
          entries.push(new TranslationEntry(key, value));
        }
      } catch (error) {
        // Skip invalid entries
        console.warn(`Skipping invalid translation entry: ${key}`, error);
      }
    }

    return entries;
  }

  /**
   * Test data extraction without throwing errors
   * @param {PageContext} pageContext - Page context
   * @param {Object} globalScope - Global scope object
   * @returns {Object} Test result
   */
  static async testDataExtraction(pageContext, globalScope = window) {
    try {
      const result = await this.extractTranslationData(pageContext, globalScope);
      return {
        canExtract: result.success,
        dataSource: result.dataSource || 'unknown',
        count: result.count || 0,
        error: result.error || null
      };
    } catch (error) {
      return {
        canExtract: false,
        dataSource: 'unknown',
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Get available data sources for current page
   * @param {Object} globalScope - Global scope object
   * @returns {Array<string>} Available data sources
   */
  static getAvailableDataSources(globalScope = window) {
    const sources = [];

    // Check for __NUXT__
    if (globalScope.__NUXT__ && globalScope.__NUXT__.state) {
      const state = globalScope.__NUXT__.state;
      // Look for i18n keys
      for (const key of Object.keys(state)) {
        if (key.startsWith('$si18n_')) {
          sources.push(`__NUXT__.state['${key}']`);
        }
      }
    }

    // Check for __INIT_STATE__
    if (globalScope.__INIT_STATE__ && globalScope.__INIT_STATE__.lang) {
      sources.push('__INIT_STATE__.lang');
    }

    return sources;
  }

  /**
   * Create mock translation data for testing
   * @param {number} count - Number of entries to create
   * @returns {Array<TranslationEntry>} Mock translation data
   */
  static createMockData(count = 5) {
    const mockEntries = [
      { key: 'lang_key_common', val: '常用文字' },
      { key: 'lang_key_button_submit', val: '提交按鈕' },
      { key: 'lang_key_error_message', val: '錯誤訊息' },
      { key: 'lang_key_title', val: '頁面標題' },
      { key: 'lang_key_description', val: '描述內容' },
      { key: 'lang_key_nav_home', val: '首頁' },
      { key: 'lang_key_nav_help', val: '幫助' },
      { key: 'lang_key_footer', val: '頁尾' },
      { key: 'lang_key_product_title', val: '產品標題' },
      { key: 'lang_key_price', val: '價格' }
    ];

    return mockEntries
      .slice(0, Math.min(count, mockEntries.length))
      .map(entry => new TranslationEntry(entry.key, entry.val));
  }

  /**
   * Create mock global scope for testing
   * @param {string} strategy - 'nuxt' or 'init_state'
   * @param {string} language - Language code for nuxt strategy
   * @returns {Object} Mock global scope
   */
  static createMockGlobalScope(strategy = 'nuxt', language = 'zh-tw') {
    const mockData = {
      'lang_key_common': '常用文字',
      'lang_key_button_submit': '提交',
      'lang_key_error_message': '錯誤訊息'
    };

    const globalScope = {};

    if (strategy === 'nuxt') {
      globalScope.__NUXT__ = {
        state: {
          [`$si18n_${language}`]: mockData
        }
      };
    } else if (strategy === 'init_state') {
      globalScope.__INIT_STATE__ = {
        lang: mockData
      };
    }

    return globalScope;
  }
}

module.exports = DataExtractionService;