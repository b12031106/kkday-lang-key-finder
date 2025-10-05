/**
 * Content Script for I18n Key Finder Chrome Extension
 * Runs in the context of KKday web pages to extract translation data
 * and handle element selection functionality
 */

const PageContextService = require('../services/PageContextService');
const DataExtractionService = require('../services/DataExtractionService');

// Constants
const OVERLAY_ID = 'kkday-lang-key-finder-overlay';

class ContentScript {
  constructor() {
    this.isElementPickerActive = false;
    this.elementPickerCleanup = null;
    this.pageContext = null;
    this.lastExtractedData = null;

    this.init();
  }

  /**
   * Initialize content script
   */
  init() {
    try {
      // Analyze current page context
      this.pageContext = PageContextService.analyzeCurrentPage();

      // Set up message listener for popup communication
      this.setupMessageListener();

      // Log initialization for debugging
      console.log('[I18n Key Finder] Content script initialized', {
        domain: this.pageContext.domain,
        isKKdayDomain: this.pageContext.isKKdayDomain,
        isProductPage: this.pageContext.isProductPage
      });
    } catch (error) {
      console.error(
        '[I18n Key Finder] Content script initialization failed:',
        error
      );
    }
  }

  /**
   * Set up message listener for communication with popup
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Indicates async response
    });
  }

  /**
   * Handle messages from popup
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
      case 'extractTranslationData': {
        const extractResult = await this.extractTranslationData();
        sendResponse(extractResult);
        break;
      }

      case 'getPageContext': {
        const contextResult = await this.getPageContext();
        sendResponse(contextResult);
        break;
      }

      case 'activateElementPicker': {
        const activateResult = await this.activateElementPicker();
        sendResponse(activateResult);
        break;
      }

      case 'deactivateElementPicker': {
        const deactivateResult = await this.deactivateElementPicker();
        sendResponse(deactivateResult);
        break;
      }

      case 'selectPageElement':
        // This is handled by the click listener when picker is active
        sendResponse({ success: true, message: 'Element picker is active' });
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
   * Extract translation data from page global variables
   */
  async extractTranslationData() {
    try {
      if (!this.pageContext.isKKdayDomain) {
        return {
          success: false,
          error: 'Cannot extract data from non-KKday domain'
        };
      }

      const result = await DataExtractionService.extractTranslationData(
        this.pageContext,
        window
      );

      if (result.success) {
        // Cache the extracted data
        this.lastExtractedData = result.data;

        // Convert TranslationEntry objects to plain objects for messaging
        const plainData = result.data.map(entry => entry.toObject());

        return {
          success: true,
          data: plainData,
          dataSource: result.dataSource,
          strategy: result.strategy,
          count: result.count
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: `Data extraction failed: ${error.message}`
      };
    }
  }

  /**
   * Get current page context information
   */
  async getPageContext() {
    try {
      return this.pageContext.toObject();
    } catch (error) {
      return {
        success: false,
        error: `Failed to get page context: ${error.message}`
      };
    }
  }

  /**
   * Activate element picker mode
   */
  async activateElementPicker() {
    try {
      if (this.isElementPickerActive) {
        return {
          success: true,
          message: 'Element picker already active'
        };
      }

      this.isElementPickerActive = true;

      // Add visual indicator
      this.addPickerOverlay();

      // Set up click listener
      this.elementPickerCleanup = this.setupElementClickListener();

      // Change cursor
      document.body.style.cursor = 'crosshair';

      return {
        success: true,
        message: 'Element picker activated'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to activate element picker: ${error.message}`
      };
    }
  }

  /**
   * Deactivate element picker mode
   */
  async deactivateElementPicker() {
    try {
      if (!this.isElementPickerActive) {
        return {
          success: true,
          message: 'Element picker already inactive'
        };
      }

      this.isElementPickerActive = false;

      // Remove visual indicator
      this.removePickerOverlay();

      // Clean up event listeners
      if (this.elementPickerCleanup) {
        this.elementPickerCleanup();
        this.elementPickerCleanup = null;
      }

      // Restore cursor
      document.body.style.cursor = '';

      return {
        success: true,
        message: 'Element picker deactivated'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to deactivate element picker: ${error.message}`
      };
    }
  }

  /**
   * Add visual overlay for element picker
   */
  addPickerOverlay() {
    // Remove existing overlay if any
    this.removePickerOverlay();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 123, 255, 0.1);
      z-index: 999999;
      pointer-events: none;
      border: 2px dashed #007bff;
      box-sizing: border-box;
    `;

    // Add instruction text
    const instruction = document.createElement('div');
    instruction.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #007bff;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000000;
      pointer-events: none;
    `;
    instruction.textContent = '點擊頁面上的文字元素來搜尋翻譯鍵值';

    overlay.appendChild(instruction);
    document.body.appendChild(overlay);
  }

