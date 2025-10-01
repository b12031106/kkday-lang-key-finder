/**
 * Popup JavaScript Logic for I18n Key Finder Chrome Extension
 * Manages the popup interface and user interactions
 */

// Use browser-compatible code without require
class PopupController {
  constructor() {
    this.extensionState = {
      isActive: false,
      hasData: false,
      dataCount: 0,
      currentDomain: '',
      currentPath: '',
      isKKdayDomain: false,
      isProductPage: false,
      errorMessage: null,
      timestamp: new Date()
    };
    this.searchService = null;
    this.currentTab = null;
    this.debounceTimer = null;
    this.elements = {};
    this.translations = [];

    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      // Cache DOM elements
      this.cacheElements();

      // Get current tab
      await this.getCurrentTab();

      // Check if on KKday domain
      await this.checkDomain();

      // Set up event listeners
      this.setupEventListeners();

      // Load translations if on valid domain
      if (this.extensionState.isKKdayDomain) {
        await this.loadTranslations();
      } else {
        this.showError('請在 KKday 網站上使用此擴充功能');
      }

    } catch (error) {
      this.showError('初始化失敗: ' + error.message);
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Search elements
      searchInput: document.getElementById('search-input'),
      clearBtn: document.getElementById('clear-search-btn'),
      pickerBtn: document.getElementById('select-element-btn'),
      cancelPickerBtn: document.getElementById('cancel-picker-btn'),

      // Container elements
      loadingContainer: document.getElementById('loading-container'),
      errorContainer: document.getElementById('error-container'),
      mainInterface: document.getElementById('main-interface'),

      // Results elements
      resultsContainer: document.getElementById('search-results'),
      noResults: document.getElementById('no-results'),
      emptyState: document.getElementById('empty-state'),
      resultCount: document.getElementById('result-count'),

      // Status elements
      statusText: document.getElementById('status-text'),
      statusDot: document.getElementById('status-dot'),
      errorMessage: document.getElementById('error-message'),

      // Notification
      notification: document.getElementById('notification'),
      notificationText: document.getElementById('notification-text'),
      notificationIcon: document.getElementById('notification-icon')
    };
  }

  /**
   * Get current active tab
   */
  async getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        if (tabs && tabs[0]) {
          this.currentTab = tabs[0];
          resolve(tabs[0]);
        } else {
          reject(new Error('無法取得當前分頁'));
        }
      });
    });
  }

  /**
   * Check if current domain is KKday
   */
  async checkDomain() {
    if (!this.currentTab || !this.currentTab.url) {
      this.extensionState.isKKdayDomain = false;
      this.showDomainWarning();
      return;
    }

    try {
      const url = new URL(this.currentTab.url);
      const domain = url.hostname.toLowerCase();
      const pathname = url.pathname;

      // Check if domain matches *.kkday.com pattern
      const isKKdayDomain = domain === 'kkday.com' || domain.endsWith('.kkday.com');

      // Check if it's a product page
      const isProductPage = /^\/[a-z]{2}(-[a-z]{2})?\/product\/\d+/i.test(pathname);

      // Update state
      this.extensionState = {
        isActive: isKKdayDomain,
        hasData: false,
        dataCount: 0,
        currentDomain: domain,
        currentPath: pathname,
        isKKdayDomain: isKKdayDomain,
        isProductPage: isProductPage,
        errorMessage: null,
        timestamp: new Date()
      };

      if (!isKKdayDomain) {
        this.showDomainWarning();
      } else {
        this.hideDomainWarning();
      }
    } catch (error) {
      this.extensionState.isKKdayDomain = false;
      this.showDomainWarning();
    }
  }

  /**
   * Show domain warning
   */
  showDomainWarning() {
    if (this.elements.domainWarning) {
      this.elements.domainWarning.style.display = 'block';
      this.elements.domainWarning.textContent = '⚠️ 此擴充功能僅在 *.kkday.com 網域上運作';
    }

    // Disable search functionality
    if (this.elements.searchInput) {
      this.elements.searchInput.disabled = true;
    }
    if (this.elements.searchBtn) {
      this.elements.searchBtn.disabled = true;
    }
    if (this.elements.pickerBtn) {
      this.elements.pickerBtn.disabled = true;
    }
  }

  /**
   * Hide domain warning
   */
  hideDomainWarning() {
    if (this.elements.domainWarning) {
      this.elements.domainWarning.style.display = 'none';
    }

    // Enable search functionality
    if (this.elements.searchInput) {
      this.elements.searchInput.disabled = false;
    }
    if (this.elements.searchBtn) {
      this.elements.searchBtn.disabled = false;
    }
    if (this.elements.pickerBtn) {
      this.elements.pickerBtn.disabled = false;
    }
  }

  /**
   * Load translations from content script
   */
  async loadTranslations() {
    this.showLoading(true);
    this.updateStatus('正在連接頁面...');

    try {
      // First, check if content script is already injected
      let response;
      let needsInjection = false;

      try {
        response = await this.sendMessageToTab({
          action: 'ping'
        });
      } catch (pingError) {
        needsInjection = true;
      }

      if (needsInjection) {
        this.updateStatus('正在注入腳本...');
        try {
          await this.injectContentScript();
          // Wait longer for script to fully initialize
          await new Promise(resolve => setTimeout(resolve, 500));

          // Try ping again to confirm injection
          response = await this.sendMessageToTab({
            action: 'ping'
          });
        } catch (injectError) {
          throw new Error('無法注入內容腳本: ' + injectError.message);
        }
      }

      this.updateStatus('正在載入翻譯資料...');

      // Now try to get translations
      response = await this.sendMessageToTab({
        action: 'getTranslations'
      });

      if (response && response.success) {
        if (response.data && response.data.length > 0) {
          this.translations = response.data;
          this.extensionState.hasData = true;
          this.extensionState.dataCount = this.translations.length;

          // Initialize search with translations
          this.initializeSearch();

          this.updateStatus(`已載入 ${this.translations.length} 筆翻譯資料`);
        } else {
          throw new Error('頁面上沒有找到翻譯資料，請確認這是一個有效的 KKday 頁面');
        }
      } else {
        throw new Error(response?.error || '無法取得翻譯資料');
      }
    } catch (error) {
      this.showError('無法載入翻譯資料: ' + error.message);
      this.extensionState.hasData = false;
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Inject content script manually
   */
  async injectContentScript() {
    if (!this.currentTab || !this.currentTab.id) {
      throw new Error('No active tab');
    }

    // Check if we can inject scripts
    if (!this.currentTab.url ||
        this.currentTab.url.startsWith('chrome://') ||
        this.currentTab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot inject script into this page');
    }

    // Use Chrome scripting API to inject content script
    await chrome.scripting.executeScript({
      target: { tabId: this.currentTab.id },
      files: ['src/content/content-script-browser.js']
    });
  }

  /**
   * Initialize search functionality
   */
  initializeSearch() {
    // Simple search implementation without external dependencies
    this.searchService = {
      search: (query, options = {}) => {
        if (!query || !this.translations) {
          return [];
        }

        const normalizedQuery = query.toLowerCase().trim();
        const limit = options.limit || 20;

        // Simple fuzzy search
        const results = this.translations
          .map(item => {
            const keyMatch = item.key.toLowerCase().includes(normalizedQuery);
            const valMatch = item.val.toLowerCase().includes(normalizedQuery);

            if (!keyMatch && !valMatch) {
              return null;
            }

            // Calculate simple relevance score
            let score = 0;
            if (item.key.toLowerCase() === normalizedQuery || item.val.toLowerCase() === normalizedQuery) {
              score = 1.0; // Exact match
            } else if (item.key.toLowerCase().startsWith(normalizedQuery) || item.val.toLowerCase().startsWith(normalizedQuery)) {
              score = 0.8; // Starts with
            } else if (keyMatch && valMatch) {
              score = 0.6; // Both contain
            } else if (keyMatch || valMatch) {
              score = 0.4; // One contains
            }

            return {
              item: item,
              score: score
            };
          })
          .filter(result => result !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

        return results;
      }
    };
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Search input
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      this.elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    // Search button
    if (this.elements.searchBtn) {
      this.elements.searchBtn.addEventListener('click', () => {
        this.performSearch();
      });
    }

    // Clear button
    if (this.elements.clearBtn) {
      this.elements.clearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Element picker button
    if (this.elements.pickerBtn) {
      this.elements.pickerBtn.addEventListener('click', () => {
        this.activateElementPicker();
      });
    }
  }

  /**
   * Activate element picker and close popup
   */
  async activateElementPicker() {
    try {
      // Send message to content script to activate picker
      const response = await this.sendMessageToTab({
        action: 'toggleElementPicker'
      });

      if (response && response.success) {
        // Close the popup by closing the window
        window.close();
      }
    } catch (error) {
      this.showError('無法啟動元素選取器');
    }
  }

  /**
   * Handle search input with debounce
   */
  handleSearchInput(value) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (value.length >= 2) {
        this.performSearch(value);
      } else if (value.length === 0) {
        this.clearResults();
      }
    }, 300);
  }

  /**
   * Perform search
   */
  performSearch(query = null) {
    const searchQuery = query || this.elements.searchInput?.value || '';

    if (!searchQuery.trim()) {
      this.showError('請輸入搜尋關鍵字');
      return;
    }

    if (!this.extensionState.hasData) {
      this.showError('尚未載入翻譯資料');
      return;
    }

    this.showLoading(true);
    this.clearError();

    try {
      const results = this.searchService.search(searchQuery, { limit: 50 });
      this.displayResults(results);
      this.updateResultCount(results.length);
    } catch (error) {
      this.showError('搜尋發生錯誤');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Display search results
   */
  displayResults(results) {
    if (!this.elements.resultsContainer) {
      return;
    }

    // Hide empty state when displaying results
    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = 'none';
    }

    // Clear previous results
    this.elements.resultsContainer.innerHTML = '';

    if (results.length === 0) {
      // Show no results message
      if (this.elements.noResults) {
        this.elements.noResults.classList.remove('hidden');
        this.elements.noResults.style.display = 'flex';
      }
      return;
    }

    // Hide no results message
    if (this.elements.noResults) {
      this.elements.noResults.classList.add('hidden');
      this.elements.noResults.style.display = 'none';
    }

    // Display results
    results.forEach((result, index) => {
      const resultItem = this.createResultItem(result.item, result.score, index);
      this.elements.resultsContainer.appendChild(resultItem);
    });
  }

  /**
   * Create result item element
   */
  createResultItem(item, score, index) {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.dataset.index = index;

    // Add relevance class for visual distinction
    if (score >= 0.8) {
      div.classList.add('high-relevance');
    } else if (score >= 0.6) {
      div.classList.add('medium-relevance');
    }

    // Score badge
    const scoreBadge = document.createElement('div');
    scoreBadge.className = 'score-badge';
    const percentage = Math.round(score * 100);
    scoreBadge.textContent = `${percentage}%`;
    scoreBadge.title = `相關度: ${percentage}%`;

    // Key section
    const keySection = document.createElement('div');
    keySection.className = 'result-key-section';

    const keyLabel = document.createElement('div');
    keyLabel.className = 'result-label';
    keyLabel.textContent = '鍵值';

    const keyValue = document.createElement('div');
    keyValue.className = 'result-key';
    keyValue.textContent = item.key;

    keySection.appendChild(keyLabel);
    keySection.appendChild(keyValue);

    // Value section
    const valueSection = document.createElement('div');
    valueSection.className = 'result-value-section';

    const valueLabel = document.createElement('div');
    valueLabel.className = 'result-label';
    valueLabel.textContent = '翻譯';

    const valueValue = document.createElement('div');
    valueValue.className = 'result-value';
    valueValue.textContent = item.val;

    valueSection.appendChild(valueLabel);
    valueSection.appendChild(valueValue);

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">複製</span>';
    copyBtn.title = '複製鍵值到剪貼簿';
    copyBtn.onclick = () => this.copyToClipboard(item.key, copyBtn);

    // Assemble
    div.appendChild(scoreBadge);
    div.appendChild(keySection);
    div.appendChild(valueSection);
    div.appendChild(copyBtn);

    return div;
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text, button) {
    try {
      // Try using the Chrome API first
      await chrome.runtime.sendMessage({
        action: 'copyToClipboard',
        text: text
      });

      // Show success feedback
      const originalText = button.textContent;
      button.textContent = '✅ 已複製';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);

    } catch (error) {
      // Fallback to document.execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        // Show success
        const originalText = button.textContent;
        button.textContent = '✅ 已複製';
        button.classList.add('copied');

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (fallbackError) {
        this.showError('複製失敗');
      }
    }
  }

  /**
   * Toggle element picker mode
   */
  async toggleElementPicker() {
    try {
      const response = await this.sendMessageToTab({
        action: 'toggleElementPicker'
      });

      if (response && response.active) {
        this.elements.pickerBtn.classList.add('active');
        this.elements.pickerBtn.textContent = '🎯 停止選擇';
        this.updateStatus('元素選擇模式已啟動，點擊頁面上的元素');
      } else {
        this.elements.pickerBtn.classList.remove('active');
        this.elements.pickerBtn.textContent = '🎯 選擇元素';
        this.updateStatus('元素選擇模式已停止');
      }
    } catch (error) {
      this.showError('無法啟動元素選擇器');
    }
  }

  /**
   * Handle element selection from content script
   */
  handleElementSelection(result) {
    if (result && result.key) {
      // Display the found result
      this.displayResults([{
        item: { key: result.key, val: result.value },
        score: 1.0
      }]);

      this.updateStatus(`找到元素對應的 key: ${result.key}`);

      // Reset picker button
      this.elements.pickerBtn.classList.remove('active');
      this.elements.pickerBtn.textContent = '🎯 選擇元素';
    } else {
      this.showError('無法找到該元素對應的翻譯 key');
    }
  }

  /**
   * Clear search and results
   */
  clearSearch() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.clearResults();
    this.updateResultCount(0);
    this.clearError();
  }

  /**
   * Clear results
   */
  clearResults() {
    if (this.elements.resultsContainer) {
      this.elements.resultsContainer.innerHTML = '';
    }

    // Show empty state again
    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = 'flex';
    }

    // Hide no results
    if (this.elements.noResults) {
      this.elements.noResults.classList.add('hidden');
      this.elements.noResults.style.display = 'none';
    }
  }

  /**
   * Update result count
   */
  updateResultCount(count) {
    if (this.elements.resultCount) {
      if (count > 0) {
        this.elements.resultCount.textContent = `找到 ${count} 筆結果`;
        this.elements.resultCount.style.display = 'block';
      } else {
        this.elements.resultCount.style.display = 'none';
      }
    }
  }

  /**
   * Send message to current tab
   */
  async sendMessageToTab(message) {
    return new Promise((resolve, reject) => {
      if (!this.currentTab || !this.currentTab.id) {
        reject(new Error('No active tab'));
        return;
      }

      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Show loading indicator
   */
  showLoading(show) {
    if (show) {
      // Show loading, hide everything else
      if (this.elements.loadingContainer) {
        this.elements.loadingContainer.classList.remove('hidden');
        this.elements.loadingContainer.style.display = 'flex';
      }
      if (this.elements.mainInterface) {
        this.elements.mainInterface.classList.add('hidden');
      }
      if (this.elements.errorContainer) {
        this.elements.errorContainer.classList.add('hidden');
      }
    } else {
      // Hide loading, show main interface
      if (this.elements.loadingContainer) {
        this.elements.loadingContainer.classList.add('hidden');
        this.elements.loadingContainer.style.display = 'none';
      }
      if (this.elements.mainInterface) {
        this.elements.mainInterface.classList.remove('hidden');
      }
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Hide loading and main interface
    if (this.elements.loadingContainer) {
      this.elements.loadingContainer.classList.add('hidden');
    }
    if (this.elements.mainInterface) {
      this.elements.mainInterface.classList.add('hidden');
    }

    // Show error container
    if (this.elements.errorContainer) {
      this.elements.errorContainer.classList.remove('hidden');
    }
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
    }
  }

  /**
   * Clear error message
   */
  clearError() {
    if (this.elements.errorContainer) {
      this.elements.errorContainer.classList.add('hidden');
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    if (this.elements.statusText) {
      this.elements.statusText.textContent = message;
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});