export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount = '0.10', description = 'Clean Reset Cursus', name, email, method, redirectUrl, enableRecurring, customerId, recurring } = req.body || {};

    const payload = {
      amount: { currency: 'EUR', value: String(Number(amount).toFixed(2)) },
      description,
      redirectUrl: redirectUrl || 'https://www.vitalora.nl/gefeliciteerd',
      metadata: { name, email },
    };

    if (method) payload.method = method;

    // If this is the first payment of a recurring flow, create customer and mark sequenceType
    let currentCustomerId = customerId;
    if (enableRecurring && !currentCustomerId) {
      const createCustomer = await fetch('https://api.mollie.com/v2/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || 'Customer',
          email,
        }),
      });
      const custData = await createCustomer.json();
      if (!createCustomer.ok) {
        res.status(createCustomer.status).json({ error: custData });
        return;
      }
      currentCustomerId = custData.id;
    }

    if (enableRecurring) {
      payload.customerId = currentCustomerId;
      payload.sequenceType = 'first';
      // include customer id back in redirect so upsell can charge without re-entering details
      const base = new URL(payload.redirectUrl);
      base.searchParams.set('cid', currentCustomerId);
      payload.redirectUrl = base.toString();
    }

    // Subsequent one-click upsell (charge existing mandate)
    if (recurring && currentCustomerId) {
      payload.customerId = currentCustomerId;
      payload.sequenceType = 'recurring';
      // For SEPA/creditcard one-click we should not set method explicitly; Mollie uses mandate
      delete payload.method;
    }

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
