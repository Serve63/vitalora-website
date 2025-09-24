const REQUIRED_FIELDS = {
  u: '3',
  f: '3',
  s: '',
  c: '0',
  m: '0',
  act: 'sub',
  v: '2',
  or: '912ee886-aab4-4e79-bb30-28b2ab9fb4a3'
};

const ALLOWED_EXTRA_FIELDS = new Set(['firstname', 'email', 'source']);

const DEFAULT_UPSTREAM_URL = 'https://mcvecommerce2.activehosted.com/proc.php';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = req.body;
    let body = {};

    if (typeof rawBody === 'string') {
      try {
        body = JSON.parse(rawBody);
      } catch (parseError) {
        console.warn('tk-ebook invalid JSON payload', parseError);
        body = {};
      }
    } else if (rawBody && typeof rawBody === 'object') {
      body = rawBody;
    }
    const firstname = typeof body.firstname === 'string' ? body.firstname.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (firstname.length < 2) {
      res.status(400).json({ success: false, error: 'Voornaam is verplicht.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'E-mailadres is ongeldig.' });
      return;
    }

    const upstreamUrl = process.env.ACTIVE_CAMPAIGN_FORM_URL || DEFAULT_UPSTREAM_URL;
    const params = new URLSearchParams();

    Object.entries(REQUIRED_FIELDS).forEach(([key, value]) => {
      params.append(key, value);
    });

    params.append('firstname', firstname);
    params.append('email', email);

    if (typeof body.source === 'string' && body.source.trim()) {
      params.append('source', body.source.trim());
    }

    // Capture unforeseen but allowed fields while preventing arbitrary payload injection
    Object.entries(body).forEach(([key, value]) => {
      if (ALLOWED_EXTRA_FIELDS.has(key) && key !== 'firstname' && key !== 'email' && typeof value === 'string' && value.trim()) {
        params.set(key, value.trim());
      }
    });

    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'vitalora-tk-ebook-proxy'
      },
      body: params.toString()
    });

    const upstreamText = await response.text();

    if (!response.ok) {
      console.error('tk-ebook upstream error', response.status, upstreamText);
      res.status(502).json({ success: false, error: 'Aanvraag kon niet worden verwerkt. Probeer het later opnieuw.' });
      return;
    }

    // ActiveCampaign returns 200 even bij fouten; controleer op error strings
    if (/error/i.test(upstreamText) && !/success/i.test(upstreamText)) {
      console.error('tk-ebook upstream responded with error text', upstreamText.slice(0, 250));
      res.status(502).json({ success: false, error: 'Aanvraag kon niet worden verwerkt. Probeer het later opnieuw.' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('tk-ebook proxy failure', error);
    res.status(500).json({ success: false, error: 'Interne fout. Probeer het later opnieuw.' });
  }
}
