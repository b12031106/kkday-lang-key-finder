# Research: Chrome Extension I18n Key Lookup

## Chrome Extension Manifest V3

**Decision**: Use Chrome Extension Manifest V3 with content scripts and popup UI
**Rationale**:
- Manifest V3 is the current standard for Chrome extensions
- Content scripts can access page's global variables (__NUXT__, __INIT_STATE__)
- Service workers provide background functionality
- Popup provides user interface for search functionality

**Alternatives considered**:
- Manifest V2: Deprecated and being phased out
- Bookmarklet: Limited access to page variables and poor UX
- Web app: Cannot access page context directly

## Fuzzy Search Implementation

**Decision**: Use Fuse.js library for fuzzy search functionality
**Rationale**:
- Lightweight and well-maintained
- Excellent fuzzy matching algorithms
- Customizable search options (threshold, keys, etc.)
- Good performance for small to medium datasets

**Alternatives considered**:
- Native JavaScript string matching: Too basic for fuzzy search
- Lunr.js: Overkill for simple fuzzy matching
- Custom implementation: Unnecessary reinvention

## Extension Architecture

**Decision**: Use popup + content script architecture
**Rationale**:
- Popup provides clean UI separated from page content
- Content scripts can access page global variables
- Message passing enables communication between components
- Clear separation of concerns

**Alternatives considered**:
- Injected overlay: More intrusive to page layout
- Sidebar extension: Limited browser support
- DevTools panel: Less accessible for regular use

## Global Variable Access

**Decision**: Direct access to __NUXT__ and __INIT_STATE__ via content scripts
**Rationale**:
- Content scripts run in page context with access to global variables
- Synchronous access to data without API calls
- Real-time data reflects current page state

**Alternatives considered**:
- DOM parsing: Unreliable and fragile
- Network interception: Complex and unnecessary
- Background scraping: Poor performance and reliability

## UI Framework

**Decision**: Vanilla JavaScript with minimal CSS for popup interface
**Rationale**:
- Keeps extension lightweight
- Fast loading and minimal dependencies
- Easy to maintain and debug
- Good performance for simple UI

**Alternatives considered**:
- React: Overkill for simple popup interface
- Vue.js: Unnecessary complexity and bundle size
- Web Components: Good option but vanilla JS simpler

## Testing Strategy

**Decision**: Jest for unit tests, Chrome extension testing utilities for integration
**Rationale**:
- Jest provides excellent testing utilities for JavaScript
- Chrome extension testing tools for popup and content script testing
- Mock capabilities for Chrome API testing

**Alternatives considered**:
- Mocha/Chai: Similar capabilities but Jest more integrated
- Cypress: Better for E2E but complex setup for extensions
- Manual testing only: Insufficient for reliable development