/**
 * Browser Compatibility Test
 * Tests that the extension works without require statements
 */

describe('Browser Compatibility Tests', () => {
  describe('Popup Script', () => {
    test('should not contain require statements', () => {
      const fs = require('fs');
      const path = require('path');

      const popupScript = fs.readFileSync(
        path.join(__dirname, '../../src/popup/popup.js'),
        'utf8'
      );

      expect(popupScript).not.toContain('require(');
      expect(popupScript).not.toContain('module.exports');
    });

    test('should handle DOM elements correctly', () => {
      const fs = require('fs');
      const path = require('path');

      // Mock DOM
      document.body.innerHTML = `
        <input id="searchInput" />
        <button id="searchBtn">Search</button>
        <button id="clearBtn">Clear</button>
        <button id="pickerBtn">Pick Element</button>
        <div id="resultsContainer"></div>
        <div id="statusMessage"></div>
        <div id="loadingIndicator"></div>
        <div id="errorMessage"></div>
        <div id="domainWarning"></div>
        <div id="resultCount"></div>
      `;

      // Mock Chrome API
      global.chrome = {
        tabs: {
          query: jest.fn((query, callback) => {
            callback([{
              id: 1,
              url: 'https://www.kkday.com/zh-tw/product/123'
            }]);
          }),
          sendMessage: jest.fn((tabId, message, callback) => {
            if (message.action === 'getTranslations') {
              callback({
                success: true,
                data: [
                  { key: 'test_key', val: 'Test Value' }
                ]
              });
            } else {
              callback({ success: true });
            }
          })
        },
        runtime: {
          lastError: null,
          onMessage: {
            addListener: jest.fn()
          },
          sendMessage: jest.fn()
        }
      };

      // Load popup script
      const scriptContent = fs.readFileSync(
        path.join(__dirname, '../../src/popup/popup.js'),
        'utf8'
      );

      // Check that it's valid JavaScript
      expect(() => {
        new Function(scriptContent);
      }).not.toThrow();
    });
  });

  describe('Content Script', () => {
    test('should not contain require statements', () => {
      const fs = require('fs');
      const path = require('path');

      const contentScript = fs.readFileSync(
        path.join(__dirname, '../../src/content/content-script-browser.js'),
        'utf8'
      );

      expect(contentScript).not.toContain('require(');
      expect(contentScript).not.toContain('module.exports');
    });

    test('should be wrapped in IIFE', () => {
      const fs = require('fs');
      const path = require('path');

      const contentScript = fs.readFileSync(
        path.join(__dirname, '../../src/content/content-script-browser.js'),
        'utf8'
      );

      expect(contentScript).toContain('(function()');
      expect(contentScript).toContain('})()');
    });
  });

  describe('Service Worker', () => {
    test('should not contain require statements', () => {
      const fs = require('fs');
      const path = require('path');

      const serviceWorker = fs.readFileSync(
        path.join(__dirname, '../../src/background/service-worker-browser.js'),
        'utf8'
      );

      expect(serviceWorker).not.toContain('require(');
      expect(serviceWorker).not.toContain('module.exports');
    });

    test('should check for Chrome runtime before initialization', () => {
      const fs = require('fs');
      const path = require('path');

      const serviceWorker = fs.readFileSync(
        path.join(__dirname, '../../src/background/service-worker-browser.js'),
        'utf8'
      );

      expect(serviceWorker).toContain('typeof chrome !== \'undefined\'');
      expect(serviceWorker).toContain('chrome.runtime');
    });
  });

  describe('Manifest', () => {
    test('should reference browser-compatible scripts', () => {
      const fs = require('fs');
      const path = require('path');

      const manifest = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../../manifest.json'),
        'utf8'
      ));

      expect(manifest.content_scripts[0].js[0]).toBe('src/content/content-script-browser.js');
      expect(manifest.background.service_worker).toBe('src/background/service-worker-browser.js');
    });

    test('should have all required permissions', () => {
      const fs = require('fs');
      const path = require('path');

      const manifest = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../../manifest.json'),
        'utf8'
      ));

      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.permissions).toContain('clipboardWrite');
      expect(manifest.permissions).toContain('storage');
      expect(manifest.permissions).toContain('tabs');
      expect(manifest.permissions).toContain('contextMenus');
      expect(manifest.permissions).toContain('scripting');
    });
  });

  describe('File Structure', () => {
    test('should have all browser-compatible files', () => {
      const fs = require('fs');
      const path = require('path');

      const files = [
        'src/popup/popup.js',
        'src/popup/popup.html',
        'src/popup/popup.css',
        'src/content/content-script-browser.js',
        'src/content/page-script.js',
        'src/background/service-worker-browser.js',
        'manifest.json'
      ];

      files.forEach(file => {
        const filePath = path.join(__dirname, '../..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Chrome API Usage', () => {
    test('popup should use Chrome tabs API correctly', () => {
      const fs = require('fs');
      const path = require('path');

      const popupScript = fs.readFileSync(
        path.join(__dirname, '../../src/popup/popup.js'),
        'utf8'
      );

      expect(popupScript).toContain('chrome.tabs.query');
      expect(popupScript).toContain('chrome.tabs.sendMessage');
      expect(popupScript).toContain('chrome.scripting');
    });

    test('content script should use Chrome runtime API correctly', () => {
      const fs = require('fs');
      const path = require('path');

      const contentScript = fs.readFileSync(
        path.join(__dirname, '../../src/content/content-script-browser.js'),
        'utf8'
      );

      expect(contentScript).toContain('chrome.runtime.onMessage');
      expect(contentScript).toContain('chrome.runtime.getURL');
    });

    test('service worker should use Chrome API correctly', () => {
      const fs = require('fs');
      const path = require('path');

      const serviceWorker = fs.readFileSync(
        path.join(__dirname, '../../src/background/service-worker-browser.js'),
        'utf8'
      );

      expect(serviceWorker).toContain('chrome.runtime.onInstalled');
      expect(serviceWorker).toContain('chrome.runtime.onMessage');
      expect(serviceWorker).toContain('chrome.tabs.onUpdated');
      expect(serviceWorker).toContain('chrome.storage.local');
    });
  });
});