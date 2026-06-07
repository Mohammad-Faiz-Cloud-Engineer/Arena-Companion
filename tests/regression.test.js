/**
 * Regression Tests - Arena Companion
 * Validates that previously fixed bugs do not reappear
 * @module regression-tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const read = (filePath) => readFileSync(join(ROOT, filePath), 'utf-8');

describe('Regression Tests', () => {
  describe('Temporal Dead Zone - logger declaration order', () => {
    it('log is defined before EXTENSION_ORIGIN in content-script.js', () => {
      const content = read('content/content-script.js');

      const logPos = content.indexOf('const log =');
      const extOriginPos = content.indexOf('const EXTENSION_ORIGIN');

      assert.ok(logPos !== -1, 'const log declaration not found');
      assert.ok(extOriginPos !== -1, 'const EXTENSION_ORIGIN declaration not found');
      assert.ok(
        logPos < extOriginPos,
        `log (position ${logPos}) must be declared before EXTENSION_ORIGIN (position ${extOriginPos}) to avoid TDZ`
      );
    });

    it('IS_PRODUCTION is defined before log in content-script.js', () => {
      const content = read('content/content-script.js');

      const isProdPos = content.indexOf('const IS_PRODUCTION');
      const logPos = content.indexOf('const log =');

      assert.ok(isProdPos !== -1, 'const IS_PRODUCTION declaration not found');
      assert.ok(logPos !== -1, 'const log declaration not found');
      assert.ok(
        isProdPos < logPos,
        `IS_PRODUCTION (position ${isProdPos}) must be declared before log (position ${logPos})`
      );
    });

    it('EXTENSION_ORIGIN catch block uses log.warn (not raw console.warn)', () => {
      const content = read('content/content-script.js');

      const extOriginBlock = content.substring(
        content.indexOf('const EXTENSION_ORIGIN'),
        content.indexOf('const EXTENSION_ORIGIN') + 500
      );

      assert.ok(
        extOriginBlock.includes('log.warn'),
        'EXTENSION_ORIGIN catch block should use log.warn, not raw console.warn'
      );
      assert.ok(
        !extOriginBlock.includes('console.warn'),
        'EXTENSION_ORIGIN catch block should not use raw console.warn'
      );
    });
  });

  describe('waitForDocumentReady - race condition fix', () => {
    it('has readyState check inside the Promise executor', () => {
      const content = read('content/content-script.js');

      const fnStart = content.indexOf('const waitForDocumentReady');
      assert.ok(fnStart !== -1, 'waitForDocumentReady function not found');

      const fnBody = content.substring(fnStart, fnStart + 500);

      const promiseMatch = fnBody.match(/new\s+Promise\s*\(\s*\(resolve\)\s*=>\s*\{([\s\S]*?)\}\s*\)/);
      assert.ok(promiseMatch, 'Promise executor not found in waitForDocumentReady');

      const promiseBody = promiseMatch[1];
      assert.ok(
        promiseBody.includes('readyState'),
        'Promise executor must contain a readyState check to prevent race condition'
      );
      assert.ok(
        promiseBody.includes('resolve()'),
        'Promise executor must call resolve() when readyState is already complete'
      );
    });

    it('has two readyState checks (outer guard + inner guard)', () => {
      const content = read('content/content-script.js');

      const fnStart = content.indexOf('const waitForDocumentReady');
      const fnBody = content.substring(fnStart, fnStart + 500);

      const readyStateChecks = fnBody.match(/readyState\s*===?\s*['"]complete['"]/g) || [];
      assert.ok(
        readyStateChecks.length >= 2,
        `Expected at least 2 readyState checks in waitForDocumentReady, found ${readyStateChecks.length}`
      );
    });
  });

  describe('Accessibility - loading overlay', () => {
    it('loading overlay uses aria-label, not self-referencing aria-describedby', () => {
      const html = read('sidepanel/sidepanel.html');

      const overlayMatch = html.match(/<div[^>]*id="loadingOverlay"[^>]*>/);
      assert.ok(overlayMatch, 'Loading overlay element not found');

      const overlayTag = overlayMatch[0];

      assert.ok(
        overlayTag.includes('aria-label'),
        'Loading overlay must have aria-label for accessible name'
      );

      const describedByMatch = overlayTag.match(/aria-describedby="([^"]+)"/);
      if (describedByMatch) {
        assert.notEqual(
          describedByMatch[1],
          'loadingOverlay',
          'Loading overlay must not reference its own ID as aria-describedby'
        );
      }
    });

    it('loading overlay has role="status" and aria-live="polite"', () => {
      const html = read('sidepanel/sidepanel.html');

      const overlayMatch = html.match(/<div[^>]*id="loadingOverlay"[^>]*>/);
      assert.ok(overlayMatch, 'Loading overlay element not found');

      const overlayTag = overlayMatch[0];
      assert.ok(
        overlayTag.includes('role="status"'),
        'Loading overlay must have role="status"'
      );
      assert.ok(
        overlayTag.includes('aria-live="polite"'),
        'Loading overlay must have aria-live="polite" for screen reader announcements'
      );
    });
  });

  describe('Polling system integrity', () => {
    it('MAX_IDS and KEEP_IDS are declared outside setInterval callback', () => {
      const content = read('content/content-script.js');

      const maxIdsPos = content.indexOf('const MAX_IDS');
      const keepIdsPos = content.indexOf('const KEEP_IDS');
      const setIntervalPos = content.indexOf('setInterval(() => {\n    if (processedActionIds.size');

      assert.ok(maxIdsPos !== -1, 'const MAX_IDS not found');
      assert.ok(keepIdsPos !== -1, 'const KEEP_IDS not found');

      if (setIntervalPos !== -1) {
        assert.ok(
          maxIdsPos < setIntervalPos,
          'MAX_IDS should be declared before the setInterval that uses it'
        );
        assert.ok(
          keepIdsPos < setIntervalPos,
          'KEEP_IDS should be declared before the setInterval that uses it'
        );
      }
    });

    it('ACTION_EXPIRY_MS is defined and reasonable (30-120 seconds)', () => {
      const content = read('content/content-script.js');
      const match = content.match(/ACTION_EXPIRY_MS\s*=\s*(\d+)/);
      assert.ok(match, 'ACTION_EXPIRY_MS not found');

      const ms = parseInt(match[1], 10);
      assert.ok(ms >= 30000, `ACTION_EXPIRY_MS (${ms}) should be at least 30 seconds`);
      assert.ok(ms <= 120000, `ACTION_EXPIRY_MS (${ms}) should be at most 120 seconds`);
    });
  });

  describe('Manifest integrity', () => {
    it('manifest is valid MV3 with required fields', () => {
      const manifest = JSON.parse(read('manifest.json'));

      assert.equal(manifest.manifest_version, 3, 'Must use Manifest V3');
      assert.ok(manifest.name, 'Manifest must have a name');
      assert.ok(manifest.version, 'Manifest must have a version');
      assert.ok(manifest.description, 'Manifest must have a description');
    });

    it('minimum_chrome_version is at least 116 (sidePanel.open requirement)', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const minVersion = parseInt(manifest.minimum_chrome_version, 10);
      assert.ok(
        minVersion >= 116,
        `minimum_chrome_version (${minVersion}) must be >= 116 for chrome.sidePanel.open()`
      );
    });

    it('content scripts run_at is document_end', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const contentScripts = manifest.content_scripts || [];
      assert.ok(contentScripts.length > 0, 'No content scripts defined');

      for (const script of contentScripts) {
        assert.equal(
          script.run_at,
          'document_end',
          `Content script run_at should be document_end, got ${script.run_at}`
        );
      }
    });

    it('side_panel default_path points to existing HTML file', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const sidePanelPath = manifest.side_panel?.default_path;
      assert.ok(sidePanelPath, 'side_panel.default_path not defined');

      let exists = false;
      try {
        readFileSync(join(ROOT, sidePanelPath));
        exists = true;
      } catch {
        exists = false;
      }
      assert.ok(exists, `side_panel.default_path "${sidePanelPath}" does not exist`);
    });

    it('service worker path exists', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const swPath = manifest.background?.service_worker;
      assert.ok(swPath, 'background.service_worker not defined');

      let exists = false;
      try {
        readFileSync(join(ROOT, swPath));
        exists = true;
      } catch {
        exists = false;
      }
      assert.ok(exists, `service worker "${swPath}" does not exist`);
    });

    it('service worker type is module', () => {
      const manifest = JSON.parse(read('manifest.json'));
      assert.equal(
        manifest.background?.type,
        'module',
        'Service worker type should be "module" for ES module imports'
      );
    });
  });

  describe('Security patterns', () => {
    it('CSP in sidepanel.html restricts script-src to self', () => {
      const html = read('sidepanel/sidepanel.html');
      assert.ok(
        html.includes("script-src 'self'"),
        'CSP must restrict script-src to self'
      );
    });

    it('iframe has sandbox attribute', () => {
      const html = read('sidepanel/sidepanel.html');
      const iframeMatch = html.match(/<iframe[^>]*>/);
      assert.ok(iframeMatch, 'iframe element not found');
      assert.ok(
        iframeMatch[0].includes('sandbox='),
        'iframe must have sandbox attribute'
      );
    });

    it('host_permissions are scoped to arena.ai only', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const hostPerms = manifest.host_permissions || [];

      for (const perm of hostPerms) {
        assert.ok(
          perm.includes('arena.ai'),
          `Host permission "${perm}" is not scoped to arena.ai`
        );
      }
    });

    it('declarativeNetRequest rules are scoped to sub_frame resource type', () => {
      const rules = JSON.parse(read('rules.json'));

      for (const rule of rules) {
        const resourceTypes = rule.condition?.resourceTypes || [];
        assert.ok(
          resourceTypes.includes('sub_frame'),
          `Rule ${rule.id} should be scoped to sub_frame resource type, got: ${resourceTypes.join(', ')}`
        );
      }
    });
  });
});
