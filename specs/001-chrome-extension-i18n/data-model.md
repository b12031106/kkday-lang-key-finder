# Data Model: Chrome Extension I18n Key Lookup

## Core Entities

### TranslationEntry
**Purpose**: Represents a single translation key-value pair extracted from page global variables

**Fields**:
- `key: string` - The translation identifier (e.g., "lang_key_common")
- `val: string` - The translated text value (e.g., "常用文字")

**Validation Rules**:
- `key` must be non-empty string
- `val` must be non-empty string
- Both fields are required

**Relationships**: None (simple data structure)

### SearchResult
**Purpose**: Represents a search match with relevance scoring from Fuse.js

**Fields**:
- `item: TranslationEntry` - The matched translation entry
- `score: number` - Relevance score from fuzzy search (0 = perfect match, 1 = no match)
- `refIndex: number` - Original index in the search dataset

**Validation Rules**:
- `item` must be valid TranslationEntry
- `score` must be between 0 and 1
- `refIndex` must be non-negative integer

**Relationships**: Contains one TranslationEntry

### PageContext
**Purpose**: Captures current page information for determining data extraction strategy

**Fields**:
- `domain: string` - Current page domain
- `pathname: string` - Current page path
- `isKKdayDomain: boolean` - Whether domain matches *.kkday.com
- `isProductPage: boolean` - Whether URL matches /{lang}/product/[numbers] pattern
- `language: string` - Detected language code from URL path

**Validation Rules**:
- `domain` must be valid domain format
- `pathname` must start with "/"
- `isKKdayDomain` derived from domain validation
- `isProductPage` derived from pathname pattern matching
- `language` extracted from pathname or default to empty

**State Transitions**:
- Initial → Domain Validated → Data Source Determined → Ready for Search

### ExtensionState
**Purpose**: Manages overall extension state and user interactions

**Fields**:
- `isActive: boolean` - Whether extension functionality is enabled
- `dataSource: TranslationEntry[]` - Current translation data array
- `searchQuery: string` - Current search input
- `searchResults: SearchResult[]` - Current search results
- `isElementPickerActive: boolean` - Whether element selection mode is active
- `errorMessage: string` - Current error message if any

**Validation Rules**:
- `dataSource` must be array of valid TranslationEntry objects
- `searchQuery` can be empty or non-empty string
- `searchResults` must be array of valid SearchResult objects
- `errorMessage` can be empty string

**State Transitions**:
1. `Inactive` → Domain check → `Active` or `Disabled`
2. `Active` → Data extraction → `Ready` or `Error`
3. `Ready` → Search input → `Searching` → `Results` or `No Results`
4. `Ready` → Element picker → `Picking` → `Searching` → `Results`

## Data Flow

```
Page Load → PageContext Analysis → Data Source Selection → TranslationEntry[] Generation
    ↓
User Input (Text/Element) → Fuzzy Search → SearchResult[] → UI Display
    ↓
User Click → Key Copy to Clipboard → Success Feedback
```

## Error States

- **Domain Error**: Not on *.kkday.com domain
- **Data Error**: Cannot access __NUXT__ or __INIT_STATE__ variables
- **Search Error**: Invalid search input or no results found
- **Clipboard Error**: Failed to copy key to clipboard