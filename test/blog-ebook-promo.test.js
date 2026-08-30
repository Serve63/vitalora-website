const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const feed = JSON.parse(read('blog-feed.json'));

function count(value, pattern) {
  return (value.match(pattern) || []).length;
}

function memoryStorage(seed) {
  const values = new Map(Object.entries(seed || {}));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    values
  };
}

function classList() {
  const values = new Set();
  return {
    add: (name) => values.add(name),
    remove: (name) => values.delete(name),
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
    },
    contains: (name) => values.has(name),
    values
  };
}

function fixture(storage, sessionStorage, request) {
  const listeners = {};
  const timers = [];
  const htmlClasses = classList();
  const bodyClasses = classList();
  const previousFocus = { focused: false, focus() { this.focused = true; } };
  const close = {
    hidden: false,
    focused: false,
    addEventListener(type, fn) { listeners[`close:${type}`] = fn; },
    focus() { this.focused = true; doc.activeElement = this; }
  };
  const nameInput = { hidden: false, value: '', focused: false, focus() { this.focused = true; doc.activeElement = this; } };
  const emailInput = { hidden: false, value: '', focused: false, focus() { this.focused = true; doc.activeElement = this; } };
  const submit = { hidden: false, disabled: false, textContent: 'Claim jouw exemplaar' };
  const feedback = { hidden: true, textContent: '' };
  const form = {
    action: '/api/lead-optin',
    querySelector(selector) { return selector.includes('firstname') ? nameInput : emailInput; },
    addEventListener(type, fn) { listeners[`form:${type}`] = fn; }
  };
  const promoClasses = classList();
  const promo = {
    hidden: true,
    isConnected: true,
    classList: promoClasses,
    querySelector(selector) {
      if (selector.includes('close')) return close;
      if (selector.includes('form')) return form;
      if (selector.includes('cta')) return submit;
      if (selector.includes('feedback')) return feedback;
      return null;
    },
    querySelectorAll() { return [close, nameInput, emailInput, submit]; },
    contains(element) { return [close, nameInput, emailInput, submit, feedback].includes(element); },
    addEventListener(type, fn) { listeners[`promo:${type}`] = fn; },
    remove() { this.isConnected = false; }
  };
  const doc = {
    activeElement: previousFocus,
    documentElement: { scrollHeight: 2000, classList: htmlClasses },
    body: { classList: bodyClasses },
    querySelector(selector) { return selector === '[data-blog-ebook-promo]' ? promo : null; },
    addEventListener(type, fn) { listeners[`doc:${type}`] = fn; }
  };
  const location = { assigned: null, assign(value) { this.assigned = value; } };
  const win = {
    innerHeight: 800,
    scrollY: 0,
    location,
    requestAnimationFrame: (fn) => fn(),
    setTimeout(fn) { timers.push(fn); return timers.length; },
    clearTimeout() {},
    addEventListener(type, fn) { listeners[`win:${type}`] = fn; },
    removeEventListener() {},
    matchMedia: () => ({ matches: true })
  };

  return {
    storage,
    sessionStorage,
    request,
    listeners,
    timers,
    htmlClasses,
    bodyClasses,
    previousFocus,
    close,
    nameInput,
    emailInput,
    submit,
    feedback,
    form,
    promo,
    promoClasses,
    doc,
    win
  };
}

