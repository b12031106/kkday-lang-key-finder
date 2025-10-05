/**
 * Performance Test Suite
 * Tests that critical operations complete within performance requirements
 */

const SearchService = require('../../src/services/SearchService');
const TranslationEntry = require('../../src/models/TranslationEntry');
const PageContext = require('../../src/models/PageContext');
const DataExtractionService = require('../../src/services/DataExtractionService');

// CI 環境通常比本地慢 3 倍，放寬時間限制
const CI_MULTIPLIER = process.env.CI ? 3 : 1;

// Mock Fuse.js for consistent performance testing
jest.mock('fuse.js', () => {
  return jest.fn().mockImplementation((data, options) => {
    return {
      search: jest.fn((query, searchOptions) => {
        const results = data.filter(item => {
          const keyMatch = item.key && item.key.toLowerCase().includes(query.toLowerCase());
          const valMatch = item.val && item.val.toLowerCase().includes(query.toLowerCase());
          return keyMatch || valMatch;
        });
        return results.map((item, index) => ({
          item: item,
          score: 0.3,
          refIndex: index
        })).slice(0, searchOptions?.limit || 10);
      })
    };
  });
});

describe('Performance Test Suite', () => {
  describe('Search Performance', () => {
    let searchService;
    let testData;

    beforeEach(() => {
      // Generate test dataset
      testData = [];
      for (let i = 0; i < 5000; i++) {
        testData.push(new TranslationEntry(
          `lang_key_${i}_${Math.random().toString(36).substring(7)}`,
          `測試值 ${i} - ${Math.random().toString(36).substring(7)}`
        ));
      }
      searchService = new SearchService(testData);
    });

    test('should initialize search service with 5000 items in < 100ms', () => {
      const startTime = performance.now();
      new SearchService(testData);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      console.log(`Search service initialization: ${duration.toFixed(2)}ms`);
    });

    test('should perform single search in < 100ms', () => {
      const startTime = performance.now();
      const results = searchService.search('lang_key_2500');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      expect(results.length).toBeGreaterThan(0);
      console.log(`Single search execution: ${duration.toFixed(2)}ms`);
    });

    test('should perform 100 searches in < 100ms total', () => {
      const queries = [];
      for (let i = 0; i < 100; i++) {
        queries.push(`lang_key_${Math.floor(Math.random() * 5000)}`);
      }

      const startTime = performance.now();
      queries.forEach(query => {
        searchService.search(query);
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      console.log(`100 searches execution: ${duration.toFixed(2)}ms`);
    });

    test('should handle fuzzy search in < 100ms', () => {
      const startTime = performance.now();
      const results = searchService.search('測試值 123');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      expect(results.length).toBeGreaterThan(0);
      console.log(`Fuzzy search execution: ${duration.toFixed(2)}ms`);
    });
  });

  describe('PageContext Performance', () => {
    test('should detect page type in < 10ms', () => {
      const urls = [
        '/zh-tw/product/123456',
        '/en/category/tours',
        '/ja/search',
        '/zh-hk/product/999'
      ];

      urls.forEach(url => {
        const startTime = performance.now();
        PageContext.isProductPage(url);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(10 * CI_MULTIPLIER);
      });
    });

    test('should create PageContext instance in < 10ms', () => {
      const startTime = performance.now();
      new PageContext(
        'www.kkday.com',
        '/zh-tw/product/123456',
        true,
        true,
        'zh-tw'
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
      console.log(`PageContext creation: ${duration.toFixed(2)}ms`);
    });

    test('should extract language from 1000 paths in < 100ms', () => {
      const paths = [];
      for (let i = 0; i < 1000; i++) {
        paths.push(`/zh-tw/product/${i}`);
        paths.push(`/en/category/${i}`);
      }

      const startTime = performance.now();
      paths.forEach(path => {
        PageContext.extractLanguage(path);
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      console.log(`1000 language extractions: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Data Processing Performance', () => {
    test('should convert 1000 TranslationEntry objects in < 100ms', () => {
      const entries = [];
      for (let i = 0; i < 1000; i++) {
        entries.push(new TranslationEntry(`key_${i}`, `value_${i}`));
      }

      const startTime = performance.now();
      entries.forEach(entry => entry.toObject());
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      console.log(`1000 TranslationEntry conversions: ${duration.toFixed(2)}ms`);
    });

    test('should validate 1000 TranslationEntry objects in < 100ms', () => {
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        const entry = new TranslationEntry(`key_${i}`, `value_${i}`);
        entry.validate();
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      console.log(`1000 TranslationEntry validations: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Message Passing Performance', () => {
    test('should serialize/deserialize messages in < 10ms', () => {
      const message = {
        type: 'SEARCH_REQUEST',
        data: {
          query: 'test query',
          options: {
            limit: 10,
            threshold: 0.3
          },
          translations: Array(100).fill(null).map((_, i) => ({
            key: `key_${i}`,
            val: `value_${i}`
          }))
        }
      };

      const startTime = performance.now();
      const serialized = JSON.stringify(message);
      const deserialized = JSON.parse(serialized);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
      expect(deserialized).toEqual(message);
      console.log(`Message serialization/deserialization: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Batch Operations Performance', () => {
    test('should process batch search of 10 queries in < 100ms', () => {
      const searchService = new SearchService(
        Array(1000).fill(null).map((_, i) =>
          new TranslationEntry(`key_${i}`, `value_${i}`)
        )
      );

      const queries = [
        'key_100', 'value_200', 'key_300', 'value_400', 'key_500',
        'value_600', 'key_700', 'value_800', 'key_900', 'value_999'
      ];

      const startTime = performance.now();
      const results = queries.map(q => searchService.search(q));
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      expect(results.every(r => Array.isArray(r))).toBe(true);
      console.log(`Batch search (10 queries): ${duration.toFixed(2)}ms`);
    });

    test('should update search index with 1000 new items in < 100ms', () => {
      const searchService = new SearchService([]);

      const newData = Array(1000).fill(null).map((_, i) =>
        new TranslationEntry(`new_key_${i}`, `new_value_${i}`)
      );

      const startTime = performance.now();
      searchService.updateData(newData);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      expect(searchService.translationData.length).toBe(1000);
      console.log(`Index update (1000 items): ${duration.toFixed(2)}ms`);
    });
  });

  describe('End-to-End Performance', () => {
    test('should complete full search flow in < 100ms', () => {
      // Simulate complete search flow
      const startTime = performance.now();

      // 1. Create page context
      const context = new PageContext(
        'www.kkday.com',
        '/zh-tw/product/123',
        true,
        true,
        'zh-tw'
      );

      // 2. Initialize search service
      const translations = Array(1000).fill(null).map((_, i) =>
        new TranslationEntry(`lang_key_${i}`, `測試值 ${i}`)
      );
      const searchService = new SearchService(translations);

      // 3. Perform search
      const results = searchService.search('測試值 500');

      // 4. Process results
      const processedResults = results.map(r => ({
        key: r.item.key,
        value: r.item.val,
        score: r.getRelevancePercentage()
      }));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      expect(processedResults.length).toBeGreaterThan(0);
      console.log(`End-to-end search flow: ${duration.toFixed(2)}ms`);
    });

    test('should handle concurrent operations efficiently', async() => {
      const searchService = new SearchService(
        Array(1000).fill(null).map((_, i) =>
          new TranslationEntry(`key_${i}`, `value_${i}`)
        )
      );

      const startTime = performance.now();

      // Simulate concurrent operations
      const operations = [
        searchService.search('key_100'),
        searchService.search('value_200'),
        searchService.smartSearch('  KEY_300  '),
        searchService.preprocessQuery('test   query'),
        PageContext.isProductPage('/zh-tw/product/123'),
        PageContext.extractLanguage('/en/category/test')
      ];

      await Promise.all(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100 * CI_MULTIPLIER);
      console.log(`Concurrent operations: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Performance Summary', () => {
    test('should meet all performance requirements', () => {
      const results = {
        searchInit: 0,
        singleSearch: 0,
        batchSearch: 0,
        pageContext: 0,
        dataProcessing: 0
      };

      // Test search initialization
      const testData = Array(5000).fill(null).map((_, i) =>
        new TranslationEntry(`key_${i}`, `value_${i}`)
      );

      let start = performance.now();
      const searchService = new SearchService(testData);
      results.searchInit = performance.now() - start;

      // Test single search
      start = performance.now();
      searchService.search('key_2500');
      results.singleSearch = performance.now() - start;

      // Test batch search
      start = performance.now();
      for (let i = 0; i < 10; i++) {
        searchService.search(`key_${i * 100}`);
      }
      results.batchSearch = performance.now() - start;

      // Test page context
      start = performance.now();
      new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
      results.pageContext = performance.now() - start;

      // Test data processing
      start = performance.now();
      testData.slice(0, 100).forEach(entry => entry.toObject());
      results.dataProcessing = performance.now() - start;

      // All operations should complete within reasonable time (adjusted for CI)
      expect(results.searchInit).toBeLessThan(100 * CI_MULTIPLIER);
      expect(results.singleSearch).toBeLessThan(100 * CI_MULTIPLIER);
      expect(results.batchSearch).toBeLessThan(100 * CI_MULTIPLIER);
      expect(results.pageContext).toBeLessThan(10 * CI_MULTIPLIER);
      expect(results.dataProcessing).toBeLessThan(100 * CI_MULTIPLIER);

      console.log('\n=== Performance Summary ===');
      console.log(`Search Initialization (5000 items): ${results.searchInit.toFixed(2)}ms`);
      console.log(`Single Search: ${results.singleSearch.toFixed(2)}ms`);
      console.log(`Batch Search (10 queries): ${results.batchSearch.toFixed(2)}ms`);
      console.log(`PageContext Creation: ${results.pageContext.toFixed(2)}ms`);
      console.log(`Data Processing (100 items): ${results.dataProcessing.toFixed(2)}ms`);
      console.log(`Total: ${Object.values(results).reduce((a, b) => a + b, 0).toFixed(2)}ms`);
      console.log('All performance requirements met! ✅');
    });
  });
});