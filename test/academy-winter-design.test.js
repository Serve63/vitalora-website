const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('alleen de Academy-pagina laadt de warme Academy-assets', () => {
  const academy = read('academy.html');
  const otherHtml = fs.readdirSync(root)
    .filter((file) => file.endsWith('.html') && file !== 'academy.html')
    .map((file) => read(file))
    .join('\n');

  assert.match(academy, /\/assets\/css\/academy-winter\.css\?v=2/);
  assert.match(academy, /\/assets\/js\/academy-overview\.js\?v=2/);
  assert.doesNotMatch(academy, /dashboard-styles\.css|dashboard-script\.js/);
  assert.doesNotMatch(otherHtml, /academy-winter\.css|academy-overview\.js/);
});

test('Academy gebruikt de warme Clean Reset-kleuren en geen koningsblauwe dashboardhero', () => {
  const css = read('assets/css/academy-winter.css');

  assert.match(css, /--academy-green:\s*#253129/);
  assert.match(css, /--academy-ivory:\s*#f4eee6/);
  assert.match(css, /--academy-clay:\s*#bf7654/);
  assert.match(css, /--academy-ink:\s*#292a25/);
  assert.doesNotMatch(css, /#2954b4|#2954b3|#3a9aea/i);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('alle zeven Image 2-beelden zijn gekoppeld, geoptimaliseerd en uniek', () => {
  const academy = read('academy.html');
  const imageNames = [
    'hero-winter.jpg',
    'course-clean-reset.jpg',
    'course-powerfoods.jpg',
    'course-balance.jpg',
    'course-30-days.jpg',
    'course-nutrition.jpg',
    'course-mindful.jpg',
  ];
  const hashes = new Set();

  imageNames.forEach((name) => {
    const relativePath = 'assets/images/academy/' + name;
    const absolutePath = path.join(root, relativePath);
    const bytes = fs.readFileSync(absolutePath);

    assert.match(academy, new RegExp('/assets/images/academy/' + name.replace('.', '\\.')));
    assert.ok(bytes.length < 500 * 1024, name + ' moet kleiner dan 500 KB blijven');
    assert.equal(bytes[0], 0xff, name + ' moet een JPEG zijn');
    assert.equal(bytes[1], 0xd8, name + ' moet een JPEG zijn');
    hashes.add(require('node:crypto').createHash('sha256').update(bytes).digest('hex'));
  });

  assert.equal(hashes.size, imageNames.length, 'Ieder Academy-beeld moet uniek zijn');
});

test('Academy bewaart de toegangspoort en toont afgesloten cursussen eerlijk', () => {
  const academy = read('academy.html');

  assert.match(academy, /location\.hostname === '127\.0\.0\.1'/);
  assert.match(academy, /!isLocalPreview && sessionStorage\.getItem/);
  assert.match(academy, /sessionStorage\.getItem\('academySession'\) !== 'ok'/);
  assert.match(academy, /window\.location\.replace\('\/login'\)/);
  assert.equal((academy.match(/aria-disabled="true"/g) || []).length, 5);
  assert.equal((academy.match(/Binnenkort/g) || []).length, 5);
  assert.match(academy, /href="\/detox-cursus\?lesson=1"/);
});

test('Academy hervat Clean Reset op basis van echte lesvoortgang', () => {
  const script = read('assets/js/academy-overview.js');

  assert.match(script, /progress:\$\{COURSE_SLUG\}:v\$\{contentVersion\}:\$\{lesson\.id\}:done/);
  assert.match(script, /lessons\.filter\(\(lesson\) => !lesson\.draft\)/);
  assert.match(script, /lessons\.find\(\(lesson\) => !isLessonComplete/);
  assert.match(script, /progressTrack\.setAttribute\('aria-valuenow'/);
  assert.match(script, /Ga verder met les \$\{nextLesson\.index\}/);
});
