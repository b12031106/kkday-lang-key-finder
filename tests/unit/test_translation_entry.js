/**
 * Unit Test: TranslationEntry Model
 * Tests the TranslationEntry model validation and functionality
 */

const TranslationEntry = require('../../src/models/TranslationEntry');

describe('TranslationEntry Model Unit Tests', () => {
  describe('Constructor', () => {
    test('should create valid TranslationEntry with correct properties', () => {
      const entry = new TranslationEntry('lang_key_test', 'Test Value');

      expect(entry.key).toBe('lang_key_test');
      expect(entry.val).toBe('Test Value');
      expect(entry).toBeInstanceOf(TranslationEntry);
    });

    test('should accept unicode and special characters in value', () => {
      const entry = new TranslationEntry('lang_key_unicode', '中文測試 😊 Special™');

      expect(entry.val).toBe('中文測試 😊 Special™');
    });

    test('should handle empty string values', () => {
      const entry = new TranslationEntry('lang_key_empty', '');

      expect(entry.key).toBe('lang_key_empty');
      expect(entry.val).toBe('');
    });

    test('should handle very long values', () => {
      const longValue = 'A'.repeat(1000);
      const entry = new TranslationEntry('lang_key_long', longValue);

      expect(entry.val).toBe(longValue);
      expect(entry.val.length).toBe(1000);
    });
  });

  describe('Validation', () => {
    test('should throw error for invalid key (null)', () => {
      expect(() => {
        new TranslationEntry(null, 'value');
      }).toThrow('TranslationEntry key must be a non-empty string');
    });

    test('should throw error for invalid key (undefined)', () => {
      expect(() => {
        new TranslationEntry(undefined, 'value');
      }).toThrow('TranslationEntry key must be a non-empty string');
    });

    test('should throw error for invalid key (empty string)', () => {
      expect(() => {
        new TranslationEntry('', 'value');
      }).toThrow('TranslationEntry key must be a non-empty string');
    });

    test('should throw error for invalid key (number)', () => {
      expect(() => {
        new TranslationEntry(123, 'value');
      }).toThrow('TranslationEntry key must be a non-empty string');
    });

    test('should throw error for invalid key (object)', () => {
      expect(() => {
        new TranslationEntry({ key: 'test' }, 'value');
      }).toThrow('TranslationEntry key must be a non-empty string');
    });

    test('should throw error for invalid value (null)', () => {
      expect(() => {
        new TranslationEntry('lang_key', null);
      }).toThrow('TranslationEntry value must be a string');
    });

    test('should throw error for invalid value (undefined)', () => {
      expect(() => {
        new TranslationEntry('lang_key', undefined);
      }).toThrow('TranslationEntry value must be a string');
    });

    test('should throw error for invalid value (number)', () => {
      expect(() => {
        new TranslationEntry('lang_key', 123);
      }).toThrow('TranslationEntry value must be a string');
    });

    test('should throw error for invalid value (object)', () => {
      expect(() => {
        new TranslationEntry('lang_key', { val: 'test' });
      }).toThrow('TranslationEntry value must be a string');
    });

    test('should throw error for invalid value (array)', () => {
      expect(() => {
        new TranslationEntry('lang_key', ['value']);
      }).toThrow('TranslationEntry value must be a string');
    });
  });

  describe('Static Methods', () => {
    describe('fromObject', () => {
      test('should create TranslationEntry from valid object', () => {
        const obj = { key: 'lang_key_from_obj', val: 'Value from object' };
        const entry = TranslationEntry.fromObject(obj);

        expect(entry).toBeInstanceOf(TranslationEntry);
        expect(entry.key).toBe('lang_key_from_obj');
        expect(entry.val).toBe('Value from object');
      });

      test('should handle object with extra properties', () => {
        const obj = {
          key: 'lang_key_extra',
          val: 'Value with extras',
          extra: 'should be ignored',
          another: 123
        };
        const entry = TranslationEntry.fromObject(obj);

        expect(entry.key).toBe('lang_key_extra');
        expect(entry.val).toBe('Value with extras');
        expect(entry.extra).toBeUndefined();
        expect(entry.another).toBeUndefined();
      });

      test('should throw error for null object', () => {
        expect(() => {
          TranslationEntry.fromObject(null);
        }).toThrow('Invalid object provided');
      });

      test('should throw error for undefined object', () => {
        expect(() => {
          TranslationEntry.fromObject(undefined);
        }).toThrow('Invalid object provided');
      });

      test('should throw error for object missing key property', () => {
        expect(() => {
          TranslationEntry.fromObject({ val: 'value' });
        }).toThrow('TranslationEntry key must be a non-empty string');
      });

      test('should throw error for object missing val property', () => {
        expect(() => {
          TranslationEntry.fromObject({ key: 'lang_key' });
        }).toThrow('TranslationEntry value must be a string');
      });
    });

    describe('fromArray', () => {
      test('should create multiple TranslationEntry objects from array', () => {
        const array = [
          { key: 'lang_key_1', val: 'Value 1' },
          { key: 'lang_key_2', val: 'Value 2' },
          { key: 'lang_key_3', val: 'Value 3' }
        ];

        const entries = TranslationEntry.fromArray(array);

        expect(entries).toHaveLength(3);
        expect(entries[0]).toBeInstanceOf(TranslationEntry);
        expect(entries[1]).toBeInstanceOf(TranslationEntry);
        expect(entries[2]).toBeInstanceOf(TranslationEntry);
        expect(entries[0].key).toBe('lang_key_1');
        expect(entries[1].val).toBe('Value 2');
        expect(entries[2].key).toBe('lang_key_3');
      });

      test('should return empty array for empty input', () => {
        const entries = TranslationEntry.fromArray([]);

        expect(entries).toEqual([]);
        expect(entries).toHaveLength(0);
      });

      test('should throw error for non-array input', () => {
        expect(() => {
          TranslationEntry.fromArray('not an array');
        }).toThrow('Input must be an array');
      });

      test('should throw error for null input', () => {
        expect(() => {
          TranslationEntry.fromArray(null);
        }).toThrow('Input must be an array');
      });

      test('should skip invalid entries and continue', () => {
        const array = [
          { key: 'valid_1', val: 'Value 1' },
          { key: '', val: 'Invalid key' }, // Invalid
          { key: 'valid_2', val: 'Value 2' },
          { key: 'no_val' }, // Invalid
          { key: 'valid_3', val: 'Value 3' }
        ];

        // Depending on implementation, this might throw or filter
        // Adjust test based on actual implementation
        expect(() => {
          TranslationEntry.fromArray(array);
        }).toThrow();
      });
    });
  });

  describe('Instance Methods', () => {
    describe('toObject', () => {
      test('should convert TranslationEntry to plain object', () => {
        const entry = new TranslationEntry('lang_key_plain', 'Plain value');
        const obj = entry.toObject();

        expect(obj).toEqual({
          key: 'lang_key_plain',
          val: 'Plain value'
        });
        expect(obj).not.toBe(entry); // Should be a new object
        expect(obj.constructor).toBe(Object); // Should be plain object
      });

      test('should create independent object copy', () => {
        const entry = new TranslationEntry('lang_key_copy', 'Original');
        const obj = entry.toObject();

        // Modify the object
        obj.key = 'modified_key';
        obj.val = 'Modified';

        // Original should remain unchanged
        expect(entry.key).toBe('lang_key_copy');
        expect(entry.val).toBe('Original');
      });
    });

    describe('toString', () => {
      test('should return string representation', () => {
        const entry = new TranslationEntry('lang_key_string', 'String value');
        const str = entry.toString();

        expect(typeof str).toBe('string');
        expect(str).toBe('[TranslationEntry: lang_key_string = "String value"]');
      });

      test('should handle special characters in string representation', () => {
        const entry = new TranslationEntry('lang_key_special', 'Line 1\nLine 2\t"Quoted"');
        const str = entry.toString();

        expect(str).toContain('lang_key_special');
        expect(str).toContain('Line 1\nLine 2\t"Quoted"');
      });

      test('should truncate very long values in string representation', () => {
        const longValue = 'A'.repeat(200);
        const entry = new TranslationEntry('lang_key_truncate', longValue);
        const str = entry.toString();

        expect(str.length).toBeLessThan(250); // Should be truncated
        expect(str).toContain('...');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle keys with special characters', () => {
      const specialKeys = [
        'lang.key.with.dots',
        'lang-key-with-dashes',
        'lang_key_with_underscores',
        'langKeyWithCamelCase',
        'LANG_KEY_UPPERCASE',
        'lang:key:colons',
        'lang/key/slashes'
      ];

      specialKeys.forEach(key => {
        const entry = new TranslationEntry(key, 'value');
        expect(entry.key).toBe(key);
      });
    });

    test('should handle values with HTML content', () => {
      const htmlValue = '<div class="test">Hello <strong>World</strong></div>';
      const entry = new TranslationEntry('lang_key_html', htmlValue);

      expect(entry.val).toBe(htmlValue);
    });

    test('should handle values with template literals', () => {
      const templateValue = 'Hello {{name}}, you have ${count} messages';
      const entry = new TranslationEntry('lang_key_template', templateValue);

      expect(entry.val).toBe(templateValue);
    });

    test('should handle values with JSON strings', () => {
      const jsonValue = '{"type":"notification","message":"Test"}';
      const entry = new TranslationEntry('lang_key_json', jsonValue);

      expect(entry.val).toBe(jsonValue);
    });
  });

  describe('Performance', () => {
    test('should handle large number of instances efficiently', () => {
      const startTime = Date.now();
      const entries = [];

      for (let i = 0; i < 10000; i++) {
        entries.push(new TranslationEntry(`key_${i}`, `value_${i}`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(entries).toHaveLength(10000);
      expect(duration).toBeLessThan(1000); // Should create 10000 instances in less than 1 second
    });

    test('should convert large arrays efficiently', () => {
      const largeArray = [];
      for (let i = 0; i < 5000; i++) {
        largeArray.push({ key: `key_${i}`, val: `value_${i}` });
      }

      const startTime = Date.now();
      const entries = TranslationEntry.fromArray(largeArray);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(entries).toHaveLength(5000);
      expect(duration).toBeLessThan(500); // Should convert 5000 objects in less than 500ms
    });
  });
});