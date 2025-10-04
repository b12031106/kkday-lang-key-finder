# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# kkday-lang-key-finder Development Guidelines

Last updated: 2025-10-04

## Project Overview

Chrome extension for finding i18n translation keys on KKday websites. Extracts translation data from page context and provides fuzzy search with accuracy scoring.

## Active Technologies
- JavaScript ES2022, HTML5, CSS3 (Chrome Extension Manifest V3)
- Chrome Extension APIs (tabs, scripting, storage, clipboardWrite, contextMenus)
- Fuse.js v7.0.0 for fuzzy search (browser version integrated in src/lib)
- CSS Grid Layout for modern UI
- Jest for testing, ESLint/Prettier for code quality

## Project Structure
```
src/
├── popup/                   # Extension popup UI
│   ├── popup.html          # Main popup interface
│   ├── popup.js            # Popup logic, search, UI management
│   └── popup.css           # Modern styled UI with accuracy badges
├── content/                 # Content scripts
│   ├── content-script-browser.js  # Element picker, data bridging
│   └── page-script.js      # Page context data extraction
├── background/              # Service worker
│   └── service-worker-browser.js  # Extension lifecycle, context menu
├── lib/                     # Third-party libraries
│   └── fuse.min.js         # Fuse.js browser version (26KB)
└── services/                # Shared services (unused in production)
    └── DataExtractionService.js   # Data extraction utilities

tests/
├── unit/                    # Unit tests
├── integration/             # Integration tests
└── browser/                 # Browser compatibility tests
    └── test_browser_compatibility.js

icons/                       # Extension icons
manifest.json               # Chrome extension manifest V3
```

## Commands

### Development
```bash
npm run dev           # Fix lint issues and format code
npm run build         # Run lint and all tests
```

### Testing
```bash
npm test              # Run all tests with Jest
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm test tests/browser/test_browser_compatibility.js  # Run specific test file
```

### Code Quality
```bash
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format code with Prettier
```

### Packaging
```bash
npm run package       # Create release zip for Chrome Web Store
                      # Includes: manifest.json, icons/, src/popup,
                      # src/content, src/background, src/lib
```

### Loading Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select project directory

## Code Style

### JavaScript
- ES2022 syntax
- No CommonJS (require/module.exports) - browser-native only
- Use IIFE for content scripts to avoid global pollution
- Async/await for asynchronous operations
- JSDoc comments for functions

### Browser Compatibility
- All scripts must work without Node.js modules
- Use Chrome Extension APIs directly
- No bundlers or transpilers (pure ES2022)
- Third-party libraries loaded as browser globals (e.g., Fuse.js via <script>)

### Key Patterns

1. **Event Handler Binding**: Pre-bind handlers in constructor to maintain consistent function references
   ```javascript
   this.boundHandleClick = this.handleClick.bind(this);
   document.addEventListener('click', this.boundHandleClick);
   ```

2. **Data Sanitization**: Deep clean objects before postMessage
   ```javascript
   sanitizeData(obj, maxDepth = 10, currentDepth = 0)
   ```

3. **Fuzzy Search with Fuse.js**:
   - Uses Fuse.js v7.0.0 for intelligent fuzzy matching
   - Configuration: threshold 0.3, val weight 0.7, key weight 0.3
   - Prioritizes translation text (val) over keys for user-friendly search
   - Score inverted for display (1.0 = best match)

4. **Accuracy Color Coding**:
   - ≥90%: Green (#10b981)
   - 70-89%: Orange (#f59e0b)
   - <70%: Blue (#3b82f6)

## Architecture Principles

1. **Multi-layer isolation**:
   - Popup (extension context)
   - Content Script (isolated context)
   - Page Script (page context with global access)

2. **Communication flow**:
   - Popup ↔ Content Script: `chrome.tabs.sendMessage`
   - Content Script ↔ Page Script: `window.postMessage`

3. **No console.log in production**: All debug logs removed for clean production code

## Recent Changes

### 2025-10-05: Fuse.js integration and context menu
- ✅ Integrated Fuse.js v7.0.0 for advanced fuzzy search
- ✅ Added right-click context menu search functionality
- ✅ Configured optimal search weights (val: 0.7, key: 0.3)
- ✅ Fixed service worker context menu listener persistence
- ✅ Implemented dynamic content script injection for context menu
- ✅ Updated packaging to include src/lib/fuse.min.js

### 2025-10-01: Production-ready release
- ✅ Removed all console.log statements (107 lines cleaned)
- ✅ Removed unused footer component
- ✅ Implemented accuracy scoring system with color-coded badges
- ✅ Enhanced element picker with smart notification positioning
- ✅ Fixed event handler binding issues (ESC key, second click)
- ✅ Improved UI with grid layout and visual hierarchy
- ✅ Added empty state handling
- ✅ Fixed DataCloneError with deep object sanitization

### 2025-09-22: Initial implementation
- Added Chrome Extension Manifest V3 structure
- Implemented fuzzy search functionality
- Created element picker feature

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->