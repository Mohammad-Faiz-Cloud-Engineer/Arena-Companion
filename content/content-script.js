/**
 * Content Script - Arena Companion UI Cleanup
 * Hides unwanted UI elements using CSS only to avoid breaking the app
 */

/**
 * Injects CSS to hide the banner
 */
const injectHidingCSS = () => {
  const style = document.createElement('style');
  style.id = 'arena-companion-cleanup';
  style.textContent = `
    /* Hide LMArena banner with high specificity */
    div.bg-surface-floating:has(p),
    div[class*="bg-surface-floating"]:has(svg),
    div.pointer-events-auto:has(a[href*="lmarena"]) {
      display: none !important;
    }
  `;
  
  const head = document.head || document.documentElement;
  if (head) {
    head.appendChild(style);
  }
};

// Inject CSS immediately
if (document.readyState === 'loading') {
  injectHidingCSS();
  document.addEventListener('DOMContentLoaded', injectHidingCSS);
} else {
  injectHidingCSS();
}


