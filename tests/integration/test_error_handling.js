/**
 * Integration Test: Error Handling Scenario
 * Tests graceful handling of error conditions
 * Based on Scenario 5 from quickstart.md
 */

describe('Error Handling Integration', () => {
  let mockChrome;

  beforeEach(() => {
    // Mock Chrome APIs
    mockChrome = {
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn()
      }
    };

    global.chrome = mockChrome;

    // Mock popup DOM
    document.body.innerHTML = `
      <div id="popup-container">
        <div id="error-message" class="hidden"></div>
        <div id="main-interface" class="hidden">
          <input id="search-input" type="text" />
          <button id="select-element-btn">選取元素</button>
          <div id="search-results"></div>
        </div>
        <div id="loading"></div>
        <div id="status-message"></div>
      </div>
    `;
  });

  test('Extension shows error when i18n data is not available', async() => {
    // Mock KKday page without i18n data
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    // Mock content script unable to access global variables
    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: false,
      error: 'Cannot access __NUXT__ or __INIT_STATE__ variables'
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Should show appropriate error message
    const errorMessage = document.getElementById('error-message');
    const mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(mainInterface.classList.contains('hidden')).toBe(true);

    expect(errorMessage.textContent).toContain('找不到資料');
    expect(errorMessage.textContent).toContain('i18n');
  });

  test('Search functionality is disabled when data is unavailable', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: false,
      error: 'Translation data not found'
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Main interface should be disabled
    const searchInput = document.getElementById('search-input');
    const selectButton = document.getElementById('select-element-btn');

    expect(searchInput.closest('#main-interface').classList.contains('hidden')).toBe(true);
    expect(selectButton.closest('#main-interface').classList.contains('hidden')).toBe(true);
  });

  test('Extension recovers when conditions improve', async() => {
    const PopupController = require('../../src/popup/popup.js');

    // Start with no data available
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: false,
      error: 'Data not available'
    });

    await PopupController.initialize();

    // Should show error
    let errorMessage = document.getElementById('error-message');
    let mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(mainInterface.classList.contains('hidden')).toBe(true);

    // Simulate data becoming available (e.g., page reload)
    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: [
        { key: 'lang_key_test', val: '測試資料' }
      ]
    });

    // Reinitialize popup (simulate popup reopening)
    await PopupController.initialize();

    // Should now show main interface
    errorMessage = document.getElementById('error-message');
    mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(true);
    expect(mainInterface.classList.contains('hidden')).toBe(false);
  });

  test('Handles content script communication errors', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    // Mock content script communication failure
    mockChrome.tabs.sendMessage.mockRejectedValue(
      new Error('Could not establish connection')
    );

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const errorMessage = document.getElementById('error-message');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(errorMessage.textContent).toContain('無法連接到頁面');
  });

  test('Handles malformed translation data gracefully', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    // Mock malformed data response
    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: [
        { key: 'valid_key', val: '正確資料' },
        { invalidKey: 'missing_val' }, // Missing required fields
        { key: '', val: '空鍵值' }, // Empty key
        { key: 'no_val' }, // Missing val
        null, // Null entry
        undefined // Undefined entry
      ]
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Should filter out invalid entries and show valid ones
    const statusMessage = document.getElementById('status-message');
    expect(statusMessage.textContent).toContain('1 個有效項目');

    // Search should work with valid data only
    const searchInput = document.getElementById('search-input');
    searchInput.value = '正確';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const searchResults = document.getElementById('search-results');
    const resultElements = searchResults.querySelectorAll('.search-result');

    // Should find the one valid entry
    expect(resultElements.length).toBe(1);
    expect(resultElements[0].textContent).toContain('valid_key');
  });

  test('Handles search service errors', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: [{ key: 'test_key', val: '測試' }]
    });

    // Mock search service failure
    const SearchService = require('../../src/services/SearchService.js');
    SearchService.search = jest.fn().mockImplementation(() => {
      throw new Error('Search service unavailable');
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const searchInput = document.getElementById('search-input');
    searchInput.value = '測試';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show search error
    const searchResults = document.getElementById('search-results');
    expect(searchResults.textContent).toContain('搜尋失敗');
  });

  test('Handles clipboard API unavailability', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: [{ key: 'test_key', val: '測試' }]
    });

    // Mock clipboard API not available
    delete navigator.clipboard;

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Perform search
    const searchInput = document.getElementById('search-input');
    searchInput.value = '測試';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 100));

    // Try to copy result
    const firstResult = document.querySelector('.search-result');
    firstResult.dispatchEvent(new Event('click'));

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should show clipboard unavailable error
    const statusMessage = document.getElementById('status-message');
    expect(statusMessage.textContent).toContain('剪貼簿功能不可用');
  });

  test('Handles Chrome extension context invalidation', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    // Mock extension context invalidated
    mockChrome.runtime.sendMessage.mockImplementation(() => {
      throw new Error('Extension context invalidated');
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const errorMessage = document.getElementById('error-message');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(errorMessage.textContent).toContain('擴充功能需要重新載入');
  });

  test('Shows appropriate error for blocked console access', async() => {
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    // Mock blocked console access error
    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: false,
      error: 'Cannot access page globals - console may be blocked'
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    const errorMessage = document.getElementById('error-message');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(errorMessage.textContent).toContain('頁面限制');
    expect(errorMessage.textContent).toContain('開發者工具');
  });

  test('Error messages are user-friendly and actionable', async() => {
    const errorScenarios = [
      {
        error: 'Cannot access __NUXT__',
        expectedMessage: '無法存取翻譯資料',
        expectedAction: '請重新整理頁面'
      },
      {
        error: 'Network timeout',
        expectedMessage: '網路連線逾時',
        expectedAction: '請檢查網路連線'
      },
      {
        error: 'Permission denied',
        expectedMessage: '權限不足',
        expectedAction: '請檢查擴充功能設定'
      }
    ];

    for (const scenario of errorScenarios) {
      // Reset DOM
      document.getElementById('error-message').classList.add('hidden');
      document.getElementById('error-message').textContent = '';

      mockChrome.tabs.query.mockResolvedValue([{
        url: 'https://zh-tw.kkday.com/product/12345',
        id: 1
      }]);

      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: false,
        error: scenario.error
      });

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      const errorMessage = document.getElementById('error-message');
      expect(errorMessage.textContent).toContain(scenario.expectedMessage);
      expect(errorMessage.textContent).toContain(scenario.expectedAction);
    }
  });
});