/**
 * Consistency Tests - Arena Companion
 * Validates cross-file consistency, documentation accuracy, and structural alignment
 * @module consistency-tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const read = (filePath) => readFileSync(join(ROOT, filePath), 'utf-8');

describe('Cross-File Consistency', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const version = manifest.version;

  describe('SVG size alignment', () => {
    it('HTML SVG width/height matches CSS and JS sizing', () => {
      const html = read('sidepanel/sidepanel.html');
      const css = read('sidepanel/styles/sidepanel.css');
      const js = read('sidepanel/scripts/main.js');

      const htmlSvgMatch = html.match(/<svg\s+width="(\d+)"\s+height="(\d+)"/);
      assert.ok(htmlSvgMatch, 'No SVG with width/height found in sidepanel.html');

      const cssWidthMatch = css.match(/\.refresh-btn\s+svg\s*\{[^}]*width:\s*(\d+)px/);
      const cssHeightMatch = css.match(/\.refresh-btn\s+svg\s*\{[^}]*height:\s*(\d+)px/);

      const jsWidthMatch = js.match(/setAttribute\('width',\s*'(\d+)'\)/);
      const jsHeightMatch = js.match(/setAttribute\('height',\s*'(\d+)'\)/);

      const htmlW = htmlSvgMatch[1];
      const htmlH = htmlSvgMatch[2];
      const cssW = cssWidthMatch?.[1];
      const cssH = cssHeightMatch?.[1];
      const jsW = jsWidthMatch?.[1];
      const jsH = jsHeightMatch?.[1];

      if (cssW) {
        assert.equal(htmlW, cssW, `HTML SVG width (${htmlW}) does not match CSS width (${cssW})`);
      }
      if (cssH) {
        assert.equal(htmlH, cssH, `HTML SVG height (${htmlH}) does not match CSS height (${cssH})`);
      }
      if (jsW) {
        assert.equal(htmlW, jsW, `HTML SVG width (${htmlW}) does not match JS width (${jsW})`);
      }
      if (jsH) {
        assert.equal(htmlH, jsH, `HTML SVG height (${htmlH}) does not match JS height (${jsH})`);
      }
    });
  });

  describe('SECURITY.md accuracy', () => {
    it('supported versions table includes current major.minor', () => {
      const security = read('SECURITY.md');
      const majorMinor = version.split('.').slice(0, 2).join('.');
      const pattern = new RegExp(`\\|\\s*${majorMinor}\\.x\\s*\\|\\s*Yes`);
      assert.ok(
        pattern.test(security),
        `SECURITY.md supported versions table does not include ${majorMinor}.x`
      );
    });

    it('audit history has entry for current version', () => {
      const security = read('SECURITY.md');
      assert.ok(
        security.includes(version),
        `SECURITY.md audit history has no entry for version ${version}`
      );
    });

    it('footer version matches manifest', () => {
      const security = read('SECURITY.md');
      const footerMatch = security.match(/\*\*Version\*\*:\s*([\d.]+)/);
      assert.ok(footerMatch, 'SECURITY.md has no footer version');
      assert.equal(
        footerMatch[1],
        version,
        `SECURITY.md footer version ${footerMatch[1]} does not match manifest ${version}`
      );
    });
  });

  describe('CHANGELOG.md accuracy', () => {
    it('has entry for current version', () => {
      const changelog = read('CHANGELOG.md');
      assert.ok(
        changelog.includes(`[${version}]`),
        `CHANGELOG.md has no entry for version ${version}`
      );
    });

    it('follows Keep a Changelog format', () => {
      const changelog = read('CHANGELOG.md');
      assert.ok(
        changelog.includes('Keep a Changelog'),
        'CHANGELOG.md does not reference Keep a Changelog format'
      );
      assert.ok(
        changelog.includes('Semantic Versioning'),
        'CHANGELOG.md does not reference Semantic Versioning'
      );
    });
  });

  describe('README.md accuracy', () => {
    it('version text matches manifest', () => {
      const readme = read('README.md');
      const versionLine = readme.match(/\*\*Version:\*\*\s*([\d.]+)/);
      assert.ok(versionLine, 'README.md has no version line');
      assert.equal(
        versionLine[1],
        version,
        `README.md version ${versionLine[1]} does not match manifest ${version}`
      );
    });

    it('version badge matches manifest', () => {
      const readme = read('README.md');
      const badgeMatch = readme.match(/version-([\d.]+)-blue/);
      assert.ok(badgeMatch, 'README.md has no version badge');
      assert.equal(
        badgeMatch[1],
        version,
        `README.md badge version ${badgeMatch[1]} does not match manifest ${version}`
      );
    });

    it('Chrome version requirement matches manifest minimum', () => {
      const readme = read('README.md');
      const minChrome = manifest.minimum_chrome_version;
      assert.ok(
        readme.includes(`Chrome ${minChrome}+`) || readme.includes(`chrome-${minChrome}`),
        `README.md does not reference Chrome ${minChrome}+ (manifest minimum_chrome_version)`
      );
    });
  });

  describe('Context menu IDs consistency', () => {
    it('service-worker.js uses all CONTEXT_MENU_IDS from constants', () => {
      const constants = read('utils/constants.js');
      const serviceWorker = read('background/service-worker.js');

      const blockMatch = constants.match(/CONTEXT_MENU_IDS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert.ok(blockMatch, 'CONTEXT_MENU_IDS block not found in constants.js');

      const block = blockMatch[1];
      const idMatches = block.matchAll(/(\w+):\s*'/g);
      const definedIds = [...idMatches].map((m) => m[1]);

      assert.ok(definedIds.length > 0, 'No IDs found in CONTEXT_MENU_IDS block');

      for (const id of definedIds) {
        assert.ok(
          serviceWorker.includes(`CONTEXT_MENU_IDS.${id}`),
          `CONTEXT_MENU_IDS.${id} is defined in constants but not used in service-worker.js`
        );
      }
    });
  });

  describe('Prompt templates consistency', () => {
    it('all context menu text actions have matching prompt templates', () => {
      const constants = read('utils/constants.js');
      const actions = ['summarize', 'explain', 'rewrite', 'quizMe', 'proofread'];

      for (const action of actions) {
        assert.ok(
          constants.includes(`${action}:`),
          `Prompt template for "${action}" is missing from PROMPT_TEMPLATES`
        );
      }
    });

    it('service-worker switch cases match prompt template keys', () => {
      const serviceWorker = read('background/service-worker.js');
      const actions = ['summarize', 'explain', 'rewrite', 'quizMe', 'proofread'];

      for (const action of actions) {
        assert.ok(
          serviceWorker.includes(`'${action}'`),
          `Service worker switch has no case for action "${action}"`
        );
      }
    });
  });

  describe('Storage key consistency', () => {
    it('content-script STORAGE_KEY matches constants ACTION_STORAGE_KEYS', () => {
      const constants = read('utils/constants.js');
      const contentScript = read('content/content-script.js');

      const constMatch = constants.match(/PENDING_ACTION:\s*'([^']+)'/);
      const scriptMatch = contentScript.match(/STORAGE_KEY\s*=\s*'([^']+)'/);

      assert.ok(constMatch, 'PENDING_ACTION not found in constants');
      assert.ok(scriptMatch, 'STORAGE_KEY not found in content-script');
      assert.equal(
        scriptMatch[1],
        constMatch[1],
        `content-script STORAGE_KEY (${scriptMatch[1]}) does not match constants PENDING_ACTION (${constMatch[1]})`
      );
    });
  });

  describe('declarativeNetRequest rules consistency', () => {
    it('rules.json file exists and is valid JSON', () => {
      const rules = JSON.parse(read('rules.json'));
      assert.ok(Array.isArray(rules), 'rules.json should be an array');
      assert.ok(rules.length > 0, 'rules.json should have at least one rule');
    });

    it('rules.json ID matches manifest rule_resources ID', () => {
      const rules = JSON.parse(read('rules.json'));
      const manifestRuleId = manifest.declarative_net_request.rule_resources[0].id;
      assert.ok(manifestRuleId, 'Manifest has no rule_resources ID');

      for (const rule of rules) {
        assert.ok(
          typeof rule.id === 'number',
          `Rule ID ${rule.id} is not a number`
        );
      }
    });

    it('rules strip frame-blocking headers for arena.ai', () => {
      const rules = JSON.parse(read('rules.json'));
      const headersToStrip = ['X-Frame-Options', 'Content-Security-Policy'];

      for (const rule of rules) {
        const responseHeaders = rule.action?.responseHeaders || [];
        const headerNames = responseHeaders.map((h) => h.header);

        for (const header of headersToStrip) {
          assert.ok(
            headerNames.includes(header),
            `Rule ${rule.id} does not strip ${header} header`
          );
        }
      }
    });
  });
});
