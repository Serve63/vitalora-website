const db = require('./db');

let initPromise = null;

async function ensureEbookLeadsTable() {
  if (!initPromise) {
    initPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ebook_leads (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          source TEXT,
          first_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.query('ALTER TABLE ebook_leads ENABLE ROW LEVEL SECURITY;');
      await db.query('CREATE INDEX IF NOT EXISTS idx_ebook_leads_last_downloaded_at ON ebook_leads(last_downloaded_at DESC);');
      await db.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            REVOKE ALL ON TABLE ebook_leads FROM anon;
          END IF;
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            REVOKE ALL ON TABLE ebook_leads FROM authenticated;
          END IF;
        END
        $$;
      `);
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

async function upsertEbookLead({ firstName, email, source }) {
  await ensureEbookLeadsTable();
  await db.query(
    `INSERT INTO ebook_leads (email, first_name, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       source = COALESCE(EXCLUDED.source, ebook_leads.source),
       last_downloaded_at = NOW();`,
    [String(email).trim().toLowerCase(), String(firstName).trim(), source ? String(source).trim() : null]
  );
}

async function listEbookLeads() {
  await ensureEbookLeadsTable();
  const result = await db.query(
    `SELECT id, first_name, email, source, first_downloaded_at, last_downloaded_at
     FROM ebook_leads
     ORDER BY last_downloaded_at DESC, id DESC;`
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    name: row.first_name || '',
    email: row.email || '',
    source: row.source || '',
    addedAt: row.first_downloaded_at || row.last_downloaded_at || null,
    status: 'Ingeschreven',
  }));
}

module.exports = { ensureEbookLeadsTable, upsertEbookLead, listEbookLeads };
