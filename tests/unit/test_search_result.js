/**
 * Unit Test: SearchResult Model
 * Tests the SearchResult model scoring and functionality
 */

const SearchResult = require('../../src/models/SearchResult');
const TranslationEntry = require('../../src/models/TranslationEntry');

describe('SearchResult Model Unit Tests', () => {
  describe('Constructor', () => {
    test('should create valid SearchResult with TranslationEntry and score', () => {
      const entry = new TranslationEntry('lang_key_test', 'Test Value');
      const result = new SearchResult(entry, 0.5);

      expect(result.item).toBe(entry);
      expect(result.score).toBe(0.5);
      expect(result).toBeInstanceOf(SearchResult);
    });

    test('should accept perfect match score (0)', () => {
      const entry = new TranslationEntry('lang_key_perfect', 'Perfect Match');
      const result = new SearchResult(entry, 0);

      expect(result.score).toBe(0);
      expect(result.isPerfectMatch()).toBe(true);
    });

    test('should accept poor match score (1)', () => {
      const entry = new TranslationEntry('lang_key_poor', 'Poor Match');
      const result = new SearchResult(entry, 1);

      expect(result.score).toBe(1);
      expect(result.isPerfectMatch()).toBe(false);
    });

    test('should handle decimal scores', () => {
      const entry = new TranslationEntry('lang_key_decimal', 'Decimal Score');
      const result = new SearchResult(entry, 0.123456789);

      expect(result.score).toBe(0.123456789);
    });
  });

  describe('Validation', () => {
    test('should throw error for null TranslationEntry', () => {
      expect(() => {
        new SearchResult(null, 0.5);
      }).toThrow('SearchResult item must be a TranslationEntry instance');
    });

    test('should throw error for undefined TranslationEntry', () => {
      expect(() => {
        new SearchResult(undefined, 0.5);
      }).toThrow('SearchResult item must be a TranslationEntry instance');
    });

    test('should throw error for non-TranslationEntry object', () => {
      const fakeEntry = { key: 'fake', val: 'not a real entry' };
      expect(() => {
        new SearchResult(fakeEntry, 0.5);
      }).toThrow('SearchResult item must be a TranslationEntry instance');
    });

    test('should throw error for null score', () => {
      const entry = new TranslationEntry('lang_key', 'value');
      expect(() => {
        new SearchResult(entry, null);
      }).toThrow('SearchResult score must be a number');
    });

    test('should throw error for undefined score', () => {
      const entry = new TranslationEntry('lang_key', 'value');
      expect(() => {
        new SearchResult(entry, undefined);
      }).toThrow('SearchResult score must be a number');
    });

    test('should throw error for string score', () => {
      const entry = new TranslationEntry('lang_key', 'value');
      expect(() => {
        new SearchResult(entry, '0.5');
      }).toThrow('SearchResult score must be a number');
    });

    test('should throw error for negative score', () => {
      const entry = new TranslationEntry('lang_key', 'value');
      expect(() => {
        new SearchResult(entry, -0.1);
      }).toThrow('SearchResult score must be between 0 and 1');
    });

    test('should throw error for score greater than 1', () => {
      const entry = new TranslationEntry('lang_key', 'value');
      expect(() => {
        new SearchResult(entry, 1.1);
      }).toThrow('SearchResult score must be between 0 and 1');
    });
  });

  describe('Instance Methods', () => {
    describe('isPerfectMatch', () => {
      test('should return true for score of 0', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0);

        expect(result.isPerfectMatch()).toBe(true);
      });

      test('should return false for score greater than 0', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.01);

        expect(result.isPerfectMatch()).toBe(false);
      });

      test('should return false for score of 0.1', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.1);

        expect(result.isPerfectMatch()).toBe(false);
      });
    });

    describe('isGoodMatch', () => {
      test('should return true for score less than threshold', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.2);

        expect(result.isGoodMatch(0.3)).toBe(true);
      });

      test('should return true for score equal to threshold', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.3);

        expect(result.isGoodMatch(0.3)).toBe(true);
      });

      test('should return false for score greater than threshold', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.4);

        expect(result.isGoodMatch(0.3)).toBe(false);
      });

      test('should use default threshold of 0.3 when not provided', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const goodResult = new SearchResult(entry, 0.25);
        const badResult = new SearchResult(entry, 0.35);

        expect(goodResult.isGoodMatch()).toBe(true);
        expect(badResult.isGoodMatch()).toBe(false);
      });
    });

    describe('getConfidenceLevel', () => {
      test('should return "perfect" for score 0', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0);

        expect(result.getConfidenceLevel()).toBe('perfect');
      });

      test('should return "high" for score < 0.2', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.15);

        expect(result.getConfidenceLevel()).toBe('high');
      });

      test('should return "medium" for score < 0.4', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.35);

        expect(result.getConfidenceLevel()).toBe('medium');
      });

      test('should return "low" for score < 0.6', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.55);

        expect(result.getConfidenceLevel()).toBe('low');
      });

      test('should return "very_low" for score >= 0.6', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.8);

        expect(result.getConfidenceLevel()).toBe('very_low');
      });
    });

    describe('toObject', () => {
      test('should convert SearchResult to plain object', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.25);
        const obj = result.toObject();

        expect(obj).toEqual({
          item: {
            key: 'lang_key',
            val: 'value'
          },
          score: 0.25,
          refIndex: 0
        });
        expect(obj.item).not.toBe(entry); // Should be a copy
      });

      test('should include confidence level in object', () => {
        const entry = new TranslationEntry('lang_key', 'value');
        const result = new SearchResult(entry, 0.15);
        const obj = result.toObject();

        // Check if confidence level is accessible
        const confidence = result.getConfidenceLevel();
        expect(confidence).toBe('high');
      });
    });

    describe('toString', () => {
      test('should return string representation', () => {
        const entry = new TranslationEntry('lang_key', 'Test Value');
        const result = new SearchResult(entry, 0.25);
        const str = result.toString();

        expect(typeof str).toBe('string');
        expect(str).toContain('lang_key');
        expect(str).toContain('0.25');
        expect(str).toContain('SearchResult');
      });

      test('should show perfect match indicator', () => {
        const entry = new TranslationEntry('lang_key_perfect', 'Perfect');
        const result = new SearchResult(entry, 0);
        const str = result.toString();

        expect(str).toContain('perfect');
      });
    });
  });

  describe('Static Methods', () => {
    describe('sortByScore', () => {
      test('should sort results by score ascending (best first)', () => {
        const entry1 = new TranslationEntry('key1', 'value1');
        const entry2 = new TranslationEntry('key2', 'value2');
        const entry3 = new TranslationEntry('key3', 'value3');

        const results = [
          new SearchResult(entry2, 0.5),
          new SearchResult(entry1, 0.1),
          new SearchResult(entry3, 0.3)
        ];

        const sorted = SearchResult.sortByScore(results);

        expect(sorted[0].score).toBe(0.1);
        expect(sorted[1].score).toBe(0.3);
        expect(sorted[2].score).toBe(0.5);
      });

      test('should not modify original array', () => {
        const entry1 = new TranslationEntry('key1', 'value1');
        const entry2 = new TranslationEntry('key2', 'value2');

        const results = [
          new SearchResult(entry1, 0.5),
          new SearchResult(entry2, 0.1)
        ];

        const originalCopy = [...results];
        const sorted = SearchResult.sortByScore(results);

        expect(results).toEqual(originalCopy); // Original unchanged
        expect(sorted).not.toBe(results); // New array
      });

      test('should handle empty array', () => {
        const sorted = SearchResult.sortByScore([]);
        expect(sorted).toEqual([]);
      });

      test('should handle single element array', () => {
        const entry = new TranslationEntry('key', 'value');
        const results = [new SearchResult(entry, 0.5)];
        const sorted = SearchResult.sortByScore(results);

        expect(sorted).toHaveLength(1);
        expect(sorted[0].score).toBe(0.5);
      });
    });

    describe('filterByThreshold', () => {
      test('should filter results by threshold', () => {
        const entry1 = new TranslationEntry('key1', 'value1');
        const entry2 = new TranslationEntry('key2', 'value2');
        const entry3 = new TranslationEntry('key3', 'value3');

        const results = [
          new SearchResult(entry1, 0.1),
          new SearchResult(entry2, 0.3),
          new SearchResult(entry3, 0.5)
        ];

        const filtered = SearchResult.filterByThreshold(results, 0.4);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].score).toBe(0.1);
        expect(filtered[1].score).toBe(0.3);
      });

      test('should include results with score equal to threshold', () => {
        const entry = new TranslationEntry('key', 'value');
        const result = new SearchResult(entry, 0.3);
        const filtered = SearchResult.filterByThreshold([result], 0.3);

        expect(filtered).toHaveLength(1);
      });

      test('should use default threshold of 0.3', () => {
        const entry1 = new TranslationEntry('key1', 'value1');
        const entry2 = new TranslationEntry('key2', 'value2');

        const results = [
          new SearchResult(entry1, 0.2),
          new SearchResult(entry2, 0.4)
        ];

        const filtered = SearchResult.filterByThreshold(results);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].score).toBe(0.2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small score differences', () => {
      const entry = new TranslationEntry('key', 'value');
      const result1 = new SearchResult(entry, 0.3000000001);
      const result2 = new SearchResult(entry, 0.2999999999);

      expect(result1.isGoodMatch(0.3)).toBe(false);
      expect(result2.isGoodMatch(0.3)).toBe(true);
    });

    test('should handle score of exactly 1', () => {
      const entry = new TranslationEntry('key', 'value');
      const result = new SearchResult(entry, 1);

      expect(result.score).toBe(1);
      expect(result.isPerfectMatch()).toBe(false);
      expect(result.getConfidenceLevel()).toBe('very_low');
    });

    test('should handle score of exactly 0', () => {
      const entry = new TranslationEntry('key', 'value');
      const result = new SearchResult(entry, 0);

      expect(result.score).toBe(0);
      expect(result.isPerfectMatch()).toBe(true);
      expect(result.getConfidenceLevel()).toBe('perfect');
    });
  });

  describe('Performance', () => {
    test('should sort large arrays efficiently', () => {
      const results = [];
      for (let i = 0; i < 10000; i++) {
        const entry = new TranslationEntry(`key_${i}`, `value_${i}`);
        const score = Math.random();
        results.push(new SearchResult(entry, score));
      }

      const startTime = Date.now();
      const sorted = SearchResult.sortByScore(results);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(sorted).toHaveLength(10000);
      expect(duration).toBeLessThan(100); // Should sort 10000 items in less than 100ms

      // Verify sorting is correct
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i - 1].score);
      }
    });

    test('should filter large arrays efficiently', () => {
      const results = [];
      for (let i = 0; i < 10000; i++) {
        const entry = new TranslationEntry(`key_${i}`, `value_${i}`);
        const score = Math.random();
        results.push(new SearchResult(entry, score));
      }

      const startTime = Date.now();
      const filtered = SearchResult.filterByThreshold(results, 0.5);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should filter 10000 items in less than 50ms

      // Verify filtering is correct
      filtered.forEach(result => {
        expect(result.score).toBeLessThanOrEqual(0.5);
      });
    });
  });
});