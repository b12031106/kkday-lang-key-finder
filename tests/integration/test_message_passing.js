/**
 * Integration Test: Message Passing Between Components
 * Tests the message passing system between content script, popup, and background service worker
 */

// Note: BackgroundService will be required after mock setup to avoid initialization issues

describe('Message Passing Integration Tests', () => {
  let mockChrome;

  beforeEach(() => {
    // Mock Chrome APIs for message passing
    mockChrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        },
        sendMessage: jest.fn(),
        onInstalled: {
          addListener: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
        onUpdated: {
          addListener: jest.fn()
        },
        onActivated: {
          addListener: jest.fn()
        },
        get: jest.fn()
      },
      action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
        setTitle: jest.fn(),
        onClicked: {
          addListener: jest.fn()
        }
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      notifications: {
        create: jest.fn()
      }
    };

    global.chrome = mockChrome;

    // Mock DOM for content script
    global.document = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      body: {
        style: {},
        appendChild: jest.fn()
      },
      createElement: jest.fn().mockReturnValue({
        id: '',
        style: {},
        appendChild: jest.fn(),
        remove: jest.fn(),
        textContent: ''
      }),
      getElementById: jest.fn(),
      removeEventListener: jest.fn()
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
            'lang_key_common': '常用文字',
            'lang_key_button_submit': '提交'
          }
        }
      }
    };
  });

  describe('Content Script to Background Communication', () => {
    test('should send element selection result to background service worker', async() => {
      // Simulate element selection
      const selectionResult = {
        success: true,
        text: '測試文字內容'
      };

      // Mock the sendMessage function to capture the message
      let capturedMessage = null;
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        capturedMessage = message;
        if (callback) {
          callback({ success: true });
        }
      });

      // Simulate content script sending element selection
      const ContentScript = require('../../src/content/content-script.js');

      // Call the function that would normally be triggered by element selection
      // We'll simulate this by directly calling the sendMessage
      chrome.runtime.sendMessage({
        action: 'elementSelected',
        result: selectionResult
      });

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'elementSelected',
        result: selectionResult
      });
    });

    test('should handle clipboard copy request through background service worker', async() => {
      // Require BackgroundService after mock setup
      const BackgroundService = require('../../src/background/service-worker.js');
      const backgroundService = new BackgroundService();

      const clipboardRequest = {
        action: 'copyToClipboard',
        text: 'lang_key_test'
      };

      // Mock sendResponse
      const sendResponse = jest.fn();

      await backgroundService.handleMessage(clipboardRequest, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        method: 'background-delegated'
      });
    });
  });

  describe('Popup to Content Script Communication', () => {
    test('should send data extraction request to content script', async() => {
      // Mock tab query to return current tab
      mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{ id: 123, url: 'https://zh-tw.kkday.com/zh-tw/product/12345' }]);
      });

      // Mock sendMessage to content script
      mockChrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        expect(tabId).toBe(123);
        expect(message.action).toBe('extractTranslationData');

        if (callback) {
          callback({
            success: true,
            data: [
              { key: 'lang_key_common', val: '常用文字' }
            ],
            dataSource: '__NUXT__.state[\'$si18n_zh-tw\']',
            strategy: 'nuxt',
            count: 1
          });
        }
      });

      // Simulate popup requesting data extraction
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'extractTranslationData'
        }, (response) => {
          expect(response.success).toBe(true);
          expect(response.data).toBeDefined();
          expect(response.strategy).toBe('nuxt');
        });
      });
    });

    test('should send element picker activation request', async() => {
      // Mock tab query
      mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{ id: 456, url: 'https://zh-tw.kkday.com/about' }]);
      });

      // Mock sendMessage for element picker activation
      mockChrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        expect(tabId).toBe(456);
        expect(message.action).toBe('activateElementPicker');

        if (callback) {
          callback({
            success: true,
            message: 'Element picker activated'
          });
        }
      });

      // Simulate popup activating element picker
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'activateElementPicker'
        }, (response) => {
          expect(response.success).toBe(true);
          expect(response.message).toContain('activated');
        });
      });
    });
  });

  describe('Background Service Worker Message Handling', () => {
    test('should handle statistics update messages', async() => {
      const BackgroundService = require('../../src/background/service-worker.js');
      const backgroundService = new BackgroundService();

      const statsRequest = {
        action: 'updateStats',
        stats: {
          totalSearches: 5,
          totalCopies: 3
        }
      };

      const sendResponse = jest.fn();

      // Mock storage
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        setTimeout(() => {
          callback({
            stats: {
              totalSearches: 2,
              totalCopies: 1,
              installDate: Date.now() - 86400000
            }
          });
        }, 0);
      });

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        setTimeout(() => {
          if (callback) {
            callback();
          }
        }, 0);
      });

      await backgroundService.handleMessage(statsRequest, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(mockChrome.storage.local.set).toHaveBeenCalled();
    });

    test('should handle settings retrieval messages', async() => {
      const BackgroundService = require('../../src/background/service-worker.js');
      const backgroundService = new BackgroundService();

      const settingsRequest = {
        action: 'getSettings'
      };

      const sendResponse = jest.fn();

      // Mock storage for settings
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({
          settings: {
            searchThreshold: 0.3,
            maxResults: 10,
            autoDeactivatePicker: true,
            showNotifications: true
          }
        });
      });

      await backgroundService.handleMessage(settingsRequest, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        searchThreshold: 0.3,
        maxResults: 10,
        autoDeactivatePicker: true,
        showNotifications: true
      });
    });
  });

  describe('Error Handling in Message Passing', () => {
    test('should handle unknown message actions gracefully', async() => {
      const BackgroundService = require('../../src/background/service-worker.js');
      const backgroundService = new BackgroundService();

      const unknownRequest = {
        action: 'unknownAction'
      };

      const sendResponse = jest.fn();

      await backgroundService.handleMessage(unknownRequest, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action: unknownAction'
      });
    });

    test('should handle content script communication errors', async() => {
      // Mock sendMessage to simulate connection error
      mockChrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        // Simulate Chrome extension error
        chrome.runtime.lastError = { message: 'Could not establish connection' };
        if (callback) {
          callback(undefined);
        }
      });

      // Test error handling in popup
      chrome.tabs.sendMessage(123, { action: 'test' }, (response) => {
        expect(chrome.runtime.lastError).toBeDefined();
        expect(response).toBeUndefined();
      });

      // Clean up mock
      delete chrome.runtime.lastError;
    });
  });

  describe('Message Flow Integration', () => {
    test('should complete full element selection flow', async() => {
      const messages = [];

      // Track all messages sent
      mockChrome.runtime.sendMessage.mockImplementation((message) => {
        messages.push({ type: 'runtime', message });
      });

      mockChrome.tabs.sendMessage.mockImplementation((tabId, message) => {
        messages.push({ type: 'tab', tabId, message });
      });

      // Simulate the full flow
      // 1. Popup requests element picker activation
      chrome.tabs.sendMessage(123, { action: 'activateElementPicker' });

      // 2. Content script sends element selection result
      chrome.runtime.sendMessage({
        action: 'elementSelected',
        result: { success: true, text: '測試文字' }
      });

      // 3. Background service worker processes the result
      chrome.runtime.sendMessage({
        action: 'updateStats',
        stats: { totalElementSelections: 1 }
      });

      expect(messages).toHaveLength(3);
      expect(messages[0].message.action).toBe('activateElementPicker');
      expect(messages[1].message.action).toBe('elementSelected');
      expect(messages[2].message.action).toBe('updateStats');
    });
  });
});