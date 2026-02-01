# Arena Companion

A production-grade Chrome Extension for seamless [Arena.AI](https://arena.ai/) integration in your browser's side panel with optimized performance and corporate-grade code quality.

## Author

**Mohammad Faiz** - Creator & Lead Developer

## Features

- **Modern Side Panel API**: Utilizes Chrome's native `chrome.sidePanel` API
- **Header Stripping**: Professional `declarativeNetRequest` implementation to bypass X-Frame-Options
- **Modular Architecture**: Clean separation of concerns with utils, storage, and UI modules
- **Production-Ready**: Comprehensive error handling, data sanitization, and logging
- **Zero Dependencies**: Pure Vanilla JS, HTML5, and CSS3
- **Performance Optimized**: Minimal memory footprint and zero-latency feel
- **Dark Mode Support**: Automatic theme adaptation based on system preferences

## Architecture

```
├── manifest.json              # Extension manifest (v3)
├── rules.json                 # declarativeNetRequest rules
├── icons/                     # Extension icons
├── background/
│   └── service-worker.js      # Background service worker
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

## Technical Details

### Header Stripping

The extension uses `declarativeNetRequest` to remove frame-blocking headers:
- `X-Frame-Options`
- `Content-Security-Policy`
- `Frame-Options`

This is the professional, security-compliant method for embedding third-party sites.

### Storage Management

User details and preferences are stored using `chrome.storage.local` with:
- Professional error handling
- Data sanitization to prevent XSS
- Validation before storage operations
- Automatic timestamp tracking

### Performance

- Service Worker architecture for minimal resource usage
- Lazy loading with visual feedback
- Optimized CSS with CSS variables
- No external dependencies or frameworks

## Code Quality

- ✅ ES6+ modern JavaScript (const/let, async/await)
- ✅ Comprehensive try/catch blocks
- ✅ Professional error handling
- ✅ Data sanitization and validation
- ✅ Modular architecture
- ✅ Developer-friendly comments
- ✅ Production logging system
- ✅ Accessibility compliant

## Browser Compatibility

- Chrome 114+
- Edge 114+
- Any Chromium-based browser with Manifest V3 support

## License

MIT License - See LICENSE file for details

## Author

Created by **Mohammad Faiz**

## Support

For issues or questions, please open an issue on the repository.
