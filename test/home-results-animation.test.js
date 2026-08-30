const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('de resultaatcopy belooft niets en noemt de oude term niet', () => {
  const home = read('index.html');
  const resultsSection = home.match(/<!-- Results Section -->([\s\S]*?)<!-- CTA Section -->/)?.[1] || '';

  assert.match(resultsSection, /welke <span class="highlight">resultaten<\/span> hopen we te bereiken\?/);
  assert.match(resultsSection, /Dit zijn de resultaten waar we samen naartoe werken\./);
  assert.match(resultsSection, /uitkomst en het tempo per persoon kunnen verschillen\./);
  assert.doesNotMatch(resultsSection, /detox/i);
});

test('de percentagebalken animeren vloeiend op ieder scherm', () => {
  const home = read('index.html');
  const css = read('assets/css/home.css');
  const animation = home.match(/<script id="results-animation">([\s\S]*?)<\/script>/)?.[1] || '';

  assert.match(css, /\.progress-fill\s*\{[\s\S]*?transform:\s*scaleX\(0\)/);
  assert.match(css, /transition:\s*transform 1\.15s cubic-bezier/);
  assert.match(css, /\.results\.results-visible \.progress-fill\s*\{\s*transform:\s*scaleX\(1\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(animation, /IntersectionObserver/);
  assert.match(animation, /requestAnimationFrame\(revealProgressBars\)/);
  assert.match(animation, /observer\.disconnect\(\)/);
  assert.doesNotMatch(animation, /innerWidth\s*>\s*768|Only on mobile/);
  assert.doesNotMatch(css, /transition:\s*width 0\.8s ease-out/);
});
