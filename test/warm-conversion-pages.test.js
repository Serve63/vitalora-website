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
  assert.match(html, /assets\/css\/checkout-warm\.css\?v=4/);
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
  assert.match(html, /@supports \(-webkit-touch-callout: none\)[\s\S]*\.page-checkout-warm \.offer-countdown-bar\s*\{[\s\S]*position:\s*sticky;[\s\S]*top:\s*0;/);
  assert.match(html, /assets\/css\/checkout-warm\.css\?v=4/);
  assert.match(html, /assets\/images\/clean-reset-course-v2\.jpg/);
  assert.match(html, /class="discounted-price">€ 27,00/);
  assert.match(html, /data-country-picker/);
  assert.match(html, /class="country-trigger"[^>]*aria-haspopup="listbox"/);
  assert.doesNotMatch(html, /<select\b|id="terms"[^>]*checked/);
  assert.match(html, /checkout-script\.js\?v=7/);
  assert.match(script, /isWachtEven \? '€ 27,00'/);
  assert.match(script, /amountValue = '27\.00'/);
});

test('ebook herstelt de oorspronkelijke hero en behoudt de opt-in naar checkout', () => {
  const html = read('ebook.html');
  const css = read('assets/css/ebook-warm.css');
  const modalCss = read('assets/css/ebook-optin-modal.css');
  const script = read('assets/js/ebook-optin-modal.js');

  assert.match(html, /<body class="ebook-page ebook-page--warm">/);
  assert.match(html, /meta name="theme-color" content="#253129"/);
  assert.match(html, /assets\/css\/ebook-warm\.css\?v=10/);
  assert.match(html, /assets\/css\/ebook-optin-modal\.css\?v=6/);
  assert.match(html, /assets\/js\/ebook-optin-modal\.js\?v=1/);
  assert.equal((html.match(/microplastics-ebook-warm-v5\.png/g) || []).length, 3);
  assert.doesNotMatch(html, /ebook-product-mockup/);
  assert.equal((html.match(/class="hero-title-line"/g) || []).length, 3);
  assert.match(html, /De éérste methode/);
  assert.match(html, /in Nederland om <span class="highlight">Microplastics<\/span>/);
  assert.match(html, /uit je lichaam te Detoxen!/);
  assert.doesNotMatch(html, /in je dagelijks leven,|zonder paniek/i);
  assert.doesNotMatch(html, /lesson-06-b\.jpg/);
  const coverPath = path.join(root, 'assets/images/microplastics-ebook-warm-v5.png');
  assert.ok(fs.statSync(coverPath).size < 700_000);
  const coverBuffer = fs.readFileSync(coverPath);
  const colorType = coverBuffer.readUInt8(25);
  assert.ok(colorType === 6 || (colorType === 3 && coverBuffer.includes(Buffer.from('tRNS'))), 'PNG must contain transparency');
  assert.match(html, /Geen paniek en geen wonderclaims/);
  assert.match(html, /Gratis aan te vragen/);
  assert.match(html, /<p class="direct-access">ebook<\/p>/);
  assert.equal((html.match(/Claim jouw exemplaar →/g) || []).length, 2);
  assert.match(html, /Maak microplastics thuis eindelijk concreet\./);
  assert.doesNotMatch(html, /Gratis Vitalora-gids|Begin klein\. Kies wat vandaag bij je past\./);
  assert.match(html, /id="ebook-claim"/);
  assert.match(html, /id="ebook-claim-bottom"/);
  assert.match(html, /id="ebook-modal"[^>]*aria-modal="true"/);
  assert.match(html, /class="modal ebook-optin-modal hidden"/);
  assert.match(html, /Gratis download/);
  assert.match(html, /Elimineer Microplastics/);
  assert.match(html, /data-ebook-optin-close/);
  assert.match(html, /id="ebook-form"[^>]*action="\/api\/lead-optin"/);
  assert.match(html, /id="ebook-feedback"[^>]*role="alert" hidden/);
  assert.match(script, /source: 'ebook_download'/);
  assert.match(script, /window\.location\.assign\('\/checkout'\)/);
  assert.match(script, /focusableElements/);
  assert.match(script, /event\.key !== 'Tab'/);
  assert.match(script, /event\.target === modal/);
  assert.match(script, /document\.documentElement\.classList\.toggle\('ebook-optin-modal-open'/);
  assert.doesNotMatch(html, /via\.placeholder\.com|Winstgevende Website Formule|revolutionaire|8\.000\+/i);
  assert.match(css, /--ebook-moss: #253129/);
  assert.match(css, /--ebook-sand: #c6a57e/);
  assert.match(css, /\.hero-title-line[\s\S]*display: block;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.hero-image::after[\s\S]*content: none;/);
  assert.match(css, /\.ebook-cover[\s\S]*max-width: 520px;/);
  assert.match(css, /#ebook-claim:focus-visible[\s\S]*outline: 3px solid var\(--ebook-moss-deep\) !important;/);
  assert.match(css, /\.direct-access[\s\S]*background: #8b694b;[\s\S]*color: #fffaf5;/);
  assert.match(css, /\.ebook-page--warm \.direct-access[\s\S]*cursor: default;[\s\S]*transition: none;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.ebook-page--warm \.direct-access[\s\S]*width: fit-content;[\s\S]*display: inline-flex !important;/);
  assert.doesNotMatch(script, /directAccessButton/);
  assert.match(script, /const REQUEST_TIMEOUT_MS = 12000;/);
  assert.match(script, /activeSubmissionId \+= 1;/);
  assert.match(script, /submissionId !== activeSubmissionId/);
  assert.match(script, /nameInput\.focus\(\)/);
  assert.match(script, /emailInput\.focus\(\)/);
  assert.doesNotMatch(script, /addEventListener\('input'/);
  assert.match(modalCss, /\.ebook-optin-modal__panel[\s\S]*width: min\(580px, 100%\)/);
  assert.match(modalCss, /\.ebook-optin-modal__image[\s\S]*width: 170px/);
  assert.match(modalCss, /\.ebook-optin-modal__cta[\s\S]*background: var\(--ebook-modal-clay\) !important/);
  assert.match(css, /\.testimonial-card \.profession \{ color: #6f6a62; \}/);
  assert.match(css, /\.feature-item \.checkmark[\s\S]*background: var\(--ebook-sand\);[\s\S]*color: var\(--ebook-moss\);/);
  assert.doesNotMatch(css, /#eff5ff|#12c993|translateX/i);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.doesNotMatch(css, /#2954B3|#3A9AEA/i);
});

test('legacy landings behouden hun eigen modalcontroller zonder ebookregressie', () => {
  const legacyScript = read('landing-script.js');
  const ebookScript = read('assets/js/ebook-optin-modal.js');

  for (const file of ['landing.html', 'detox.html', 'detox/index.html']) {
    const html = read(file);
    assert.match(html, /landing-script\.js\?v=2/);
    assert.match(html, /class="modal-close"/);
    assert.match(html, /class="modal-backdrop"/);
    assert.match(html, /id="ebook-error"/);
  }

  assert.match(legacyScript, /modal\.querySelector\('\.modal-close'\)/);
  assert.match(legacyScript, /modal\.querySelector\('\.modal-backdrop'\)/);
  assert.match(legacyScript, /document\.getElementById\('ebook-error'\)/);
  assert.doesNotMatch(legacyScript, /data-ebook-optin-close|ebook-optin-modal-open/);
  assert.match(ebookScript, /data-ebook-optin-close/);
  assert.match(ebookScript, /ebook-optin-modal-open/);
});

test('succes- en bedankpagina blijven functioneel in de warme Vitalora-stijl', () => {
  const success = read('gefeliciteerd.html');
  const successCss = read('success-styles.css');
  const thanks = read('bedankt.html');
  const thanksCss = read('thanks-styles.css');

  assert.match(success, /<body class="page-success-warm">/);
  assert.match(success, /meta name="theme-color" content="#f1e3d8"/);
  assert.match(success, /success-styles\.css\?v=7/);
  assert.match(success, /<header class="ios-status-bar-surface" aria-hidden="true"><\/header>/);
  assert.match(success, /@supports \(-webkit-touch-callout: none\)[\s\S]*position:\s*fixed;[\s\S]*height:\s*32px;[\s\S]*background-color:\s*#f1e3d8;[\s\S]*background-image:\s*linear-gradient\(90deg, #f6ece3 0%, #f1e3d8 50%, #eeded1 100%\)/);
  assert.doesNotMatch(success, /\.page-success-warm main\s*\{\s*padding-top:/);
  assert.equal((success.match(/assets\/images\/academy\/course-/g) || []).length, 4);
  assert.doesNotMatch(success, /1\.200\+|70% korting|OCU\.png/);
  assert.match(success, /id="upsell-buy"/);
  assert.match(success, /id="skip-upsell"/);
  assert.match(success, /amount:'10\.00'/);
  assert.match(success, /fetch\('\/api\/create-payment'/);
  assert.match(successCss, /--success-moss:\s*#253129/);
  assert.match(successCss, /--success-clay:\s*#bd7654/);
  assert.match(successCss, /html\s*\{\s*background:\s*#f1e3d8;/);
  assert.match(successCss, /body\.page-success-warm\s*\{[\s\S]*background-color:\s*#f1e3d8;/);
  assert.match(successCss, /@supports \(-webkit-touch-callout: none\)[\s\S]*\.ios-status-bar-surface\s*\{[\s\S]*position:\s*fixed;[\s\S]*height:\s*32px;[\s\S]*background-color:\s*#f1e3d8;[\s\S]*background-image:\s*linear-gradient\(90deg, #f6ece3 0%, #f1e3d8 50%, #eeded1 100%\)/);
  assert.doesNotMatch(successCss, /padding-top:\s*calc\(clamp\(38px, 6vw, 78px\) - 32px\)/);

  assert.match(thanks, /<body class="page-thanks-warm">/);
  assert.match(thanks, /meta name="theme-color" content="#f1e3d8"/);
  assert.match(thanks, /thanks-styles\.css\?v=9/);
  assert.match(thanks, /<header class="ios-status-bar-surface" aria-hidden="true"><\/header>/);
  assert.match(thanks, /@supports \(-webkit-touch-callout: none\)[\s\S]*position:\s*fixed;[\s\S]*height:\s*32px;[\s\S]*background-color:\s*#f1e3d8;[\s\S]*background-image:\s*linear-gradient\(90deg, #f6ece3 0%, #f1e3d8 50%, #eeded1 100%\)/);
  assert.match(thanks, /\.page-thanks-warm \.container\s*\{\s*padding-top:\s*32px;/);
  assert.match(thanks, /clean-reset-welcome-warm-v2\.jpg/);
  assert.match(thanks, /Welkom bij<br>Clean Reset/);
  assert.match(thanks, /mailto:info@vitalora\.nl/);
  assert.match(thanksCss, /--thanks-moss:\s*#253129/);
  assert.match(thanksCss, /html\s*\{\s*background:\s*#f1e3d8;/);
  assert.match(thanksCss, /body\.page-thanks-warm\s*\{[\s\S]*background-color:\s*#f1e3d8;/);
  assert.match(thanksCss, /@supports \(-webkit-touch-callout: none\)[\s\S]*\.ios-status-bar-surface\s*\{[\s\S]*position:\s*fixed;[\s\S]*height:\s*32px;[\s\S]*background-color:\s*#f1e3d8;[\s\S]*background-image:\s*linear-gradient\(90deg, #f6ece3 0%, #f1e3d8 50%, #eeded1 100%\)/);
  assert.match(thanksCss, /@media \(min-width: 1000px\) and \(min-height: 760px\)[\s\S]*min-height: 100dvh;[\s\S]*justify-content: center;/);
  assert.match(thanksCss, /\.page-thanks-warm \.hero \.photo img[\s\S]*height: clamp\(300px, 42vh, 400px\);/);
  assert.match(thanksCss, /\.bullet[\s\S]*background: var\(--thanks-clay-dark\)/);
  assert.match(thanksCss, /\.help \.contact[\s\S]*background: var\(--thanks-clay-dark\)/);
  assert.doesNotMatch(thanksCss, /body\.page-thanks-warm\s*\{[\s\S]{0,160}overflow:\s*hidden/);
  assert.doesNotMatch(thanksCss, /padding-top:\s*calc\(clamp\(38px, 6vw, 72px\) - 32px\)/);
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

  assert.match(home, /home\.css\?v=196/);
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
