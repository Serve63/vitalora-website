export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      amount = '1.00',
      description = 'Clean Reset Cursus',
      name,
      email,
      method,
      redirectUrl,
      enableRecurring,
      customerId,
      recurring,
      recurringMethod,
      postSaleRedirect,
    } = req.body || {};

    const isRecurringCharge = Boolean(recurring);

    let currentCustomerId = customerId;

    if (isRecurringCharge && !currentCustomerId) {
      res.status(400).json({ error: 'Missing customerId for recurring charge' });
      return;
    }

    const payload = {
      amount: { currency: 'EUR', value: String(Number(amount).toFixed(2)) },
      description,
      webhookUrl: 'https://www.vitalora.nl/api/mollie-webhook',
      metadata: { name, email },
    };

    const fallbackUpsellRedirect = 'https://www.vitalora.nl/gefeliciteerd.html';
    const fallbackThanksRedirect = 'https://www.vitalora.nl/bedankt.html';
    const firstRedirect = redirectUrl || fallbackUpsellRedirect;
    const afterUpsellRedirect = postSaleRedirect || fallbackThanksRedirect;

    if (!isRecurringCharge) {
      payload.redirectUrl = firstRedirect;
    }

    if (method && !isRecurringCharge) payload.method = method;

    // If this is the first payment of a recurring flow, create customer and mark sequenceType
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

    if (enableRecurring && !isRecurringCharge) {
      payload.customerId = currentCustomerId;
      payload.sequenceType = 'first';
      // include customer id back in redirect so upsell can prefill payment mandate details
      const base = new URL(payload.redirectUrl, 'https://www.vitalora.nl');
      base.searchParams.set('cid', currentCustomerId);
      if (method) base.searchParams.set('pm', method);
      base.searchParams.set('next', afterUpsellRedirect);
      payload.redirectUrl = base.toString();
    }

    // Subsequent one-click upsell (charge existing mandate)
    if (isRecurringCharge && currentCustomerId) {
      payload.customerId = currentCustomerId;
      payload.sequenceType = 'recurring';
      // Default: Mollie selects the stored mandate, override when frontend sends a specific method
      delete payload.method;
      delete payload.redirectUrl;
      if (recurringMethod) payload.method = recurringMethod;
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

    const checkoutUrl = data?._links?.checkout?.href || null;
    if (!checkoutUrl && !isRecurringCharge) {
      res.status(500).json({ error: 'No checkout URL from Mollie' });
      return;
    }

    res.status(200).json({
      checkoutUrl,
      paymentId: data?.id,
      status: data?.status,
    });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error', details: String(err) });
  }
}
