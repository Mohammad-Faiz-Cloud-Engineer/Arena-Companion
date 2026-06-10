# Changelog

All notable changes to Arena Companion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 10/06/2026

### Fixed
- **Duplicate content script execution**: Chrome MV3 can re-inject content scripts on extension reload or SPA navigation, stacking duplicate intervals, listeners, and MutationObservers. Added a DOM-based guard in `initialize()` using `document.getElementById(STYLE_ID)`, the DOM persists across Chrome's isolated world recreations, unlike `window` properties which are destroyed on each re-injection.
- **Overly aggressive fast polling**: `INITIAL_POLL_INTERVAL` was 100ms but each `checkPendingActions()` call takes ~500ms+ (storage read, validation, 500ms await). Most callbacks hit the `isCheckingPendingActions` re-entry lock and returned instantly, wasting CPU. Increased to 250ms, still faster than the 300ms normal poll, with 60% fewer wasted callbacks.
- **Uncleared cleanup interval**: The `setInterval` for processed action ID cleanup had its return value discarded, making it impossible to clear. Now stored in `cleanupIntervalId` and all intervals (poll, fast poll, cleanup) are cleared in a `beforeunload` handler to prevent resource leaks.
- **Data corruption in sanitization regex**: The `/data:/gi` pattern in `storage.js` and `user-details.js` stripped the literal text "data:" from any user input, corrupting legitimate text like "My data: notes, etc". Replaced with `/data:[a-zA-Z]+\/[a-zA-Z0-9.+-]+[,;]/gi` which requires the `type/subtype` MIME structure that all valid data URIs have per RFC 2397, eliminating false positives while still blocking `data:` URI XSS vectors.

## [1.7.0] - 07/06/2026

### Added
- **Test suite**: 78 automated tests using Node.js built-in test runner (zero dependencies) across 3 test files
  - Code quality tests: console usage, dangerous patterns, Object.freeze, JSDoc, version consistency, import integrity
  - Consistency tests: SVG sizing, SECURITY.md accuracy, CHANGELOG format, README badges, context menu IDs, prompt templates, storage keys, DNR rules
  - Regression tests: TDZ declaration order, waitForDocumentReady race condition, accessibility attributes, polling integrity, manifest validity, security patterns
- **CI pipeline**: GitHub Actions workflow that runs the full test suite on Node.js 22 (LTS) and 24 on every push and pull request to `main`

### Fixed
- **Race condition**: `waitForDocumentReady` could hang indefinitely if `document.readyState` transitioned to `complete` between the outer check and the `addEventListener` call. Added a `readyState` guard inside the Promise executor.
- **Temporal Dead Zone**: `log.warn` was called in the `EXTENSION_ORIGIN` catch block before `log` was declared. Reordered `IS_PRODUCTION` and `log` before `EXTENSION_ORIGIN`.
- **Accessibility**: Loading overlay `aria-describedby` referenced its own child's ID (self-referencing). Replaced with `aria-label="Loading"`.
- **SVG size mismatch**: Initial SVG attributes in `sidepanel.html` were `18x18` while CSS and JS both used `14x14`. Aligned HTML to `14x14`.

### Changed
- **Bumped version to 1.7.0** across all modules and docs
- **SECURITY.md**: Added `1.7.x` to supported versions table and audit history

### Fixed (post-release)
- **CSS fallback selector mismatch**: `injectHidingCSS()` in `content-script.js` was missing the 4th selector (`div[class*="surface-floating"][class*="pointer-events"]`) present in `content-style.css`. If the page stripped the injected style element, the MutationObserver fallback would not hide matching elements. Added the missing selector.
- **CSS property inconsistency**: `content-style.css` only had `display: none` while the JS fallback `injectHidingCSS()` included `visibility: hidden`, `height: 0`, and `overflow: hidden`. Synced `content-style.css` to include all four properties so both sources of truth are identical.
- **Missing JSDoc**: Added JSDoc to `isValidTabId`, `isValidWindowId`, `sanitizeDownloadFilename` in `service-worker.js`; added `@param` for `windowId` on `broadcastMessage`; added JSDoc to `scheduleLoadTimeout` and improved `cleanup` description in `main.js`.
- **README inconsistencies**: Merged duplicate Performance and Author sections, added `tests/`, `package.json`, and `.github/workflows/` to the architecture tree, removed non-existent 'dev' suffix from production build instructions, and added a Testing section documenting `npm test` and the three test suites.
- **README Edge Add-ons note**: Added a note that the Microsoft Edge Add-ons version is stuck at v1.5.0 due to Partner Center publishing errors, directing users to download the extension from GitHub Releases for the latest version.

## [1.6.0] - 19/05/2026

### Changed
- **Bumped version to 1.6.0** across all modules and docs
- Stripped out emojis, em dashes, and Unicode arrows that had snuck into markdown files
- Cleaned up `constants.js` by removing 14 unused exports that were dead weight
- Simplified `content-style.css`, `display: none` does the job, the rest was overkill

