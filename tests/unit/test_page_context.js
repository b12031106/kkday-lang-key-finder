/**
 * Unit Test: PageContext Model
 * Tests the PageContext model for determining page type and data extraction strategy
 */

const PageContext = require('../../src/models/PageContext');

describe('PageContext Model Unit Tests', () => {
  describe('Constructor', () => {
    test('should create valid PageContext with all properties', () => {
      const context = new PageContext(
        'www.kkday.com',
        '/zh-tw/product/123456',
        true,
        true,
        'zh-tw'
      );

      expect(context.domain).toBe('www.kkday.com');
      expect(context.pathname).toBe('/zh-tw/product/123456');
      expect(context.isKKdayDomain).toBe(true);
      expect(context.isProductPage).toBe(true);
      expect(context.language).toBe('zh-tw');
      expect(context).toBeInstanceOf(PageContext);
    });

    test('should create context for non-KKday domain', () => {
      const context = new PageContext(
        'example.com',
        '/some/path',
        false,
        false,
        ''
      );

      expect(context.domain).toBe('example.com');
      expect(context.pathname).toBe('/some/path');
      expect(context.isKKdayDomain).toBe(false);
      expect(context.isProductPage).toBe(false);
      expect(context.language).toBe('');
    });

    test('should create context for KKday general page', () => {
      const context = new PageContext(
        'www.kkday.com',
        '/zh-tw/category/tours',
        true,
        false,
        'zh-tw'
      );

      expect(context.isKKdayDomain).toBe(true);
      expect(context.isProductPage).toBe(false);
    });

    test('should handle various languages', () => {
      const zhTwContext = new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
      const enContext = new PageContext('www.kkday.com', '/en/product/456', true, true, 'en');
      const jaContext = new PageContext('www.kkday.com', '/ja/product/789', true, true, 'ja');

      expect(zhTwContext.language).toBe('zh-tw');
      expect(enContext.language).toBe('en');
      expect(jaContext.language).toBe('ja');
    });
  });

  describe('Validation', () => {
    test('should throw error for null domain', () => {
      expect(() => {
        new PageContext(null, '/path', true, true, 'en');
      }).toThrow('PageContext domain must be a non-empty string');
    });

    test('should throw error for empty domain', () => {
      expect(() => {
        new PageContext('', '/path', true, true, 'en');
      }).toThrow('PageContext domain must be a non-empty string');
    });

    test('should throw error for non-string domain', () => {
      expect(() => {
        new PageContext(123, '/path', true, true, 'en');
      }).toThrow('PageContext domain must be a non-empty string');
    });

    test('should throw error for null pathname', () => {
      expect(() => {
        new PageContext('www.kkday.com', null, true, true, 'en');
      }).toThrow('PageContext pathname must be a string starting with "/"');
    });

    test('should throw error for empty pathname', () => {
      expect(() => {
        new PageContext('www.kkday.com', '', true, true, 'en');
      }).toThrow('PageContext pathname must be a string starting with "/"');
    });

    test('should throw error for pathname not starting with /', () => {
      expect(() => {
        new PageContext('www.kkday.com', 'path', true, true, 'en');
      }).toThrow('PageContext pathname must be a string starting with "/"');
    });

    test('should throw error for non-boolean isKKdayDomain', () => {
      expect(() => {
        new PageContext('www.kkday.com', '/path', 'yes', true, 'en');
      }).toThrow('PageContext isKKdayDomain must be a boolean');
    });

    test('should throw error for non-boolean isProductPage', () => {
      expect(() => {
        new PageContext('www.kkday.com', '/path', true, 'yes', 'en');
      }).toThrow('PageContext isProductPage must be a boolean');
    });

    test('should throw error for non-string language', () => {
      expect(() => {
        new PageContext('www.kkday.com', '/path', true, true, 123);
      }).toThrow('PageContext language must be a string');
    });
  });

  describe('Static Methods', () => {
    describe('isKKdayDomain', () => {
      test('should return true for kkday.com', () => {
        expect(PageContext.isKKdayDomain('kkday.com')).toBe(true);
        expect(PageContext.isKKdayDomain('KKday.com')).toBe(true);
        expect(PageContext.isKKdayDomain('KKDAY.COM')).toBe(true);
      });

      test('should return true for *.kkday.com subdomains', () => {
        expect(PageContext.isKKdayDomain('www.kkday.com')).toBe(true);
        expect(PageContext.isKKdayDomain('staging.kkday.com')).toBe(true);
        expect(PageContext.isKKdayDomain('api.kkday.com')).toBe(true);
        expect(PageContext.isKKdayDomain('multi.level.subdomain.kkday.com')).toBe(true);
      });

      test('should return false for non-kkday domains', () => {
        expect(PageContext.isKKdayDomain('example.com')).toBe(false);
        expect(PageContext.isKKdayDomain('kkday.net')).toBe(false);
        expect(PageContext.isKKdayDomain('notkkday.com')).toBe(false);
        expect(PageContext.isKKdayDomain('kkday.com.tw')).toBe(false);
      });

      test('should handle invalid inputs', () => {
        expect(PageContext.isKKdayDomain(null)).toBe(false);
        expect(PageContext.isKKdayDomain(undefined)).toBe(false);
        expect(PageContext.isKKdayDomain('')).toBe(false);
        expect(PageContext.isKKdayDomain(123)).toBe(false);
      });
    });

    describe('isProductPage', () => {
      test('should return true for product page patterns', () => {
        expect(PageContext.isProductPage('/zh-tw/product/123456')).toBe(true);
        expect(PageContext.isProductPage('/en/product/789')).toBe(true);
        expect(PageContext.isProductPage('/ja/product/1')).toBe(true);
        expect(PageContext.isProductPage('/zh-hk/product/999999')).toBe(true);
      });

      test('should return false for non-product page patterns', () => {
        expect(PageContext.isProductPage('/zh-tw')).toBe(false);
        expect(PageContext.isProductPage('/zh-tw/category/tours')).toBe(false);
        expect(PageContext.isProductPage('/zh-tw/search')).toBe(false);
        expect(PageContext.isProductPage('/zh-tw/products/123')).toBe(false); // products (plural)
        expect(PageContext.isProductPage('/zh-tw/product')).toBe(false); // No ID
        expect(PageContext.isProductPage('/zh-tw/product/abc')).toBe(false); // Non-numeric ID
        expect(PageContext.isProductPage('/product/123')).toBe(false); // No language
      });

      test('should handle invalid inputs', () => {
        expect(PageContext.isProductPage(null)).toBe(false);
        expect(PageContext.isProductPage(undefined)).toBe(false);
        expect(PageContext.isProductPage('')).toBe(false);
        expect(PageContext.isProductPage(123)).toBe(false);
      });
    });

    describe('extractLanguage', () => {
      test('should extract language codes from pathname', () => {
        expect(PageContext.extractLanguage('/zh-tw/product/123')).toBe('zh-tw');
        expect(PageContext.extractLanguage('/en/category/tours')).toBe('en');
        expect(PageContext.extractLanguage('/ja/search')).toBe('ja');
        expect(PageContext.extractLanguage('/zh-hk/home')).toBe('zh-hk');
      });

      test('should return empty string for paths without language', () => {
        expect(PageContext.extractLanguage('/')).toBe('');
        expect(PageContext.extractLanguage('/product/123')).toBe('');
        expect(PageContext.extractLanguage('/search')).toBe('');
      });

      test('should handle invalid inputs', () => {
        expect(PageContext.extractLanguage(null)).toBe('');
        expect(PageContext.extractLanguage(undefined)).toBe('');
        expect(PageContext.extractLanguage('')).toBe('');
        expect(PageContext.extractLanguage(123)).toBe('');
      });
    });

    describe('fromLocation', () => {
      test('should create PageContext from location object', () => {
        const mockLocation = {
          hostname: 'www.kkday.com',
          pathname: '/zh-tw/product/123456'
        };

        const context = PageContext.fromLocation(mockLocation);

        expect(context.domain).toBe('www.kkday.com');
        expect(context.pathname).toBe('/zh-tw/product/123456');
        expect(context.isKKdayDomain).toBe(true);
        expect(context.isProductPage).toBe(true);
        expect(context.language).toBe('zh-tw');
      });

      test('should handle non-KKday domain location', () => {
        const mockLocation = {
          hostname: 'example.com',
          pathname: '/some/path'
        };

        const context = PageContext.fromLocation(mockLocation);

        expect(context.domain).toBe('example.com');
        expect(context.pathname).toBe('/some/path');
        expect(context.isKKdayDomain).toBe(false);
        expect(context.isProductPage).toBe(false);
        expect(context.language).toBe('');
      });

      test('should handle missing properties with defaults', () => {
        const mockLocation = {};

        // Empty domain will fail validation
        expect(() => {
          PageContext.fromLocation(mockLocation);
        }).toThrow('PageContext domain must be a non-empty string');
      });

      test('should throw error for null location', () => {
        expect(() => {
          PageContext.fromLocation(null);
        }).toThrow('Location object is required');
      });
    });
  });

  describe('Instance Methods', () => {
    describe('getDataSourceStrategy', () => {
      test('should return "nuxt" for product pages', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
        expect(context.getDataSourceStrategy()).toBe('nuxt');
      });

      test('should return "init_state" for general pages', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/category', true, false, 'zh-tw');
        expect(context.getDataSourceStrategy()).toBe('init_state');
      });

      test('should throw error for non-KKday domain', () => {
        const context = new PageContext('example.com', '/path', false, false, '');
        expect(() => {
          context.getDataSourceStrategy();
        }).toThrow('Cannot determine data source for non-KKday domain');
      });
    });

    describe('getDataSourcePath', () => {
      test('should return NUXT path for product pages', () => {
        const zhContext = new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
        expect(zhContext.getDataSourcePath()).toBe('__NUXT__.state[\'$si18n_zh-tw\']');

        const enContext = new PageContext('www.kkday.com', '/en/product/456', true, true, 'en');
        expect(enContext.getDataSourcePath()).toBe('__NUXT__.state[\'$si18n_en\']');
      });

      test('should use default language if not specified', () => {
        const context = new PageContext('www.kkday.com', '/product/123', true, true, '');
        expect(context.getDataSourcePath()).toBe('__NUXT__.state[\'$si18n_zh-tw\']');
      });

      test('should return INIT_STATE path for general pages', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/category', true, false, 'zh-tw');
        expect(context.getDataSourcePath()).toBe('__INIT_STATE__.lang');
      });
    });

    describe('shouldBeActive', () => {
      test('should return true for KKday domains', () => {
        const context = new PageContext('www.kkday.com', '/path', true, false, '');
        expect(context.shouldBeActive()).toBe(true);
      });

      test('should return false for non-KKday domains', () => {
        const context = new PageContext('example.com', '/path', false, false, '');
        expect(context.shouldBeActive()).toBe(false);
      });
    });

    describe('getPageTypeDescription', () => {
      test('should return "Product page" for product pages', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
        expect(context.getPageTypeDescription()).toBe('Product page');
      });

      test('should return "General page" for general KKday pages', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/category', true, false, 'zh-tw');
        expect(context.getPageTypeDescription()).toBe('General page');
      });

      test('should return "Non-KKday domain" for non-KKday sites', () => {
        const context = new PageContext('example.com', '/path', false, false, '');
        expect(context.getPageTypeDescription()).toBe('Non-KKday domain');
      });
    });

    describe('toObject', () => {
      test('should convert PageContext to plain object for KKday product page', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
        const obj = context.toObject();

        expect(obj).toEqual({
          domain: 'www.kkday.com',
          pathname: '/zh-tw/product/123',
          isKKdayDomain: true,
          isProductPage: true,
          language: 'zh-tw',
          shouldBeActive: true,
          pageTypeDescription: 'Product page',
          dataSourceStrategy: 'nuxt',
          dataSourcePath: '__NUXT__.state[\'$si18n_zh-tw\']'
        });
      });

      test('should convert PageContext to plain object for KKday general page', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/category', true, false, 'zh-tw');
        const obj = context.toObject();

        expect(obj).toEqual({
          domain: 'www.kkday.com',
          pathname: '/zh-tw/category',
          isKKdayDomain: true,
          isProductPage: false,
          language: 'zh-tw',
          shouldBeActive: true,
          pageTypeDescription: 'General page',
          dataSourceStrategy: 'init_state',
          dataSourcePath: '__INIT_STATE__.lang'
        });
      });

      test('should exclude data source info for non-KKday domains', () => {
        const context = new PageContext('example.com', '/path', false, false, '');
        const obj = context.toObject();

        expect(obj).toEqual({
          domain: 'example.com',
          pathname: '/path',
          isKKdayDomain: false,
          isProductPage: false,
          language: '',
          shouldBeActive: false,
          pageTypeDescription: 'Non-KKday domain'
        });

        expect(obj.dataSourceStrategy).toBeUndefined();
        expect(obj.dataSourcePath).toBeUndefined();
      });
    });

    describe('toString', () => {
      test('should return string representation', () => {
        const context = new PageContext('www.kkday.com', '/zh-tw/product/123', true, true, 'zh-tw');
        const str = context.toString();

        expect(typeof str).toBe('string');
        expect(str).toContain('PageContext');
        expect(str).toContain('www.kkday.com');
        expect(str).toContain('Product page');
        expect(str).toContain('zh-tw');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long pathnames', () => {
      const longPath = '/' + 'a'.repeat(2000);
      const context = new PageContext('www.kkday.com', longPath, true, false, '');

      expect(context.pathname).toBe(longPath);
      expect(context.pathname.length).toBe(2001);
    });

    test('should handle special characters in domain', () => {
      const context = new PageContext('測試.kkday.com', '/path', false, false, '');
      expect(context.domain).toBe('測試.kkday.com');
    });

    test('should handle language codes with different cases', () => {
      // Test that language extraction is case-insensitive
      expect(PageContext.extractLanguage('/ZH-TW/product/123')).toBe('ZH-TW');
      expect(PageContext.extractLanguage('/En/product/456')).toBe('En');
    });
  });

  describe('Performance', () => {
    test('should create many instances efficiently', () => {
      const startTime = Date.now();
      const contexts = [];

      for (let i = 0; i < 10000; i++) {
        contexts.push(new PageContext(
          'www.kkday.com',
          `/zh-tw/product/${i}`,
          true,
          true,
          'zh-tw'
        ));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(contexts).toHaveLength(10000);
      expect(duration).toBeLessThan(500); // Should create 10000 instances in less than 500ms
    });

    test('should check domains efficiently', () => {
      const domains = [];
      for (let i = 0; i < 10000; i++) {
        domains.push(`subdomain${i}.kkday.com`);
      }

      const startTime = Date.now();
      const results = domains.map(d => PageContext.isKKdayDomain(d));
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10000);
      expect(results.every(r => r === true)).toBe(true);
      expect(duration).toBeLessThan(100); // Should check 10000 domains in less than 100ms
    });
  });
});