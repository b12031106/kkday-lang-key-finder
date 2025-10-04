/**
 * Service Worker for I18n Key Finder Chrome Extension
 * Browser-compatible version without require statements
 */

class BackgroundService {
  constructor() {
    this.init();
  }

  /**
   * Initialize background service
   */
  init() {
    // Background service worker started

    // Set up event listeners
    this.setupInstallListener();
    this.setupMessageListener();
    this.setupTabListener();
    this.setupActionListener();
    this.setupContextMenus();
  }

  /**
   * Set up extension installation/update listener
   */
  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });
  }

  /**
   * Handle extension installation or update
   */
  handleInstallation(details) {
    // Extension installed/updated: details.reason

    switch (details.reason) {
    case 'install':
      this.handleFirstInstall();
      this.createContextMenus();
      break;
    case 'update':
      this.handleUpdate(details.previousVersion);
      this.createContextMenus();
      break;
    case 'chrome_update':
    case 'shared_module_update':
      // No special handling needed
      break;
    }
  }

  /**
   * Handle first-time installation
   */
  handleFirstInstall() {
    // Set default settings
    chrome.storage.local.set({
      settings: {
        searchThreshold: 0.3,
        maxResults: 50,
        enableNotifications: true,
        enableAutoSearch: true
      },
      stats: {
        totalSearches: 0,
        totalCopies: 0,
        installDate: new Date().toISOString()
      }
    });
  }

  /**
   * Handle extension update
   */
  handleUpdate(previousVersion) {
    // Perform any necessary migrations
    // For now, no special handling needed
  }

  /**
   * Set up message listener
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // Ensure async response
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep the message channel open
    });
  }

  /**
   * Handle messages from content scripts and popup
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
      case 'copyToClipboard': {
        const copyResult = await this.handleClipboardCopy(request.text);
        sendResponse(copyResult);
        break;
      }

      case 'elementSelected':
        await this.handleElementSelection(request.result, sender.tab);
        sendResponse({ success: true });
        break;

      case 'updateStats':
        await this.updateStats(request.stats);
        sendResponse({ success: true });
        break;

      case 'getSettings': {
        const settings = await this.getSettings();
        sendResponse(settings);
        break;
      }

      case 'updateSettings':
        await this.updateSettings(request.settings);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({
          success: false,
          error: `Unknown action: ${request.action}`
        });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle clipboard copy
   */
  async handleClipboardCopy(text) {
    try {
      // Try using the offscreen document API (Chrome 109+)
      if (chrome.offscreen) {
        try {
          await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['CLIPBOARD'],
            justification: 'Copy translation key to clipboard'
          });

          await chrome.runtime.sendMessage({
            type: 'copy-to-clipboard',
            text: text
          });

          await chrome.offscreen.closeDocument();

          return { success: true };
        } catch (offscreenError) {
          // Offscreen API not available
        }
      }

      // Fallback: inject a script to copy
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (textToCopy) => {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          },
          args: [text]
        });

        return { success: true };
      }

      throw new Error('No active tab found');

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set up tab listener
   */
  setupTabListener() {
    // Listen for tab updates to inject content script if needed
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkAndInjectContentScript(tab);
      }
    });
  }

  /**
   * Check if content script should be injected
   */
  checkAndInjectContentScript(tab) {
    if (!tab.url) {
      return;
    }

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname.toLowerCase();

      // Check if it's a KKday domain
      if (hostname === 'kkday.com' || hostname.endsWith('.kkday.com')) {
        // KKday domain detected, content script should be auto-injected
      }
    } catch (error) {
      // Error checking tab URL
    }
  }

  /**
   * Set up action (toolbar icon) click listener
   */
  setupActionListener() {
    // In Manifest V3, clicking the action opens the popup automatically
    // We can still listen for clicks if popup is not set
    chrome.action.onClicked.addListener((tab) => {
      // Action clicked
    });
  }

  /**
   * Handle element selection result
   */
  async handleElementSelection(result, _tab) {
    if (result && result.key) {
      // Update stats
      const stats = await this.getStats();
      stats.totalSelections = (stats.totalSelections || 0) + 1;
      await this.updateStats(stats);

      // Show notification if enabled
      const settings = await this.getSettings();
      if (settings.enableNotifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: 'I18n Key Found',
          message: `Key: ${result.key}`
        });
      }
    }
  }

  /**
   * Get extension settings
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings || {
          searchThreshold: 0.3,
          maxResults: 50,
          enableNotifications: true,
          enableAutoSearch: true
        });
      });
    });
  }

  /**
   * Update extension settings
   */
  async updateSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings }, () => {
        resolve();
      });
    });
  }

  /**
   * Get extension stats
   */
  async getStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['stats'], (result) => {
        resolve(result.stats || {
          totalSearches: 0,
          totalCopies: 0,
          totalSelections: 0,
          installDate: new Date().toISOString()
        });
      });
    });
  }

  /**
   * Update extension stats
   */
  async updateStats(stats) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ stats }, () => {
        resolve();
      });
    });
  }

  /**
   * Set up context menus and listeners
   */
  setupContextMenus() {
    // Check if contextMenus API is available
    if (!chrome.contextMenus) {
      return;
    }

    // Remove existing menus to avoid duplicates
    chrome.contextMenus.removeAll(() => {
      // Create context menu for text selection
      chrome.contextMenus.create({
        id: 'search-i18n-key',
        title: 'Search I18n Key for "%s"',
        contexts: ['selection']
      });
    });

    // Listen for context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'search-i18n-key' && info.selectionText) {
        this.handleContextMenuSearch(info.selectionText, tab);
      }
    });
  }

  /**
   * Create context menu items (called during installation)
   */
  createContextMenus() {
    this.setupContextMenus();
  }

  /**
   * Handle context menu search
   */
  async handleContextMenuSearch(text, tab) {
    try {
      // First, try to ping the content script to see if it's loaded
      await chrome.tabs.sendMessage(tab.id, { action: 'ping' });

      // If ping succeeds, send the search request
      await chrome.tabs.sendMessage(tab.id, {
        action: 'searchFromContextMenu',
        query: text
      });

    } catch (error) {
      // Content script not responding, try to inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/content-script-browser.js']
        });

        // Wait for content script to initialize and inject page script
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try the search again
        await chrome.tabs.sendMessage(tab.id, {
          action: 'searchFromContextMenu',
          query: text
        });

      } catch (injectError) {
        // Injection failed, show error notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: '搜尋失敗',
          message: '請確認您在 KKday 網站上，並嘗試重新整理頁面後再試'
        });
      }
    }
  }
}

// Initialize background service only in browser environment
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const backgroundService = new BackgroundService();

  // Export for testing
  if (typeof self !== 'undefined') {
    self.BackgroundService = BackgroundService;
  }
}