test('alle publieke blogoppervlakken bevatten exact één toegankelijke ebookmodal', () => {
  const files = [
    ...feed.map((post) => `${post.slug}.html`),
    'aardbeien-gezond.html',
    'blog.html',
    'blog/index.html',
    'post.html'
  ];

  assert.equal(feed.length, 13);
  for (const file of files) {
    const html = read(file);
    assert.equal(count(html, /<aside class="blog-ebook-promo ebook-optin-modal" data-blog-ebook-promo hidden/g), 1, file);
    assert.equal(count(html, /assets\/css\/ebook-optin-modal\.css\?v=6/g), 1, file);
    assert.equal(count(html, /assets\/js\/blog-ebook-promo\.js\?v=5/g), 1, file);
    assert.match(html, /role="dialog" aria-modal="true"/);
    assert.match(html, /aria-labelledby="blog-ebook-promo-title" aria-describedby="blog-ebook-promo-copy"/);
    assert.match(html, /data-blog-ebook-promo-form[^>]*method="post" action="\/api\/lead-optin"/);
    assert.match(html, /name="firstname"[^>]*autocomplete="given-name"/);
    assert.match(html, /name="email"[^>]*autocomplete="email"/);
    assert.match(html, /data-blog-ebook-promo-cta type="submit">Claim jouw exemplaar</);
    assert.match(html, /Gratis download/);
    assert.match(html, /Elimineer Microplastics/);
    assert.match(html, /class="ebook-optin-modal__image" src="\/assets\/images\/microplastics-ebook-warm-v5\.png"/);
    const promo = html.match(/<aside class="blog-ebook-promo ebook-optin-modal"[\s\S]*?<\/aside>/);
    assert.ok(promo, file);
    assert.doesNotMatch(promo[0], /Gratis Vitalora-gids|ebook-product-mockup/i);
  }

  for (const file of ['404.html', 'ebook.html']) {
    assert.doesNotMatch(read(file), /data-blog-ebook-promo/);
  }
});

test('de generator is de bron voor alle drie blogtemplates', () => {
  const builder = read('scripts/build-blog.js');
  assert.equal(count(builder, /\$\{ebookPromoAssets\(\)\}/g), 3);
  assert.equal(count(builder, /\$\{ebookPromo\(\)\}/g), 3);
  assert.match(builder, /function ebookPromoAssets\(\)/);
  assert.match(builder, /function ebookPromo\(\)/);
});

test('modal toont, vergrendelt focus en onthoudt sluiten fouttolerant', () => {
  const { setupBlogEbookPromo, STORAGE_KEY, SESSION_KEY } = require('../assets/js/blog-ebook-promo.js');
  const storage = memoryStorage();
  const sessionStorage = memoryStorage();
  const first = fixture(storage, sessionStorage);
  const controller = setupBlogEbookPromo({
    document: first.doc,
    window: first.win,
    storage,
    sessionStorage,
    fetch: async () => ({ ok: true, json: async () => ({ success: true }) })
  });

  assert.ok(controller);
  controller.reveal();
  assert.equal(first.promo.hidden, false);
  assert.ok(first.promoClasses.contains('is-visible'));
  assert.ok(first.htmlClasses.contains('blog-ebook-promo-open'));
  assert.ok(first.bodyClasses.contains('blog-ebook-promo-open'));
  assert.equal(first.nameInput.focused, true);
  assert.equal(sessionStorage.getItem(SESSION_KEY), '1');

  first.doc.activeElement = first.submit;
  let trapped = false;
  first.listeners['doc:keydown']({ key: 'Tab', shiftKey: false, preventDefault() { trapped = true; } });
  assert.equal(trapped, true);
  assert.equal(first.close.focused, true);

  first.listeners['close:click']();
  first.timers.at(-1)();
  assert.equal(first.promo.isConnected, false);
  assert.equal(first.htmlClasses.contains('blog-ebook-promo-open'), false);
  assert.equal(first.previousFocus.focused, true);
  assert.ok(JSON.parse(storage.getItem(STORAGE_KEY)).suppressedUntil > Date.now());

  const repeat = fixture(storage, memoryStorage());
  assert.equal(setupBlogEbookPromo({ document: repeat.doc, window: repeat.win, storage, sessionStorage: repeat.sessionStorage }), null);

  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const fallback = fixture(blocked, blocked);
  const fallbackController = setupBlogEbookPromo({ document: fallback.doc, window: fallback.win, storage: blocked, sessionStorage: blocked });
  assert.ok(fallbackController);
  assert.doesNotThrow(() => fallbackController.reveal());
  assert.doesNotThrow(() => fallback.listeners['close:click']());
});

