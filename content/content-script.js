/**
 * Content Script - Arena Companion UI Cleanup
 * Hides unwanted UI elements using CSS only to avoid breaking the app
 * @author Mohammad Faiz
 */

(() => {
  'use strict';
  
  const STYLE_ID = 'arena-companion-cleanup';
  
  /**
   * Injects CSS to hide promotional banners
   */
  const injectHidingCSS = () => {
    // Check if already injected
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = STYLE_ID;
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

  /**
   * Observes DOM mutations to re-inject CSS if removed
   */
  const observeStyleRemoval = () => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (const node of mutation.removedNodes) {
            if (node.id === STYLE_ID) {
              injectHidingCSS();
              break;
            }
          }
        }
      }
    });
    
    const head = document.head || document.documentElement;
    if (head) {
      observer.observe(head, { childList: true });
    }
  };

  // Inject CSS immediately
  if (document.readyState === 'loading') {
    injectHidingCSS();
    document.addEventListener('DOMContentLoaded', () => {
      injectHidingCSS();
      observeStyleRemoval();
    }, { once: true });
  } else {
    injectHidingCSS();
    observeStyleRemoval();
  }
})();


