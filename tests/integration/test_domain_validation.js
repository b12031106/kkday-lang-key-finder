/**
 * Integration Test: Domain Validation Scenario
 * Tests extension behavior on KKday vs non-KKday domains
 * Based on Scenario 3 from quickstart.md
 */

describe('Domain Validation Integration', () => {
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
      </div>
    `;
  });

  test('Extension shows error message on non-KKday domain', async() => {
    // Mock non-KKday domain
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://google.com/search?q=test',
      id: 1
    }]);

    const PopupController = require('../../src/popup/popup.js');

    // Initialize popup
    await PopupController.initialize();

    // Should show error message
    const errorMessage = document.getElementById('error-message');
    const mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(mainInterface.classList.contains('hidden')).toBe(true);

    expect(errorMessage.textContent).toContain('不是目標網頁');
    expect(errorMessage.textContent).toContain('KKday');
  });

  test('Extension disables search and element selection on non-KKday domain', async() => {
    // Mock non-KKday domain
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://example.com',
      id: 1
    }]);

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Main interface should be hidden
    const searchInput = document.getElementById('search-input');
    const selectButton = document.getElementById('select-element-btn');

    expect(searchInput.closest('#main-interface').classList.contains('hidden')).toBe(true);
    expect(selectButton.closest('#main-interface').classList.contains('hidden')).toBe(true);
  });

  test('Extension activates functionality on valid KKday domain', async() => {
    // Mock KKday domain with data
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: [
        { key: 'lang_key_test', val: '測試文字' }
      ]
    });

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Should show main interface
    const errorMessage = document.getElementById('error-message');
    const mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(true);
    expect(mainInterface.classList.contains('hidden')).toBe(false);

    // Interface elements should be functional
    const searchInput = document.getElementById('search-input');
    const selectButton = document.getElementById('select-element-btn');

    expect(searchInput.disabled).toBe(false);
    expect(selectButton.disabled).toBe(false);
  });

  test('Extension handles subdomain variations of KKday', async() => {
    const kkdayDomains = [
      'https://www.kkday.com/en/product/12345',
      'https://zh-tw.kkday.com/product/67890',
      'https://ja.kkday.com/activity/11111',
      'https://ko.kkday.com/tour/22222',
      'https://th.kkday.com/package/33333'
    ];

    for (const domain of kkdayDomains) {
      // Reset DOM
      document.getElementById('error-message').classList.add('hidden');
      document.getElementById('main-interface').classList.add('hidden');

      mockChrome.tabs.query.mockResolvedValue([{
        url: domain,
        id: 1
      }]);

      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: [{ key: 'test', val: 'test' }]
      });

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      // Should activate for all KKday subdomains
      const errorMessage = document.getElementById('error-message');
      const mainInterface = document.getElementById('main-interface');

      expect(errorMessage.classList.contains('hidden')).toBe(true);
      expect(mainInterface.classList.contains('hidden')).toBe(false);
    }
  });

  test('Extension rejects similar but non-KKday domains', async() => {
    const nonKKdayDomains = [
      'https://kkday-fake.com/product/123',
      'https://fakekkday.com/test',
      'https://kkday.co.uk/product/456', // Wrong TLD
      'https://subdomain.kkday.evil.com/hack'
    ];

    for (const domain of nonKKdayDomains) {
      // Reset DOM
      document.getElementById('error-message').classList.add('hidden');
      document.getElementById('main-interface').classList.add('hidden');

      mockChrome.tabs.query.mockResolvedValue([{
        url: domain,
        id: 1
      }]);

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      // Should show error for fake domains
      const errorMessage = document.getElementById('error-message');
      const mainInterface = document.getElementById('main-interface');

      expect(errorMessage.classList.contains('hidden')).toBe(false);
      expect(mainInterface.classList.contains('hidden')).toBe(true);
    }
  });

  test('Extension recovers when navigating from non-KKday to KKday domain', async() => {
    const PopupController = require('../../src/popup/popup.js');

    // Start on non-KKday domain
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://google.com',
      id: 1
    }]);

    await PopupController.initialize();

    // Should show error
    let errorMessage = document.getElementById('error-message');
    let mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(mainInterface.classList.contains('hidden')).toBe(true);

    // Simulate navigation to KKday domain (popup reinitialization)
    mockChrome.tabs.query.mockResolvedValue([{
      url: 'https://zh-tw.kkday.com/product/12345',
      id: 1
    }]);

    mockChrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: [{ key: 'test', val: 'test' }]
    });

    // Reinitialize popup
    await PopupController.initialize();

    // Should now show main interface
    errorMessage = document.getElementById('error-message');
    mainInterface = document.getElementById('main-interface');

    expect(errorMessage.classList.contains('hidden')).toBe(true);
    expect(mainInterface.classList.contains('hidden')).toBe(false);
  });

  test('Extension handles tab query failures gracefully', async() => {
    // Mock tab query failure
    mockChrome.tabs.query.mockRejectedValue(new Error('No active tab'));

    const PopupController = require('../../src/popup/popup.js');

    await PopupController.initialize();

    // Should show appropriate error message
    const errorMessage = document.getElementById('error-message');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(errorMessage.textContent).toContain('無法獲取當前頁面資訊');
  });

  test('Domain validation is case-insensitive', async() => {
    const caseDomains = [
      'https://ZH-TW.KKDAY.COM/product/123',
      'https://zh-tw.KKDay.com/product/456',
      'https://WWW.KKDAY.COM/en/activity/789'
    ];

    for (const domain of caseDomains) {
      // Reset DOM
      document.getElementById('error-message').classList.add('hidden');
      document.getElementById('main-interface').classList.add('hidden');

      mockChrome.tabs.query.mockResolvedValue([{
        url: domain,
        id: 1
      }]);

      mockChrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: [{ key: 'test', val: 'test' }]
      });

      const PopupController = require('../../src/popup/popup.js');

      await PopupController.initialize();

      // Should work regardless of case
      const errorMessage = document.getElementById('error-message');
      const mainInterface = document.getElementById('main-interface');

      expect(errorMessage.classList.contains('hidden')).toBe(true);
      expect(mainInterface.classList.contains('hidden')).toBe(false);
    }
  });
});