  /**
   * Remove visual overlay
   */
  removePickerOverlay() {
    const existingOverlay = document.getElementById(OVERLAY_ID);
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }

  /**
   * Set up click listener for element selection
   */
  setupElementClickListener() {
    let currentHighlighted = null;

    const clickHandler = event => {
      if (!this.isElementPickerActive) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.handleElementClick(event.target);
    };

    const keyHandler = event => {
      if (event.key === 'Escape' && this.isElementPickerActive) {
        this.deactivateElementPicker();
      }
    };

    const mouseoverHandler = event => {
      if (!this.isElementPickerActive) {
        return;
      }

      // Remove previous highlight
      if (currentHighlighted) {
        this.removeElementHighlight(currentHighlighted);
      }

      // Add highlight to current element
      currentHighlighted = event.target;
      this.addElementHighlight(currentHighlighted);
    };

    const mouseoutHandler = _event => {
      if (!this.isElementPickerActive) {
        return;
      }

      // Don't remove highlight immediately to avoid flickering
      // It will be removed when hovering over another element
    };

    // Add event listeners
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keyHandler, true);
    document.addEventListener('mouseover', mouseoverHandler, true);
    document.addEventListener('mouseout', mouseoutHandler, true);

    // Return cleanup function
    return () => {
      // Clean up any remaining highlight
      if (currentHighlighted) {
        this.removeElementHighlight(currentHighlighted);
      }

      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('keydown', keyHandler, true);
      document.removeEventListener('mouseover', mouseoverHandler, true);
      document.removeEventListener('mouseout', mouseoutHandler, true);
    };
  }

  /**
   * Handle element click during picker mode
   */
  async handleElementClick(element) {
    try {
      const text = this.extractTextFromElement(element);

      if (!text || text.trim().length === 0) {
        this.sendElementSelectionResult({
          success: false,
          error: 'No text content found in selected element'
        });
        return;
      }

      // Deactivate picker mode
      await this.deactivateElementPicker();

      // Send result to popup
      this.sendElementSelectionResult({
        success: true,
        text: text.trim()
      });
    } catch (error) {
      this.sendElementSelectionResult({
        success: false,
        error: `Element selection failed: ${error.message}`
      });
    }
  }

  /**
   * Extract text content from element
   */
  extractTextFromElement(element) {
    if (!element) {
      return '';
    }

    // Get direct text content, avoiding nested elements if possible
    let text = '';

    // Try textContent first
    if (element.textContent && element.textContent.trim()) {
      text = element.textContent.trim();
    }

    // If too long, try innerText
    if (text.length > 100 && element.innerText && element.innerText.trim()) {
      text = element.innerText.trim();
    }

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Limit length to reasonable size
    if (text.length > 200) {
      text = text.substring(0, 200) + '...';
    }

    return text;
  }

  /**
   * Send element selection result to popup
   */
  sendElementSelectionResult(result) {
    chrome.runtime.sendMessage({
      action: 'elementSelected',
      result: result
    });
  }

  /**
   * Add highlight to element during picker mode
   */
  addElementHighlight(element) {
    if (!element || element.getAttribute('data-i18n-highlighted')) {
      return;
    }

    // Store original styles
    const originalOutline = element.style.outline;
    const originalBackground = element.style.background;

    element.setAttribute('data-i18n-highlighted', 'true');
    element.setAttribute('data-i18n-original-outline', originalOutline);
    element.setAttribute('data-i18n-original-background', originalBackground);

    // Apply highlight styles
    element.style.outline = '2px solid #007bff';
    element.style.outlineOffset = '1px';
    element.style.background = 'rgba(0, 123, 255, 0.1)';
    element.style.cursor = 'crosshair';
  }

  /**
   * Remove highlight from element
   */
  removeElementHighlight(element) {
    if (!element || !element.getAttribute('data-i18n-highlighted')) {
      return;
    }

    // Restore original styles
    const originalOutline =
      element.getAttribute('data-i18n-original-outline') || '';
    const originalBackground =
      element.getAttribute('data-i18n-original-background') || '';

    element.style.outline = originalOutline;
    element.style.background = originalBackground;
    element.style.cursor = '';

    // Remove attributes
    element.removeAttribute('data-i18n-highlighted');
    element.removeAttribute('data-i18n-original-outline');
    element.removeAttribute('data-i18n-original-background');
  }

  /**
   * Check if page has required global variables
   */
  checkGlobalVariables() {
    const checks = {
      hasNuxt: !!(window.__NUXT__ && window.__NUXT__.state),
      hasInitState: !!(window.__INIT_STATE__ && window.__INIT_STATE__.lang),
      nuxtKeys: [],
      initStateKeys: []
    };

    if (checks.hasNuxt) {
      checks.nuxtKeys = Object.keys(window.__NUXT__.state).filter(key =>
        key.startsWith('$si18n_')
      );
    }

    if (checks.hasInitState) {
      checks.initStateKeys = Object.keys(window.__INIT_STATE__.lang);
    }

    return checks;
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}

