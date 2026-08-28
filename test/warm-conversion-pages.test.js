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
  assert.match(html, /assets\/css\/checkout-warm\.css\?v=2/);
  assert.match(html, /assets\/images\/clean-reset-course-v2\.jpg/);
  assert.match(html, /24 heldere lessen/);
  assert.match(html, /class="discounted-price">€ 47,00/);
  assert.match(html, /placeholder="Voornaam"/);
  assert.match(html, /placeholder="Achternaam"/);
  assert.match(html, /placeholder="E-mailadres"/);
  assert.match(html, /id="terms" required>/);
  assert.doesNotMatch(html, /id="terms"[^>]*checked/);
  assert.match(html, /checkout-script\.js\?v=7/);
  assert.doesNotMatch(html, /checkout-back|<select\b/);
  assert.match(html, /data-country-picker/);
  assert.match(html, /id="country" name="country" value="Nederland"/);
  assert.match(html, /class="country-trigger"[^>]*aria-haspopup="listbox"/);
  assert.match(html, /id="country-list" role="listbox"/);
  assert.match(script, /fetch\('\/api\/create-payment'/);
  assert.match(script, /amountValue = '47\.00'/);
  assert.match(script, /!firstName \|\| !lastName \|\| !email \|\| !terms/);
  assert.match(css, /--checkout-moss: #253129/);
  assert.match(css, /--checkout-clay: #bd7654/);
  assert.match(css, /\.checkout-layout[\s\S]*align-items: stretch;/);
  assert.match(css, /\.product-info,[\s\S]*\.checkout-form[\s\S]*height: 100%;/);
  assert.match(css, /\.country-trigger[\s\S]*border-color: var\(--checkout-clay\);/);
  assert.match(css, /\.country-options[\s\S]*position: absolute;/);
  assert.match(script, /closeCountryPicker/);
  assert.match(script, /\['ArrowDown', 'ArrowUp', 'Enter', ' '\]/);
  assert.match(script, /hiddenInput\.dispatchEvent/);
  assert.doesNotMatch(css, /#2954B4|#3A9AEA|#10b981/i);
});

test('eenmalig aanbod gebruikt dezelfde warme checkout zonder systeemdropdown', () => {
  const html = read('wacht-even.html');
  const script = read('checkout-script.js');

  assert.match(html, /<body class="page-checkout-warm">/);
  assert.match(html, /meta name="theme-color" content="#253129"/);
  assert.match(html, /html\s*\{\s*background:\s*#253129;/);
  assert.match(html, /assets\/css\/checkout-warm\.css\?v=2/);
  assert.match(html, /assets\/images\/clean-reset-course-v2\.jpg/);
  assert.match(html, /class="discounted-price">€ 27,00/);
  assert.match(html, /data-country-picker/);
  assert.match(html, /class="country-trigger"[^>]*aria-haspopup="listbox"/);
  assert.doesNotMatch(html, /<select\b|id="terms"[^>]*checked/);
  assert.match(html, /checkout-script\.js\?v=7/);
  assert.match(script, /isWachtEven \? '€ 27,00'/);
  assert.match(script, /amountValue = '27\.00'/);
});

test('ebook gebruikt eerlijke warme copy en behoudt de opt-in naar checkout', () => {
  const html = read('ebook.html');
  const css = read('assets/css/ebook-warm.css');
  const script = read('landing-script.js');

  assert.match(html, /<body class="ebook-page ebook-page--warm">/);
  assert.match(html, /meta name="theme-color" content="#253129"/);
  assert.match(html, /assets\/css\/ebook-warm\.css\?v=7/);
  assert.equal((html.match(/assets\/images\/microplastics-ebook-warm-v5\.png/g) || []).length, 3);
  assert.equal((html.match(/class="hero-title-line"/g) || []).length, 3);
  assert.match(html, /De éérste methode/);
  assert.match(html, /in Nederland om <span class="highlight">Microplastics<\/span>/);
  assert.match(html, /uit je lichaam te Detoxen!/);
  assert.doesNotMatch(html, /lesson-06-b\.jpg/);
  const coverPath = path.join(root, 'assets/images/microplastics-ebook-warm-v5.png');
  assert.ok(fs.statSync(coverPath).size < 700_000);
  const coverBuffer = fs.readFileSync(coverPath);
  const colorType = coverBuffer.readUInt8(25);
  assert.ok(colorType === 6 || (colorType === 3 && coverBuffer.includes(Buffer.from('tRNS'))), 'PNG must contain transparency');
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
  assert.match(css, /--ebook-sand: #c6a57e/);
  assert.match(css, /\.hero-title-line[\s\S]*display: block;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.hero-image::after[\s\S]*content: none;/);
  assert.match(css, /\.ebook-cover[\s\S]*object-fit: contain;/);
  assert.match(css, /\.ebook-cover[\s\S]*filter: drop-shadow/);
  assert.match(css, /#ebook-modal \.modal-copy[\s\S]*background: transparent !important;/);
  assert.match(css, /#ebook-modal \.modal-cta[\s\S]*transform: none !important;/);
  assert.match(css, /#ebook-modal \.modal-trust[\s\S]*background: transparent !important;/);
  assert.match(css, /#ebook-modal \.modal-trust::before[\s\S]*content: none !important;/);
  assert.match(css, /\.feature-item \.checkmark[\s\S]*background: var\(--ebook-sand\);[\s\S]*color: var\(--ebook-moss\);/);
  assert.match(css, /#ebook-claim:focus-visible[\s\S]*outline: 0 !important;/);
  assert.doesNotMatch(css, /#eff5ff|#12c993|translateX/i);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.doesNotMatch(css, /#2954B3|#3A9AEA/i);
});

test('succes- en bedankpagina blijven functioneel in de warme Vitalora-stijl', () => {
  const success = read('gefeliciteerd.html');
  const successCss = read('success-styles.css');
  const thanks = read('bedankt.html');
  const thanksCss = read('thanks-styles.css');

  assert.match(success, /<body class="page-success-warm">/);
  assert.match(success, /meta name="theme-color" content="#f9f2ea"/);
  assert.match(success, /success-styles\.css\?v=3/);
  assert.equal((success.match(/assets\/images\/academy\/course-/g) || []).length, 4);
  assert.doesNotMatch(success, /1\.200\+|70% korting|OCU\.png/);
  assert.match(success, /id="upsell-buy"/);
  assert.match(success, /id="skip-upsell"/);
  assert.match(success, /amount:'10\.00'/);
  assert.match(success, /fetch\('\/api\/create-payment'/);
  assert.match(successCss, /--success-moss:\s*#253129/);
  assert.match(successCss, /--success-clay:\s*#bd7654/);
  assert.match(successCss, /html\s*\{\s*background:\s*#f9f2ea;/);

  assert.match(thanks, /<body class="page-thanks-warm">/);
  assert.match(thanks, /meta name="theme-color" content="#f9f2ea"/);
  assert.match(thanks, /thanks-styles\.css\?v=4/);
  assert.match(thanks, /clean-reset-welcome-warm-v2\.jpg/);
  assert.match(thanks, /Welkom bij<br>Clean Reset/);
  assert.match(thanks, /mailto:info@vitalora\.nl/);
  assert.match(thanksCss, /--thanks-moss:\s*#253129/);
  assert.match(thanksCss, /html\s*\{\s*background:\s*#f9f2ea;/);
  assert.doesNotMatch(thanksCss, /#2954B4|#2954B3|#3A9AEA/i);
});

test('personeel en juridische pagina’s gebruiken één warme stijllaag zonder functieverlies', () => {
  const staff = read('personeel.html');
  const privacy = read('privacy.html');
  const privacyIndex = read('privacy/index.html');
  const terms = read('voorwaarden.html');
  const termsIndex = read('voorwaarden/index.html');
  const css = read('assets/css/warm-utility-pages.css');

  assert.match(staff, /<body class="page-staff-warm">/);
  assert.match(staff, /id="staff-login"/);
  assert.equal((staff.match(/class="pin-input"/g) || []).length, 6);
  assert.match(staff, /fetch\('\/api\/staff\/login'/);
  [privacy, privacyIndex, terms, termsIndex].forEach((html) => {
    assert.match(html, /<body class="page-legal-warm">/);
    assert.match(html, /class="legal-document"/);
    assert.match(html, /warm-utility-pages\.css\?v=1/);
  });
  assert.match(css, /--utility-moss:\s*#253129/);
  assert.match(css, /--utility-clay:\s*#bd7654/);
  assert.doesNotMatch(css, /#23469D|#2954B3|#3A9AEA/i);
});

test('homepage en favicon gebruiken de nieuwe Image 2-assets', () => {
  const home = read('index.html');
  const imagePath = path.join(root, 'assets/images/vitalora-home-hero-warm-v2.jpg');
  const faviconPath = path.join(root, 'assets/images/vitalora logo.webp');

  assert.match(home, /home\.css\?v=195/);
  assert.match(home, /assets\/images\/vitalora-home-hero-warm-v2\.jpg/);
  assert.doesNotMatch(home, /vitalora-founder-portrait\.jpg/);
  assert.ok(fs.statSync(imagePath).size < 500 * 1024);
  assert.ok(fs.statSync(faviconPath).size < 100 * 1024);
  assert.equal(fs.readFileSync(faviconPath).subarray(8, 12).toString(), 'WEBP');
});

test('blogindex houdt alleen Vitalora.nl in de bovenbalk', () => {
  [read('blog.html'), read('blog/index.html')].forEach((html) => {
    assert.match(html, /class="editorial-brand"[^>]*>Vitalora\.nl<\/a>/);
    assert.doesNotMatch(html, /class="editorial-nav"|>Alle artikelen<|>Mijn Academy</);
  });
});