test('formulier valideert, verstuurt via de bestaande opt-in en onderdrukt na succes 90 dagen', async () => {
  const { setupBlogEbookPromo, STORAGE_KEY } = require('../assets/js/blog-ebook-promo.js');
  const storage = memoryStorage();
  const sessionStorage = memoryStorage();
  let requestBody = null;
  const request = async (url, options) => {
    assert.equal(url, '/api/lead-optin');
    requestBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true }) };
  };
  const current = fixture(storage, sessionStorage, request);
  const controller = setupBlogEbookPromo({
    document: current.doc,
    window: current.win,
    storage,
    sessionStorage,
    fetch: request
  });
  controller.reveal();

  current.nameInput.value = 'S';
  current.emailInput.value = 'geen-mail';
  await current.listeners['form:submit']({ preventDefault() {} });
  assert.match(current.feedback.textContent, /voornaam/i);
  assert.equal(current.nameInput.focused, true);

  current.nameInput.value = 'Servé';
  current.emailInput.value = 'serve@example.com';
  await current.listeners['form:submit']({ preventDefault() {} });
  assert.deepEqual(requestBody, {
    firstname: 'Servé',
    email: 'serve@example.com',
    source: 'blog_ebook_popup'
  });
  assert.equal(current.win.location.assigned, '/checkout');
  const suppressedUntil = JSON.parse(storage.getItem(STORAGE_KEY)).suppressedUntil;
  assert.ok(suppressedUntil > Date.now() + 89 * 24 * 60 * 60 * 1000);
  assert.ok(suppressedUntil < Date.now() + 91 * 24 * 60 * 60 * 1000);
  assert.deepEqual(JSON.parse(storage.getItem('lead_data')), {
    name: 'Servé',
    email: 'serve@example.com',
    source: 'blog_ebook_popup'
  });
});

test('een hangende aanvraag kan altijd worden gesloten en laat de pagina niet vergrendeld', async () => {
  const { setupBlogEbookPromo } = require('../assets/js/blog-ebook-promo.js');
  const storage = memoryStorage();
  const sessionStorage = memoryStorage();
  const request = () => new Promise(() => {});
  const current = fixture(storage, sessionStorage, request);
  const controller = setupBlogEbookPromo({
    document: current.doc,
    window: current.win,
    storage,
    sessionStorage,
    fetch: request
  });
  controller.reveal();
  current.nameInput.value = 'Servé';
  current.emailInput.value = 'serve@example.com';

  const submission = current.listeners['form:submit']({ preventDefault() {} });
  await Promise.resolve();
  assert.equal(current.submit.disabled, true);

  current.listeners['close:click']();
  current.timers.at(-1)();
  await submission;

  assert.equal(current.promo.isConnected, false);
  assert.equal(current.htmlClasses.contains('blog-ebook-promo-open'), false);
  assert.equal(current.bodyClasses.contains('blog-ebook-promo-open'), false);
});

