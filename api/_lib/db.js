const { Pool } = require('pg');

let pool = null;
let connectionMeta = null;

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    ''
  ).trim();
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

function getPool() {
  if (pool) return pool;
  const rawConnectionString = resolveConnectionString();
  if (!rawConnectionString) {
    throw new Error('DATABASE_URL ontbreekt voor blogdatabase.');
  }
  const connectionString = normalizeConnectionString(rawConnectionString);
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  try {
    const parsed = new URL(connectionString);
    connectionMeta = {
      host: parsed.hostname,
      database: parsed.pathname || '',
    };
  } catch (_) {
    connectionMeta = { host: 'onbekend', database: '' };
  }

  pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
  });
  pool.on('error', (err) => {
    console.error('Postgres pool error', {
      message: err?.message,
      host: connectionMeta?.host,
    });
  });
  return pool;
}

async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

module.exports = { getPool, query, connectionMeta: () => connectionMeta, normalizeConnectionString };
