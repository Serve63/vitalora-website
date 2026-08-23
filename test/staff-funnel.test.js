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

test('Funnel-API combineert e-bookinschrijvingen en alleen betaalde Clean Reset-bestellingen', async () => {
  const previousEnv = {
    SESSION_SECRET: process.env.SESSION_SECRET,
    MAILBLUE_API_URL: process.env.MAILBLUE_API_URL,
    MAILBLUE_API_KEY: process.env.MAILBLUE_API_KEY,
    MOLLIE_API_KEY: process.env.MOLLIE_API_KEY,
  };
  const originalFetch = global.fetch;
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.MAILBLUE_API_URL = 'https://mailblue.test/api/3';
  process.env.MAILBLUE_API_KEY = 'test-mailblue-key';
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
      if (String(url).startsWith('https://mailblue.test/api/3/contacts?')) {
        assert.match(String(url), /formid=3/);
        return new Response(JSON.stringify({
          contacts: [{ id: '9', firstName: 'Eva', lastName: 'Jansen', email: 'Eva@example.nl', cdate: '2026-08-23T10:15:00Z' }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
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
    assert.deepEqual(result.body.mailingList.contacts.map((item) => item.email), ['eva@example.nl']);
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
