/**
 * Integration Test: Element Selection Search Scenario
 * Tests the complete user flow for selecting page elements to search
 * Based on Scenario 2 from quickstart.md
 */

describe('Element Selection Search Integration', () => {
  let mockChrome;
  let mockTranslationData;

  beforeEach(() => {
    // Setup mock translation data
    mockTranslationData = [
      { key: 'lang_key_common', val: '常用文字' },
      { key: 'lang_key_button_submit', val: '提交按鈕' },
      { key: 'lang_key_nav_home', val: '首頁' },
      { key: 'lang_key_product_title', val: '產品標題' }
    ];

    // Mock Chrome APIs
    mockChrome = {
      tabs: {
        query: jest.fn().mockResolvedValue([{
          url: 'https://zh-tw.kkday.com/product/12345',
          id: 1
        }]),
        sendMessage: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn()
      }
    };

    global.chrome = mockChrome;

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });

    // Mock popup DOM
    document.body.innerHTML = `
      <div id="popup-container">
        <button id="select-element-btn">選取頁面元素</button>
        <div id="search-results"></div>
        <div id="notification" class="hidden"></div>
        <div id="status-message"></div>
      </div>
    `;
  });

  test('Complete element selection flow: activate picker → click element → search → copy key', async() => {
    // Import modules (these will fail until implemented)
    const PopupController = require('../../src/popup/popup.js');
    const ElementPicker = require('../../src/services/ElementPickerService.js');

    // Step 1: Initialize popup (equivalent to clicking extension icon)
    await PopupController.initialize();

    // Step 2: User clicks "Select Element" button
    const selectButton = document.getElementById('select-element-btn');
    expect(selectButton).toBeTruthy();

    // Mock element picker activation
    mockChrome.tabs.sendMessage
      .mockResolvedValueOnce({ success: true }) // Element picker activation
      .mockResolvedValueOnce({ // Element selection result
        success: true,
        text: '提交按鈕'
      })
      .mockResolvedValueOnce({ // Translation data
        success: true,
        data: mockTranslationData
      });

    const clickEvent = new Event('click');
    selectButton.dispatchEvent(clickEvent);

    // Verify element picker mode is activated
    await new Promise(resolve => setTimeout(resolve, 50));

    const statusMessage = document.getElementById('status-message');
    expect(statusMessage.textContent).toContain('點擊頁面上的文字元素');

    // Step 3: Simulate user clicking on page element
    // This would normally happen in content script, mock the response
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 4: Verify element text is automatically searched
    const searchResults = document.getElementById('search-results');
    const resultElements = searchResults.querySelectorAll('.search-result');

    expect(resultElements.length).toBeGreaterThan(0);

    // Should find the matching translation for "提交按鈕"
    const matchingResult = Array.from(resultElements).find(element =>
      element.textContent.includes('lang_key_button_submit')
    );
    expect(matchingResult).toBeTruthy();

    // Step 5: User clicks on result to copy key
    matchingResult.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 6: Verify key is copied and notification appears
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('lang_key_button_submit');

    const notification = document.getElementById('notification');
    expect(notification.classList.contains('hidden')).toBe(false);
    expect(notification.textContent).toContain('複製成功');
  });

  test('Element picker handles nested elements correctly', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Mock selection of nested element with multiple text nodes
    mockChrome.tabs.sendMessage
      .mockResolvedValueOnce({ success: true }) // Picker activation
      .mockResolvedValueOnce({ // Element selection with nested content
        success: true,
        text: '產品標題: 精選商品'
      })
      .mockResolvedValueOnce({ // Translation data
        success: true,
        data: mockTranslationData
      });

    const selectButton = document.getElementById('select-element-btn');
    selectButton.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 150));

    // Should find matches for the text content
    const searchResults = document.getElementById('search-results');
    const resultElements = searchResults.querySelectorAll('.search-result');

    expect(resultElements.length).toBeGreaterThan(0);

    // Should match "產品標題" part
    const titleMatch = Array.from(resultElements).find(element =>
      element.textContent.includes('lang_key_product_title')
    );
    expect(titleMatch).toBeTruthy();
  });

  test('Element picker handles selection failure gracefully', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Mock element selection failure
    mockChrome.tabs.sendMessage
      .mockResolvedValueOnce({ success: true }) // Picker activation
      .mockResolvedValueOnce({ // Selection failure
        success: false,
        error: 'No text content found in selected element'
      });

    const selectButton = document.getElementById('select-element-btn');
    selectButton.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 150));

    // Should show error message
    const statusMessage = document.getElementById('status-message');
    expect(statusMessage.textContent).toContain('無法獲取元素文字');
  });

  test('Element picker can be cancelled', async() => {
    const PopupController = require('../../src/popup/popup.js');

    // Add cancel button to DOM
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-picker-btn';
    cancelButton.textContent = '取消選取';
    cancelButton.className = 'hidden';
    document.body.appendChild(cancelButton);

    await PopupController.initialize();

    // Activate element picker
    mockChrome.tabs.sendMessage.mockResolvedValueOnce({ success: true });

    const selectButton = document.getElementById('select-element-btn');
    selectButton.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 50));

    // Cancel button should be visible
    expect(cancelButton.classList.contains('hidden')).toBe(false);

    // Mock cancellation
    mockChrome.tabs.sendMessage.mockResolvedValueOnce({ success: true });

    // Click cancel
    cancelButton.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should return to normal state
    const statusMessage = document.getElementById('status-message');
    expect(statusMessage.textContent).not.toContain('點擊頁面');
    expect(cancelButton.classList.contains('hidden')).toBe(true);
  });

  test('Element selection works with different text content types', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const testCases = [
      { text: '首頁', expectedKey: 'lang_key_nav_home' },
      { text: '常用文字內容', expectedKey: 'lang_key_common' },
      { text: '提交', expectedKey: 'lang_key_button_submit' }
    ];

    for (const testCase of testCases) {
      // Reset results
      document.getElementById('search-results').innerHTML = '';

      mockChrome.tabs.sendMessage
        .mockResolvedValueOnce({ success: true }) // Picker activation
        .mockResolvedValueOnce({ // Element selection
          success: true,
          text: testCase.text
        })
        .mockResolvedValueOnce({ // Translation data
          success: true,
          data: mockTranslationData
        });

      const selectButton = document.getElementById('select-element-btn');
      selectButton.dispatchEvent(new Event('click'));

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should find appropriate matches
      const searchResults = document.getElementById('search-results');
      const resultElements = searchResults.querySelectorAll('.search-result');

      const matchingResult = Array.from(resultElements).find(element =>
        element.textContent.includes(testCase.expectedKey)
      );

      expect(matchingResult).toBeTruthy();
    }
  });

  test('Element picker respects content script communication timeout', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Mock timeout scenario
    mockChrome.tabs.sendMessage
      .mockResolvedValueOnce({ success: true }) // Picker activation
      .mockImplementationOnce(() => new Promise(resolve => {
        // Simulate timeout - never resolve
        setTimeout(() => resolve({
          success: false,
          error: 'Timeout waiting for element selection'
        }), 5000);
      }));

    const selectButton = document.getElementById('select-element-btn');
    selectButton.dispatchEvent(new Event('click'));

    // Wait for reasonable timeout period
    await new Promise(resolve => setTimeout(resolve, 200));

    const statusMessage = document.getElementById('status-message');
    expect(statusMessage.textContent).toContain('超時' || '失敗');
  });
});