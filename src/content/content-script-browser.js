/**
 * Content Script for I18n Key Finder Chrome Extension
 * Injected into *.kkday.com pages to extract translation data
 * Browser-compatible version without require statements
 */

(function() {
  'use strict';

  class ContentScript {
    constructor() {
      this.isPickerActive = false;
      this.translationData = null;
      this.highlightedElement = null;
      this.originalStyles = new WeakMap();

      // Bind event handlers to preserve 'this' context
      this.boundHandleMouseOver = this.handleMouseOver.bind(this);
      this.boundHandleMouseOut = this.handleMouseOut.bind(this);
      this.boundHandleClick = this.handleClick.bind(this);
      this.boundHandleKeyDown = this.handleKeyDown.bind(this);

      this.init();
    }

    /**
     * Initialize content script
     */
    init() {
      // Set up message listener immediately
      this.setupMessageListener();

      // Listen for data from page script BEFORE injecting
      this.listenForPageData();

      // Inject page script to access page context
      this.injectPageScript();

      // Also try after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.injectPageScript();
        });
      }

      // Set up mutation observer for dynamic content
      this.setupMutationObserver();
    }

    /**
     * Inject page script into the page context
     */
    injectPageScript() {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('src/content/page-script.js');
      script.onload = function() {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    }

    /**
     * Listen for data from page script
     */
    listenForPageData() {
      window.addEventListener('message', (event) => {
        // Only accept messages from the same window
        if (event.source !== window) {
          return;
        }

        if (event.data.type === 'I18N_KEY_FINDER_DATA') {
          if (event.data.data) {
            // Flatten and store the data
            this.translationData = this.flattenTranslationData(event.data.data);
          }
        }
      });
    }

    /**
     * Extract translation data from page
     */
    extractTranslationData() {
      try {
        let data = null;

        // Method 1: Check for Next.js __NEXT_DATA__
        if (!data && window.__NEXT_DATA__) {
          const nextData = window.__NEXT_DATA__;

          // Check props
          if (nextData.props?.pageProps) {
            const pageProps = nextData.props.pageProps;

            // Look for translation-related properties
            const checkKeys = ['translations', 'i18n', 'locale', 'messages', '_nextI18Next', 'initialI18nStore'];
            for (const key of checkKeys) {
              if (pageProps[key]) {
                data = pageProps[key];
                break;
              }
            }

            // Also check nested structures
            if (!data && pageProps._nextI18Next?.initialI18nStore) {
              const store = pageProps._nextI18Next.initialI18nStore;
              const locale = pageProps._nextI18Next.initialLocale || 'zh-tw';
              if (store[locale]) {
                data = store[locale];
              }
            }
          }
        }

        // Method 2: Check for Vue/Nuxt __NUXT__
        if (!data && typeof window.__NUXT__ !== 'undefined') {
          if (window.__NUXT__.state) {
            // Check for i18n related keys
            for (const key of Object.keys(window.__NUXT__.state)) {
              if (key.includes('i18n') || key.includes('lang') || key.includes('locale') || key.startsWith('$s')) {
                const value = window.__NUXT__.state[key];
                if (value && typeof value === 'object' && Object.keys(value).length > 0) {
                  data = value;
                  break;
                }
              }
            }
          }
        }

        // Method 3: Look for i18n instances in window
        if (!data) {
          // Common i18n library patterns
          const i18nPatterns = [
            'i18n',
            'I18n',
            'i18next',
            'I18Next',
            '$t',
            '_i18n',
            '__i18n',
            'translations',
            'localeData',
            'messages'
          ];

          for (const pattern of i18nPatterns) {
            if (window[pattern]) {
              const obj = window[pattern];

              // Check if it has translation data
              if (obj.store?.data) {
                data = obj.store.data;
                break;
              } else if (obj.locale && obj.messages) {
                data = obj.messages[obj.locale] || obj.messages;
                break;
              } else if (obj.messages) {
                data = obj.messages;
                break;
              } else if (typeof obj === 'object' && !obj.nodeName) {
                // Check if the object itself contains translations
                const keys = Object.keys(obj);
                if (keys.length > 0 && keys.some(k => typeof obj[k] === 'string' || typeof obj[k] === 'object')) {
                  data = obj;
                  break;
                }
              }
            }
          }
        }

        // Method 4: Search React Fiber for i18n context
        if (!data) {
          const reactRoot = document.getElementById('__next') || document.getElementById('root');
          if (reactRoot && reactRoot._reactRootContainer) {
            // This is complex and might not always work, but worth trying
          }
        }

        // Method 5: Check sessionStorage/localStorage
        if (!data) {
          const storageKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
          for (const key of storageKeys) {
            if (key.includes('i18n') || key.includes('translation') || key.includes('locale')) {
              try {
                const value = localStorage.getItem(key) || sessionStorage.getItem(key);
                if (value) {
                  const parsed = JSON.parse(value);
                  if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                    data = parsed;
                    break;
                  }
                }
              } catch (e) {
                // Not JSON, skip
              }
            }
          }
        }

        // Method 6: Try to extract from page content
        if (!data) {
          const scripts = document.querySelectorAll('script');
          for (const script of scripts) {
            const content = script.innerHTML;
            if (content.includes('i18n') || content.includes('translations') || content.includes('locale')) {
              // Look for JSON-like structures
              const jsonMatch = content.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[1]);
                  if (parsed.i18n || parsed.translations || parsed.locale) {
                    data = parsed.i18n || parsed.translations || parsed;
                    break;
                  }
                } catch (e) {
                  // Not valid JSON
                }
              }
            }
          }
        }

        if (data) {
          // Only update if we don't already have data from page script
          if (!this.translationData || this.translationData.length === 0) {
            this.translationData = this.flattenTranslationData(data);
          }
        } else {
          // Only set empty array if we don't have data from page script
          if (!this.translationData || this.translationData.length === 0) {
            this.translationData = [];
          }
        }
      } catch (error) {
        // Don't clear existing data if extraction fails
        if (!this.translationData || this.translationData.length === 0) {
          this.translationData = [];
        }
      }
    }

    /**
     * Flatten nested translation data into key-value pairs
     */
    flattenTranslationData(data, prefix = '') {
      const result = [];

      const flatten = (obj, currentPrefix) => {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;

            if (typeof obj[key] === 'string') {
              result.push({
                key: fullKey,
                val: obj[key]
              });
            } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              flatten(obj[key], fullKey);
            }
          }
        }
      };

      if (typeof data === 'object' && data !== null) {
        flatten(data, prefix);
      }

      return result;
    }

    /**
     * Set up message listener for popup communication
     */
    setupMessageListener() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
        case 'getTranslations': {
          // Try to extract data again if we don't have any
          if (!this.translationData || this.translationData.length === 0) {
            this.extractTranslationData();
          }

          const responseData = {
            success: true,
            data: this.translationData || []
          };

          sendResponse(responseData);
          break;
        }

        case 'toggleElementPicker':
          this.toggleElementPicker();
          sendResponse({
            success: true,
            active: this.isPickerActive
          });
          break;

        case 'searchFromContextMenu': {
          // Handle search request from context menu
          const query = request.query;

          // Ensure we have translation data
          if (!this.translationData || this.translationData.length === 0) {
            this.extractTranslationData();
          }

          if (query && this.translationData) {
            const matchResult = this.findTranslationByText(query);

            if (matchResult) {
              // Copy to clipboard
              this.copyToClipboard(matchResult.entry.key);

              // Show success notification
              this.showResultNotification({
                success: true,
                key: matchResult.entry.key,
                value: matchResult.entry.val,
                score: matchResult.score,
                elementText: query.substring(0, 50) + (query.length > 50 ? '...' : '')
              });
            } else {
              // Show no match notification
              this.showResultNotification({
                success: false,
                elementText: query.substring(0, 50) + (query.length > 50 ? '...' : '')
              });
            }
          } else {
            // No translation data available
            this.showResultNotification({
              success: false,
              elementText: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
              noData: true
            });
          }

          sendResponse({ success: true });
          break;
        }

        case 'ping':
          sendResponse({ success: true });
          break;

        case 'debugInfo':
          // Provide debug information about available data
          sendResponse({
            success: true,
            info: {
              hasNextData: typeof window.__NEXT_DATA__ !== 'undefined',
              hasNuxt: typeof window.__NUXT__ !== 'undefined',
              windowKeys: Object.keys(window).slice(0, 100),
              sampleData: this.translationData?.slice(0, 3) || []
            }
          });
          break;

        default:
          sendResponse({
            success: false,
            error: 'Unknown action'
          });
        }

        return true; // Keep the message channel open for async response
      });
    }

    /**
     * Set up mutation observer for dynamic content
     */
    setupMutationObserver() {
      const observer = new MutationObserver(() => {
        // Re-extract data if major changes detected
        if (!this.translationData || this.translationData.length === 0) {
          this.extractTranslationData();
        }
      });

      // Observe body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    /**
     * Toggle element picker mode
     */
    toggleElementPicker() {
      if (this.isPickerActive) {
        // Already active, stop it
        this.stopElementPicker();
      } else {
        // Not active, start it
        this.startElementPicker();
      }
    }

    /**
     * Start element picker
     */
    startElementPicker() {
      // Set active state first
      this.isPickerActive = true;

      // Show on-page notification
      this.showPickerNotification();

      // Add event listeners using bound methods
      document.addEventListener('mouseover', this.boundHandleMouseOver, true);
      document.addEventListener('mouseout', this.boundHandleMouseOut, true);
      document.addEventListener('click', this.boundHandleClick, true);
      document.addEventListener('keydown', this.boundHandleKeyDown, true);

      // Change cursor
      document.body.style.cursor = 'crosshair';

      // Add picker overlay class
      document.body.classList.add('i18n-picker-active');
    }

    /**
     * Show picker notification on page
     */
    showPickerNotification() {
      // Remove existing notification if any
      const existing = document.getElementById('i18n-picker-notification');
      if (existing) {
        existing.remove();
      }

      // Create notification element
      const notification = document.createElement('div');
      notification.id = 'i18n-picker-notification';
      notification.className = 'i18n-notification-top';
      notification.innerHTML = `
        <div class="i18n-notification-content" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          pointer-events: auto;
        ">
          <span style="font-size: 24px;">🎯</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 15px;">元素選取模式</div>
            <div style="font-size: 13px; opacity: 0.95; line-height: 1.4;">
              點擊頁面元素查找翻譯鍵值 • 按 <kbd style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">ESC</kbd> 退出
            </div>
          </div>
        </div>
      `;

      // Add styles for positioning
      const style = document.createElement('style');
      style.id = 'i18n-notification-styles';
      style.textContent = `
        #i18n-picker-notification {
          position: fixed;
          z-index: 2147483647;
          pointer-events: none;
          transition: all 0.3s ease-out;
        }

        #i18n-picker-notification.i18n-notification-top {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          animation: slideDown 0.3s ease-out;
        }

        #i18n-picker-notification.i18n-notification-top-left {
          top: 20px;
          left: 20px;
          transform: none;
          animation: slideInLeft 0.3s ease-out;
        }

        #i18n-picker-notification.i18n-notification-top-right {
          top: 20px;
          right: 20px;
          transform: none;
          animation: slideInRight 0.3s ease-out;
        }

        #i18n-picker-notification.i18n-notification-bottom {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          animation: slideUp 0.3s ease-out;
        }

        #i18n-picker-notification.i18n-notification-bottom-left {
          bottom: 20px;
          left: 20px;
          transform: none;
          animation: slideInLeft 0.3s ease-out;
        }

        #i18n-picker-notification.i18n-notification-bottom-right {
          bottom: 20px;
          right: 20px;
          transform: none;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      // Add to page
      document.body.appendChild(notification);

      // Track mouse movement to adjust notification position
      this.notificationPositionHandler = (e) => {
        this.adjustNotificationPosition(e.clientX, e.clientY);
      };
      document.addEventListener('mousemove', this.notificationPositionHandler);
    }

    /**
     * Adjust notification position based on mouse location
     */
    adjustNotificationPosition(mouseX, mouseY) {
      const notification = document.getElementById('i18n-picker-notification');
      if (!notification) {
        return;
      }

      const rect = notification.getBoundingClientRect();
      const buffer = 100; // Distance from mouse to trigger repositioning

      // Check if mouse is near the notification
      const isNearX = mouseX >= rect.left - buffer && mouseX <= rect.right + buffer;
      const isNearY = mouseY >= rect.top - buffer && mouseY <= rect.bottom + buffer;

      if (isNearX && isNearY) {
        // Mouse is near notification, move it
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Determine best position based on mouse location
        let newClass;

        if (mouseY < windowHeight / 2) {
          // Mouse in top half, move notification to bottom
          if (mouseX < windowWidth / 3) {
            newClass = 'i18n-notification-bottom-right';
          } else if (mouseX > windowWidth * 2/3) {
            newClass = 'i18n-notification-bottom-left';
          } else {
            newClass = 'i18n-notification-bottom';
          }
        } else {
          // Mouse in bottom half, keep notification at top but adjust horizontal
          if (mouseX < windowWidth / 3) {
            newClass = 'i18n-notification-top-right';
          } else if (mouseX > windowWidth * 2/3) {
            newClass = 'i18n-notification-top-left';
          } else {
            newClass = 'i18n-notification-top';
          }
        }

        // Only update if class is different
        if (!notification.classList.contains(newClass)) {
          notification.className = newClass;
        }
      }
    }

    /**
     * Hide picker notification
     */
    hidePickerNotification() {
      // Remove mouse move listener
      if (this.notificationPositionHandler) {
        document.removeEventListener('mousemove', this.notificationPositionHandler);
        this.notificationPositionHandler = null;
      }

      const notification = document.getElementById('i18n-picker-notification');
      if (notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'scale(0.9)';
        setTimeout(() => notification.remove(), 300);
      }

      // Remove styles
      const style = document.getElementById('i18n-notification-styles');
      if (style) {
        style.remove();
      }
    }

    /**
     * Stop element picker
     */
    stopElementPicker() {
      // Set inactive state first
      this.isPickerActive = false;

      // Hide notification
      this.hidePickerNotification();

      // Remove event listeners using bound methods
      document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
      document.removeEventListener('mouseout', this.boundHandleMouseOut, true);
      document.removeEventListener('click', this.boundHandleClick, true);
      document.removeEventListener('keydown', this.boundHandleKeyDown, true);

      // Reset cursor
      document.body.style.cursor = '';

      // Remove picker overlay class
      document.body.classList.remove('i18n-picker-active');

      // Remove any highlights
      if (this.highlightedElement) {
        this.removeHighlight(this.highlightedElement);
        this.highlightedElement = null;
      }
    }

    /**
     * Handle mouse over event
     */
    handleMouseOver = (event) => {
      if (!this.isPickerActive) {
        return;
      }

      const element = event.target;
      if (element === this.highlightedElement) {
        return;
      }

      // Remove previous highlight
      if (this.highlightedElement) {
        this.removeHighlight(this.highlightedElement);
      }

      // Add new highlight
      this.addHighlight(element);
      this.highlightedElement = element;
    };

    /**
     * Handle mouse out event
     */
    handleMouseOut = (event) => {
      if (!this.isPickerActive) {
        return;
      }

      const element = event.target;
      if (element === this.highlightedElement) {
        this.removeHighlight(element);
        this.highlightedElement = null;
      }
    };

    /**
     * Handle click event
     */
    handleClick = (event) => {
      if (!this.isPickerActive) {
        return;
      }

      // Skip if clicking on the notification
      if (event.target.closest('#i18n-picker-notification')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const element = event.target;
      const text = element.textContent.trim();

      if (!text) {
        // Show notification for empty element
        this.showResultNotification({
          success: false,
          elementText: '(空白元素)',
          noText: true
        });
      } else {
        const matchResult = this.findTranslationByText(text);

        if (matchResult) {
          // Copy to clipboard
          this.copyToClipboard(matchResult.entry.key);

          // Show success notification
          this.showResultNotification({
            success: true,
            key: matchResult.entry.key,
            value: matchResult.entry.val,
            score: matchResult.score,
            elementText: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
        } else {
          // Show no match notification
          this.showResultNotification({
            success: false,
            elementText: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
        }
      }

      // Stop picker after selection
      this.stopElementPicker();
    };

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        // Failed to copy
      }
    }

    /**
     * Show result notification
     */
    showResultNotification(result) {
      // Remove existing notification
      const existing = document.getElementById('i18n-result-notification');
      if (existing) {
        existing.remove();
      }

      const notification = document.createElement('div');
      notification.id = 'i18n-result-notification';

      if (result.success) {
        const percentage = Math.round((result.score || 1.0) * 100);

        // Determine badge color based on accuracy
        let badgeGradient, borderColor, titleColor;
        if (percentage >= 90) {
          // High accuracy - Green
          badgeGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          borderColor = '#10b981';
          titleColor = '#10b981';
        } else if (percentage >= 70) {
          // Medium accuracy - Orange
          badgeGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
          borderColor = '#f59e0b';
          titleColor = '#f59e0b';
        } else {
          // Low accuracy - Blue
          badgeGradient = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          borderColor = '#3b82f6';
          titleColor = '#3b82f6';
        }

        notification.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2147483647;
            background: #ffffff;
            color: #1f2937;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
            border: 3px solid ${borderColor};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
          ">
            <div style="display: flex; align-items: start; gap: 12px;">
              <span style="font-size: 24px;">✅</span>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                  <div style="font-weight: 700; font-size: 15px; color: ${titleColor};">找到翻譯鍵值！</div>
                  <div style="
                    background: ${badgeGradient};
                    color: white;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                  ">準確率 ${percentage}%</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">搜尋文字</div>
                  <div style="background: #f9fafb; padding: 8px 10px; border-radius: 6px; font-size: 13px; color: #374151; border: 1px solid #e5e7eb; line-height: 1.5;">
                    「${this.escapeHtml(result.elementText)}」
                  </div>
                </div>
                <div style="margin-bottom: 8px;">
                  <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">翻譯鍵值</div>
                  <div style="background: #f3f4f6; padding: 10px 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all; color: #1f2937; border: 1px solid #e5e7eb;">
                    ${this.escapeHtml(result.key)}
                  </div>
                </div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 500;">
                  ✓ 已複製到剪貼簿
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        const errorTitle = result.noData ? '無法取得翻譯資料' : '找不到對應的翻譯鍵值';
        const errorMessage = result.noData
          ? '請確認頁面已載入完成，或嘗試重新整理頁面'
          : `「${this.escapeHtml(result.elementText)}」`;

        notification.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2147483647;
            background: #ffffff;
            color: #1f2937;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
            border: 3px solid #ef4444;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
          ">
            <div style="display: flex; align-items: start; gap: 12px;">
              <span style="font-size: 24px;">❌</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 15px; color: #ef4444; margin-bottom: 10px;">${errorTitle}</div>
                <div style="background: #fef2f2; padding: 10px 12px; border-radius: 6px; font-size: 13px; color: #991b1b; border: 1px solid #fecaca;">
                  ${errorMessage}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(notification);

      // Auto remove after 5 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.animation = 'slideInRight 0.3s ease-out reverse';
          setTimeout(() => notification.remove(), 300);
        }
      }, 5000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * Handle key down event
     */
    handleKeyDown = (event) => {
      if (!this.isPickerActive) {
        return;
      }

      // ESC key to cancel
      if (event.key === 'Escape') {
        this.stopElementPicker();
      }
    };

    /**
     * Add highlight to element
     */
    addHighlight(element) {
      // Store original styles
      const originalStyle = {
        outline: element.style.outline,
        backgroundColor: element.style.backgroundColor,
        cursor: element.style.cursor
      };
      this.originalStyles.set(element, originalStyle);

      // Apply highlight styles
      element.style.outline = '2px solid #007bff';
      element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
      element.style.cursor = 'pointer';
    }

    /**
     * Remove highlight from element
     */
    removeHighlight(element) {
      const originalStyle = this.originalStyles.get(element);
      if (originalStyle) {
        element.style.outline = originalStyle.outline;
        element.style.backgroundColor = originalStyle.backgroundColor;
        element.style.cursor = originalStyle.cursor;
        this.originalStyles.delete(element);
      }
    }

    /**
     * Find translation entry by text
     */
    findTranslationByText(text) {
      if (!this.translationData || !text) {
        return null;
      }

      // Normalize text for comparison
      const normalizedText = text.trim().toLowerCase();

      // First try exact match
      let match = this.translationData.find(entry =>
        entry.val && entry.val.trim().toLowerCase() === normalizedText
      );

      if (match) {
        return { entry: match, score: 1.0 };
      }

      // If no exact match, try partial match
      match = this.translationData.find(entry =>
        entry.val && entry.val.toLowerCase().includes(normalizedText)
      );

      if (match) {
        // Calculate score based on text length ratio
        const score = normalizedText.length / match.val.toLowerCase().length;
        return { entry: match, score: Math.min(0.8, score) };
      }

      // If still no match, try the other way around
      match = this.translationData.find(entry =>
        entry.val && normalizedText.includes(entry.val.toLowerCase())
      );

      if (match) {
        // Lower score for reverse match
        const score = match.val.toLowerCase().length / normalizedText.length;
        return { entry: match, score: Math.min(0.6, score) };
      }

      return null;
    }

    /**
     * Get all translation entries
     */
    getAllTranslations() {
      return this.translationData || [];
    }

    /**
     * Search translations
     */
    searchTranslations(query, options = {}) {
      if (!query || !this.translationData) {
        return [];
      }

      const normalizedQuery = query.toLowerCase().trim();
      const limit = options.limit || 20;

      const results = this.translationData
        .map(entry => {
          const keyMatch = entry.key.toLowerCase().includes(normalizedQuery);
          const valMatch = entry.val.toLowerCase().includes(normalizedQuery);

          if (!keyMatch && !valMatch) {
            return null;
          }

          // Calculate relevance score
          let score = 0;
          if (entry.key.toLowerCase() === normalizedQuery || entry.val.toLowerCase() === normalizedQuery) {
            score = 1.0;
          } else if (entry.key.toLowerCase().startsWith(normalizedQuery) || entry.val.toLowerCase().startsWith(normalizedQuery)) {
            score = 0.8;
          } else if (keyMatch && valMatch) {
            score = 0.6;
          } else {
            score = 0.4;
          }

          return { item: entry, score };
        })
        .filter(result => result !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    }
  }

  // Initialize content script immediately
  const contentScript = new ContentScript();

  // Expose API for testing
  if (typeof window !== 'undefined') {
    window.ContentScriptAPI = {
      extractTranslationData: () => contentScript.extractTranslationData(),
      getAllTranslations: () => contentScript.getAllTranslations(),
      searchTranslations: (query, options) => contentScript.searchTranslations(query, options),
      toggleElementPicker: () => contentScript.toggleElementPicker(),
      isPickerActive: () => contentScript.isPickerActive
    };
  }

})();