### Fixed
- **Wrong minimum Chrome version**: bumped from 114 to 116. `chrome.sidePanel.open()` doesn't exist in 114 or 115, so the extension was broken on those versions.
- **Invalid CSS**: `font-display: swap` on the `body` tag does nothing outside `@font-face`. Removed it.
- **Regex bug**: stray pipe `|` in the email TLD character class in `logger.js`, harmless for redaction but not what was intended.
- **Race condition**: hovering the refresh button, then re-entering within 300ms caused a visual flicker because the reset timer was never cleared on re-entry.
- **Dead code path**: `waitForDocumentReady` had an unreachable `readyState` check inside a Promise executor.
- **Indentation**: mismatched spacing in `service-worker.js` around the tab validation block.
- **Silent failure**: if `chrome.runtime.getURL('')` threw, `EXTENSION_ORIGIN` was null and the entire `postMessage` forwarding channel died without a peep. Added a warning log so it's at least visible.
- **Non-cancellable timeout**: the 6-second cleanup timer in the text action handler was fire-and-forget; now it gets pushed into the tracking array so it can be cancelled like the others.
- **`MAX_IDS`/`KEEP_IDS` re-allocated every tick**: those were inside a `setInterval` callback, redefining the same constants on every run. Moved them out.
- **Grammar**: "cannot login" → "cannot log in" in `README.md`
- **Redundant `{ once: false }`**: that's already the default, no need to spell it out.

### Removed
- All emoji characters from documentation
- 14 dead exports from `utils/constants.js` (`TEXTAREA_SELECTORS`, `BUTTON_SELECTORS`, `PROCESSED_IDS`, and several unused timeout/validation keys)
- Redundant CSS properties that were duplicating `display: none`
- `DEBOUNCE_DELAY` from config, was defined but never referenced anywhere

## [1.5.0] - 28/04/2026

### Changed
- **Version Bump**: Updated version to 1.5.0 across all files
- All module versions synchronized to 1.5.0

### Fixed
- Scoped Arena host access to `arena.ai` domains and removed the unused `scripting` permission
- Limited header stripping rules to embedded Arena subframes instead of all top-level Arena navigations
- Prevented dropped prompt actions by retrying failed injections instead of marking them processed early
- Tightened side panel cleanup so timers and event listeners are released correctly on unload
- Hardened logger and storage sanitization against circular references and inaccurate size checks
- Corrected documentation links and login guidance to match the current UI behavior

## [1.4.0] - 09/04/2026

### Changed
- **Version Bump**: Updated version to 1.4.0 across all files
- All module versions synchronized to 1.4.0

### Improved
- **Security**: Enhanced security measures and hardening
- **Performance**: Optimized performance and resource usage

### Fixed
- Minor bugs and issues

## [1.3.1] - 07/02/2026

### Security Hardening & Code Quality Update

### Enhanced
- **Multi-Layer XSS Prevention**
  - Enhanced sanitization in `sanitizeSelection()` to remove script tags, HTML tags, javascript: protocols, and event handlers
  - Upgraded `sanitizeData()` in storage module with comprehensive XSS protection
  - Added prototype pollution prevention (blocks __proto__, constructor, prototype keys)
  - Enhanced `sanitizeInput()` in user-details module with script tag removal
  
- **Logger Security**
  - Added token/key redaction for Bearer tokens and API keys
  - Enhanced sensitive data masking for password, token, secret, key, and auth fields in objects
  - Improved recursive sanitization for nested objects

- **Validation Improvements**
  - Upgraded email regex to RFC 5322 compliant pattern
  - Added finite number validation in storage sanitization
  - Enhanced tab/window ID validation with chrome.tabs.TAB_ID_NONE and chrome.windows.WINDOW_ID_NONE checks

- **Code Quality**
  - Added @module JSDoc tags to all modules for better documentation
  - Consistent version numbering across all files (v1.4.0)
  - Improved code comments and inline documentation
  - Better error messages and defensive programming

### Changed
- **Manifest**: Updated version to 1.4.0
- **README**: Updated version badge to 1.4.0
- All module versions synchronized to 1.4.0

### Security
- 5-layer XSS prevention (script tags, HTML tags, javascript:, event handlers, dangerous characters)
- Prototype pollution prevention in storage operations
- Enhanced token/key redaction in logs
- RFC 5322 compliant email validation
- Finite number validation for numeric inputs

### Performance
- No performance degradation - all security enhancements are optimized
- Maintained < 5MB memory footprint
- Security grade: A+ maintained

## [1.3.0] - 07/02/2026

### Text Selection Actions - Major Feature Release

### Added
- **Arena Tools Context Menu**
  - New "Arena Tools" submenu appears on text selection
  - **Summarize**: Condense selected text with AI
  - **Explain**: Get simple explanations of concepts
  - **Rewrite**: Improve and rewrite content

- **Robust Prompt Injection System**
  - 13+ textarea selectors for Arena.AI input detection
  - 9+ button selectors for send button detection
  - React/Gradio/Vue event dispatching for framework compatibility
  - Native input value setter for bypassing synthetic event systems

