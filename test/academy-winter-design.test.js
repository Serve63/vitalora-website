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

  assert.match(academy, /\/assets\/css\/academy-winter\.css\?v=7/);
  assert.match(academy, /\/assets\/js\/academy-overview\.js\?v=5/);
  assert.doesNotMatch(academy, /dashboard-styles\.css|dashboard-script\.js/);
  assert.doesNotMatch(otherHtml, /academy-winter\.css|academy-overview\.js/);
});

test('Academy houdt de hero-titel op desktop bewust op twee regels', () => {
  const academy = read('academy.html');
  const css = read('assets/css/academy-winter.css');

  assert.match(academy, /<h1><span>Een rustige plek om te leren,<\/span><em>op jouw tempo\.<\/em><\/h1>/);
  assert.match(css, /\.academy-hero h1 > span\s*\{\s*white-space:\s*nowrap;/);
  assert.match(css, /font-size:\s*clamp\(38px, 3\.65vw, 50px\)/);
  assert.match(css, /font-size:\s*clamp\(34px, 3\.7vw, 46px\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?\.academy-hero h1 > span\s*\{\s*white-space:\s*normal;/);
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
  assert.match(css, /height:\s*clamp\(360px, 32vw, 450px\)/);
  assert.doesNotMatch(css, /height:\s*min\(80vh, 900px\)/);
});

test('de hero en zes onderscheidende cursusbeelden zijn gekoppeld, geoptimaliseerd en uniek', () => {
  const academy = read('academy.html');
  const imageNames = [
    'hero-winter.jpg',
    'course-clean-reset-v3.jpg',
    'course-powerfoods-v3.jpg',
    'course-balance-v3.jpg',
    'course-30-days-v3.jpg',
    'course-nutrition-v3.jpg',
    'course-mindful-v3.jpg',
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
  assert.match(read('assets/css/academy-winter.css'), /filter:\s*saturate\(1\.03\) contrast\(1\.01\)/);
  assert.doesNotMatch(academy, /course-(?:clean-reset|powerfoods|nutrition)\.jpg|course-(?:balance|30-days|mindful)-v2\.jpg/);
});

test('iedere cursus heeft een eigen herkenbaar beeldconcept en passende alttekst', () => {
  const academy = read('academy.html');
  const expectedCovers = [
    ['course-clean-reset-v3.jpg', 'glazen voorraadbakjes'],
    ['course-powerfoods-v3.jpg', 'Bovenaanzicht van kleurrijke bessen'],
    ['course-balance-v3.jpg', 'duinpad langs zee'],
    ['course-30-days-v3.jpg', 'dertigste houten schijfje'],
    ['course-nutrition-v3.jpg', 'Drie mensen van verschillende leeftijden'],
    ['course-mindful-v3.jpg', 'mistig bosmeer'],
  ];

  expectedCovers.forEach(([name, altFragment]) => {
    assert.match(academy, new RegExp(`src="/assets/images/academy/${name}"[^>]+alt="[^"]*${altFragment}`));
  });
});

test('Academy bewaart de toegangspoort en toont zes beschikbare cursussen', () => {
  const academy = read('academy.html');

  assert.match(academy, /location\.hostname === '127\.0\.0\.1'/);
  assert.match(academy, /!isLocalPreview && sessionStorage\.getItem/);
  assert.match(academy, /sessionStorage\.getItem\('academySession'\) !== 'ok'/);
  assert.match(academy, /window\.location\.replace\('\/login'\)/);
  assert.equal((academy.match(/aria-disabled="true"/g) || []).length, 0);
  assert.equal((academy.match(/Binnenkort/g) || []).length, 0);
  assert.equal((academy.match(/>Beschikbaar</g) || []).length, 6);
  assert.equal((academy.match(/<(?:a|article) class="academy-course-card/g) || []).length, 6);
  assert.match(academy, /href="\/detox-cursus\?lesson=1"/);
});

test('Academy zet de websitelink links en verwijdert het Vitalora-merk uit de navigatie', () => {
  const academy = read('academy.html');
  const nav = academy.match(/<nav class="academy-nav"[\s\S]*?<\/nav>/)?.[0] || '';

  assert.match(nav, /class="academy-home-link"[\s\S]*Terug naar website/);
  assert.doesNotMatch(nav, /academy-brand|academy-nav-label|Mijn Academy|>Vitalora</);
  assert.match(read('assets/css/academy-winter.css'), /\.academy-nav\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
});

test('Academy hervat Clean Reset op basis van echte lesvoortgang', () => {
  const academy = read('academy.html');
  const script = read('assets/js/academy-overview.js');

  assert.match(script, /progress:\$\{COURSE_SLUG\}:v\$\{contentVersion\}:\$\{lesson\.id\}:done/);
  assert.match(script, /lessons\.filter\(\(lesson\) => !lesson\.draft\)/);
  assert.match(script, /lessons\.find\(\(lesson\) => !isLessonComplete/);
  assert.match(script, /progressTrack\.setAttribute\('aria-valuenow'/);
  assert.match(script, /Ga verder met les \$\{nextLesson\.index\}/);
  assert.match(script, /next-lesson-title/);
  assert.match(script, /resume-summary/);
  assert.match(script, /Les \$\{lesson\.index\} van \$\{total\}/);
  assert.match(script, /resumeSummary\.hidden = !message/);
  assert.match(academy, /id="resume-summary" hidden><\/p>/);
  assert.doesNotMatch(academy, /academy-hero-actions|hero-course-link|Je voortgang wordt automatisch bewaard|Je staat aan het begin/);
  assert.doesNotMatch(script, /hero-course-link|heroText/);
  assert.match(academy, /<span>Vitalora\.nl<\/span>/);
  assert.match(read('assets/css/academy-winter.css'), /\.page-academy \.academy-course-button\s*\{[\s\S]*color:\s*#fffaf3;/);
});
