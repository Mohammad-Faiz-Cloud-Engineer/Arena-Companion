/**
 * Code Quality Tests - Arena Companion
 * Validates coding standards, safety patterns, and structural integrity
 * @module code-quality-tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

/**
 * Reads a file relative to project root
 * @param {string} filePath - Path relative to project root
 * @returns {string} File contents
 */
const read = (filePath) => readFileSync(join(ROOT, filePath), 'utf-8');

/**
 * Collects all files matching extensions from a directory recursively
 * @param {string} dir - Directory to scan
 * @param {string[]} exts - File extensions to include
 * @returns {Array<{path: string, content: string}>} Matching files
 */
const collectFiles = (dir, exts) => {
  const results = [];
  const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'tests') {
      results.push(...collectFiles(fullPath, exts));
    } else if (entry.isFile() && exts.includes(extname(entry.name))) {
      results.push({ path: fullPath, content: read(fullPath) });
    }
  }
  return results;
};

describe('Code Quality', () => {
  const jsFiles = collectFiles('.', ['.js']);
  const cssFiles = collectFiles('.', ['.css']);
  const allSourceFiles = [...jsFiles, ...cssFiles];

  /**
   * Normalizes path separators to forward slashes for cross-platform comparison
   * @param {string} p - Path to normalize
   * @returns {string} Normalized path
   */
  const normalize = (p) => p.replace(/\\/g, '/');

  describe('No console.* outside logger modules', () => {
    const LOGGER_FILES = ['utils/logger.js', 'content/content-script.js'];

    for (const { path, content } of jsFiles) {
      const normPath = normalize(path);
      if (LOGGER_FILES.some((f) => normPath.endsWith(f))) continue;
      if (normPath.includes('tests/')) continue;

      it(`${path} has no raw console.* calls`, () => {
        const lines = content.split('\n');
        const violations = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/\/\/.*console\./.test(line)) continue;
          if (/\bconsole\.(log|warn|error|debug|info)\b/.test(line)) {
            violations.push(`Line ${i + 1}: ${line.trim()}`);
          }
        }
        assert.equal(
          violations.length,
          0,
          `Raw console.* calls found in ${path}:\n${violations.join('\n')}`
        );
      });
    }
  });

  describe('No dangerous code patterns', () => {
    for (const { path, content } of jsFiles) {
      if (path.includes('tests/')) continue;

      it(`${path} has no eval()`, () => {
        assert.doesNotMatch(content, /\beval\s*\(/, `eval() found in ${path}`);
      });

      it(`${path} has no innerHTML assignment`, () => {
        assert.doesNotMatch(content, /innerHTML\s*=/, `innerHTML assignment found in ${path}`);
      });

      it(`${path} has no document.write`, () => {
        assert.doesNotMatch(content, /document\.write\s*\(/, `document.write found in ${path}`);
      });
    }
  });

  describe('No TODO/FIXME/HACK comments', () => {
    for (const { path, content } of jsFiles) {
      if (path.includes('tests/')) continue;

      it(`${path} has no TODO/FIXME/HACK/XXX comments`, () => {
        const matches = content.match(/\b(TODO|FIXME|HACK|XXX)\b/g);
        assert.equal(
          matches,
          null,
          `Found ${matches?.length} TODO/FIXME/HACK/XXX comment(s) in ${path}`
        );
      });
    }
  });

  describe('Object.freeze on utility exports', () => {
    const UTIL_FILES = ['utils/constants.js', 'utils/logger.js', 'utils/storage.js', 'utils/user-details.js'];

    for (const utilFile of UTIL_FILES) {
      it(`${utilFile} uses Object.freeze on exports`, () => {
        const content = read(utilFile);
        const exportMatches = content.match(/export\s+const\s+\w+/g) || [];
        const freezeMatches = content.match(/Object\.freeze/g) || [];
        assert.ok(
          freezeMatches.length > 0,
          `${utilFile} exports ${exportMatches.length} constant(s) but has no Object.freeze`
        );
      });
    }
  });

  describe('JSDoc on exported functions', () => {
    const MODULE_FILES = ['background/service-worker.js', 'sidepanel/scripts/main.js'];

    for (const moduleFile of MODULE_FILES) {
      it(`${moduleFile} has JSDoc on functions`, () => {
        const content = read(moduleFile);
        const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
        const jsdocBlocks = content.match(jsdocPattern) || [];
        assert.ok(
          jsdocBlocks.length >= 3,
          `${moduleFile} has only ${jsdocBlocks.length} JSDoc block(s), expected at least 3`
        );
      });
    }
  });

  describe('Version consistency across all source files', () => {
    it('all JS and CSS files have @version matching manifest', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const version = manifest.version;

      for (const { path, content } of allSourceFiles) {
        if (path.includes('tests/')) continue;
        if (path.includes('package.json')) continue;

        const versionMatch = content.match(/@version\s+(\S+)/);
        if (versionMatch) {
          assert.equal(
            versionMatch[1],
            version,
            `${path} has @version ${versionMatch[1]}, expected ${version}`
          );
        }
      }
    });

    it('runtime log messages reference current version', () => {
      const manifest = JSON.parse(read('manifest.json'));
      const version = manifest.version;
      const runtimeLogs = [
        { file: 'background/service-worker.js', pattern: /initialized\s+v[\d.]+/ },
        { file: 'sidepanel/scripts/main.js', pattern: /Initializing.*v[\d.]+/ },
        { file: 'content/content-script.js', pattern: /initializing.*v[\d.]+/i }
      ];

      for (const { file, pattern } of runtimeLogs) {
        const content = read(file);
        const match = content.match(pattern);
        if (match) {
          assert.ok(
            match[0].includes(version),
            `${file} runtime log references v${match[0].match(/v([\d.]+)/)?.[1]}, expected v${version}`
          );
        }
      }
    });
  });

  describe('Import integrity', () => {
    it('service-worker.js imports all required symbols from constants', () => {
      const content = read('background/service-worker.js');
      const expectedImports = [
        'ARENA_HOST_PATTERNS', 'CONFIG', 'ERROR_MESSAGES',
        'SUCCESS_MESSAGES', 'CONTEXT_MENU_IDS', 'PROMPT_TEMPLATES',
        'ACTION_STORAGE_KEYS'
      ];

      for (const symbol of expectedImports) {
        assert.ok(
          content.includes(symbol),
          `service-worker.js imports ${symbol} but does not use it`
        );
      }
    });

    it('no file imports non-existent modules', () => {
      for (const { path, content } of jsFiles) {
        const normPath = normalize(path);
        if (normPath.includes('tests/')) continue;

        const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
        for (const match of importMatches) {
          const importPath = match[1];
          if (importPath.startsWith('chrome') || importPath.startsWith('node:')) continue;

          const dir = normPath.substring(0, normPath.lastIndexOf('/'));
          const resolved = join(ROOT, dir, importPath).replace(/\\/g, '/');
          let exists = false;
          try {
            readFileSync(resolved);
            exists = true;
          } catch {
            exists = false;
          }
          assert.ok(exists, `${normPath} imports "${importPath}" which does not exist`);
        }
      }
    });
  });
});
