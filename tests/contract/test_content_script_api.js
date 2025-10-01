/**
 * Contract Test: Content Script API
 * Tests the content script API contracts defined in contracts/content-script-api.json
 * These tests MUST FAIL until implementation is complete
 */

const ContentScriptAPI = require('../../src/content/content-script.js');

describe('Content Script API Contract Tests', () => {
  beforeEach(() => {
    // Mock global variables that would be present on KKday pages
    global.__NUXT__ = {
      state: {
        '$si18n_zh-tw': {
          'lang_key_common': '常用文字',
          'lang_key_button_submit': '提交',
          'lang_key_error_message': '錯誤訊息'
        }
      }
    };

    global.__INIT_STATE__ = {
      lang: {
        'lang_key_title': '標題',
        'lang_key_description': '描述',
        'lang_key_footer': '頁尾'
      }
    };

    // Mock window.location
    delete window.location;
    window.location = {
      hostname: 'zh-tw.kkday.com',
      pathname: '/zh-tw/product/12345'
    };
  });

  describe('extractTranslationData', () => {
    test('should return success=true with data array for product pages', async() => {
      const result = await ContentScriptAPI.extractTranslationData();

      expect(result).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            key: expect.any(String),
            val: expect.any(String)
          })
        ]),
        dataSource: expect.any(String),
        strategy: expect.any(String),
        count: expect.any(Number)
      });

      expect(result.data.length).toBeGreaterThan(0);
    });

    test('should extract from __NUXT__ for product pages', async() => {
      window.location.pathname = '/zh-tw/product/12345';

      const result = await ContentScriptAPI.extractTranslationData();

      expect(result.success).toBe(true);
      expect(result.data).toContainEqual({
        key: 'lang_key_common',
        val: '常用文字'
      });
    });

    test('should extract from __INIT_STATE__ for non-product pages', async() => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'zh-tw.kkday.com',
          pathname: '/help/contact',
          href: 'https://zh-tw.kkday.com/help/contact'
        },
        writable: true,
        configurable: true
      });

      const result = await ContentScriptAPI.extractTranslationData();

      expect(result.success).toBe(true);
      expect(result.data).toContainEqual({
        key: 'lang_key_title',
        val: '標題'
      });
    });

    test('should return error when no data sources available', async() => {
      delete global.__NUXT__;
      delete global.__INIT_STATE__;

      const result = await ContentScriptAPI.extractTranslationData();

      expect(result).toEqual({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('getPageContext', () => {
    test('should return complete page context object', async() => {
      const result = await ContentScriptAPI.getPageContext();

      expect(result).toEqual({
        domain: 'zh-tw.kkday.com',
        pathname: '/zh-tw/product/12345',
        isKKdayDomain: true,
        isProductPage: true,
        language: 'zh-tw',
        dataSourcePath: expect.any(String),
        dataSourceStrategy: expect.any(String),
        pageTypeDescription: expect.any(String),
        shouldBeActive: expect.any(Boolean)
      });
    });

    test('should identify non-KKday domains', async() => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'google.com',
          pathname: '/',
          href: 'https://google.com/'
        },
        writable: true,
        configurable: true
      });

      const result = await ContentScriptAPI.getPageContext();

      expect(result.isKKdayDomain).toBe(false);
    });

    test('should identify non-product pages', async() => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'zh-tw.kkday.com',
          pathname: '/help/contact',
          href: 'https://zh-tw.kkday.com/help/contact'
        },
        writable: true,
        configurable: true
      });

      const result = await ContentScriptAPI.getPageContext();

      expect(result.isProductPage).toBe(false);
    });
  });

  describe('selectPageElement', () => {
    test('should return success with element text when element is clicked', async() => {
      // Mock DOM element
      const mockElement = {
        textContent: '測試文字內容'
      };

      // Mock element selection
      document.elementFromPoint = jest.fn().mockReturnValue(mockElement);

      const result = await ContentScriptAPI.selectPageElement();

      expect(result).toEqual({
        success: true,
        text: '測試文字內容'
      });
    });

    test('should return error when element selection fails', async() => {
      document.elementFromPoint = jest.fn().mockReturnValue(null);

      const result = await ContentScriptAPI.selectPageElement();

      expect(result).toEqual({
        success: false,
        error: expect.any(String)
      });
    });
  });
});