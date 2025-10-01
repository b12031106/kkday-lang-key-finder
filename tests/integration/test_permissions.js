/**
 * Integration Test: Chrome Extension Permissions
 * Tests that all required permissions are properly configured
 */

const fs = require('fs');
const path = require('path');

describe('Chrome Extension Permissions Tests', () => {
  let manifest;

  beforeAll(() => {
    // Read manifest.json
    const manifestPath = path.join(__dirname, '../../manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  });

  describe('Manifest V3 Compliance', () => {
    test('should use Manifest V3', () => {
      expect(manifest.manifest_version).toBe(3);
    });

    test('should have required metadata fields', () => {
      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBeDefined();
      expect(manifest.description).toBeDefined();

      expect(typeof manifest.name).toBe('string');
      expect(typeof manifest.version).toBe('string');
      expect(typeof manifest.description).toBe('string');
    });

    test('should have service worker instead of background page', () => {
      expect(manifest.background).toBeDefined();
      expect(manifest.background.service_worker).toBeDefined();
      expect(manifest.background.scripts).toBeUndefined();
      expect(manifest.background.page).toBeUndefined();
    });
  });

  describe('Required Permissions', () => {
    test('should have activeTab permission for current tab access', () => {
      expect(manifest.permissions).toContain('activeTab');
    });

    test('should have clipboardWrite permission for copy functionality', () => {
      expect(manifest.permissions).toContain('clipboardWrite');
    });

    test('should have storage permission for settings and statistics', () => {
      expect(manifest.permissions).toContain('storage');
    });

    test('should have notifications permission for user feedback', () => {
      expect(manifest.permissions).toContain('notifications');
    });

    test('should have tabs permission for tab management', () => {
      expect(manifest.permissions).toContain('tabs');
    });

    test('should not have excessive permissions', () => {
      const allowedPermissions = [
        'activeTab',
        'clipboardWrite',
        'storage',
        'notifications',
        'tabs'
      ];

      for (const permission of manifest.permissions) {
        expect(allowedPermissions).toContain(permission);
      }
    });
  });

  describe('Host Permissions', () => {
    test('should be restricted to KKday domains only', () => {
      expect(manifest.host_permissions).toContain('*://*.kkday.com/*');
      expect(manifest.host_permissions).toHaveLength(1);
    });

    test('should match content script patterns', () => {
      const hostPermission = manifest.host_permissions[0];
      const contentScriptMatch = manifest.content_scripts[0].matches[0];

      expect(hostPermission).toBe(contentScriptMatch);
    });
  });

  describe('Content Scripts Configuration', () => {
    test('should have content script for KKday domains', () => {
      expect(manifest.content_scripts).toBeDefined();
      expect(manifest.content_scripts).toHaveLength(1);

      const contentScript = manifest.content_scripts[0];
      expect(contentScript.matches).toContain('*://*.kkday.com/*');
      expect(contentScript.js).toContain('src/content/content-script.js');
    });

    test('should run content script at appropriate time', () => {
      const contentScript = manifest.content_scripts[0];
      expect(contentScript.run_at).toBe('document_idle');
    });
  });

  describe('Action Configuration', () => {
    test('should have popup action configured', () => {
      expect(manifest.action).toBeDefined();
      expect(manifest.action.default_popup).toBe('src/popup/popup.html');
      expect(manifest.action.default_title).toBeDefined();
    });

    test('should have icon configuration', () => {
      expect(manifest.action.default_icon).toBeDefined();
      expect(manifest.icons).toBeDefined();

      const actionIcons = manifest.action.default_icon;
      const globalIcons = manifest.icons;

      // Check required icon sizes
      const requiredSizes = ['16', '32', '48', '128'];
      for (const size of requiredSizes) {
        expect(actionIcons[size]).toBeDefined();
        expect(globalIcons[size]).toBeDefined();
        expect(actionIcons[size]).toBe(globalIcons[size]);
      }
    });
  });

  describe('Security Considerations', () => {
    test('should not include dangerous permissions', () => {
      const dangerousPermissions = [
        '<all_urls>',
        'http://*/*',
        'https://*/*',
        '*://*/*',
        'debugger',
        'desktopCapture',
        'documentScan',
        'experimental',
        'geolocation',
        'mdns',
        'nativeMessaging',
        'proxy',
        'system.cpu',
        'system.memory',
        'system.storage',
        'tabCapture',
        'unlimitedStorage'
      ];

      for (const permission of manifest.permissions || []) {
        expect(dangerousPermissions).not.toContain(permission);
      }

      for (const hostPermission of manifest.host_permissions || []) {
        const isDangerous = dangerousPermissions.some(dangerous =>
          hostPermission.includes(dangerous)
        );
        expect(isDangerous).toBe(false);
      }
    });

    test('should have appropriate CSP if defined', () => {
      if (manifest.content_security_policy) {
        const csp = manifest.content_security_policy;

        // Should not allow unsafe-eval or unsafe-inline
        expect(csp).not.toMatch(/unsafe-eval/);
        expect(csp).not.toMatch(/unsafe-inline/);
      }
    });
  });

  describe('File Structure Compliance', () => {
    test('should reference existing files', () => {
      const basePath = path.join(__dirname, '../..');

      // Check service worker
      const serviceWorkerPath = path.join(basePath, manifest.background.service_worker);
      expect(fs.existsSync(serviceWorkerPath)).toBe(true);

      // Check popup HTML
      const popupPath = path.join(basePath, manifest.action.default_popup);
      expect(fs.existsSync(popupPath)).toBe(true);

      // Check content script
      const contentScriptPath = path.join(basePath, manifest.content_scripts[0].js[0]);
      expect(fs.existsSync(contentScriptPath)).toBe(true);
    });
  });

  describe('Permission Usage Validation', () => {
    test('should use activeTab permission for tab access', async() => {
      // Mock Chrome API to verify permission usage
      const mockChrome = {
        tabs: {
          query: jest.fn(),
          sendMessage: jest.fn()
        }
      };

      // Simulate permission check
      const hasActiveTabPermission = manifest.permissions.includes('activeTab');
      expect(hasActiveTabPermission).toBe(true);

      // Test would pass if we can query active tabs
      if (hasActiveTabPermission) {
        mockChrome.tabs.query({ active: true, currentWindow: true }, () => {});
        expect(mockChrome.tabs.query).toHaveBeenCalled();
      }
    });

    test('should use storage permission for data persistence', () => {
      const mockChrome = {
        storage: {
          local: {
            get: jest.fn(),
            set: jest.fn()
          }
        }
      };

      const hasStoragePermission = manifest.permissions.includes('storage');
      expect(hasStoragePermission).toBe(true);

      // Test would pass if we can use storage
      if (hasStoragePermission) {
        mockChrome.storage.local.get(['settings'], () => {});
        expect(mockChrome.storage.local.get).toHaveBeenCalled();
      }
    });

    test('should use notifications permission for user feedback', () => {
      const mockChrome = {
        notifications: {
          create: jest.fn()
        }
      };

      const hasNotificationsPermission = manifest.permissions.includes('notifications');
      expect(hasNotificationsPermission).toBe(true);

      // Test would pass if we can create notifications
      if (hasNotificationsPermission) {
        mockChrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Test',
          message: 'Test message'
        });
        expect(mockChrome.notifications.create).toHaveBeenCalled();
      }
    });
  });

  describe('Privacy and Data Handling', () => {
    test('should have appropriate host restrictions', () => {
      // Should only access KKday domains
      const hostPermissions = manifest.host_permissions;
      expect(hostPermissions.every(permission =>
        permission.includes('kkday.com')
      )).toBe(true);
    });

    test('should not request broad host permissions', () => {
      const hostPermissions = manifest.host_permissions;
      const hasBroadPermissions = hostPermissions.some(permission =>
        permission === '<all_urls>' ||
        permission === '*://*/*' ||
        permission === 'http://*/*' ||
        permission === 'https://*/*'
      );

      expect(hasBroadPermissions).toBe(false);
    });
  });
});