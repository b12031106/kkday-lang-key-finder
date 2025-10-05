/**
 * Background Service Worker for I18n Key Finder Chrome Extension
 * Handles background tasks, extension lifecycle, and inter-component communication
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
      break;
    case 'update':
      this.handleUpdate(details.previousVersion);
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
    console.log('[I18n Key Finder] First-time installation');

    // Set default settings
    chrome.storage.local.set({
      settings: {
        searchThreshold: 0.3,
        maxResults: 10,
        autoDeactivatePicker: true,
        showNotifications: true
      },
      stats: {
        totalSearches: 0,
        totalCopies: 0,
        installDate: Date.now()
      }
    });
  }

  /**
   * Handle extension update
   */
  handleUpdate(previousVersion) {
    console.log(`[I18n Key Finder] Updated from version ${previousVersion}`);

    // Perform any necessary migration tasks
    this.migrateSettings(previousVersion);
  }

  /**
   * Migrate settings from previous version
   */
  migrateSettings(previousVersion) {
    // Add migration logic here if needed in future versions
    console.log(`[I18n Key Finder] Checking for settings migration from ${previousVersion}`);
  }

  /**
   * Set up message listener for inter-component communication
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Indicates async response
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
      console.error('[I18n Key Finder] Background message handling error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle clipboard copy request
   */
  async handleClipboardCopy(text) {
    try {
      if (!text || typeof text !== 'string') {
        return {
          success: false,
          error: 'Invalid text provided for clipboard copy'
        };
      }

      // In Manifest V3, we need to use the offscreen document for clipboard access
      // For now, we'll return success and let the content script handle it
      return {
        success: true,
        method: 'background-delegated'
      };

    } catch (error) {
      return {
        success: false,
        error: `Background clipboard copy failed: ${error.message}`
      };
    }
  }

  /**
   * Handle element selection notification
   */
  async handleElementSelection(result, _tab) {
    try {
      // Forward the element selection result to the popup if it's open
      if (result.success) {
        // Update usage statistics
        await this.incrementStat('totalElementSelections');

        // Optionally show notification
        const settings = await this.getSettings();
        if (settings.showNotifications) {
          this.showNotification('元素選取成功', `選取文字: ${result.text.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.error('[I18n Key Finder] Element selection handling error:', error);
    }
  }

  /**
   * Set up tab change listener
   */
  setupTabListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });
  }

  /**
   * Handle tab update events
   */
  handleTabUpdate(_tabId, changeInfo, tab) {
    // Update extension badge based on page type
    if (changeInfo.status === 'complete' && tab.url) {
      this.updateExtensionBadge(tab);
    }
  }

  /**
   * Handle tab activation
   */
  handleTabActivation(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab && tab.url) {
        this.updateExtensionBadge(tab);
      }
    });
  }

  /**
   * Update extension badge based on current tab
   */
  updateExtensionBadge(tab) {
    try {
      const url = new URL(tab.url);
      const isKKdayDomain = url.hostname.toLowerCase().endsWith('.kkday.com') ||
                           url.hostname.toLowerCase() === 'kkday.com';

      if (isKKdayDomain) {
        chrome.action.setBadgeText({
          text: '✓',
          tabId: tab.id
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#28a745',
          tabId: tab.id
        });
        chrome.action.setTitle({
          title: 'I18n Key Finder - 可在此頁面使用',
          tabId: tab.id
        });
      } else {
        chrome.action.setBadgeText({
          text: '',
          tabId: tab.id
        });
        chrome.action.setTitle({
          title: 'I18n Key Finder - 僅適用於 KKday 網站',
          tabId: tab.id
        });
      }
    } catch (error) {
      // Invalid URL, clear badge
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  }

  /**
   * Set up extension action listener
   */
  setupActionListener() {
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  /**
   * Handle extension icon click
   */
  handleActionClick(tab) {
    // The popup will open automatically due to manifest configuration
    // This is just for additional logging/analytics
    console.log('[I18n Key Finder] Extension icon clicked on tab:', tab.url);
    this.incrementStat('totalIconClicks');
  }

  /**
   * Get stored settings
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        const defaultSettings = {
          searchThreshold: 0.3,
          maxResults: 10,
          autoDeactivatePicker: true,
          showNotifications: true
        };

        resolve(result.settings || defaultSettings);
      });
    });
  }

  /**
   * Update stored settings
   */
  async updateSettings(newSettings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings: newSettings }, () => {
        console.log('[I18n Key Finder] Settings updated:', newSettings);
        resolve();
      });
    });
  }

  /**
   * Update usage statistics
   */
  async updateStats(newStats) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['stats'], (result) => {
        const currentStats = result.stats || {
          totalSearches: 0,
          totalCopies: 0,
          installDate: Date.now()
        };

        const updatedStats = { ...currentStats, ...newStats };

        chrome.storage.local.set({ stats: updatedStats }, () => {
          resolve();
        });
      });
    });
  }

  /**
   * Increment a specific statistic
   */
  async incrementStat(statName) {
    const stats = {};
    stats[statName] = 1;

    chrome.storage.local.get(['stats'], (result) => {
      const currentStats = result.stats || {};
      currentStats[statName] = (currentStats[statName] || 0) + 1;

      chrome.storage.local.set({ stats: currentStats });
    });
  }

  /**
   * Show notification to user
   */
  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }

  /**
   * Clean up old data (called periodically)
   */
  async cleanupOldData() {
    try {
      // Remove old cache entries, logs, etc.
      // This is a placeholder for future cleanup logic
      console.log('[I18n Key Finder] Performing periodic cleanup');
    } catch (error) {
      console.error('[I18n Key Finder] Cleanup error:', error);
    }
  }
}

// Initialize background service only in browser environment
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const backgroundService = new BackgroundService();

  // Set up periodic cleanup (every 24 hours)
  setInterval(() => {
    backgroundService.cleanupOldData();
  }, 24 * 60 * 60 * 1000);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundService;
}