/**
 * PageContextService
 * Service for analyzing and managing page context information
 */

const PageContext = require('../models/PageContext');

class PageContextService {
  /**
   * Analyze current page and create PageContext
   * @param {Object} location - Window location object (optional)
   * @returns {PageContext} Page context analysis
   */
  static analyzeCurrentPage(location = window.location) {
    try {
      return PageContext.fromLocation(location);
    } catch (error) {
      throw new Error(`Failed to analyze page context: ${error.message}`);
    }
  }

  /**
   * Analyze page from URL string
   * @param {string} url - Full URL to analyze
   * @returns {PageContext} Page context analysis
   */
  static analyzeUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    try {
      const urlObject = new URL(url);
      return PageContext.fromLocation(urlObject);
    } catch (error) {
      throw new Error(`Failed to parse URL: ${error.message}`);
    }
  }

  /**
   * Check if extension should be active for given context
   * @param {PageContext} pageContext - Page context to check
   * @returns {boolean} True if extension should be active
   */
  static shouldExtensionBeActive(pageContext) {
    if (!(pageContext instanceof PageContext)) {
      throw new Error('Invalid PageContext provided');
    }

    return pageContext.shouldBeActive();
  }

  /**
   * Get data extraction strategy for page context
   * @param {PageContext} pageContext - Page context
   * @returns {Object} Data extraction strategy information
   */
  static getDataExtractionStrategy(pageContext) {
    if (!(pageContext instanceof PageContext)) {
      throw new Error('Invalid PageContext provided');
    }

    if (!pageContext.isKKdayDomain) {
      throw new Error('Cannot determine data extraction strategy for non-KKday domain');
    }

    try {
      const strategy = pageContext.getDataSourceStrategy();
      const path = pageContext.getDataSourcePath();

      return {
        strategy: strategy,
        globalVariablePath: path,
        isProductPage: pageContext.isProductPage,
        language: pageContext.language,
        description: this.getStrategyDescription(strategy)
      };
    } catch (error) {
      throw new Error(`Failed to determine data extraction strategy: ${error.message}`);
    }
  }

  /**
   * Get human-readable description of extraction strategy
   * @param {string} strategy - Strategy type ('nuxt' or 'init_state')
   * @returns {string} Strategy description
   */
  static getStrategyDescription(strategy) {
    switch (strategy) {
    case 'nuxt':
      return 'Product page - extract from __NUXT__.state';
    case 'init_state':
      return 'General page - extract from __INIT_STATE__.lang';
    default:
      return 'Unknown strategy';
    }
  }

  /**
   * Validate if page context allows data extraction
   * @param {PageContext} pageContext - Page context to validate
   * @returns {Object} Validation result
   */
  static validateForDataExtraction(pageContext) {
    if (!(pageContext instanceof PageContext)) {
      return {
        isValid: false,
        error: 'Invalid PageContext provided'
      };
    }

    if (!pageContext.isKKdayDomain) {
      return {
        isValid: false,
        error: '不是目標網頁 - 僅支援 *.kkday.com 域名'
      };
    }

    try {
      const strategy = this.getDataExtractionStrategy(pageContext);
      return {
        isValid: true,
        strategy: strategy
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Compare two page contexts for changes
   * @param {PageContext} oldContext - Previous context
   * @param {PageContext} newContext - New context
   * @returns {Object} Change analysis
   */
  static compareContexts(oldContext, newContext) {
    if (!(oldContext instanceof PageContext) || !(newContext instanceof PageContext)) {
      throw new Error('Both contexts must be valid PageContext instances');
    }

    const changes = {
      domainChanged: oldContext.domain !== newContext.domain,
      pathChanged: oldContext.pathname !== newContext.pathname,
      languageChanged: oldContext.language !== newContext.language,
      pageTypeChanged: oldContext.isProductPage !== newContext.isProductPage,
      activationChanged: oldContext.shouldBeActive() !== newContext.shouldBeActive()
    };

    const hasChanges = Object.values(changes).some(changed => changed);

    let strategyChanged = false;
    try {
      const oldStrategy = oldContext.getDataSourceStrategy();
      const newStrategy = newContext.getDataSourceStrategy();
      strategyChanged = oldStrategy !== newStrategy;
    } catch (error) {
      // Strategy comparison failed, treat as changed
      strategyChanged = true;
    }

    return {
      hasChanges: hasChanges || strategyChanged,
      changes: {
        ...changes,
        strategyChanged: strategyChanged
      },
      requiresReinitialization: changes.domainChanged || changes.activationChanged || strategyChanged
    };
  }

  /**
   * Get error message for invalid page context
   * @param {PageContext} pageContext - Page context
   * @returns {string} User-friendly error message
   */
  static getErrorMessage(pageContext) {
    if (!(pageContext instanceof PageContext)) {
      return '無法分析當前頁面';
    }

    if (!pageContext.isKKdayDomain) {
      return '這不是目標網頁 - 此擴充功能僅適用於 KKday 網站 (*.kkday.com)';
    }

    return '頁面分析正常';
  }

  /**
   * Create mock page context for testing
   * @param {Object} options - Mock options
   * @returns {PageContext} Mock page context
   */
  static createMockContext(options = {}) {
    const defaults = {
      domain: 'zh-tw.kkday.com',
      pathname: '/zh-tw/product/12345',
      language: 'zh-tw'
    };

    const config = { ...defaults, ...options };

    const isKKdayDomain = PageContext.isKKdayDomain(config.domain);
    const isProductPage = PageContext.isProductPage(config.pathname);

    return new PageContext(
      config.domain,
      config.pathname,
      isKKdayDomain,
      isProductPage,
      config.language
    );
  }
}

module.exports = PageContextService;