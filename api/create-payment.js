export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount = '0.10', description = 'Clean Reset Cursus', name, email, method, redirectUrl } = req.body || {};

    const payload = {
      amount: { currency: 'EUR', value: String(Number(amount).toFixed(2)) },
      description,
      redirectUrl: redirectUrl || 'https://www.vitalora.nl/bedankt.html',
      metadata: { name, email },
    };

    if (method) payload.method = method;

    const resp = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      res.status(resp.status).json({ error: data });
      return;
    }

    const checkoutUrl = data?._links?.checkout?.href;
    if (!checkoutUrl) {
      res.status(500).json({ error: 'No checkout URL from Mollie' });
      return;
    }

    res.status(200).json({ checkoutUrl });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error', details: String(err) });
  }
}
