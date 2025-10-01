# Quickstart: Chrome Extension I18n Key Lookup

## Overview
This quickstart guide validates the core user scenarios for the Chrome Extension that helps developers find i18n translation keys on KKday websites.

## Prerequisites
- Chrome browser with extension installed
- Access to a KKday website (*.kkday.com)
- Page with available i18n data (__NUXT__ or __INIT_STATE__ global variables)

## Test Scenarios

### Scenario 1: Manual Text Search
**Objective**: Verify users can search for translation keys by typing text

**Steps**:
1. Navigate to any KKday website (e.g., `zh-tw.kkday.com/product/12345`)
2. Click the extension icon in Chrome toolbar
3. Verify popup opens with search interface
4. Type "常用文字" in the search input field
5. Verify search results appear with matching translation keys
6. Click on a result item
7. Verify the translation key is copied to clipboard
8. Verify success notification appears

**Expected Results**:
- Extension popup displays without errors
- Search returns relevant results ranked by relevance
- Clipboard contains the selected translation key
- User receives visual feedback on successful copy

### Scenario 2: Element Selection Search
**Objective**: Verify users can search by selecting page elements

**Steps**:
1. Navigate to any KKday website with visible text
2. Click the extension icon to open popup
3. Click the "Select Element" button
4. Click on any text element on the page
5. Verify the element's text is automatically searched
6. Verify search results appear for the selected text
7. Click on a result to copy the key
8. Verify clipboard copy and success notification

**Expected Results**:
- Element picker mode activates successfully
- Clicked element text is extracted correctly
- Search automatically executes with element text
- Results display matching translation keys
- Copy functionality works as expected

### Scenario 3: Domain Validation
**Objective**: Verify extension only works on KKday domains

**Steps**:
1. Navigate to a non-KKday website (e.g., `google.com`)
2. Click the extension icon
3. Verify appropriate error message displays
4. Verify search and element selection features are disabled
5. Navigate to a KKday domain
6. Verify extension functionality returns

**Expected Results**:
- Clear error message on non-KKday domains
- All interactive features disabled appropriately
- Extension reactivates on valid domains

### Scenario 4: Data Source Selection
**Objective**: Verify correct data extraction based on URL patterns

**Steps**:
1. Navigate to product page: `/{lang}/product/12345`
2. Open extension and verify it extracts from `__NUXT__.state['$si18n_zh-tw']`
3. Navigate to non-product page: `/help/contact`
4. Verify extension extracts from `__INIT_STATE__.lang`
5. Search for known translations on both page types
6. Verify search results are appropriate for each data source

**Expected Results**:
- Correct data source selected based on URL pattern
- Search results match the expected data source
- No errors during data extraction

### Scenario 5: Error Handling
**Objective**: Verify graceful handling of error conditions

**Steps**:
1. Navigate to KKday page without i18n data (blocked console access)
2. Open extension
3. Verify appropriate error message displays
4. Try to search - verify search is disabled
5. Navigate to page with data
6. Verify extension recovers and functions normally

**Expected Results**:
- Clear error messages for missing data
- Graceful degradation of functionality
- Recovery when conditions improve

## Performance Validation

### Search Response Time
**Test**: Search with 50+ translation entries
**Target**: <100ms response time
**Method**: Browser DevTools performance measurement

### Memory Usage
**Test**: Extension running with large dataset
**Target**: <5MB memory usage
**Method**: Chrome Task Manager monitoring

## Acceptance Criteria
- [ ] All 5 test scenarios pass completely
- [ ] Performance targets are met
- [ ] No console errors during normal operation
- [ ] Extension works across different KKday page types
- [ ] User feedback is clear and helpful