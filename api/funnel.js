const { requireStaff } = require('./staff/login.js');

const CLEAN_RESET_PATTERN = /clean\s*reset/i;
const MAX_PAGES = 50;

function normalizeApiBase(value) {
  return String(value || '').replace(/\/+$/, '');
}

async function fetchEbookContacts() {
  const apiBase = normalizeApiBase(process.env.MAILBLUE_API_URL);
  const apiKey = process.env.MAILBLUE_API_KEY;
  const formId = String(process.env.MAILBLUE_EBOOK_FORM_ID || '3');

  if (!apiBase || !apiKey) {
    return {
      available: false,
      message: 'MailBlue is niet geconfigureerd.',
      contacts: [],
    };
  }

  const contacts = [];
  let lastId = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      formid: formId,
      limit: '100',
      id_greater: String(lastId),
      'orders[id]': 'ASC',
    });
    const response = await fetch(`${apiBase}/contacts?${params.toString()}`, {
      headers: { 'Api-Token': apiKey },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`MailBlue gaf status ${response.status}`);
    }

    const batch = Array.isArray(payload.contacts) ? payload.contacts : [];
    contacts.push(...batch.map((contact) => ({
      id: String(contact.id || ''),
      name: [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim(),
      email: String(contact.email || '').trim().toLowerCase(),
      addedAt: contact.cdate || contact.adate || contact.udate || null,
      status: 'Ingeschreven',
    })).filter((contact) => contact.email));

    if (batch.length < 100) break;
    const nextId = Number(batch[batch.length - 1]?.id || 0);
    if (!nextId || nextId <= lastId) break;
    lastId = nextId;
  }

  contacts.sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')));
  return { available: true, message: '', contacts };
}

async function fetchCleanResetCustomers() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return {
      available: false,
      message: 'Mollie is niet geconfigureerd.',
      customers: [],
    };
  }

  const map = new Map();
  let url = 'https://api.mollie.com/v2/payments?limit=250';

  for (let page = 0; url && page < MAX_PAGES; page += 1) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Mollie gaf status ${response.status}`);
    }

    const payments = payload?._embedded?.payments || [];
    for (const payment of payments) {
      if (!['paid', 'authorized'].includes(payment.status)) continue;
      if (!CLEAN_RESET_PATTERN.test(String(payment.description || ''))) continue;

      const email = String(
        payment?.metadata?.email ||
        payment?.customer?.email ||
        payment?.billingEmail ||
        ''
      ).trim().toLowerCase();
      if (!email) continue;

      const name = String(
        payment?.metadata?.name ||
        payment?.customer?.name ||
        payment?.billingName ||
        ''
      ).trim();
      const amount = Number(payment?.amount?.value || 0);
      const paidAt = payment.paidAt || payment.authorizedAt || payment.createdAt || null;
      const current = map.get(email) || {
        name,
        email,
        total: 0,
        orders: 0,
        lastPaymentAt: paidAt,
        status: 'Klant',
      };

      current.name = current.name || name;
      current.total += amount;
      current.orders += 1;
      if (String(paidAt || '') > String(current.lastPaymentAt || '')) {
        current.lastPaymentAt = paidAt;
      }
      map.set(email, current);
    }

    url = payload?._links?.next?.href || null;
  }

  const customers = Array.from(map.values())
    .sort((a, b) => String(b.lastPaymentAt || '').localeCompare(String(a.lastPaymentAt || '')));
  return { available: true, message: '', customers };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!requireStaff(req)) {
    res.status(401).json({ error: 'Niet ingelogd' });
    return;
  }

  const [mailingResult, cleanResetResult] = await Promise.allSettled([
    fetchEbookContacts(),
    fetchCleanResetCustomers(),
  ]);

  const mailingList = mailingResult.status === 'fulfilled'
    ? mailingResult.value
    : {
      available: false,
      message: /^MailBlue gaf status \d+$/.test(String(mailingResult.reason?.message || ''))
        ? `Mailinglijst kon niet worden geladen (${mailingResult.reason.message}).`
        : 'Mailinglijst kon niet worden geladen.',
      contacts: [],
    };
  const cleanReset = cleanResetResult.status === 'fulfilled'
    ? cleanResetResult.value
    : { available: false, message: 'Clean Reset-klanten konden niet worden geladen.', customers: [] };

  res.status(200).json({
    mailingList,
    cleanReset,
    academy: {
      available: false,
      message: 'Academy-toegang gebruikt nu een gedeelde toegangscode; er bestaan nog geen individuele accounts om hier te tonen.',
      customers: [],
    },
  });
};
