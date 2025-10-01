# Tasks: Chrome Extension for I18n Key Lookup

**Input**: Design documents from `/Users/chaoyang.hsu/work/b12031106/lang-key-finder/specs/001-chrome-extension-i18n/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Chrome Extension**: `src/`, `tests/` at repository root
- All paths relative to project root: `/Users/chaoyang.hsu/work/b12031106/lang-key-finder/`

## Phase 3.1: Setup
- [ ] T001 Create Chrome extension project structure (manifest.json, src/, tests/)
- [ ] T002 Initialize package.json with Jest, Fuse.js dependencies
- [ ] T003 [P] Configure ESLint and Prettier for JavaScript formatting

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test for content script data extraction in tests/contract/test_content_script_api.js
- [ ] T005 [P] Contract test for popup search functionality in tests/contract/test_popup_api.js
- [ ] T006 [P] Integration test for manual text search scenario in tests/integration/test_manual_search.js
- [ ] T007 [P] Integration test for element selection scenario in tests/integration/test_element_selection.js
- [ ] T008 [P] Integration test for domain validation scenario in tests/integration/test_domain_validation.js
- [ ] T009 [P] Integration test for data source selection scenario in tests/integration/test_data_source_selection.js
- [ ] T010 [P] Integration test for error handling scenario in tests/integration/test_error_handling.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T011 [P] TranslationEntry model in src/models/TranslationEntry.js
- [ ] T012 [P] SearchResult model in src/models/SearchResult.js
- [ ] T013 [P] PageContext model in src/models/PageContext.js
- [ ] T014 [P] ExtensionState model in src/models/ExtensionState.js
- [ ] T015 [P] Page context analyzer service in src/services/PageContextService.js
- [ ] T016 [P] Data extraction service in src/services/DataExtractionService.js
- [ ] T017 [P] Fuzzy search service in src/services/SearchService.js
- [ ] T018 [P] Clipboard service in src/services/ClipboardService.js
- [ ] T019 Content script for page data access in src/content/content-script.js
- [ ] T020 Background service worker in src/background/service-worker.js
- [ ] T021 Popup HTML interface in src/popup/popup.html
- [ ] T022 Popup JavaScript logic in src/popup/popup.js
- [ ] T023 Popup CSS styling in src/popup/popup.css

## Phase 3.4: Integration
- [ ] T024 Message passing between content script and popup
- [ ] T025 Element picker functionality implementation
- [ ] T026 Chrome extension permissions setup
- [ ] T027 Extension icon and metadata configuration

## Phase 3.5: Polish
- [ ] T028 [P] Unit tests for TranslationEntry validation in tests/unit/test_translation_entry.js
- [ ] T029 [P] Unit tests for SearchResult scoring in tests/unit/test_search_result.js
- [ ] T030 [P] Unit tests for PageContext analysis in tests/unit/test_page_context.js
- [ ] T031 [P] Unit tests for fuzzy search logic in tests/unit/test_search_service.js
- [ ] T032 Performance tests for search response time (<100ms)
- [ ] T033 Memory usage optimization and testing (<5MB)
- [ ] T034 Cross-browser compatibility testing
- [ ] T035 Execute quickstart.md validation scenarios

## Dependencies
- Setup (T001-T003) before everything
- Tests (T004-T010) before implementation (T011-T027)
- Models (T011-T014) before services (T015-T018)
- Services before UI components (T019-T023)
- Core functionality before integration (T024-T027)
- Everything before polish (T028-T035)

## Parallel Execution Examples
```
# Launch model creation tasks together:
Task: "TranslationEntry model in src/models/TranslationEntry.js"
Task: "SearchResult model in src/models/SearchResult.js"
Task: "PageContext model in src/models/PageContext.js"
Task: "ExtensionState model in src/models/ExtensionState.js"

# Launch service creation tasks together:
Task: "Page context analyzer service in src/services/PageContextService.js"
Task: "Data extraction service in src/services/DataExtractionService.js"
Task: "Fuzzy search service in src/services/SearchService.js"
Task: "Clipboard service in src/services/ClipboardService.js"

# Launch contract tests together:
Task: "Contract test for content script data extraction in tests/contract/test_content_script_api.js"
Task: "Contract test for popup search functionality in tests/contract/test_popup_api.js"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task completion
- Follow TDD: Red-Green-Refactor cycle
- Use Chrome Extension Manifest V3 standards
- Ensure Fuse.js integration for fuzzy search

## Task Generation Rules Applied
1. **From Contracts**: content-script-api.json → T004, popup-api.json → T005
2. **From Data Model**: 4 entities → T011-T014 model tasks [P]
3. **From User Stories**: 5 scenarios → T006-T010 integration tests [P]
4. **From Research**: Architecture decisions → service tasks T015-T018 [P]

## Validation Checklist
- [x] All contracts have corresponding tests (T004-T005)
- [x] All entities have model tasks (T011-T014)
- [x] All tests come before implementation (T004-T010 before T011+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task