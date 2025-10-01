/**
 * Integration Test: Manual Text Search Scenario
 * Tests the complete user flow for manually searching translation keys
 * Based on Scenario 1 from quickstart.md
 */

describe('Manual Text Search Integration', () => {
  let mockChrome;
  let mockTranslationData;

  beforeEach(() => {
    // Setup mock translation data
    mockTranslationData = [
      { key: 'lang_key_common', val: '常用文字' },
      { key: 'lang_key_button_submit', val: '提交按鈕' },
      { key: 'lang_key_error_message', val: '錯誤訊息' },
      { key: 'lang_key_title', val: '頁面標題' }
    ];

    // Mock Chrome APIs
    mockChrome = {
      tabs: {
        query: jest.fn().mockResolvedValue([{
          url: 'https://zh-tw.kkday.com/product/12345',
          id: 1
        }]),
        sendMessage: jest.fn().mockResolvedValue({
          success: true,
          data: mockTranslationData
        })
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

    // Mock DOM
    document.body.innerHTML = `
      <div id="search-container">
        <input id="search-input" type="text" placeholder="輸入要搜尋的文字" />
        <div id="search-results"></div>
        <div id="notification" class="hidden"></div>
      </div>
    `;
  });

  test('Complete manual search flow: input text → search → display results → copy key', async() => {
    // Import modules (these will fail until implemented)
    const PopupController = require('../../src/popup/popup.js');
    const SearchService = require('../../src/services/SearchService.js');

    // Step 1: Initialize popup (equivalent to clicking extension icon)
    await PopupController.initialize();

    // Verify popup shows search interface
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    expect(searchInput).toBeTruthy();
    expect(searchResults).toBeTruthy();

    // Step 2: User types "常用文字" in search input
    const searchQuery = '常用文字';
    searchInput.value = searchQuery;

    // Trigger search (simulate input event)
    const inputEvent = new Event('input');
    searchInput.dispatchEvent(inputEvent);

    // Allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 3: Verify search results appear with matching translation keys
    const resultElements = searchResults.querySelectorAll('.search-result');
    expect(resultElements.length).toBeGreaterThan(0);

    // Verify results are ranked by relevance
    const firstResult = resultElements[0];
    expect(firstResult.textContent).toContain('lang_key_common');
    expect(firstResult.textContent).toContain('常用文字');

    // Step 4: User clicks on a result item
    const clickEvent = new Event('click');
    firstResult.dispatchEvent(clickEvent);

    // Allow clipboard operation to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 5: Verify translation key is copied to clipboard
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('lang_key_common');

    // Step 6: Verify success notification appears
    const notification = document.getElementById('notification');
    expect(notification.classList.contains('hidden')).toBe(false);
    expect(notification.textContent).toContain('複製成功');
  });

  test('Search with partial matches shows ranked results', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // Search for partial text
    searchInput.value = '文字';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const resultElements = searchResults.querySelectorAll('.search-result');

    // Should find multiple results containing "文字"
    expect(resultElements.length).toBeGreaterThan(0);

    // Verify each result contains the search term in value
    Array.from(resultElements).forEach(element => {
      const resultText = element.querySelector('.result-value').textContent;
      expect(resultText).toContain('文字');
    });

    // Verify results show both key and value
    const firstResult = resultElements[0];
    expect(firstResult.querySelector('.result-key')).toBeTruthy();
    expect(firstResult.querySelector('.result-value')).toBeTruthy();
  });

  test('Search with no matches shows appropriate message', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // Search for text that won't match anything
    searchInput.value = 'xyz123notfound';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show "no results" message
    expect(searchResults.textContent).toContain('找不到相關結果');
  });

  test('Handles clipboard copy failure gracefully', async() => {
    // Mock clipboard failure
    navigator.clipboard.writeText = jest.fn().mockRejectedValue(
      new Error('Clipboard access denied')
    );

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const searchInput = document.getElementById('search-input');
    searchInput.value = '常用文字';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const firstResult = document.querySelector('.search-result');
    firstResult.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should show error notification
    const notification = document.getElementById('notification');
    expect(notification.textContent).toContain('複製失敗');
  });

  test('Search performance meets requirements (<100ms)', async() => {
    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const searchInput = document.getElementById('search-input');

    const startTime = performance.now();

    searchInput.value = '常用';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    // Search should complete within 100ms
    expect(searchTime).toBeLessThan(100);
  });
});