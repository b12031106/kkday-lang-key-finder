/**
 * Integration Test: Data Source Selection Scenario
 * Tests correct data extraction based on URL patterns
 * Based on Scenario 4 from quickstart.md
 */

describe('Data Source Selection Integration', () => {
  let mockChrome;

  beforeEach(() => {
    // Mock Chrome APIs
    mockChrome = {
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn()
      }
    };

    global.chrome = mockChrome;

    // Mock popup DOM
    document.body.innerHTML = `
      <div id="popup-container">
        <div id="main-interface">
          <input id="search-input" type="text" />
          <div id="search-results"></div>
          <div id="data-source-info"></div>
        </div>
      </div>
    `;
  });

  test('Extension extracts from __NUXT__ for product pages', async() => {
    const productPageUrls = [
      'https://zh-tw.kkday.com/zh-tw/product/12345',
      'https://ja.kkday.com/ja/product/67890',
      'https://en.kkday.com/en/product/11111',
      'https://ko.kkday.com/ko/product/22222'
    ];

    const nuxtData = [
      { key: 'lang_key_product_title', val: '產品標題' },
      { key: 'lang_key_product_desc', val: '產品描述' },
      { key: 'lang_key_price', val: '價格' }
    ];

    for (const url of productPageUrls) {
      mockChrome.tabs.query.mockResolvedValue([{ url, id: 1 }]);

      // Mock content script response indicating NUXT data source
      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: nuxtData,
        dataSource: '__NUXT__.state[\'$si18n_zh-tw\']'
      });

      const PopupController = require('../../src/popup/popup.js');
      const DataExtractionService = require('../../src/services/DataExtractionService.js');

      await PopupController.initialize();

      // Verify data was extracted from NUXT
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          action: 'extractTranslationData'
        })
      );

      // Verify correct data source is used
      const dataSourceInfo = document.getElementById('data-source-info');
      expect(dataSourceInfo.textContent).toContain('__NUXT__');
    }
  });

  test('Extension extracts from __INIT_STATE__ for non-product pages', async() => {
    const nonProductUrls = [
      'https://zh-tw.kkday.com/help/contact',
      'https://ja.kkday.com/about/company',
      'https://en.kkday.com/support/faq',
      'https://ko.kkday.com/terms/privacy',
      'https://th.kkday.com/blog/travel-tips'
    ];

    const initStateData = [
      { key: 'lang_key_nav_home', val: '首頁' },
      { key: 'lang_key_nav_help', val: '幫助' },
      { key: 'lang_key_footer_copyright', val: '版權所有' }
    ];

    for (const url of nonProductUrls) {
      mockChrome.tabs.query.mockResolvedValue([{ url, id: 1 }]);

      // Mock content script response indicating INIT_STATE data source
      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: initStateData,
        dataSource: '__INIT_STATE__.lang'
      });

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      // Verify correct data source is used
      const dataSourceInfo = document.getElementById('data-source-info');
      expect(dataSourceInfo.textContent).toContain('__INIT_STATE__');
    }
  });

  test('Search results are appropriate for each data source', async() => {
    const PopupController = require('../../src/popup/popup.js');

    // Test product page with NUXT data
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/zh-tw/product/12345',
      id: 1
    }]);

    const nuxtData = [
      { key: 'lang_key_product_title', val: '精選產品標題' },
      { key: 'lang_key_product_price', val: '特惠價格' }
    ];

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: nuxtData,
      dataSource: '__NUXT__.state[\'$si18n_zh-tw\']'
    });

    await PopupController.initialize();

    // Search for product-related terms
    const searchInput = document.getElementById('search-input');
    searchInput.value = '產品';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const searchResults = document.getElementById('search-results');
    const resultElements = searchResults.querySelectorAll('.search-result');

    // Should find product-related translations
    const productTitleResult = Array.from(resultElements).find(element =>
      element.textContent.includes('lang_key_product_title')
    );
    expect(productTitleResult).toBeTruthy();

    // Reset for non-product page test
    document.getElementById('search-results').innerHTML = '';

    // Test non-product page with INIT_STATE data
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/help/contact',
      id: 1
    }]);

    const initStateData = [
      { key: 'lang_key_nav_help', val: '幫助中心' },
      { key: 'lang_key_contact_form', val: '聯絡表單' }
    ];

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: initStateData,
      dataSource: '__INIT_STATE__.lang'
    });

    await PopupController.initialize();

    // Search for navigation-related terms
    searchInput.value = '幫助';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const helpResults = searchResults.querySelectorAll('.search-result');

    // Should find navigation-related translations
    const helpResult = Array.from(helpResults).find(element =>
      element.textContent.includes('lang_key_nav_help')
    );
    expect(helpResult).toBeTruthy();
  });

  test('URL pattern recognition handles edge cases', async() => {
    const edgeCaseUrls = [
      {
        url: 'https://zh-tw.kkday.com/zh-tw/product/12345/details',
        isProduct: true,
        description: 'Product page with additional path'
      },
      {
        url: 'https://zh-tw.kkday.com/zh-tw/product/12345?ref=search',
        isProduct: true,
        description: 'Product page with query parameters'
      },
      {
        url: 'https://zh-tw.kkday.com/zh-tw/products',
        isProduct: false,
        description: 'Products listing page (not individual product)'
      },
      {
        url: 'https://zh-tw.kkday.com/zh-tw/product-category/tours',
        isProduct: false,
        description: 'Product category page'
      },
      {
        url: 'https://zh-tw.kkday.com/zh-tw/search?q=product',
        isProduct: false,
        description: 'Search page mentioning product'
      }
    ];

    for (const testCase of edgeCaseUrls) {
      mockChrome.tabs.query.mockResolvedValue([{
        url: testCase.url,
        id: 1
      }]);

      const expectedDataSource = testCase.isProduct
        ? '__NUXT__.state[\'$si18n_zh-tw\']'
        : '__INIT_STATE__.lang';

      const mockData = testCase.isProduct
        ? [{ key: 'product_key', val: 'Product Value' }]
        : [{ key: 'general_key', val: 'General Value' }];

      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: mockData,
        dataSource: expectedDataSource
      });

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      const dataSourceInfo = document.getElementById('data-source-info');

      if (testCase.isProduct) {
        expect(dataSourceInfo.textContent).toContain('__NUXT__');
      } else {
        expect(dataSourceInfo.textContent).toContain('__INIT_STATE__');
      }
    }
  });

  test('Handles language code variations in product URLs', async() => {
    const languageCodes = ['zh-tw', 'zh-cn', 'ja', 'ko', 'en', 'th', 'vi'];

    for (const lang of languageCodes) {
      const url = `https://${lang}.kkday.com/${lang}/product/12345`;

      mockChrome.tabs.query.mockResolvedValue([{ url, id: 1 }]);

      // Mock data with language-specific key
      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: [{ key: 'lang_key_test', val: `Test ${lang}` }],
        dataSource: `__NUXT__.state['$si18n_${lang}']`
      });

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      // Should recognize as product page regardless of language
      const dataSourceInfo = document.getElementById('data-source-info');
      expect(dataSourceInfo.textContent).toContain('__NUXT__');
      expect(dataSourceInfo.textContent).toContain(lang);
    }
  });

  test('Fallback behavior when primary data source fails', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/zh-tw/product/12345',
      id: 1
    }]);

    // Mock primary data source failure with fallback success
    mockChrome.tabs.sendMessage
      .mockResolvedValueOnce({ // First attempt (NUXT) fails
        success: false,
        error: '__NUXT__ data not available'
      })
      .mockResolvedValueOnce({ // Fallback to INIT_STATE succeeds
        success: true,
        data: [{ key: 'fallback_key', val: 'Fallback Value' }],
        dataSource: '__INIT_STATE__.lang (fallback)'
      });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Should show fallback data source
    const dataSourceInfo = document.getElementById('data-source-info');
    expect(dataSourceInfo.textContent).toContain('fallback');
  });

  test('Data extraction respects content script timeout', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/zh-tw/product/12345',
      id: 1
    }]);

    // Mock content script timeout
    mockChrome.tabs.sendMessage.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            error: 'Content script timeout'
          });
        }, 100);
      });
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Should handle timeout gracefully
    const dataSourceInfo = document.getElementById('data-source-info');
    expect(dataSourceInfo.textContent).toContain('timeout' || '超時');
  });
});