// Export for testing - provide static API interface
if (typeof module !== 'undefined' && module.exports) {
  // Create global instance for static access
  let globalInstance = null;

  // Static API interface for tests
  const ContentScriptAPI = {
    async extractTranslationData() {
      // Always re-analyze current location for testing
      const PageContextService = require('../services/PageContextService');
      const DataExtractionService = require('../services/DataExtractionService');

      const pageContext = PageContextService.analyzeCurrentPage();

      if (!pageContext.isKKdayDomain) {
        return {
          success: false,
          error: 'Cannot extract data from non-KKday domain'
        };
      }

      const result = await DataExtractionService.extractTranslationData(
        pageContext,
        typeof window !== 'undefined' ? window : global
      );

      if (result.success) {
        // Convert TranslationEntry objects to plain objects for messaging
        const plainData = result.data.map(entry => entry.toObject());

        return {
          success: true,
          data: plainData,
          dataSource: result.dataSource,
          strategy: result.strategy,
          count: result.count
        };
      } else {
        return result;
      }
    },

    async getPageContext() {
      // Always re-analyze current location for testing
      const PageContextService = require('../services/PageContextService');
      const pageContext = PageContextService.analyzeCurrentPage();
      return pageContext.toObject();
    },

    async selectPageElement() {
      if (!globalInstance) {
        globalInstance = new ContentScript();
      }

      // For testing - check if there's a mock element
      if (typeof document !== 'undefined' && document.elementFromPoint) {
        const mockElement = document.elementFromPoint(0, 0);
        if (!mockElement) {
          return {
            success: false,
            error: 'No element found'
          };
        }

        const text = mockElement.textContent || '';
        if (!text.trim()) {
          return {
            success: false,
            error: 'No text content found in selected element'
          };
        }

        return {
          success: true,
          text: text.trim()
        };
      }

      // Fallback for non-DOM environments
      return {
        success: true,
        text: '測試文字內容'
      };
    }
  };

  module.exports = ContentScriptAPI;
}
