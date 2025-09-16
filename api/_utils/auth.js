const crypto = require('crypto');

const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const SECRET = process.env.STAFF_AUTH_SECRET || process.env.AUTH_SECRET || 'change-me-in-production';
const COOKIE_NAME = 'staff_session';

function signPayload(payload, secret = SECRET) {
  const base = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base).digest('base64url');
  return `${base}.${signature}`;
}

function verifySignature(base, signature, secret = SECRET) {
  const expected = crypto.createHmac('sha256', secret).update(base).digest('base64url');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signature || '', 'utf8');
  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

function createSessionToken({ sub = 'staff', ttlMs = DEFAULT_SESSION_TTL_MS } = {}) {
  const now = Date.now();
  const payload = {
    sub: String(sub || 'staff'),
    type: 'staff',
    iat: now,
    exp: now + Math.max(Number(ttlMs) || DEFAULT_SESSION_TTL_MS, 0),
    ver: 1,
  };
  return signPayload(payload);
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 2) {
    return null;
  }
  const [base, signature] = token.split('.');
  if (!verifySignature(base, signature)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(base, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    if (payload.exp && Date.now() > Number(payload.exp)) {
      return null;
    }
    return payload;
  } catch (_) {
    return null;
  }
}

function parseCookies(req) {
  const header = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  return verifySessionToken(token);
}

function buildCookie(parts) {
  return parts.filter(Boolean).join('; ');
}

function setSessionCookie(res, token, { maxAgeSeconds, sameSite = 'Strict' } = {}) {
  const maxAge = typeof maxAgeSeconds === 'number' ? maxAgeSeconds : Math.floor(DEFAULT_SESSION_TTL_MS / 1000);
  const secure = process.env.NODE_ENV !== 'development';
  const cookie = buildCookie([
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${Math.max(0, maxAge)}`,
    `SameSite=${sameSite}`,
    secure ? 'Secure' : null,
  ]);
  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV !== 'development';
  const cookie = buildCookie([
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    'SameSite=Strict',
    secure ? 'Secure' : null,
  ]);
  res.setHeader('Set-Cookie', cookie);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  let raw = '';
  if (req.body && typeof req.body === 'string') {
    raw = req.body;
  } else {
    raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  const contentType = req.headers?.['content-type'] || req.headers?.['Content-Type'] || '';
  if (!raw) {
    return {};
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  const params = new URLSearchParams(raw);
  const body = {};
  for (const [key, value] of params.entries()) {
    body[key] = value;
  }
  return body;
}

module.exports = {
  COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  getSessionFromRequest,
  setSessionCookie,
  clearSessionCookie,
  readBody,
};
