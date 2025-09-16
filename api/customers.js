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
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing Mollie API key' });
    return;
  }
  try {
    let url = 'https://api.mollie.com/v2/payments?limit=250';
    const map = new Map(); // email -> {name,email,total,count,lastPaymentAt}
    const customerCache = new Map(); // customerId -> {name,email}
    let guard = 0;

    const rawPayments = [];
    const missingCustomerIds = new Set();

    // 1) Fetch payments pages (only paid/authorized), collect minimal fields
    while (url && guard < 50) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });
      const items = data?._embedded?.payments || [];
      for (const p of items) {
        if (!['paid', 'authorized'].includes(p.status)) continue;
        const base = {
          customerId: p?.customerId || '',
          email: (p?.metadata?.email || p?.customer?.email || p?.billingEmail || '').toLowerCase(),
          name: p?.metadata?.name || p?.customer?.name || p?.billingName || '',
          amount: Number(p?.amount?.value || '0'),
          created: p?.createdAt || p?.paidAt || p?.authorizedAt || p?.statusChangedAt || new Date().toISOString(),
        };
        rawPayments.push(base);
        if (!base.email && base.customerId) missingCustomerIds.add(base.customerId);
      }
      url = data?._links?.next?.href || null;
      guard += 1;
    }

    // 2) Batch-fetch missing customers (parallel chunks)
    const ids = Array.from(missingCustomerIds);
    const chunkSize = 25;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(async (id) => {
          if (customerCache.has(id)) return [id, customerCache.get(id)];
          try {
            const rr = await fetch(`https://api.mollie.com/v2/customers/${id}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            const dd = await rr.json();
            const val = { name: dd?.name || '', email: (dd?.email || '').toLowerCase() };
            return [id, val];
          } catch (_) {
            return [id, { name: '', email: '' }];
          }
        })
      );
      results.forEach(([id, val]) => customerCache.set(id, val));
    }

    // 3) Aggregate per email
    for (const p of rawPayments) {
      let email = p.email;
      let name = p.name;
      if (!email && p.customerId && customerCache.has(p.customerId)) {
        const c = customerCache.get(p.customerId);
        email = c.email || email;
        name = name || c.name;
      }
      if (!email) continue;
      if (!map.has(email)) map.set(email, { name, email, total: 0, count: 0, lastPaymentAt: p.created });
      const ref = map.get(email);
      ref.name = ref.name || name;
      ref.total += p.amount;
      ref.count += 1;
      ref.lastPaymentAt = p.created > ref.lastPaymentAt ? p.created : ref.lastPaymentAt;
    }

    const customers = Array.from(map.values()).sort((a, b) => b.total - a.total);
    res.status(200).json({ customers });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', details: String(e) });
  }
}
