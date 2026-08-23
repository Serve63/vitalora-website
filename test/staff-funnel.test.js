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

test('e-bookleads blijven server-side en de tabel heeft RLS zonder publieke grants', () => {
  const store = read('api/_lib/ebook-leads-store.js');
  assert.match(store, /ALTER TABLE ebook_leads ENABLE ROW LEVEL SECURITY/);
  assert.match(store, /REVOKE ALL ON TABLE ebook_leads FROM anon/);
  assert.match(store, /REVOKE ALL ON TABLE ebook_leads FROM authenticated/);
});

test('database-URL laat de expliciete TLS-config gelden zonder verify-full te verzwakken', () => {
  const { normalizeConnectionString } = require('../api/_lib/db');
  const relaxed = new URL(normalizeConnectionString('postgres://user:pass@example.com/db?sslmode=require'));
  const verified = new URL(normalizeConnectionString('postgres://user:pass@example.com/db?sslmode=verify-full'));
  assert.equal(relaxed.searchParams.has('sslmode'), false);
  assert.equal(verified.searchParams.get('sslmode'), 'verify-full');
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

test('Funnel-API combineert opgeslagen e-bookinschrijvingen en alleen betaalde Clean Reset-bestellingen', async () => {
  const previousEnv = {
    SESSION_SECRET: process.env.SESSION_SECRET,
    MOLLIE_API_KEY: process.env.MOLLIE_API_KEY,
  };
  const originalFetch = global.fetch;
  const db = require('../api/_lib/db');
  const originalQuery = db.query;
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.MOLLIE_API_KEY = 'test-mollie-key';
  let leadInsertSeen = false;

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

    db.query = async (sql) => {
      if (/SELECT id, first_name, email/.test(sql)) {
        return { rows: [{ id: '9', first_name: 'Eva', email: 'eva@example.nl', source: 'ebook', first_downloaded_at: '2026-08-23T10:15:00Z' }] };
      }
      if (/INSERT INTO ebook_leads/.test(sql)) leadInsertSeen = true;
      return { rows: [], rowCount: 1 };
    };

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
    assert.deepEqual(result.body.mailingList.contacts.map((item) => item.email), ['eva@example.nl']);
    assert.deepEqual(result.body.cleanReset.customers.map((item) => item.email), ['sam@example.nl']);
    assert.equal(result.body.cleanReset.customers[0].total, 47);
    assert.equal(result.body.academy.available, false);

    global.fetch = async (url) => {
      assert.equal(String(url), 'https://mcvecommerce2.activehosted.com/proc.php');
      return new Response('success', { status: 200 });
    };
    const leadOptin = require('../api/lead-optin.js');
    const leadResult = { status: null, body: null };
    await leadOptin(
      { method: 'POST', body: { firstname: 'Eva', email: 'eva@example.nl', source: 'ebook' } },
      {
        setHeader() {},
        status(code) { leadResult.status = code; return this; },
        json(body) { leadResult.body = body; return this; },
      }
    );
    assert.equal(leadResult.status, 200);
    assert.equal(leadResult.body.success, true);
    assert.equal(leadInsertSeen, true);
  } finally {
    global.fetch = originalFetch;
    db.query = originalQuery;
    Object.entries(previousEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});