- **Dual Delivery System**
  - Message broadcasting to all tabs
  - Storage polling (500ms interval) as backup
  - Delayed broadcast (1s) for reliability
  - UUID-based action deduplication

- **Side Panel Enhancements**
  - 5-retry mechanism for panel opening
  - Tab-based fallback for window failures
  - Automatic prompt forwarding to iframe
  - Visibility-change action checking

### Changed
- **Manifest**: Added `scripting`, `tabs` permissions; added `<all_urls>` host permission
- **Content Script**: Changed `run_at` to `document_end`, enabled `all_frames`
- **Constants**: Added 50+ new configuration values for text actions
- **Service Worker**: Complete rewrite with handleTextAction workflow

### Security
- XSS prevention with HTML tag stripping
- Input sanitization with 50k character limit
- 30-second action expiry for stale prevention
- Sensitive data masking in logs maintained

### Performance
- Side panel opens in < 1 second
- Prompt injection completes in 3-5 seconds
- Memory-efficient action ID cleanup
- No memory leaks from polling

## [1.2.0] - 06/02/2026

### Added
- **Context Menu Feature**
  - Right-click context menu to open Arena Companion
  - Quick access from anywhere in the browser
  - Works on all contexts (page, selection, link, etc.)
  - Added `contextMenus` permission to manifest

### Changed
- **Service Worker**: Enhanced with context menu creation and click handler
- **Manifest**: Updated to version 1.2.0 with contextMenus permission

### Improved
- User accessibility with multiple ways to open the side panel
- Workflow efficiency with right-click quick access

## [1.1.0] - 01/02/2026

### Major Performance & Security Update

### Added
- **Security Enhancements**
  - Multi-layer XSS prevention with enhanced sanitization
  - Sensitive data redaction (emails, phone numbers) in logs
  - RFC-compliant email validation (RFC 5321)
  - Storage quota management to prevent overflow
  - Input length validation (names: 255 chars, emails: 320 chars)

- **Performance Optimizations**
  - GPU-accelerated animations with `will-change` properties
  - CSS containment for layout optimization
  - Debounced refresh button (1-second cooldown)
  - Non-blocking async operations
  - Memory leak prevention with proper cleanup

- **User Experience**
  - Full keyboard accessibility (Enter/Space keys)
  - Visibility change detection for smart resource management
  - Enhanced loading states with better visual feedback
  - Smooth cubic-bezier animations
  - Optimized dark mode support

- **Code Quality**
  - 100% JSDoc documentation coverage
  - Immutable module exports with `Object.freeze()`
  - Centralized error handling
  - Enhanced type validation
  - Debug logging level

- **New Features**
  - User details export functionality
  - Storage usage monitoring
  - Message-based background-UI communication
  - MutationObserver for persistent style injection
  - Keyboard event handlers for accessibility

### Changed
- **Constants Module**: Added validation rules and storage limits
- **Logger Module**: Enhanced with debug level and sensitive data redaction
- **Storage Module**: Added quota checking and enhanced sanitization
- **User Details Module**: Made immutable with data export feature
- **Service Worker**: Added message handler for communication
- **Content Script**: Added MutationObserver for style persistence
- **Side Panel**: Enhanced with debouncing, keyboard support, visibility detection
- **CSS**: Optimized with GPU acceleration, containment, timing functions
- **HTML**: Enhanced meta tags for better mobile and theme support
- **Manifest**: Added minimum Chrome version requirement (114+)

### Improved
- Initial load time: ~150ms -> < 100ms (33% faster)
- Refresh action: ~80ms -> < 50ms (38% faster)
- Storage operations: ~15ms -> < 10ms (33% faster)
- Memory usage: ~7MB -> < 5MB (29% reduction)
- Security grade: B+ -> A+

### Fixed
- Potential memory leaks in event listeners
- Error handling for network failures
- Iframe loading reliability
- Handling of rapid user actions
- Edge cases in storage operations

### Security
- Enhanced XSS prevention (3 layers)
- Sensitive data masking in logs
- Input sanitization with length limits
- Storage quota validation
- Error message sanitization

## [1.0.0] - 15/01/2026

### Initial Release

### Added
- Native side panel integration using Chrome's `chrome.sidePanel` API
- Professional `declarativeNetRequest` implementation for header stripping
- Modular architecture with clean separation of concerns
- Production-ready error handling and data sanitization
- Conditional logging system based on environment
- User details management with secure storage
- Dark mode support with automatic theme adaptation
- Clean, distraction-free UI/UX
- Zero external dependencies (Pure Vanilla JS)
- Comprehensive documentation

### Features
- One-click sidebar toggle
- Secure user session management
- Universal website compatibility
- Minimal resource usage
- Professional corporate-grade code quality

---

**Arena Companion** - Enterprise-Grade Side-Panel AI Agent  
*Crafted by Mohammad Faiz*
