const { Pool } = require('pg');

let pool = null;

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();
}

function getPool() {
  if (pool) return pool;
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    throw new Error('DATABASE_URL ontbreekt voor blogdatabase.');
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
  });
  pool.on('error', (err) => {
    console.error('Postgres pool error', err);
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

module.exports = { getPool, query };

