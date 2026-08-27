const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('checkout gebruikt de warme Vitalora-laag en behoudt het betaalcontract', () => {
  const html = read('checkout-new.html');
  const css = read('assets/css/checkout-warm.css');
  const script = read('checkout-script.js');

  assert.match(html, /<body class="page-checkout-warm">/);
  assert.match(html, /meta name="theme-color" content="#253129"/);
  assert.match(html, /assets\/css\/checkout-warm\.css\?v=1/);
  assert.match(html, /assets\/images\/clean-reset-course-v2\.jpg/);
  assert.match(html, /24 heldere lessen/);
  assert.match(html, /class="discounted-price">€ 47,00/);
  assert.match(html, /placeholder="Voornaam"/);
  assert.match(html, /placeholder="Achternaam"/);
  assert.match(html, /placeholder="E-mailadres"/);
  assert.match(html, /id="terms" required>/);
  assert.doesNotMatch(html, /id="terms"[^>]*checked/);
  assert.match(html, /checkout-script\.js\?v=6/);
  assert.match(script, /fetch\('\/api\/create-payment'/);
  assert.match(script, /amountValue = '47\.00'/);
  assert.match(script, /!firstName \|\| !lastName \|\| !email \|\| !terms/);
  assert.match(css, /--checkout-moss: #253129/);
  assert.match(css, /--checkout-clay: #bd7654/);
  assert.doesNotMatch(css, /#2954B4|#3A9AEA|#10b981/i);
});

test('ebook gebruikt eerlijke warme copy en behoudt de opt-in naar checkout', () => {
  const html = read('ebook.html');
  const css = read('assets/css/ebook-warm.css');
  const script = read('landing-script.js');

  assert.match(html, /<body class="ebook-page ebook-page--warm">/);
  assert.match(html, /meta name="theme-color" content="#253129"/);
  assert.match(html, /assets\/css\/ebook-warm\.css\?v=2/);
  assert.equal((html.match(/assets\/images\/microplastics-ebook-warm-v2\.jpg/g) || []).length, 3);
  assert.equal((html.match(/class="hero-title-line"/g) || []).length, 3);
  assert.match(html, /De éérste methode/);
  assert.match(html, /in Nederland om <span class="highlight">Microplastics<\/span>/);
  assert.match(html, /uit je lichaam te Detoxen!/);
  assert.doesNotMatch(html, /lesson-06-b\.jpg/);
  assert.ok(fs.statSync(path.join(root, 'assets/images/microplastics-ebook-warm-v2.jpg')).size < 400_000);
  assert.match(html, /Geen paniek en geen wonderclaims/);
  assert.match(html, /id="ebook-claim"/);
  assert.match(html, /id="ebook-claim-bottom"/);
  assert.match(html, /id="ebook-modal"/);
  assert.match(html, /id="ebook-form"[^>]*action="\/api\/lead-optin"/);
  assert.match(html, /id="ebook-error"/);
  assert.match(html, /id="ebook-success"/);
  assert.match(script, /source: 'ebook_download'/);
  assert.match(script, /window\.location\.assign\('\/checkout'\)/);
  assert.doesNotMatch(html, /via\.placeholder\.com|Winstgevende Website Formule|revolutionaire|8\.000\+/i);
  assert.match(css, /--ebook-moss: #253129/);
  assert.match(css, /\.hero-title-line[\s\S]*display: block;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.hero-image::after[\s\S]*content: none;/);
  assert.match(css, /\.ebook-cover[\s\S]*object-fit: contain;/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.doesNotMatch(css, /#2954B3|#3A9AEA/i);
});
