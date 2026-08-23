const { requireStaff } = require('./staff/login.js');

const CLEAN_RESET_PATTERN = /clean\s*reset/i;
const MAX_PAGES = 50;

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

  const [cleanResetResult] = await Promise.allSettled([fetchCleanResetCustomers()]);

  const mailingList = {
    available: false,
    message: 'Historische e-bookdownloaders staan in MailBlue. Exporteer die lijst één keer om hem hier te tonen; de contacten-API is niet beschikbaar in het huidige abonnement.',
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
