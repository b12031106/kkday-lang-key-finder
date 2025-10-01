# lang-key-finder Development Guidelines

Last updated: 2025-10-01

## Project Overview

Chrome extension for finding i18n translation keys on KKday websites. Extracts translation data from page context and provides fuzzy search with accuracy scoring.

## Active Technologies
- JavaScript ES2022, HTML5, CSS3 (Chrome Extension Manifest V3)
- Chrome Extension APIs (tabs, scripting, storage, clipboardWrite, contextMenus)
- Inline fuzzy search algorithm (no external dependencies)
- CSS Grid Layout for modern UI

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
│   └── service-worker-browser.js  # Extension lifecycle management
└── services/                # Shared services
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
```bash
npm test              # Run all tests
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix lint issues
```

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

3. **Fuzzy Search Scoring**:
   - Exact match: 100%
   - Starts with: 80%
   - Contains: 40-60% (length ratio)

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