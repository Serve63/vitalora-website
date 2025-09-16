const crypto = require('crypto');

function getConfiguredCodes(){
  const raw = process.env.STAFF_CODE || process.env.STAFF_PASSWORD || '248911';
  return String(raw)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function resolveSessionSecret(){
  const configured = process.env.SESSION_SECRET;
  if (configured && configured !== 'dev-secret-change-me') return configured;
  const codes = getConfiguredCodes();
  if (!codes.length) return null;
  const fallbackCode = codes[0];
  return crypto.createHash('sha256').update(`vitalora::${fallbackCode}`).digest('hex');
}

function safeCompare(a, b){
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Simple HMAC-signed cookie session. In production, use a real auth provider.
function sign(value, secret){
  const h = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${h}`;
}

function verify(signed, secret){
  if(!signed || !signed.includes('.')) return null;
  const [val, sig] = signed.split('.');
  const h = crypto.createHmac('sha256', secret).update(val).digest('base64url');
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h))) return val;
  return null;
}

async function handler(req, res){
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try{
    const { code } = req.body || {};
    const submitted = typeof code === 'string' ? code.trim() : '';
    if(!submitted){
      res.status(400).json({ error: 'Toegangscode verplicht' });
      return;
    }

    const configuredCodes = getConfiguredCodes();

    if (!configuredCodes.length || !configuredCodes.some(stored => safeCompare(stored, submitted))) {
      res.status(401).json({ error: 'Ongeldige toegangscode' });
      return;
    }

    const secret = resolveSessionSecret();
    if (!secret) {
      res.status(500).json({ error: 'Serverconfiguratie ontbreekt (SESSION_SECRET).' });
      return;
    }
    const ttlMs = 1000 * 60 * 60 * 12; // 12u sessie
    const payload = JSON.stringify({ code: submitted, exp: Date.now() + ttlMs });
    const token = sign(Buffer.from(payload).toString('base64url'), secret);

    res.setHeader('Set-Cookie', `vitalora_staff=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`);
    res.status(200).json({ ok: true });
  }catch(e){
    res.status(500).json({ error: 'Serverfout' });
  }
}

// Guard helper exported for reuse by other endpoints
function requireStaff(req){
  try{
    const cookie = String(req.headers.cookie || '');
    const m = cookie.split(/;\s*/).find(kv => kv.startsWith('vitalora_staff='));
    if(!m) return null;
    const token = m.split('=')[1];
    const secret = resolveSessionSecret();
    if(!secret) return null;
    const raw = verify(token, secret);
    if(!raw) return null;
    const obj = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!obj || !obj.exp || Date.now() > Number(obj.exp)) return null;
    return obj;
  }catch(_){ return null; }
}

module.exports = handler;
module.exports.requireStaff = requireStaff;
