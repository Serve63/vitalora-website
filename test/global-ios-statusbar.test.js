const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const sharedStylesheet = '<link rel="stylesheet" href="/assets/css/ios-statusbar.css?v=1">';

function trackedHtmlFiles() {
  return execFileSync('git', ['ls-files', '*.html'], { cwd: repoRoot, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
}

test('elk volledig HTML-document heeft dezelfde vaste iOS-statusbalkbasis', () => {
  let documents = 0;

  for (const relativePath of trackedHtmlFiles()) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    if (!/<html\b/i.test(source) || !/<head\b/i.test(source) || !/<body\b/i.test(source)) continue;
    documents += 1;

    const theme = source.match(/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i);
    assert.ok(theme, `${relativePath}: theme-color ontbreekt`);
    assert.ok(source.includes(sharedStylesheet), `${relativePath}: gedeelde iOS-stylesheet ontbreekt`);
    assert.match(
      source,
      new RegExp(`<html\\b[^>]*style=["'][^"']*--ios-statusbar-color\\s*:\\s*${theme[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["']`, 'i'),
      `${relativePath}: HTML-achtergrond wijkt af van theme-color`
    );
    assert.match(
      source,
      /<body\b[^>]*>\s*<(?:div|header)\b[^>]*class=["'][^"']*\bios-status-bar-surface\b[^"']*["'][^>]*aria-hidden=["']true["'][^>]*><\/(?:div|header)>/i,
      `${relativePath}: vaste statusbalk is niet het eerste body-element`
    );
    assert.equal((source.match(/class=["'][^"']*\bios-status-bar-surface\b[^"']*["']/gi) || []).length, 1, `${relativePath}: statusbalk staat dubbel`);
  }

  assert.ok(documents >= 260, `expected at least 260 full HTML documents, found ${documents}`);
});

test('de gedeelde iOS-statusbalk neemt geen layoutruimte in', () => {
  const css = fs.readFileSync(path.join(repoRoot, 'assets/css/ios-statusbar.css'), 'utf8');
  assert.match(css, /@supports \(-webkit-touch-callout:\s*none\)/);
  assert.match(css, /\.ios-status-bar-surface\s*\{[\s\S]*position:\s*fixed;[\s\S]*top:\s*0;[\s\S]*left:\s*0;[\s\S]*width:\s*100%;[\s\S]*height:\s*32px;/);
  assert.match(css, /background-color:\s*var\(--ios-statusbar-color,\s*#253129\);/);
  assert.match(css, /pointer-events:\s*none;/);
  assert.doesNotMatch(css, /position:\s*(?:-webkit-)?sticky|flex:\s*0 0 32px|padding-top/);
});

test('gegenereerde en dynamische HTML-routes behouden het globale contract', () => {
  const builder = fs.readFileSync(path.join(repoRoot, 'scripts/build-blog.js'), 'utf8');
  const staff = fs.readFileSync(path.join(repoRoot, 'api/staff/index.js'), 'utf8');
  assert.equal((builder.match(/--ios-statusbar-color:\s*#253129/g) || []).length, 3);
  assert.equal((builder.match(/\/assets\/css\/ios-statusbar\.css\?v=1/g) || []).length, 3);
  assert.equal((builder.match(/class="ios-status-bar-surface"/g) || []).length, 3);
  assert.match(staff, /theme-color/);
  assert.match(staff, /\/assets\/css\/ios-statusbar\.css\?v=1/);
  assert.match(staff, /class="ios-status-bar-surface"/);
});
