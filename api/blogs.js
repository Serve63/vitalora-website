const { Pool } = require('pg');

const CONNECTION_STRING =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  '';

let pool = null;
let initPromise = null;

function getPool() {
  if (!CONNECTION_STRING) {
    const error = new Error(
      'Database verbinding ontbreekt. Stel POSTGRES_URL of DATABASE_URL in.'
    );
    error.statusCode = 500;
    throw error;
  }

  if (!pool) {
    const isLocal =
      CONNECTION_STRING.includes('localhost') ||
      CONNECTION_STRING.includes('127.0.0.1');

    pool = new Pool({
      connectionString: CONNECTION_STRING,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
    });

    pool.on('error', (err) => {
      console.error('Postgres pool error:', err);
    });
  }

  return pool;
}

async function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          meta_title TEXT,
          meta_description TEXT,
          content TEXT NOT NULL,
          featured_image TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          publish_date TEXT,
          published_date TEXT,
          read_time INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.query(
        'CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);'
      );
      await db.query(
        'CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts (status);'
      );
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

function toCamelCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    metaTitle: row.meta_title || '',
    metaDescription: row.meta_description || '',
    content: row.content || '',
    featuredImage: row.featured_image || null,
    status: row.status || 'draft',
    publishDate: row.publish_date || null,
    publishedDate: row.published_date || null,
    readTime:
      row.read_time === null || row.read_time === undefined
        ? null
        : Number(row.read_time),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (error) {
      return {};
    }
  }
  return req.body || {};
}

function isValidStatus(status) {
  return ['draft', 'scheduled', 'published', 'offline'].includes(status);
}

function normalizeReadTime(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || Number.isNaN(number)) return null;
  return Math.max(0, Math.round(number));
}

