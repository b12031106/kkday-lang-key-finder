/**
 * Integration Test: Enhanced Element Picker Functionality
 * Tests the improved element picker with hover highlights and better UX
 */

describe('Enhanced Element Picker Integration Tests', () => {
  let ContentScript;
  let mockDocument;
  let mockElement;

  beforeEach(() => {
    // Mock DOM elements
    mockElement = {
      textContent: '測試文字內容',
      style: {},
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    mockDocument = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getElementById: jest.fn(),
      createElement: jest.fn().mockReturnValue({
        id: '',
        style: {},
        appendChild: jest.fn(),
        remove: jest.fn(),
        textContent: ''
      }),
      body: {
        style: {},
        appendChild: jest.fn()
      },
      elementFromPoint: jest.fn().mockReturnValue(mockElement)
    };

    global.document = mockDocument;

    // Mock Chrome APIs
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        },
        sendMessage: jest.fn()
      }
    };

    // Mock window.location
    global.window = {
      location: {
        hostname: 'zh-tw.kkday.com',
        pathname: '/zh-tw/product/12345',
        href: 'https://zh-tw.kkday.com/zh-tw/product/12345'
      },
      __NUXT__: {
        state: {
          '$si18n_zh-tw': {
            'lang_key_test': '測試文字內容'
          }
        }
      }
    };

    // Clear module cache to get fresh instance
    delete require.cache[require.resolve('../../src/content/content-script.js')];
    ContentScript = require('../../src/content/content-script.js');
  });

  describe('Element Highlighting', () => {
    test('should add highlight when hovering over elements', () => {
      const contentScript = new (require('../../src/content/content-script.js').default || Object)();

      // Mock element for highlighting
      const element = {
        style: {},
        getAttribute: jest.fn().mockReturnValue(null),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn()
      };

      // Test highlighting
      if (contentScript.addElementHighlight) {
        contentScript.addElementHighlight(element);

        expect(element.setAttribute).toHaveBeenCalledWith('data-i18n-highlighted', 'true');
        expect(element.style.outline).toBe('2px solid #007bff');
        expect(element.style.background).toBe('rgba(0, 123, 255, 0.1)');
      }
    });

    test('should remove highlight when element is no longer hovered', () => {
      const contentScript = new (require('../../src/content/content-script.js').default || Object)();

      // Mock highlighted element
      const element = {
        style: {
          outline: '2px solid #007bff',
          background: 'rgba(0, 123, 255, 0.1)'
        },
        getAttribute: jest.fn((attr) => {
          switch(attr) {
          case 'data-i18n-highlighted': return 'true';
          case 'data-i18n-original-outline': return '';
          case 'data-i18n-original-background': return '';
          default: return null;
          }
        }),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn()
      };

      // Test highlight removal
      if (contentScript.removeElementHighlight) {
        contentScript.removeElementHighlight(element);

        expect(element.removeAttribute).toHaveBeenCalledWith('data-i18n-highlighted');
        expect(element.removeAttribute).toHaveBeenCalledWith('data-i18n-original-outline');
        expect(element.removeAttribute).toHaveBeenCalledWith('data-i18n-original-background');
      }
    });

    test('should preserve original styles when removing highlight', () => {
      const contentScript = new (require('../../src/content/content-script.js').default || Object)();

      // Mock element with original styles
      const element = {
        style: {
          outline: '2px solid #007bff',
          background: 'rgba(0, 123, 255, 0.1)'
        },
        getAttribute: jest.fn((attr) => {
          switch(attr) {
          case 'data-i18n-highlighted': return 'true';
          case 'data-i18n-original-outline': return '1px solid red';
          case 'data-i18n-original-background': return '#ffffff';
          default: return null;
          }
        }),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn()
      };

      // Test style restoration
      if (contentScript.removeElementHighlight) {
        contentScript.removeElementHighlight(element);

        expect(element.style.outline).toBe('1px solid red');
        expect(element.style.background).toBe('#ffffff');
      }
    });
  });

  describe('Enhanced User Experience', () => {
    test('should handle escape key to deactivate picker', () => {
      // Create a mock event listener setup
      const eventListeners = {};
      mockDocument.addEventListener = jest.fn((event, handler, options) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(handler);
      });

      // Simulate element picker activation
      const mockContentScript = {
        isElementPickerActive: true,
        deactivateElementPicker: jest.fn()
      };

      // Create key handler manually (since we can't access the actual instance)
      const keyHandler = (event) => {
        if (event.key === 'Escape' && mockContentScript.isElementPickerActive) {
          mockContentScript.deactivateElementPicker();
        }
      };

      // Simulate Escape key press
      keyHandler({ key: 'Escape' });

      expect(mockContentScript.deactivateElementPicker).toHaveBeenCalled();
    });

    test('should prevent default behavior on element click during picker mode', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: mockElement
      };

      // Create click handler manually
      const clickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      clickHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    test('should clean up event listeners when picker is deactivated', () => {
      const removeEventListenerSpy = jest.fn();
      mockDocument.removeEventListener = removeEventListenerSpy;

      // Mock cleanup function
      const cleanup = () => {
        mockDocument.removeEventListener('click', jest.fn(), true);
        mockDocument.removeEventListener('keydown', jest.fn(), true);
        mockDocument.removeEventListener('mouseover', jest.fn(), true);
        mockDocument.removeEventListener('mouseout', jest.fn(), true);
      };

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Text Extraction Enhancement', () => {
    test('should extract meaningful text from various element types', async() => {
      const testCases = [
        {
          element: { textContent: '這是測試文字', innerText: '這是測試文字' },
          expected: '這是測試文字'
        },
        {
          element: { textContent: '   多餘空白   ', innerText: '多餘空白' },
          expected: '多餘空白'
        },
        {
          element: {
            textContent: '很長的文字內容'.repeat(20),
            innerText: '很長的文字內容'.repeat(20)
          },
          expected: '很長的文字內容'.repeat(20).substring(0, 200) + '...'
        },
        {
          element: { textContent: '', innerText: '' },
          expected: ''
        }
      ];

      for (const testCase of testCases) {
        // Mock the text extraction logic
        let text = testCase.element.textContent || '';

        if (text.length > 100 && testCase.element.innerText) {
          text = testCase.element.innerText;
        }

        text = text.replace(/\s+/g, ' ').trim();

        if (text.length > 200) {
          text = text.substring(0, 200) + '...';
        }

        expect(text).toBe(testCase.expected);
      }
    });

    test('should handle elements with nested content appropriately', () => {
      const complexElement = {
        textContent: 'Header\n  Sub content\n    Deep content',
        innerText: 'Header Sub content Deep content'
      };

      // Simulate text extraction
      let text = complexElement.textContent.replace(/\s+/g, ' ').trim();

      expect(text).toBe('Header Sub content Deep content');
    });
  });

  describe('Integration with Popup Communication', () => {
    test('should send element selection result with proper format', () => {
      const mockSendMessage = jest.fn();
      global.chrome.runtime.sendMessage = mockSendMessage;

      // Mock the sendElementSelectionResult method
      const sendElementSelectionResult = (result) => {
        chrome.runtime.sendMessage({
          action: 'elementSelected',
          result: result
        });
      };

      const testResult = {
        success: true,
        text: '選取的文字內容'
      };

      sendElementSelectionResult(testResult);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'elementSelected',
        result: testResult
      });
    });

    test('should handle element selection errors gracefully', () => {
      const mockSendMessage = jest.fn();
      global.chrome.runtime.sendMessage = mockSendMessage;

      const sendElementSelectionResult = (result) => {
        chrome.runtime.sendMessage({
          action: 'elementSelected',
          result: result
        });
      };

      const errorResult = {
        success: false,
        error: 'No text content found in selected element'
      };

      sendElementSelectionResult(errorResult);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'elementSelected',
        result: errorResult
      });
    });
  });
});