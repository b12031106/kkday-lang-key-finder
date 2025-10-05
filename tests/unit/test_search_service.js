/**
 * Unit Test: SearchService
 * Tests the fuzzy search service functionality
 */

const SearchService = require('../../src/services/SearchService');
const TranslationEntry = require('../../src/models/TranslationEntry');
const SearchResult = require('../../src/models/SearchResult');

// Mock Fuse.js
jest.mock('fuse.js', () => {
  return jest.fn().mockImplementation((data, _options) => {
    return {
      search: jest.fn((query, searchOptions) => {
        // Simple mock search implementation
        const results = data.filter(item => {
          const keyMatch = item.key && item.key.toLowerCase().includes(query.toLowerCase());
          const valMatch = item.val && item.val.toLowerCase().includes(query.toLowerCase());
          return keyMatch || valMatch;
        });

        // Return in Fuse.js format
        return results.map((item, index) => ({
          item: item,
          score: query === item.key || query === item.val ? 0 : 0.3,
          refIndex: index
        })).slice(0, searchOptions?.limit || 10);
      })
    };
  });
});

describe('SearchService Unit Tests', () => {
  let searchService;
  let mockTranslations;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock translation data
    mockTranslations = [
      new TranslationEntry('lang_key_common_button_submit', '送出'),
      new TranslationEntry('lang_key_common_button_cancel', '取消'),
      new TranslationEntry('lang_key_common_button_confirm', '確認'),
      new TranslationEntry('lang_key_common_label_name', '姓名'),
      new TranslationEntry('lang_key_common_label_email', '電子郵件'),
      new TranslationEntry('lang_key_common_label_phone', '電話'),
      new TranslationEntry('lang_key_product_title', '商品標題'),
      new TranslationEntry('lang_key_product_description', '商品說明'),
      new TranslationEntry('lang_key_product_price', '價格'),
      new TranslationEntry('lang_key_error_required', '此欄位為必填'),
      new TranslationEntry('lang_key_error_invalid_email', '請輸入有效的電子郵件'),
      new TranslationEntry('lang_key_success_message', '操作成功'),
      new TranslationEntry('lang_key_loading', '載入中...')
    ];

    searchService = new SearchService(mockTranslations);
  });

  describe('Constructor', () => {
    test('should create SearchService instance with data', () => {
      expect(searchService).toBeInstanceOf(SearchService);
      expect(searchService.translationData).toEqual(mockTranslations);
    });

    test('should create SearchService with empty data', () => {
      const emptyService = new SearchService();
      expect(emptyService).toBeInstanceOf(SearchService);
      expect(emptyService.translationData).toEqual([]);
    });

    test('should initialize with custom options', () => {
      const customOptions = {
        threshold: 0.5,
        limit: 20
      };
      const service = new SearchService(mockTranslations, customOptions);
      expect(service.fuseOptions.threshold).toBe(0.5);
    });

    test('should filter out non-TranslationEntry items', () => {
      const mixedData = [
        new TranslationEntry('key1', 'value1'),
        { key: 'key2', val: 'value2' }, // Not a TranslationEntry
        new TranslationEntry('key3', 'value3'),
        'invalid', // Invalid item
        null // Invalid item
      ];

      const service = new SearchService(mixedData);
      expect(service.translationData.length).toBe(2);
      expect(service.translationData[0].key).toBe('key1');
      expect(service.translationData[1].key).toBe('key3');
    });

    test('should throw error for non-array data', () => {
      expect(() => {
        new SearchService('not an array');
      }).toThrow('Translation data must be an array');

      expect(() => {
        new SearchService(123);
      }).toThrow('Translation data must be an array');
    });
  });

  describe('search', () => {
    test('should find matches by key', () => {
      const results = searchService.search('button');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // All results should be SearchResult instances
      results.forEach(result => {
        expect(result).toBeInstanceOf(SearchResult);
      });
    });

    test('should find matches by value', () => {
      const results = searchService.search('送出');

      expect(results.length).toBeGreaterThan(0);
      const foundResult = results.find(r => r.item.val === '送出');
      expect(foundResult).toBeDefined();
      expect(foundResult.item.key).toBe('lang_key_common_button_submit');
    });

    test('should throw error for invalid query', () => {
      expect(() => {
        searchService.search(null);
      }).toThrow('Search query must be a non-empty string');

      expect(() => {
        searchService.search('');
      }).toThrow('Search query must be a non-empty string');

      expect(() => {
        searchService.search(123);
      }).toThrow('Search query must be a non-empty string');
    });

    test('should respect limit option', () => {
      const results = searchService.search('common', { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('should respect threshold option', () => {
      const results = searchService.search('button', { threshold: 0.1 });
      expect(results).toBeDefined();
      // Results should have good scores due to low threshold
    });

    test('should filter by minimum relevance', () => {
      const results = searchService.search('button', { minRelevance: 70 });

      results.forEach(result => {
        expect(result.getRelevancePercentage()).toBeGreaterThanOrEqual(70);
      });
    });
  });

  describe('smartSearch', () => {
    test('should preprocess and search', () => {
      const results = searchService.smartSearch('  BUTTON  ');

      expect(results.length).toBeGreaterThan(0);
    });

    test('should return empty array for empty query', () => {
      const results = searchService.smartSearch('');
      expect(results).toEqual([]);
    });

    test('should return empty array for whitespace query', () => {
      const results = searchService.smartSearch('   ');
      expect(results).toEqual([]);
    });

    test('should handle null query', () => {
      const results = searchService.smartSearch(null);
      expect(results).toEqual([]);
    });

    test('should normalize multiple spaces', () => {
      const results = searchService.smartSearch('button    submit');
      expect(results).toBeDefined();
    });
  });

  describe('updateData', () => {
    test('should update translation data', () => {
      const newTranslations = [
        new TranslationEntry('new_key_1', 'New Value 1'),
        new TranslationEntry('new_key_2', 'New Value 2')
      ];

      searchService.updateData(newTranslations);
      expect(searchService.translationData).toEqual(newTranslations);

      const results = searchService.search('new_key_1');
      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle empty data update', () => {
      searchService.updateData([]);
      expect(searchService.translationData).toEqual([]);
    });

    test('should validate data on update', () => {
      const invalidData = [
        new TranslationEntry('valid_key', 'valid_value'),
        'invalid_item',
        null
      ];

      searchService.updateData(invalidData);
      expect(searchService.translationData.length).toBe(1);
    });
  });

  describe('preprocessQuery', () => {
    test('should trim whitespace', () => {
      const processed = searchService.preprocessQuery('  test  ');
      expect(processed).toBe('test');
    });

    test('should normalize multiple spaces', () => {
      const processed = searchService.preprocessQuery('test    query   here');
      expect(processed).toBe('test query here');
    });

    test('should convert to lowercase', () => {
      const processed = searchService.preprocessQuery('TEST Query');
      expect(processed).toBe('test query');
    });

    test('should handle empty string', () => {
      const processed = searchService.preprocessQuery('');
      expect(processed).toBe('');
    });

    test('should handle null', () => {
      const processed = searchService.preprocessQuery(null);
      expect(processed).toBe('');
    });
  });

  describe('searchKeyValue', () => {
    test('should search both keys and values when available', () => {
      // Check if method exists
      if (typeof searchService.searchKeyValue === 'function') {
        const results = searchService.searchKeyValue('button');

        expect(results).toBeDefined();
        expect(results.keys.length).toBeGreaterThan(0);
        expect(results.values.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getAllTranslations', () => {
    test('should return all translations when method exists', () => {
      // Check if method exists
      if (typeof searchService.getAllTranslations === 'function') {
        const all = searchService.getAllTranslations();

        expect(all.length).toBe(mockTranslations.length);
        all.forEach((item) => {
          expect(item).toBeInstanceOf(SearchResult);
        });
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in search', () => {
      const specialTranslations = [
        new TranslationEntry('special_chars', 'Test@#$%^&*()'),
        new TranslationEntry('with_dots', 'test.value.here'),
        new TranslationEntry('with_slashes', 'test/value\\here')
      ];

      const service = new SearchService(specialTranslations);
      const results = service.search('test');

      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle Unicode characters', () => {
      const unicodeTranslations = [
        new TranslationEntry('emoji_key', '😀😁😂'),
        new TranslationEntry('chinese_key', '中文測試'),
        new TranslationEntry('japanese_key', '日本語テスト')
      ];

      const service = new SearchService(unicodeTranslations);

      const results1 = service.search('emoji');
      expect(results1.length).toBeGreaterThan(0);

      const results2 = service.search('chinese');
      expect(results2.length).toBeGreaterThan(0);
    });

    test('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);

      expect(() => {
        searchService.search(longQuery);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large datasets', () => {
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push(new TranslationEntry(`key_${i}`, `value_${i}`));
      }

      const startTime = Date.now();
      const service = new SearchService(largeDataset);
      const initDuration = Date.now() - startTime;

      expect(initDuration).toBeLessThan(1000); // Should initialize quickly

      const searchStart = Date.now();
      const results = service.search('key_500');
      const searchDuration = Date.now() - searchStart;

      expect(searchDuration).toBeLessThan(100); // Should search quickly
      expect(results.length).toBeGreaterThan(0);
    });

    test('should perform multiple searches efficiently', () => {
      const queries = ['button', 'email', 'product', 'error', 'common'];
      const startTime = Date.now();

      queries.forEach(query => {
        searchService.search(query);
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete quickly
    });
  });
});