async function handleGet(req, res) {
  const db = getPool();
  const { id, slug, status } = req.query || {};
  const conditions = [];
  const values = [];

  if (id !== undefined) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      res.status(400).json({ error: 'Ongeldige ID' });
      return;
    }
    values.push(numericId);
    conditions.push(`id = $${values.length}`);
  }

  if (slug) {
    values.push(String(slug));
    conditions.push(`slug = $${values.length}`);
  }

  if (status) {
    if (!isValidStatus(status)) {
      res.status(400).json({ error: 'Ongeldige status' });
      return;
    }
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT
      id,
      title,
      slug,
      meta_title,
      meta_description,
      content,
      featured_image,
      status,
      publish_date,
      published_date,
      read_time,
      created_at,
      updated_at
    FROM blog_posts
  `;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (id || slug) {
    query += ' LIMIT 1';
  } else {
    query += ' ORDER BY updated_at DESC, created_at DESC';
  }

  const { rows } = await db.query(query, values);

  if (id || slug) {
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Blogpost niet gevonden' });
      return;
    }
    res.status(200).json({ success: true, data: toCamelCase(row) });
    return;
  }

  res.status(200).json({ success: true, data: rows.map(toCamelCase) });
}

async function handlePost(req, res) {
  const db = getPool();
  const body = parseBody(req);
  const title = (body.title || '').trim();
  const slug = (body.slug || '').trim();
  const rawContent = typeof body.content === 'string' ? body.content : '';
  const status = body.status && isValidStatus(body.status) ? body.status : 'draft';

  if (!title) {
    res.status(400).json({ error: 'Titel is verplicht' });
    return;
  }
  if (!slug) {
    res.status(400).json({ error: 'Slug is verplicht' });
    return;
  }
  if (!rawContent || !rawContent.trim()) {
    res.status(400).json({ error: 'Inhoud is verplicht' });
    return;
  }

  const now = new Date().toISOString();
  const params = [
    title,
    slug,
    body.metaTitle || '',
    body.metaDescription || '',
    rawContent,
    body.featuredImage || null,
    status,
    body.publishDate || null,
    body.publishedDate || null,
    normalizeReadTime(body.readTime),
    now,
    now,
  ];

  try {
    const { rows } = await db.query(
      `INSERT INTO blog_posts (
        title,
        slug,
        meta_title,
        meta_description,
        content,
        featured_image,
        status,
        publish_date,
        published_date,
        read_time,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING
        id,
        title,
        slug,
        meta_title,
        meta_description,
        content,
        featured_image,
        status,
        publish_date,
        published_date,
        read_time,
        created_at,
        updated_at`,
      params
    );

    res.status(201).json({ success: true, data: toCamelCase(rows[0]) });
  } catch (error) {
    if (error && error.code === '23505') {
      res.status(409).json({ error: 'Slug is al in gebruik' });
      return;
    }
    console.error('Blog POST error:', error);
    res.status(500).json({ error: 'Kon blogpost niet opslaan' });
  }
}

async function handlePut(req, res) {
  const db = getPool();
  const queryId = req.query?.id;
  const body = parseBody(req);
  const bodyId = body && body.id ? body.id : null;
  const targetId = queryId || bodyId;

  const numericId = Number(targetId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    res.status(400).json({ error: 'ID is verplicht voor updates' });
    return;
  }

  const updates = [];
  const values = [];

  if ('title' in body) {
    const value = (body.title || '').trim();
    if (!value) {
      res.status(400).json({ error: 'Titel is verplicht' });
      return;
    }
    values.push(value);
    updates.push(`title = $${values.length}`);
  }

  if ('slug' in body) {
    const value = (body.slug || '').trim();
    if (!value) {
      res.status(400).json({ error: 'Slug is verplicht' });
      return;
    }
    values.push(value);
    updates.push(`slug = $${values.length}`);
  }

  if ('metaTitle' in body) {
    values.push(body.metaTitle || '');
    updates.push(`meta_title = $${values.length}`);
  }

  if ('metaDescription' in body) {
    values.push(body.metaDescription || '');
    updates.push(`meta_description = $${values.length}`);
  }

  if ('content' in body) {
    const rawContent = typeof body.content === 'string' ? body.content : '';
    if (!rawContent.trim()) {
      res.status(400).json({ error: 'Inhoud is verplicht' });
      return;
    }
    values.push(rawContent);
    updates.push(`content = $${values.length}`);
  }

  if ('featuredImage' in body) {
    values.push(body.featuredImage || null);
    updates.push(`featured_image = $${values.length}`);
  }

  if ('status' in body) {
    if (!isValidStatus(body.status)) {
      res.status(400).json({ error: 'Ongeldige status' });
      return;
    }
    values.push(body.status);
    updates.push(`status = $${values.length}`);
  }

  if ('publishDate' in body) {
    values.push(body.publishDate || null);
    updates.push(`publish_date = $${values.length}`);
  }

  if ('publishedDate' in body) {
    values.push(body.publishedDate || null);
    updates.push(`published_date = $${values.length}`);
  }

  if ('readTime' in body) {
    values.push(normalizeReadTime(body.readTime));
    updates.push(`read_time = $${values.length}`);
  }

  if (!updates.length) {
    res.status(400).json({ error: 'Geen velden om bij te werken' });
    return;
  }

  values.push(new Date().toISOString());
  updates.push(`updated_at = $${values.length}`);

  values.push(numericId);
  const idParam = values.length;

  try {
    const { rows } = await db.query(
      `UPDATE blog_posts
        SET ${updates.join(', ')}
        WHERE id = $${idParam}
        RETURNING
          id,
          title,
          slug,
          meta_title,
          meta_description,
          content,
          featured_image,
          status,
          publish_date,
          published_date,
          read_time,
          created_at,
          updated_at`,
      values
    );

    if (!rows.length) {
      res.status(404).json({ error: 'Blogpost niet gevonden' });
      return;
    }

    res.status(200).json({ success: true, data: toCamelCase(rows[0]) });
  } catch (error) {
    if (error && error.code === '23505') {
      res.status(409).json({ error: 'Slug is al in gebruik' });
      return;
    }
    console.error('Blog PUT error:', error);
    res.status(500).json({ error: 'Kon blogpost niet bijwerken' });
  }
}

async function handleDelete(req, res) {
  const db = getPool();
  const { id } = req.query || {};
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    res.status(400).json({ error: 'ID is verplicht om te verwijderen' });
    return;
  }

  const result = await db.query('DELETE FROM blog_posts WHERE id = $1', [numericId]);
  if (!result.rowCount) {
    res.status(404).json({ error: 'Blogpost niet gevonden' });
    return;
  }

  res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error('Blog API initialisatie fout:', error);
    const status = error.statusCode || 500;
    const message = error.statusCode
      ? error.message
      : 'Database niet beschikbaar';
    res.status(status).json({ error: message });
    return;
  }

  try {
    if (req.method === 'GET') {
      await handleGet(req, res);
      return;
    }

    if (req.method === 'POST') {
      await handlePost(req, res);
      return;
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      await handlePut(req, res);
      return;
    }

    if (req.method === 'DELETE') {
      await handleDelete(req, res);
      return;
    }

    res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE');
    res.status(405).json({ error: 'Methode niet toegestaan' });
  } catch (error) {
    console.error('Blog API fout:', error);
    res.status(500).json({ error: 'Onverwachte serverfout' });
  }
}
