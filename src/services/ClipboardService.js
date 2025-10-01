/**
 * ClipboardService
 * Service for handling clipboard operations in Chrome extension context
 */

class ClipboardService {
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<Object>} Copy operation result
   */
  static async copyToClipboard(text) {
    if (!text || typeof text !== 'string') {
      return {
        success: false,
        error: 'Invalid text provided - must be a non-empty string'
      };
    }

    if (text.trim().length === 0) {
      return {
        success: false,
        error: 'Cannot copy empty text to clipboard'
      };
    }

    try {
      // Method 1: Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return {
          success: true,
          method: 'clipboard-api',
          text: text
        };
      }

      // Method 2: Try legacy execCommand as fallback
      const result = await this.copyWithExecCommand(text);
      if (result.success) {
        return result;
      }

      // Method 3: Try Chrome extension specific method
      const chromeResult = await this.copyWithChromeAPI(text);
      if (chromeResult.success) {
        return chromeResult;
      }

      // All methods failed
      return {
        success: false,
        error: 'All clipboard methods failed - clipboard may not be available'
      };

    } catch (error) {
      return {
        success: false,
        error: `Clipboard operation failed: ${error.message}`
      };
    }
  }

  /**
   * Copy text using legacy execCommand method
   * @param {string} text - Text to copy
   * @returns {Promise<Object>} Copy operation result
   */
  static async copyWithExecCommand(text) {
    return new Promise((resolve) => {
      try {
        // Create temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        textarea.setAttribute('readonly', '');

        // Add to DOM, select, and copy
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');

        // Clean up
        document.body.removeChild(textarea);

        if (successful) {
          resolve({
            success: true,
            method: 'exec-command',
            text: text
          });
        } else {
          resolve({
            success: false,
            error: 'execCommand copy returned false'
          });
        }

      } catch (error) {
        resolve({
          success: false,
          error: `execCommand failed: ${error.message}`
        });
      }
    });
  }

  /**
   * Copy text using Chrome extension API
   * @param {string} text - Text to copy
   * @returns {Promise<Object>} Copy operation result
   */
  static async copyWithChromeAPI(text) {
    return new Promise((resolve) => {
      try {
        // Check if Chrome extension API is available
        if (!chrome || !chrome.runtime) {
          resolve({
            success: false,
            error: 'Chrome extension API not available'
          });
          return;
        }

        // Try to send message to background script for clipboard operation
        chrome.runtime.sendMessage({
          action: 'copyToClipboard',
          text: text
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: `Chrome API error: ${chrome.runtime.lastError.message}`
            });
          } else if (response && response.success) {
            resolve({
              success: true,
              method: 'chrome-api',
              text: text
            });
          } else {
            resolve({
              success: false,
              error: 'Chrome API copy failed'
            });
          }
        });

      } catch (error) {
        resolve({
          success: false,
          error: `Chrome API exception: ${error.message}`
        });
      }
    });
  }

  /**
   * Check if clipboard functionality is available
   * @returns {Object} Availability check result
   */
  static checkAvailability() {
    const availability = {
      clipboardAPI: false,
      execCommand: false,
      chromeAPI: false,
      anyMethod: false
    };

    // Check Clipboard API
    try {
      availability.clipboardAPI = !!(navigator.clipboard && navigator.clipboard.writeText);
    } catch (error) {
      availability.clipboardAPI = false;
    }

    // Check execCommand
    try {
      availability.execCommand = !!(document && document.execCommand);
    } catch (error) {
      availability.execCommand = false;
    }

    // Check Chrome API
    try {
      availability.chromeAPI = !!(chrome && chrome.runtime);
    } catch (error) {
      availability.chromeAPI = false;
    }

    availability.anyMethod = availability.clipboardAPI ||
                           availability.execCommand ||
                           availability.chromeAPI;

    return availability;
  }

  /**
   * Get user-friendly error message for clipboard failures
   * @param {string} errorMessage - Technical error message
   * @returns {string} User-friendly error message
   */
  static getUserFriendlyError(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return '複製失敗：未知錯誤';
    }

    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('permission') || lowerError.includes('denied')) {
      return '複製失敗：權限不足，請檢查瀏覽器設定';
    }

    if (lowerError.includes('not available') || lowerError.includes('not supported')) {
      return '複製失敗：瀏覽器不支援剪貼簿功能';
    }

    if (lowerError.includes('empty')) {
      return '複製失敗：內容不能為空';
    }

    if (lowerError.includes('timeout')) {
      return '複製失敗：操作超時，請重試';
    }

    if (lowerError.includes('context invalidated')) {
      return '複製失敗：擴充功能需要重新載入';
    }

    // Generic fallback
    return '複製失敗：請重試或手動複製';
  }

  /**
   * Copy translation key with user feedback
   * @param {string} key - Translation key to copy
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  static async copyTranslationKey(key, onSuccess, onError) {
    if (!key || typeof key !== 'string') {
      if (typeof onError === 'function') {
        onError('無效的翻譯鍵值');
      }
      return;
    }

    try {
      const result = await this.copyToClipboard(key);

      if (result.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(key, result.method);
        }
      } else {
        const friendlyError = this.getUserFriendlyError(result.error);
        if (typeof onError === 'function') {
          onError(friendlyError);
        }
      }

    } catch (error) {
      const friendlyError = this.getUserFriendlyError(error.message);
      if (typeof onError === 'function') {
        onError(friendlyError);
      }
    }
  }

  /**
   * Test clipboard functionality
   * @returns {Promise<Object>} Test result
   */
  static async testClipboard() {
    const testText = 'clipboard_test_' + Date.now();
    const availability = this.checkAvailability();

    let testResult = {
      availability: availability,
      copyTest: null,
      performance: null
    };

    if (availability.anyMethod) {
      const startTime = performance.now();
      const copyResult = await this.copyToClipboard(testText);
      const endTime = performance.now();

      testResult.copyTest = copyResult;
      testResult.performance = {
        time: Math.round(endTime - startTime),
        method: copyResult.method
      };
    }

    return testResult;
  }

  /**
   * Create mock clipboard service for testing
   * @param {boolean} shouldSucceed - Whether operations should succeed
   * @returns {Object} Mock service
   */
  static createMock(shouldSucceed = true) {
    return {
      copyToClipboard: async(text) => {
        if (shouldSucceed) {
          return {
            success: true,
            method: 'mock',
            text: text
          };
        } else {
          return {
            success: false,
            error: 'Mock clipboard failure'
          };
        }
      },

      checkAvailability: () => ({
        clipboardAPI: shouldSucceed,
        execCommand: shouldSucceed,
        chromeAPI: shouldSucceed,
        anyMethod: shouldSucceed
      })
    };
  }
}

module.exports = ClipboardService;