const { Pool } = require('pg');

const pools = new Map();
let activeConnectionString = null;
let connectionMeta = null;

function resolveConnectionStrings(env = process.env) {
  return Array.from(new Set([
    env.DATABASE_URL,
    env.POSTGRES_URL,
    env.SUPABASE_DB_URL,
    env.POSTGRES_PRISMA_URL,
    env.SUPABASE_POSTGRES_URL,
  ].map((value) => String(value || '').trim()).filter(Boolean)));
}

function normalizeConnectionString(rawConnectionString) {
  try {
    const parsed = new URL(rawConnectionString);
    const sslMode = String(parsed.searchParams.get('sslmode') || '').toLowerCase();
    if (['require', 'prefer', 'no-verify'].includes(sslMode)) {
      parsed.searchParams.delete('sslmode');
      parsed.searchParams.delete('uselibpqcompat');
    }
    return parsed.toString();
  } catch (_) {
    return rawConnectionString;
  }
}

function describeConnection(connectionString) {
  try {
    const parsed = new URL(connectionString);
    return { host: parsed.hostname, database: parsed.pathname || '' };
  } catch (_) {
    return { host: 'onbekend', database: '' };
  }
}

function poolFor(rawConnectionString) {
  if (pools.has(rawConnectionString)) return pools.get(rawConnectionString);
  const connectionString = normalizeConnectionString(rawConnectionString);
  const meta = describeConnection(connectionString);
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
  });
  pool.on('error', (err) => {
    console.error('Postgres pool error', { message: err?.message, host: meta.host });
  });
  pools.set(rawConnectionString, pool);
  return pool;
}

function getPool() {
  const candidates = resolveConnectionStrings();
  if (!candidates.length) {
    throw new Error('DATABASE_URL ontbreekt voor blogdatabase.');
  }
  const selected = activeConnectionString || candidates[0];
  return poolFor(selected);
}

function isConnectionFailure(error) {
  const message = String(error?.message || '');
  return [
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'self-signed certificate',
    'certificate in certificate chain',
    'password authentication failed',
    'tenant/user',
    'connection terminated',
  ].some((needle) => message.toLowerCase().includes(needle.toLowerCase()));
}

async function query(text, params = []) {
  const candidates = resolveConnectionStrings();
  if (!candidates.length) throw new Error('DATABASE_URL ontbreekt voor blogdatabase.');
  const ordered = activeConnectionString
    ? [activeConnectionString, ...candidates.filter((value) => value !== activeConnectionString)]
    : candidates;
  let lastError = null;

  for (let index = 0; index < ordered.length; index += 1) {
    const candidate = ordered[index];
    let client = null;
    try {
      client = await poolFor(candidate).connect();
      const result = await client.query(text, params);
      activeConnectionString = candidate;
      connectionMeta = describeConnection(normalizeConnectionString(candidate));
      return result;
    } catch (error) {
      lastError = error;
      if (!isConnectionFailure(error) || index === ordered.length - 1) throw error;
    } finally {
      if (client) client.release();
    }
  }
  throw lastError || new Error('Databaseverbinding mislukt.');
}

module.exports = {
  getPool,
  query,
  connectionMeta: () => connectionMeta,
  normalizeConnectionString,
  resolveConnectionStrings,
  isConnectionFailure,
};
