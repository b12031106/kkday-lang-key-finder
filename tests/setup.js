/**
 * Jest setup file for Chrome extension testing
 */

// Mock Chrome APIs manually
global.chrome = {
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Mock DOM APIs that might not be available in test environment
global.performance = global.performance || {
  now: jest.fn(() => Date.now())
};

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve())
  },
  writable: true
});

// Mock window.location
delete window.location;
window.location = {
  hostname: 'zh-tw.kkday.com',
  pathname: '/zh-tw/product/12345',
  href: 'https://zh-tw.kkday.com/zh-tw/product/12345'
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset location to default KKday product page
  Object.defineProperty(window, 'location', {
    value: {
      hostname: 'zh-tw.kkday.com',
      pathname: '/zh-tw/product/12345',
      href: 'https://zh-tw.kkday.com/zh-tw/product/12345'
    },
    writable: true,
    configurable: true
  });
});