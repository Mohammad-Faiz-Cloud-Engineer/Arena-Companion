/**
 * Content Script - Arena Companion UI Cleanup
 * Hides unwanted UI elements using CSS only to avoid breaking the app
 * @author Mohammad Faiz
 */

(() => {
  'use strict';
  
  /**
   * Injects CSS to hide promotional banners
   */
  const injectHidingCSS = () => {
    // Check if already injected
    if (document.getElementById('arena-companion-cleanup')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'arena-companion-cleanup';
    style.textContent = `
      /* Hide LMArena banner with high specificity */
      div.bg-surface-floating:has(p),
      div[class*="bg-surface-floating"]:has(svg),
      div.pointer-events-auto:has(a[href*="lmarena"]) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
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
    document.addEventListener('DOMContentLoaded', injectHidingCSS, { once: true });
  } else {
    injectHidingCSS();
  }
})();


