const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('alleen de homepage laadt de warme home-laag', () => {
  const home = read('index.html');
  const otherHtml = fs.readdirSync(root)
    .filter((file) => file.endsWith('.html') && file !== 'index.html')
    .map((file) => read(file))
    .join('\n');

  assert.match(home, /\/assets\/css\/home\.css\?v=196/);
  assert.match(home, /meta name="theme-color" content="#253129"/);
  assert.doesNotMatch(otherHtml, /\/assets\/css\/home\.css/);
});

test('de warme laag verandert kleur en diepte maar geen homepage-layout', () => {
  const css = read('assets/css/home.css');
  const warmLayer = css.match(/\/\* HOME WARM ACADEMY LAYER START[\s\S]*?HOME WARM ACADEMY LAYER END \*\//)?.[0] || '';

  assert.match(warmLayer, /--home-moss:\s*#253129/);
  assert.match(warmLayer, /--home-ivory:\s*#f4eee6/);
  assert.match(warmLayer, /--home-clay:\s*#bf7654/);
  assert.match(warmLayer, /\.hero-image img\s*\{[\s\S]*#e3d4c2/);
  assert.match(warmLayer, /\.why-image img\s*\{[\s\S]*rgba\(226, 181, 150, 0\.5\)/);
  assert.match(warmLayer, /\.toxin-card,[\s\S]*\.result-item/);
  assert.match(warmLayer, /box-shadow:/);
  assert.doesNotMatch(warmLayer, /#2954b3|#3a9aea|#10b981|#edf7fd/i);
  assert.doesNotMatch(warmLayer, /\b(?:display|grid-template(?:-columns|-rows)?|gap|padding|margin|width|height|position|inset|top|right|bottom|left)\s*:/);
});

test('de homepage gebruikt zes duidelijke unieke Image 2-foto\'s en een warme vitaliteitsfoto', () => {
  const home = read('index.html');
  const assets = [
    'toxin-microplastics.jpg',
    'toxin-pfas.jpg',
    'toxin-bpa.jpg',
    'toxin-pesticides.jpg',
    'toxin-parabens.jpg',
    'toxin-phthalates.jpg',
    'vitality-winter.jpg'
  ];
  const hashes = new Set();

  assets.forEach((file) => {
    const relativePath = `assets/images/home-v2/${file}`;
    const fullPath = path.join(root, relativePath);
    assert.ok(fs.existsSync(fullPath), `${relativePath} ontbreekt`);
    assert.ok(fs.statSync(fullPath).size < 500_000, `${relativePath} is niet web-geoptimaliseerd`);
    hashes.add(crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex'));
    assert.match(home, new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  assert.equal(hashes.size, assets.length);
});

test('de bestaande homepage-onderdelen blijven op hun plek in de bron', () => {
  const home = read('index.html');

  assert.ok(home.indexOf('class="hero"') < home.indexOf('class="toxins"'));
  assert.ok(home.indexOf('class="toxins"') < home.indexOf('class="why"'));
  assert.ok(home.indexOf('class="why"') < home.indexOf('class="how"'));
  assert.ok(home.indexOf('class="how"') < home.indexOf('class="results"'));
  assert.equal((home.match(/class="toxin-card"/g) || []).length, 5);
  assert.equal((home.match(/class="process-card"/g) || []).length, 3);
  assert.equal((home.match(/class="result-item"/g) || []).length, 6);
});

test('de homepage-footer vermeldt Softora als websitebouwer', () => {
  const home = read('index.html');
  const footer = home.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] || '';

  assert.match(footer, /<a class="copy" href="https:\/\/www\.softora\.nl\/">Website gebouwd door Softora\.nl<\/a>/);
  assert.equal((home.match(/Website gebouwd door Softora\.nl/g) || []).length, 1);
});
