/**
 * PageContext Model
 * Captures current page information for determining data extraction strategy
 */

class PageContext {
  /**
   * Create a PageContext
   * @param {string} domain - Current page domain
   * @param {string} pathname - Current page path
   * @param {boolean} isKKdayDomain - Whether domain matches *.kkday.com
   * @param {boolean} isProductPage - Whether URL matches /{lang}/product/[numbers] pattern
   * @param {string} language - Detected language code from URL path
   */
  constructor(domain, pathname, isKKdayDomain, isProductPage, language) {
    this.domain = domain;
    this.pathname = pathname;
    this.isKKdayDomain = isKKdayDomain;
    this.isProductPage = isProductPage;
    this.language = language;

    // Validate required fields
    this.validate();
  }

  /**
   * Validate the page context
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.domain || typeof this.domain !== 'string') {
      throw new Error('PageContext domain must be a non-empty string');
    }

    if (!this.pathname || typeof this.pathname !== 'string' || !this.pathname.startsWith('/')) {
      throw new Error('PageContext pathname must be a string starting with "/"');
    }

    if (typeof this.isKKdayDomain !== 'boolean') {
      throw new Error('PageContext isKKdayDomain must be a boolean');
    }

    if (typeof this.isProductPage !== 'boolean') {
      throw new Error('PageContext isProductPage must be a boolean');
    }

    if (typeof this.language !== 'string') {
      throw new Error('PageContext language must be a string');
    }
  }

  /**
   * Create PageContext from current window location
   * @param {Object} location - Window location object (optional, defaults to window.location)
   * @returns {PageContext} New PageContext instance
   */
  static fromLocation(location = window.location) {
    if (!location) {
      throw new Error('Location object is required');
    }

    const domain = location.hostname || '';
    const pathname = location.pathname || '/';

    // Check if domain matches *.kkday.com pattern
    const isKKdayDomain = PageContext.isKKdayDomain(domain);

    // Check if URL matches product page pattern
    const isProductPage = PageContext.isProductPage(pathname);

    // Extract language from path
    const language = PageContext.extractLanguage(pathname);

    return new PageContext(domain, pathname, isKKdayDomain, isProductPage, language);
  }

  /**
   * Check if domain is a KKday domain
   * @param {string} domain - Domain to check
   * @returns {boolean} True if KKday domain
   */
  static isKKdayDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      return false;
    }

    // Convert to lowercase for case-insensitive comparison
    const normalizedDomain = domain.toLowerCase();

    // Check for exact match or subdomain of kkday.com
    return normalizedDomain === 'kkday.com' ||
           normalizedDomain.endsWith('.kkday.com');
  }

  /**
   * Check if pathname matches product page pattern
   * @param {string} pathname - Pathname to check
   * @returns {boolean} True if product page
   */
  static isProductPage(pathname) {
    if (!pathname || typeof pathname !== 'string') {
      return false;
    }

    // Product page pattern: /{lang}/product/[numbers]
    const productPageRegex = /^\/[a-z]{2}(-[a-z]{2})?\/product\/\d+/i;
    return productPageRegex.test(pathname);
  }

  /**
   * Extract language code from pathname
   * @param {string} pathname - Pathname to extract from
   * @returns {string} Language code or empty string
   */
  static extractLanguage(pathname) {
    if (!pathname || typeof pathname !== 'string') {
      return '';
    }

    // Language pattern: /{lang}/ at the start
    // Must be exactly 2 letters or 2 letters-2letters format
    const languageMatch = pathname.match(/^\/([a-z]{2}(-[a-z]{2})?)(\/|$)/i);
    return languageMatch ? languageMatch[1] : '';
  }

  /**
   * Get the data source strategy based on page context
   * @returns {string} Data source strategy ('nuxt' or 'init_state')
   */
  getDataSourceStrategy() {
    if (!this.isKKdayDomain) {
      throw new Error('Cannot determine data source for non-KKday domain');
    }

    return this.isProductPage ? 'nuxt' : 'init_state';
  }

  /**
   * Get the specific global variable path for data extraction
   * @returns {string} Global variable path
   */
  getDataSourcePath() {
    const strategy = this.getDataSourceStrategy();

    if (strategy === 'nuxt') {
      // For product pages: __NUXT__.state['$si18n_{language}']
      const langSuffix = this.language || 'zh-tw';
      return `__NUXT__.state['$si18n_${langSuffix}']`;
    } else {
      // For other pages: __INIT_STATE__.lang
      return '__INIT_STATE__.lang';
    }
  }

  /**
   * Check if extension should be active on this page
   * @returns {boolean} True if extension should be active
   */
  shouldBeActive() {
    return this.isKKdayDomain;
  }

  /**
   * Get user-friendly page type description
   * @returns {string} Page type description
   */
  getPageTypeDescription() {
    if (!this.isKKdayDomain) {
      return 'Non-KKday domain';
    }

    return this.isProductPage ? 'Product page' : 'General page';
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    const result = {
      domain: this.domain,
      pathname: this.pathname,
      isKKdayDomain: this.isKKdayDomain,
      isProductPage: this.isProductPage,
      language: this.language,
      shouldBeActive: this.shouldBeActive(),
      pageTypeDescription: this.getPageTypeDescription()
    };

    // Only include data source info for KKday domains
    if (this.isKKdayDomain) {
      result.dataSourceStrategy = this.getDataSourceStrategy();
      result.dataSourcePath = this.getDataSourcePath();
    }

    return result;
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `PageContext{domain: "${this.domain}", type: "${this.getPageTypeDescription()}", lang: "${this.language}"}`;
  }
}

module.exports = PageContext;