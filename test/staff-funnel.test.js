const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('dashboard heeft geen blogbeheer meer en bevat de Funnel-link', () => {
  const dashboard = read('personeel-dashboard.html');
  assert.equal(dashboard.includes('Blogbeheer'), false);
  assert.equal(dashboard.includes('Blog aanmaken'), false);
  assert.match(dashboard, /href="\/funnel">Funnel<\/a>/);
});

test('dashboard gebruikt dezelfde warme Vitalora-kleurstijl als de personeelslogin', () => {
  const dashboard = read('personeel-dashboard.html');
  const css = read('assets/css/staff-dashboard.css');

  assert.match(dashboard, /<body class="page-staff-shell page-staff-dashboard-warm">/);
  assert.match(dashboard, /staff-dashboard\.css\?v=1/);
  assert.match(dashboard, /fetch\('\/api\/staff\/guard'/);
  assert.match(dashboard, /fetch\('\/api\/orders-summary'/);
  assert.match(css, /--staff-moss:\s*#253129/);
  assert.match(css, /--staff-clay:\s*#bd7654/);
  assert.match(css, /--staff-paper:\s*#fffaf5/);
  assert.doesNotMatch(dashboard + css, /#2954B3|#3A9AEA|#eef7fe|#1d4ed8/i);
});

test('alle personeelschermen linken naar de Marketingmachine in dezelfde warme shell', () => {
  const pages = ['personeel-dashboard.html', 'klanten.html', 'funnel.html'].map(read);
  const shell = read('assets/css/staff-shell.css');
  const funnelCss = read('assets/css/staff-funnel.css');

  pages.forEach((html) => {
    assert.match(html, /href="\/marketingmachine">Marketingmachine<\/a>/);
    assert.match(html, /page-staff-shell/);
    assert.match(html, /staff-shell\.css\?v=1/);
  });
  assert.match(shell, /--staff-moss:\s*#253129/);
  assert.match(shell, /--staff-clay:\s*#bd7654/);
  assert.doesNotMatch(shell + funnelCss, /#2954B3|#3A9AEA|#eef7fe|#1d4ed8/i);
});

test('Marketingmachine toont drie funnelpagina’s en de mailingstamboom zonder verzonnen winnaars', () => {
  const page = read('marketingmachine.html');
  const config = JSON.parse(read('data/marketing-machine.json'));
  const vercel = JSON.parse(read('vercel.json'));

  assert.equal((page.match(/data-page-key=/g) || []).length, 3);
  assert.match(page, />E-book<\/h3>/);
  assert.match(page, />Aankoop<\/h3>/);
  assert.match(page, />Upsell<\/h3>/);
  assert.match(page, /id="mailing-title">Mailingstamboom<\/h2>/);
  assert.deepEqual(config.pages.map((item) => item.key), ['ebook', 'checkout', 'upsell']);
  assert.ok(config.pages.every((item) => item.variants.every((variant) => variant.visitors === null && variant.conversions === null)));
  assert.ok(config.pages.every((item) => item.variants.every((variant) => variant.decision === 'insufficient_data')));
  assert.equal(config.mailing.status, 'not_available');
  assert.deepEqual(config.mailing.steps, []);
  assert.ok(vercel.rewrites.some((item) => item.source === '/marketingmachine' && item.destination === '/marketingmachine.html'));
});

test('Marketingmachine-API is afgeschermd en rekent alleen echte beschikbare rates uit', async () => {
  const handler = require('../api/marketing-experiments.js');
  const unauthorized = { status: null, body: null, headers: {} };
  await handler(
    { method: 'GET', headers: {} },
    {
      setHeader(name, value) { unauthorized.headers[name] = value; },
      status(code) { unauthorized.status = code; return this; },
      json(body) { unauthorized.body = body; return this; },
    }
  );
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers['Cache-Control'], 'private, no-store');

  const previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'marketingmachine-test-secret';
  try {
    const login = require('../api/staff/login.js');
    let cookie = '';
    await login(
      { method: 'POST', body: { code: '000000' }, headers: {} },
      {
        setHeader(name, value) { if (name === 'Set-Cookie') cookie = value; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
      }
    );
    const result = { status: null, body: null };
    await handler(
      { method: 'GET', headers: { cookie: cookie.split(';')[0] } },
      {
        setHeader() {},
        status(code) { result.status = code; return this; },
        json(body) { result.body = body; return this; },
      }
    );
    assert.equal(result.status, 200);
    assert.equal(result.body.pages.length, 3);
    assert.ok(result.body.pages.every((item) => item.winnerVariantId === null));
    assert.ok(result.body.pages.every((item) => item.variants.every((variant) => variant.conversionRate === null)));
    assert.equal(result.body.mailing.steps.length, 0);
    assert.equal(result.body.summary.pageWinners, 0);
  } finally {
    if (previousSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSecret;
  }
});

test('Funnel-pagina bevat exact de drie gevraagde tabbladen', () => {
  const funnel = read('funnel.html');
  assert.match(funnel, />\s*Mailinglijst\s*<span/);
  assert.match(funnel, />\s*Clean Reset klanten\s*<span/);
  assert.match(funnel, />\s*Vitalora Academy\s*<span/);
  assert.equal((funnel.match(/role="tab"/g) || []).length, 3);
});

test('Funnel-API weigert een niet-ingelogde aanvraag voordat databronnen worden benaderd', async () => {
  const handler = require('../api/funnel.js');
  const req = { method: 'GET', headers: {} };
  const result = { status: null, body: null, headers: {} };
  const res = {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
  };

  await handler(req, res);
  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { error: 'Niet ingelogd' });
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
});

test('Funnel-API vraagt geen betaalde MailBlue-API aan en toont alleen betaalde Clean Reset-bestellingen', async () => {
  const previousEnv = {
    SESSION_SECRET: process.env.SESSION_SECRET,
    MOLLIE_API_KEY: process.env.MOLLIE_API_KEY,
  };
  const originalFetch = global.fetch;
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.MOLLIE_API_KEY = 'test-mollie-key';

  try {
    const login = require('../api/staff/login.js');
    let cookie = '';
    await login(
      { method: 'POST', body: { code: '000000' }, headers: {} },
      {
        setHeader(name, value) { if (name === 'Set-Cookie') cookie = value; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
      }
    );
    assert.match(cookie, /^vitalora_staff=/);

    global.fetch = async (url) => {
      if (String(url).startsWith('https://api.mollie.com/v2/payments')) {
        return new Response(JSON.stringify({
          _embedded: { payments: [
            { status: 'paid', description: 'Clean Reset Cursus', amount: { value: '47.00' }, metadata: { name: 'Sam de Boer', email: 'sam@example.nl' }, paidAt: '2026-08-21T12:00:00Z' },
            { status: 'paid', description: 'Ander product', amount: { value: '99.00' }, metadata: { name: 'Niet tonen', email: 'ander@example.nl' } },
            { status: 'failed', description: 'Clean Reset Cursus', amount: { value: '47.00' }, metadata: { name: 'Niet betaald', email: 'mislukt@example.nl' } },
          ] },
          _links: {},
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw new Error(`Onverwachte URL in test: ${url}`);
    };

    const handler = require('../api/funnel.js');
    const result = { status: null, body: null };
    await handler(
      { method: 'GET', headers: { cookie: cookie.split(';')[0] } },
      {
        setHeader() {},
        status(code) { result.status = code; return this; },
        json(body) { result.body = body; return this; },
      }
    );

    assert.equal(result.status, 200);
    assert.equal(result.body.mailingList.available, false);
    assert.match(result.body.mailingList.message, /Exporteer die lijst één keer/);
    assert.deepEqual(result.body.mailingList.contacts, []);
    assert.deepEqual(result.body.cleanReset.customers.map((item) => item.email), ['sam@example.nl']);
    assert.equal(result.body.cleanReset.customers[0].total, 47);
    assert.equal(result.body.academy.available, false);
  } finally {
    global.fetch = originalFetch;
    Object.entries(previousEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});
