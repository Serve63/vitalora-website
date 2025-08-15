export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    // Mollie post standaard x-www-form-urlencoded: id=tr_xxx
    let paymentId = req.body?.id;
    if (!paymentId && typeof req.body === 'string') {
      const p = new URLSearchParams(req.body);
      paymentId = p.get('id');
    }
    if (!paymentId) return res.status(400).json({ error: 'missing payment id' });

    // 1) Haal betaling op
    const mRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` }
    });
    if (!mRes.ok) return res.status(200).json({ ok: true, ignored: 'fetch_failed' });
    const payment = await mRes.json();

    // 2) Alleen verwerken als betaald/geautoriseerd
    if (!['paid','authorized'].includes(payment.status)) {
      return res.status(200).json({ ok: true, ignored: payment.status });
    }

    const email =
      payment?.metadata?.email ||
      payment?.customer?.email ||
      payment?.billingEmail || null;
    if (!email) return res.status(200).json({ ok: true, ignored: 'no_email' });

    // 3) MailBlue: upsert + tag + (optioneel) lijst
    const API = process.env.MAILBLUE_API_URL;
    const KEY = process.env.MAILBLUE_API_KEY;
    const TAG = process.env.MAILBLUE_TAG_NAME || 'Koper_vitalora3.0';
    const LIST_ID = process.env.MAILBLUE_LIST_ID; // "11"

    const acFetch = (path, init = {}) =>
      fetch(`${API}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', 'Api-Token': KEY, ...(init.headers||{}) }
      });

    // Contact vinden of maken
    const find = await acFetch(`/contacts?email=${encodeURIComponent(email)}`);
    const found = find.ok ? await find.json() : { contacts: [] };
    let contactId = found.contacts?.[0]?.id;
    if (!contactId) {
      const create = await acFetch('/contacts', {
        method: 'POST',
        body: JSON.stringify({ contact: { email } })
      });
      if (!create.ok) throw new Error(await create.text());
      contactId = (await create.json()).contact?.id;
    }

    // Tag ophalen/aanmaken
    const tRes = await acFetch(`/tags?search=${encodeURIComponent(TAG)}`);
    const tJson = tRes.ok ? await tRes.json() : {};
    let tagId = tJson.tags?.find(t => (t.tag || t?.tag?.tag)?.toLowerCase?.() === TAG.toLowerCase())?.id;
    if (!tagId) {
      const mk = await acFetch('/tags', { method:'POST', body: JSON.stringify({ tag: { tag: TAG, tagType: 'contact' } }) });
      if (!mk.ok) throw new Error(await mk.text());
      tagId = (await mk.json()).tag?.id;
    }

    // Tag koppelen (409 = bestaat al → ok)
    const ct = await acFetch('/contactTags', {
      method:'POST',
      body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
    });
    if (!ct.ok && ct.status !== 409) throw new Error(await ct.text());

    // Optioneel: toevoegen aan lijst als Actief (status:1)
    if (LIST_ID) {
      const cl = await acFetch('/contactLists', {
        method:'POST',
        body: JSON.stringify({ contactList: { list: LIST_ID, contact: contactId, status: 1 } })
      });
      if (!cl.ok && cl.status !== 409) throw new Error(await cl.text());
    }

    return res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true, ignored: 'exception' }); // Mollie verwacht 200
  }
}