test('modal volgt het voorbeeld, de Vitalora-kleuren en ieder viewport', () => {
  const css = read('assets/css/ebook-optin-modal.css');
  assert.match(css, /@font-face[\s\S]*font-family: "Vitalora Popup";[\s\S]*Quicksand-400\.woff2/);
  assert.match(css, /\.ebook-optin-modal button,[\s\S]*\.ebook-optin-modal input[\s\S]*font-family: "Vitalora Popup"/);
  assert.match(css, /\.ebook-optin-modal \{[\s\S]*font-family: "Vitalora Popup"[\s\S]*line-height: normal;/);
  assert.match(css, /position: fixed !important;[\s\S]*inset: 0;/);
  assert.match(css, /background: rgba\(20, 28, 24, \.8\);/);
  assert.match(css, /\.ebook-optin-modal__panel[\s\S]*width: min\(580px, 100%\);[\s\S]*max-height:/);
  assert.match(css, /\.ebook-optin-modal__header[\s\S]*min-height: 122px;[\s\S]*background: var\(--ebook-modal-moss-deep\);/);
  assert.match(css, /\.ebook-optin-modal__body[\s\S]*grid-template-columns: 195px minmax\(0, 1fr\);/);
  assert.match(css, /\.ebook-optin-modal__close[\s\S]*top: -13px;[\s\S]*right: -13px;[\s\S]*width: 34px;[\s\S]*height: 34px;/);
  assert.match(css, /\.ebook-optin-modal__close[\s\S]*letter-spacing: 0;[\s\S]*text-transform: none;/);
  assert.match(css, /\.ebook-optin-modal__cta[\s\S]*letter-spacing: 0;[\s\S]*text-transform: none;/);
  assert.match(css, /outline: 3px solid var\(--ebook-modal-paper\) !important;/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*grid-template-columns: 1fr;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

  const script = read('assets/js/blog-ebook-promo.js');
  assert.match(script, /SHOW_DELAY_MS = 3500/);
  assert.match(script, /REQUEST_TIMEOUT_MS = 12000/);
  assert.match(script, /Promise\.race/);
  assert.match(script, /cancelPendingRequest/);
  assert.match(script, /source: 'blog_ebook_popup'/);
  assert.match(script, /event\.key !== 'Tab'/);
  assert.match(script, /win\.location\.assign\('\/checkout'\)/);
  assert.doesNotMatch(script, /IntersectionObserver|updateContextVisibility/);

  assert.match(css, /--ebook-modal-line: #b6a18e/);
  assert.match(css, /input::placeholder[\s\S]*color: #77736c/);
  assert.match(css, /__cta[\s\S]*background: var\(--ebook-modal-clay\) !important/);
  const feedbackBlock = css.match(/\.ebook-optin-modal__feedback \{([^}]*)\}/);
  assert.ok(feedbackBlock);
  assert.doesNotMatch(feedbackBlock[1], /display:\s*none/);
  assert.match(css, /\.ebook-optin-modal__feedback\[hidden\][\s\S]*display: none !important;/);
  assert.doesNotMatch(css, /font:\s*(?:600|750)[^;]*inherit/);
});

test('ebookpagina en blogs gebruiken exact hetzelfde visuele popupcontract', () => {
  const landing = read('ebook.html');
  const blog = read(`${feed[0].slug}.html`);
  const sharedTokens = [
    'ebook-optin-modal__panel',
    'ebook-optin-modal__close',
    'ebook-optin-modal__header',
    'ebook-optin-modal__eyebrow',
    'ebook-optin-modal__title',
    'ebook-optin-modal__body',
    'ebook-optin-modal__visual',
    'ebook-optin-modal__image',
    'ebook-optin-modal__content',
    'ebook-optin-modal__copy',
    'ebook-optin-modal__form',
    'ebook-optin-modal__cta',
    'ebook-optin-modal__trust'
  ];

  for (const token of sharedTokens) {
    assert.match(landing, new RegExp(`class="[^"]*${token}`), token);
    assert.match(blog, new RegExp(`class="[^"]*${token}`), token);
  }

  for (const text of [
    'Gratis download',
    'Elimineer Microplastics',
    'Ontdek in 12 minuten waar je microplastics tegenkomt en welke kleine keuzes je vandaag kunt maken.',
    'Claim jouw exemplaar',
    'Je gegevens blijven privé ·'
  ]) {
    assert.ok(landing.includes(text), text);
    assert.ok(blog.includes(text), text);
  }

  assert.equal(count(landing, /assets\/css\/ebook-optin-modal\.css\?v=6/g), 1);
  assert.equal(count(blog, /assets\/css\/ebook-optin-modal\.css\?v=6/g), 1);
});
