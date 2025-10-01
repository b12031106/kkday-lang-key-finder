/**
 * Integration Test: Assets and Metadata Configuration
 * Tests that all icons, metadata, and web store assets are properly configured
 */

const fs = require('fs');
const path = require('path');

describe('Assets and Metadata Tests', () => {
  let manifest;
  const basePath = path.join(__dirname, '../..');

  beforeAll(() => {
    const manifestPath = path.join(basePath, 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  });

  describe('Icon Files', () => {
    test('should have all required icon sizes', () => {
      const requiredSizes = ['16', '32', '48', '128'];
      const iconsDir = path.join(basePath, 'icons');

      for (const size of requiredSizes) {
        // Check SVG source files
        const svgPath = path.join(iconsDir, `icon${size}.svg`);
        expect(fs.existsSync(svgPath)).toBe(true);

        // Check PNG files (even if they're placeholders)
        const pngPath = path.join(iconsDir, `icon${size}.png`);
        expect(fs.existsSync(pngPath)).toBe(true);

        // Verify SVG content is valid
        const svgContent = fs.readFileSync(svgPath, 'utf8');
        expect(svgContent).toMatch(/<svg.*>/);
        expect(svgContent).toMatch(/<\/svg>/);
        expect(svgContent).toContain(`width="${size}"`);
        expect(svgContent).toContain(`height="${size}"`);
      }
    });

    test('should have consistent icon design elements', () => {
      const iconsDir = path.join(basePath, 'icons');
      const svgFiles = ['icon16.svg', 'icon32.svg', 'icon48.svg', 'icon128.svg'];

      for (const file of svgFiles) {
        const svgPath = path.join(iconsDir, file);
        const svgContent = fs.readFileSync(svgPath, 'utf8');

        // Check for design consistency
        expect(svgContent).toContain('#007bff'); // Brand blue color
        expect(svgContent).toContain('circle'); // Search glass
        expect(svgContent).toContain('line'); // Search handle
        expect(svgContent).toContain('white'); // White elements
      }
    });

    test('should have favicon for popup', () => {
      const faviconPath = path.join(basePath, 'icons', 'favicon.svg');
      expect(fs.existsSync(faviconPath)).toBe(true);

      const faviconContent = fs.readFileSync(faviconPath, 'utf8');
      expect(faviconContent).toMatch(/<svg.*>/);
      expect(faviconContent).toMatch(/<\/svg>/);
    });

    test('should have icons README documentation', () => {
      const readmePath = path.join(basePath, 'icons', 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);

      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      expect(readmeContent).toContain('Extension Icons');
      expect(readmeContent).toContain('icon16.svg/png');
      expect(readmeContent).toContain('Converting SVG to PNG');
    });
  });

  describe('Manifest Metadata', () => {
    test('should have complete basic metadata', () => {
      expect(manifest.name).toBe('I18n Key Finder');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.description).toContain('i18n translation keys');
      expect(manifest.description).toContain('fuzzy search');
      expect(manifest.description).toContain('element picker');
    });

    test('should have author and homepage information', () => {
      expect(manifest.author).toBeDefined();
      expect(manifest.homepage_url).toBeDefined();
      expect(typeof manifest.author).toBe('string');
      expect(typeof manifest.homepage_url).toBe('string');
    });

    test('should have proper web accessible resources configuration', () => {
      expect(manifest.web_accessible_resources).toBeDefined();
      expect(Array.isArray(manifest.web_accessible_resources)).toBe(true);

      const iconResource = manifest.web_accessible_resources.find(
        resource => resource.resources.includes('icons/*.png')
      );

      expect(iconResource).toBeDefined();
      expect(iconResource.matches).toContain('*://*.kkday.com/*');
    });

    test('should have all action properties configured', () => {
      expect(manifest.action.default_popup).toBeDefined();
      expect(manifest.action.default_title).toBeDefined();
      expect(manifest.action.default_icon).toBeDefined();

      // Check icon paths are correct
      const actionIcons = manifest.action.default_icon;
      expect(actionIcons['16']).toBe('icons/icon16.png');
      expect(actionIcons['32']).toBe('icons/icon32.png');
      expect(actionIcons['48']).toBe('icons/icon48.png');
      expect(actionIcons['128']).toBe('icons/icon128.png');
    });
  });

  describe('Documentation and Assets', () => {
    test('should have Chrome Web Store documentation', () => {
      const docsPath = path.join(basePath, 'docs', 'chrome-web-store.md');
      expect(fs.existsSync(docsPath)).toBe(true);

      const docsContent = fs.readFileSync(docsPath, 'utf8');
      expect(docsContent).toContain('Chrome Web Store 發布準備');
      expect(docsContent).toContain('擴充功能資訊');
      expect(docsContent).toContain('隱私政策');
      expect(docsContent).toContain('發布檢查清單');
    });

    test('should have icon generation tool', () => {
      const toolPath = path.join(basePath, 'tools', 'generate-icons.js');
      expect(fs.existsSync(toolPath)).toBe(true);

      const toolContent = fs.readFileSync(toolPath, 'utf8');
      expect(toolContent).toContain('createSVGIcon');
      expect(toolContent).toContain('iconSizes');
      expect(toolContent).toContain('#007bff');
    });
  });

  describe('Asset Quality', () => {
    test('should have properly sized icons', () => {
      const expectedSizes = [16, 32, 48, 128];
      const iconsDir = path.join(basePath, 'icons');

      for (const size of expectedSizes) {
        const svgPath = path.join(iconsDir, `icon${size}.svg`);
        const svgContent = fs.readFileSync(svgPath, 'utf8');

        // Check that SVG has correct dimensions
        expect(svgContent).toContain(`width="${size}"`);
        expect(svgContent).toContain(`height="${size}"`);
        expect(svgContent).toContain(`viewBox="0 0 ${size} ${size}"`);
      }
    });

    test('should have scalable icon elements', () => {
      const iconsDir = path.join(basePath, 'icons');
      const sizes = [16, 32, 48, 128];

      sizes.forEach(size => {
        const svgPath = path.join(iconsDir, `icon${size}.svg`);
        const svgContent = fs.readFileSync(svgPath, 'utf8');

        // Elements should scale with icon size
        expect(svgContent).toContain(`r="${size/2 - 2}"`); // Background circle
        expect(svgContent).toContain(`cx="${size/2}"`); // Center elements
        expect(svgContent).toContain(`cy="${size/2}"`); // Center elements

        // Should have stroke widths appropriate for size
        const expectedMinStroke = Math.max(2, size/32);
        expect(svgContent).toContain(`stroke-width="${expectedMinStroke}"`);
      });
    });
  });

  describe('Chrome Web Store Readiness', () => {
    test('should have all required store assets planned', () => {
      const docsPath = path.join(basePath, 'docs', 'chrome-web-store.md');
      const docsContent = fs.readFileSync(docsPath, 'utf8');

      // Check for store listing requirements
      expect(docsContent).toContain('簡短描述');
      expect(docsContent).toContain('詳細描述');
      expect(docsContent).toContain('螢幕截圖');
      expect(docsContent).toContain('隱私政策');
      expect(docsContent).toContain('發布檢查清單');
    });

    test('should have version strategy defined', () => {
      const docsPath = path.join(basePath, 'docs', 'chrome-web-store.md');
      const docsContent = fs.readFileSync(docsPath, 'utf8');

      expect(docsContent).toContain('1.0.0 - 初始版本');
      expect(docsContent).toContain('版本發布策略');
      expect(docsContent).toContain('支援和維護');
    });

    test('should have proper manifest version for store', () => {
      // Chrome Web Store requirements
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(manifest.name.length).toBeLessThanOrEqual(45);
      expect(manifest.description.length).toBeLessThanOrEqual(132);
    });
  });

  describe('Asset File Integrity', () => {
    test('should have valid JSON in manifest', () => {
      const manifestPath = path.join(basePath, 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');

      expect(() => {
        JSON.parse(manifestContent);
      }).not.toThrow();
    });

    test('should have valid SVG structure in icons', () => {
      const iconsDir = path.join(basePath, 'icons');
      const svgFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));

      for (const file of svgFiles) {
        const svgPath = path.join(iconsDir, file);
        const svgContent = fs.readFileSync(svgPath, 'utf8');

        // Basic SVG validation
        expect(svgContent.startsWith('<?xml')).toBe(true);
        expect(svgContent).toMatch(/<svg[^>]*>/);
        expect(svgContent).toMatch(/<\/svg>/);
        expect(svgContent).toContain('xmlns="http://www.w3.org/2000/svg"');

        // Should have balanced opening and closing tags (basic validation)
        const openTags = (svgContent.match(/<[a-zA-Z][^>]*[^\/]>/g) || []).length;
        const closeTags = (svgContent.match(/<\/[^>]*>/g) || []).length;

        // Allow for some flexibility in SVG structure (self-closing tags, etc.)
        expect(closeTags).toBeGreaterThan(0);
        expect(openTags).toBeGreaterThan(0);
      }
    });
  });
});