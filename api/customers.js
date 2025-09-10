export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
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

    async function resolveCustomer(customerId) {
      if (!customerId) return { name: '', email: '' };
      if (customerCache.has(customerId)) return customerCache.get(customerId);
      try {
        const r = await fetch(`https://api.mollie.com/v2/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const d = await r.json();
        const val = { name: d?.name || '', email: (d?.email || '').toLowerCase() };
        customerCache.set(customerId, val);
        return val;
      } catch (_) {
        const val = { name: '', email: '' };
        customerCache.set(customerId, val);
        return val;
      }
    }
    while (url && guard < 50) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });
      const items = data?._embedded?.payments || [];
      for (const p of items) {
        if (!['paid', 'authorized'].includes(p.status)) continue;
        let email = (p?.metadata?.email || p?.customer?.email || p?.billingEmail || '').toLowerCase();
        let name = p?.metadata?.name || p?.customer?.name || p?.billingName || '';
        if (!email && p?.customerId) {
          const c = await resolveCustomer(p.customerId);
          email = c.email || email;
          name = name || c.name;
        }
        if (!email) continue;
        const amount = Number(p?.amount?.value || '0');
        const created = p?.createdAt || p?.paidAt || p?.authorizedAt || p?.statusChangedAt || new Date().toISOString();
        if (!map.has(email)) map.set(email, { name, email, total: 0, count: 0, lastPaymentAt: created });
        const ref = map.get(email);
        ref.name = ref.name || name;
        ref.total += amount;
        ref.count += 1;
        ref.lastPaymentAt = created > ref.lastPaymentAt ? created : ref.lastPaymentAt;
      }
      url = data?._links?.next?.href || null;
      guard += 1;
    }
    const customers = Array.from(map.values()).sort((a,b)=> b.total - a.total);
    res.status(200).json({ customers });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', details: String(e) });
  }
}


