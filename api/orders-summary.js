const { requireStaff } = require('./staff/login.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const staff = requireStaff(req);
  if (!staff) {
    res.status(401).json({ error: 'Niet ingelogd' });
    return;
  }

  const apiKey = process.env.MOLLIE_API_KEY || process.env.MOLLIE_LIVE_KEY || process.env.MOLLIE_TEST_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing Mollie API key' });
    return;
  }

  try {
    let url = 'https://api.mollie.com/v2/payments?limit=250';
    let allPayments = [];
    let guard = 0;

    while (url && guard < 50) { // safety guard for pagination
      const mRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });
      const text = await mRes.text();
      let data = {};
      try { data = JSON.parse(text || '{}'); } catch(_) { data = {}; }
      if (!mRes.ok) {
        const code = data?.status || mRes.status;
        const message = data?.title || data?.detail || 'Mollie API error';
        return res.status(code).json({ error: message, details: data });
      }
      const items = Array.isArray(data?._embedded?.payments)
        ? data._embedded.payments
        : [];
      allPayments = allPayments.concat(items);
      url = data?._links?.next?.href || null;
      guard += 1;
    }

    // Sum only successful/authorized payments; ignore refunds/chargebacks
    const relevant = allPayments.filter((p) => {
      const st = String(p?.status || '').toLowerCase();
      if (!['paid', 'authorized'].includes(st)) return false;
      const amount = Number(p?.amount?.value || '0');
      return amount > 0;
    });

    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const todayD = today.getDate();

    let sumAll = 0;
    let sumYear = 0;
    let sumMonth = 0;
    let sumToday = 0;

    for (const p of relevant) {
      const amount = Number(p?.amount?.value || '0');
      const created = new Date(
        p?.paidAt || p?.authorizedAt || p?.createdAt || p?.created || p?.statusChangedAt || Date.now()
      );
      sumAll += amount;
      if (created.getFullYear() === todayY) sumYear += amount;
      if (created.getFullYear() === todayY && created.getMonth() === todayM) sumMonth += amount;
      if (
        created.getFullYear() === todayY &&
        created.getMonth() === todayM &&
        created.getDate() === todayD
      )
        sumToday += amount;
    }

    // Small cache to reduce API calls (safe for 30s)
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
    res.status(200).json({
      currency: 'EUR',
      allTime: Number(sumAll.toFixed(2)),
      year: Number(sumYear.toFixed(2)),
      month: Number(sumMonth.toFixed(2)),
      today: Number(sumToday.toFixed(2)),
      count: {
        all: relevant.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error', details: String(err?.message || err) });
  }
}
