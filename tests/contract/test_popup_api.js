/**
 * Contract Test: Popup API
 * Tests the popup API contracts defined in contracts/popup-api.json
 * These tests MUST FAIL until implementation is complete
 */

const PopupAPI = require('../../src/popup/popup.js');

describe('Popup API Contract Tests', () => {
  beforeEach(() => {
    // Mock translation data
    global.mockTranslationData = [
      { key: 'lang_key_common', val: '常用文字' },
      { key: 'lang_key_button_submit', val: '提交' },
      { key: 'lang_key_error_message', val: '錯誤訊息' },
      { key: 'lang_key_title', val: '標題' }
    ];

    // Mock chrome.tabs API
    global.chrome = {
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn()
      }
    };
  });

  describe('searchTranslations', () => {
    test('should return success with ranked results for valid query', async() => {
      const query = '常用';
      const options = { threshold: 0.3, limit: 10 };

      const result = await PopupAPI.searchTranslations(query, options);

      expect(result).toEqual({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            item: expect.objectContaining({
              key: expect.any(String),
              val: expect.any(String)
            }),
            score: expect.any(Number)
          })
        ])
      });

      // Results should be sorted by relevance (lower score = better match)
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i].score).toBeGreaterThanOrEqual(
          result.results[i - 1].score
        );
      }
    });

    test('should respect threshold option', async() => {
      const query = 'xyz123'; // Unlikely to match anything
      const options = { threshold: 0.1 }; // Very strict threshold

      const result = await PopupAPI.searchTranslations(query, options);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    test('should respect limit option', async() => {
      const query = '文';
      const options = { limit: 2 };

      const result = await PopupAPI.searchTranslations(query, options);

      expect(result.success).toBe(true);
      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    test('should return error for empty query', async() => {
      const result = await PopupAPI.searchTranslations('');

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('empty')
      });
    });

    test('should handle search with no data available', async() => {
      // Mock empty data
      global.mockTranslationData = [];

      const result = await PopupAPI.searchTranslations('test');

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
    });

    test('should return success when copy succeeds', async() => {
      const key = 'lang_key_common';

      const result = await PopupAPI.copyToClipboard(key);

      expect(result.success).toBe(true);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(key);
    });

    test('should return error when copy fails', async() => {
      navigator.clipboard.writeText = jest.fn().mockRejectedValue(
        new Error('Clipboard access denied')
      );

      const key = 'lang_key_common';

      const result = await PopupAPI.copyToClipboard(key);

      expect(result).toEqual({
        success: false,
        error: expect.any(String)
      });
    });

    test('should return error for empty key', async() => {
      const result = await PopupAPI.copyToClipboard('');

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('empty')
      });
    });
  });

  describe('getExtensionState', () => {
    test('should return complete extension state', async() => {
      const result = await PopupAPI.getExtensionState();

      expect(result).toEqual({
        isActive: expect.any(Boolean),
        hasData: expect.any(Boolean),
        errorMessage: expect.any(String)
      });
    });

    test('should return inactive state for non-KKday domains', async() => {
      // Mock non-KKday tab
      chrome.tabs.query.mockResolvedValue([{
        url: 'https://google.com'
      }]);

      const result = await PopupAPI.getExtensionState();

      expect(result.isActive).toBe(false);
      expect(result.errorMessage).toContain('KKday');
    });

    test('should return active state with data for valid KKday pages', async() => {
      // Mock KKday tab with data
      chrome.tabs.query.mockResolvedValue([{
        url: 'https://zh-tw.kkday.com/product/12345'
      }]);

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: global.mockTranslationData
      });

      const result = await PopupAPI.getExtensionState();

      expect(result.isActive).toBe(true);
      expect(result.hasData).toBe(true);
      expect(result.errorMessage).toBe('');
    });

    test('should return error state when data extraction fails', async() => {
      chrome.tabs.query.mockResolvedValue([{
        url: 'https://zh-tw.kkday.com/product/12345'
      }]);

      chrome.tabs.sendMessage.mockResolvedValue({
        success: false,
        error: 'No translation data found'
      });

      const result = await PopupAPI.getExtensionState();

      expect(result.isActive).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errorMessage).toContain('translation data');
    });
  });
});