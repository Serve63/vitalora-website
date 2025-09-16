const crypto = require('crypto');
const {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  readBody,
} = require('./_utils/auth.js');

function safeCompare(a, b) {
  const valA = Buffer.from(String(a ?? ''), 'utf8');
  const valB = Buffer.from(String(b ?? ''), 'utf8');
  if (valA.length !== valB.length) {
    return false;
  }
  return crypto.timingSafeEqual(valA, valB);
}

function passwordMatches(password) {
  const expectedHash = process.env.STAFF_PASSWORD_HASH;
  if (expectedHash) {
    const hash = crypto.createHash('sha256').update(String(password || '')).digest('hex');
    return safeCompare(hash, expectedHash);
  }
  const expectedPlain = process.env.STAFF_PASSWORD || process.env.STAFF_PIN || '248911';
  return safeCompare(String(password || ''), expectedPlain);
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readBody(req);
    const username = String(body?.username || body?.email || '').trim();
    const password = body?.password || body?.pin || '';

    if (!username || !password) {
      clearSessionCookie(res);
      res.status(400).json({ error: 'Vul zowel gebruikersnaam als wachtwoord in.' });
      return;
    }

    const expectedUsername = process.env.STAFF_USERNAME || process.env.STAFF_USER || 'vitalora';
    if (!safeCompare(username.toLowerCase(), expectedUsername.toLowerCase()) || !passwordMatches(password)) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'Ongeldige inloggegevens.' });
      return;
    }

    const token = createSessionToken({ sub: username });
    setSessionCookie(res, token);
    res.status(200).json({ success: true, redirect: '/personeel-dashboard' });
  } catch (err) {
    clearSessionCookie(res);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het inloggen.' });
  }
}

module.exports = handler;
