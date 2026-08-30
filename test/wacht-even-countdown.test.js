const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    values
  };
}

function classes() {
  const values = new Set();
  return { add: (value) => values.add(value), contains: (value) => values.has(value) };
}

function fixture(sessionStorage) {
  const timer = {
    textContent: '30:00',
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const status = { textContent: 'Controleer je gegevens rustig' };
  const bar = {
    dataset: { durationMinutes: '30' },
    classList: classes(),
    querySelector(selector) { return selector.includes('timer') ? timer : status; }
  };
  const document = {
    querySelector(selector) {
      if (selector === '[data-offer-countdown]') return bar;
      return null;
    }
  };
  const intervals = [];
  const window = {
    sessionStorage,
    setInterval(fn) { intervals.push(fn); return intervals.length; },
    clearInterval() {}
  };
  return { timer, status, bar, document, window, intervals };
}

test('wacht-even gebruikt een echte 30-minutenbalk en verdedigbare productcopy', () => {
  const html = read('wacht-even.html');
  const css = read('assets/css/checkout-warm.css');

  assert.match(html, /checkout-warm\.css\?v=4/);
  assert.match(html, /data-offer-countdown data-duration-minutes="30"/);
  assert.match(html, /data-offer-countdown-timer[^>]*datetime="PT30M"[^>]*>30:00</);
  assert.match(html, /30 min check/);
  assert.match(html, /Controleer je gegevens rustig/);
  assert.match(html, /Verminder je blootstelling aan PFAS, BPA en microplastics — zonder paniek\./);
  assert.match(html, /24 korte lessen met haalbare keuzes/);
  assert.match(html, /assets\/js\/wacht-even-countdown\.js\?v=2/);
  assert.doesNotMatch(html, /data-offer-countdown-expired|bestelsessie is gesloten|Sessie verlopen|Eenmalig aanbod|rustig af binnen/);
  assert.doesNotMatch(html, /<h1>Clean Reset voor|<h1>[^<]*(?:uit je lichaam|elimineren|detoxen)/i);

  assert.match(css, /\.offer-countdown-bar[\s\S]*position: sticky;[\s\S]*min-height: 72px;/);
  assert.match(css, /\.offer-countdown-bar__timer[\s\S]*font-variant-numeric: tabular-nums;/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.offer-countdown-bar__label \{ display: none; \}/);
});

test('timer bewaart een absolute deadline, loopt na refresh door en eindigt zonder de checkout te blokkeren', () => {
  const { setupWachtEvenCountdown, STORAGE_KEY } = require('../assets/js/wacht-even-countdown.js');
  const sessionStorage = storage();
  let now = 1_000_000;
  const first = fixture(sessionStorage);
  const controller = setupWachtEvenCountdown({
    document: first.document,
    window: first.window,
    storage: sessionStorage,
    now: () => now
  });

  assert.ok(controller);
  assert.equal(first.timer.textContent, '30:00');
  assert.equal(Number(sessionStorage.getItem(STORAGE_KEY)), now + 30 * 60 * 1000);

  now += 61 * 1000;
  controller.render();
  assert.equal(first.timer.textContent, '28:59');

  const reload = fixture(sessionStorage);
  const reloadController = setupWachtEvenCountdown({
    document: reload.document,
    window: reload.window,
    storage: sessionStorage,
    now: () => now
  });
  assert.equal(reloadController.deadline, controller.deadline);
  assert.equal(reload.timer.textContent, '28:59');

  now = controller.deadline + 1;
  reloadController.render();
  assert.equal(reload.timer.textContent, '00:00');
  assert.equal(reload.status.textContent, 'Rond af wanneer jij wilt');
  assert.equal(reload.timer.attributes['aria-label'], 'Aftelperiode afgelopen');
  assert.equal(reload.bar.classList.contains('is-expired'), true);
});

test('timer blijft functioneren wanneer sessionStorage is geblokkeerd', () => {
  const { setupWachtEvenCountdown } = require('../assets/js/wacht-even-countdown.js');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const current = fixture(blocked);
  assert.doesNotThrow(() => setupWachtEvenCountdown({
    document: current.document,
    window: current.window,
    storage: blocked,
    now: () => 50_000
  }));
  assert.equal(current.timer.textContent, '30:00');
});
