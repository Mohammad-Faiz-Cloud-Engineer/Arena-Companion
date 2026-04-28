# Arena Companion

**Version:** 1.5.0

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/Mohammad-Faiz-Cloud-Engineer/arena-companion/releases)
[![License](https://img.shields.io/badge/license-BSD--2--Clause-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-114%2B-brightgreen.svg)](https://www.google.com/chrome/)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Security](https://img.shields.io/badge/security-reviewed-success.svg)](SECURITY.md)
[![Performance](https://img.shields.io/badge/performance-optimized-success.svg)](#performance)

A Chrome Extension for seamless [Arena.AI](https://arena.ai/) integration in your browser's side panel with hardened defaults, optimized performance, and a small runtime footprint.

## Author

**Mohammad Faiz** - Creator & Lead Developer

## Features

- **Text Selection Actions**: Right-click any text to Summarize, Explain, Rewrite, Quiz Me, or Proofread
- **Modern Side Panel API**: Utilizes Chrome's native `chrome.sidePanel` API
- **Hardened Security Defaults**: Restricted permissions, sandboxed framing, validated storage, and redacted logs
- **Performance Optimized**: CSS containment, debounced interactions, and non-blocking operations
- **Scoped Header Stripping**: `declarativeNetRequest` rules limited to embedded Arena subframes
- **Modular Architecture**: Clean separation of concerns with utils, storage, and UI modules
- **Production-Ready**: Comprehensive error handling, data sanitization, and logging
- **Zero Dependencies**: Pure Vanilla JS, HTML5, and CSS3
- **Keyboard-Friendly Controls**: Refresh interaction supports keyboard activation
- **Lean Runtime**: Minimal background work with explicit cleanup paths
- **Dark Mode Support**: Automatic theme adaptation based on system preferences

## Architecture

```
├── manifest.json              # Extension manifest (v3)
├── rules.json                 # declarativeNetRequest rules
├── icons/                     # Extension icons
├── background/
│   └── service-worker.js      # Background service worker
├── content/
│   ├── content-script.js      # Arena page automation
│   └── content-style.css      # Arena page cleanup styles
├── sidepanel/
│   ├── sidepanel.html         # Side panel UI
│   ├── scripts/
│   │   └── main.js            # Side panel logic
│   └── styles/
│       ├── reset.css          # CSS reset
│       └── sidepanel.css      # Main styles
└── utils/
    ├── constants.js           # Application constants
    ├── logger.js              # Logging utility
    ├── storage.js             # Storage management
    └── user-details.js        # User data handling
```

## Installation

### Development Mode

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension directory

### Production Build

1. Ensure all files are present
2. Update version in `manifest.json` (remove 'dev' suffix for production)
3. Zip the entire directory
4. Upload to Chrome Web Store

## Usage

1. Click the extension icon in the Chrome toolbar
2. The Arena AI side panel will open
3. Use the refresh button to reload the Arena AI interface
4. The panel persists across tabs and windows

### How to Login

**Important:** Due to OAuth security restrictions, you cannot login directly within the extension's iframe.

**Login Steps:**
1. Open [https://arena.ai/](https://arena.ai/) in a regular browser tab
2. Complete the login process (Google OAuth or other method)
3. Once logged in on the website, return to the extension
4. Click the **refresh button** in the side panel
5. You will now be logged in within the extension

**Why this approach?**
- Google OAuth and most authentication providers block iframe embedding for security reasons
- This is a standard security measure to prevent clickjacking attacks
- Your login session is shared between the website and the extension once authenticated

**Alternative:** Open [https://arena.ai/](https://arena.ai/) manually in a regular browser tab whenever you need to re-authenticate, then return to the side panel and refresh it.

## Technical Details

### Header Stripping

The extension uses `declarativeNetRequest` to remove frame-blocking headers from Arena subframes loaded inside the extension:
- `X-Frame-Options`
- `Content-Security-Policy`
- `Frame-Options`

This rule is limited to `arena.ai` subframes so the direct website keeps its normal protections outside the extension.

### Storage Management

User details and preferences are stored using `chrome.storage.local` with:
- Professional error handling
- Validation before storage operations
- Sensible length limits
- Automatic timestamp tracking

### Performance

- Service Worker architecture for minimal resource usage
- Lazy loading with visual feedback
- Optimized CSS with CSS variables
- No external dependencies or frameworks

## Code Quality

- ✅ ES6+ modern JavaScript (const/let, async/await)
- ✅ Focused modules with explicit responsibilities
- ✅ Defensive error handling in runtime entry points
- ✅ Input validation for persisted user data
- ✅ Immutable module exports with Object.freeze()
- ✅ Modular architecture with clean separation
- ✅ Developer-friendly comments
- ✅ Production logging system with debug levels
- ✅ Keyboard-accessible refresh control

## Browser Compatibility

- Chrome 114+
- Edge 114+
- Any Chromium-based browser with Manifest V3 support

- Microsoft Edge users: install from Microsoft Edge Add-ons — [Arena Companion on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/arena-companion/hfpllffcikhjbhfmiiaacenmegimognh)

## Performance

- Low-overhead background service worker architecture
- Debounced refresh interaction to prevent accidental reload storms
- Scoped message delivery to Arena tabs in the active window
- Cleanup paths for iframe and DOM listeners in the side panel

## License

BSD-2-Clause license - See LICENSE file for details

## Author

Created by **Mohammad Faiz**

## Support

For issues or questions, please open an issue on the repository.
