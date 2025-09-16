const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'blogs.sqlite');

let initPromise = null;

function buildParameterCommands(params) {
  const commands = [];
  const entries = Object.entries(params || {});
  if (!entries.length) return commands;

  commands.push('.parameter init');
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    let command;
    if (value === null) {
      command = `.parameter set @${key} NULL`;
    } else if (typeof value === 'number' || typeof value === 'bigint') {
      command = `.parameter set @${key} ${Number(value)}`;
    } else if (typeof value === 'boolean') {
      command = `.parameter set @${key} ${value ? 1 : 0}`;
    } else {
      const safe = String(value).replace(/'/g, "''");
      command = `.parameter set @${key} '${safe}'`;
    }
    commands.push(command);
  }
  return commands;
}

function runSql(sql, params = {}, { json = false } = {}) {
  return new Promise((resolve, reject) => {
    const statements = Array.isArray(sql) ? sql.join('\n') : String(sql || '');
    const args = [];

    if (json) {
      args.push('-json');
    }

    args.push(DB_PATH);

    const paramCommands = buildParameterCommands(params);
    for (const cmd of paramCommands) {
      args.push('-cmd', cmd);
    }

    args.push(statements);

    const child = spawn('sqlite3', args);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(stderr || `sqlite3 exited with code ${code}`);
        error.stderr = stderr;
        error.code = code;
        return reject(error);
      }

      if (!json) {
        return resolve(stdout);
      }

      const trimmed = stdout.trim();
      if (!trimmed) {
        return resolve([]);
      }

      try {
        resolve(JSON.parse(trimmed));
      } catch (parseError) {
        parseError.stdout = stdout;
        parseError.stderr = stderr;
        reject(parseError);
      }
    });
  });
}

async function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await runSql(
        `PRAGMA journal_mode=WAL;\n` +
          `CREATE TABLE IF NOT EXISTS blog_posts (\n` +
          `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
          `  title TEXT NOT NULL,\n` +
          `  slug TEXT NOT NULL UNIQUE,\n` +
          `  meta_title TEXT,\n` +
          `  meta_description TEXT,\n` +
          `  content TEXT NOT NULL,\n` +
          `  featured_image TEXT,\n` +
          `  status TEXT DEFAULT 'draft',\n` +
          `  publish_date TEXT,\n` +
          `  published_date TEXT,\n` +
          `  read_time INTEGER,\n` +
          `  created_at TEXT NOT NULL,\n` +
          `  updated_at TEXT NOT NULL\n` +
          `);\n` +
          `CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);`
      );
    })();
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
    readTime: row.read_time !== null && row.read_time !== undefined ? Number(row.read_time) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

async function handleGet(req, res) {
  const { id, slug, status } = req.query || {};
  const params = {};
  let sql =
    'SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at FROM blog_posts';

  const conditions = [];
  if (id) {
    conditions.push('id = @id');
    params.id = Number(id);
  }
  if (slug) {
    conditions.push('slug = @slug');
    params.slug = slug;
  }
  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }

  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  if (id || slug) {
    sql += ' LIMIT 1';
  } else {
    sql += ' ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC';
  }

  sql += ';';

  const rows = await runSql(sql, params, { json: true });
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
  const body = parseBody(req);
  const title = (body.title || '').trim();
  const slug = (body.slug || '').trim();
  const content = body.content || '';
  const status = body.status && isValidStatus(body.status) ? body.status : 'draft';

  if (!title) {
    res.status(400).json({ error: 'Titel is verplicht' });
    return;
  }
  if (!slug) {
    res.status(400).json({ error: 'Slug is verplicht' });
    return;
  }
  if (!content) {
    res.status(400).json({ error: 'Inhoud is verplicht' });
    return;
  }

  const now = new Date().toISOString();
  const params = {
    title,
    slug,
    metaTitle: body.metaTitle || '',
    metaDescription: body.metaDescription || '',
    content,
    featuredImage: body.featuredImage || null,
    status,
    publishDate: body.publishDate || null,
    publishedDate: body.publishedDate || null,
    readTime:
      typeof body.readTime === 'number' && !Number.isNaN(body.readTime)
        ? Math.max(0, Math.round(body.readTime))
        : null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const insertResult = await runSql(
      `INSERT INTO blog_posts (\n` +
        `  title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at\n` +
        `) VALUES (\n` +
        `  @title, @slug, @metaTitle, @metaDescription, @content, @featuredImage, @status, @publishDate, @publishedDate, @readTime, @createdAt, @updatedAt\n` +
        `);\n` +
        `SELECT last_insert_rowid() AS id;`,
      params,
      { json: true }
    );

    const newId = insertResult?.[0]?.id;
    if (!newId) {
      res.status(500).json({ error: 'Kon ID van nieuwe blogpost niet ophalen' });
      return;
    }

    const created = await runSql(
      'SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at FROM blog_posts WHERE id = @id;',
      { id: newId },
      { json: true }
    );

    res.status(201).json({ success: true, data: toCamelCase(created[0]) });
  } catch (error) {
    const message = String(error.stderr || error.message || '').toLowerCase();
    if (message.includes('unique constraint failed')) {
      res.status(409).json({ error: 'Slug is al in gebruik' });
      return;
    }
    console.error('Blog POST error:', error);
    res.status(500).json({ error: 'Kon blogpost niet opslaan' });
  }
}

async function handlePut(req, res) {
  const queryId = req.query?.id;
  const body = parseBody(req);
  const bodyId = body && body.id ? body.id : null;
  const targetId = queryId || bodyId;

  if (!targetId) {
    res.status(400).json({ error: 'ID is verplicht voor updates' });
    return;
  }

  const updates = [];
  const params = { id: Number(targetId) };

  if ('title' in body) {
    params.title = (body.title || '').trim();
    if (!params.title) {
      res.status(400).json({ error: 'Titel is verplicht' });
      return;
    }
    updates.push('title = @title');
  }
  if ('slug' in body) {
    params.slug = (body.slug || '').trim();
    if (!params.slug) {
      res.status(400).json({ error: 'Slug is verplicht' });
      return;
    }
    updates.push('slug = @slug');
  }
  if ('metaTitle' in body) {
    params.metaTitle = body.metaTitle || '';
    updates.push('meta_title = @metaTitle');
  }
  if ('metaDescription' in body) {
    params.metaDescription = body.metaDescription || '';
    updates.push('meta_description = @metaDescription');
  }
  if ('content' in body) {
    params.content = body.content || '';
    if (!params.content) {
      res.status(400).json({ error: 'Inhoud is verplicht' });
      return;
    }
    updates.push('content = @content');
  }
  if ('featuredImage' in body) {
    params.featuredImage = body.featuredImage || null;
    updates.push('featured_image = @featuredImage');
  }
  if ('status' in body) {
    const status = body.status;
    if (!isValidStatus(status)) {
      res.status(400).json({ error: 'Ongeldige status' });
      return;
    }
    params.status = status;
    updates.push('status = @status');
  }
  if ('publishDate' in body) {
    params.publishDate = body.publishDate || null;
    updates.push('publish_date = @publishDate');
  }
  if ('publishedDate' in body) {
    params.publishedDate = body.publishedDate || null;
    updates.push('published_date = @publishedDate');
  }
  if ('readTime' in body) {
    if (body.readTime === null || body.readTime === undefined || body.readTime === '') {
      params.readTime = null;
    } else {
      const readTime = Number(body.readTime);
      params.readTime = Number.isNaN(readTime) ? null : Math.max(0, Math.round(readTime));
    }
    updates.push('read_time = @readTime');
  }

  if (!updates.length) {
    res.status(400).json({ error: 'Geen velden om bij te werken' });
    return;
  }

  params.updatedAt = new Date().toISOString();
  updates.push('updated_at = @updatedAt');

  try {
    const result = await runSql(
      `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = @id;\nSELECT changes() AS changes;`,
      params,
      { json: true }
    );

    const changes = result?.[0]?.changes || 0;
    if (!changes) {
      res.status(404).json({ error: 'Blogpost niet gevonden' });
      return;
    }

    const updated = await runSql(
      'SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at FROM blog_posts WHERE id = @id;',
      { id: params.id },
      { json: true }
    );

    res.status(200).json({ success: true, data: toCamelCase(updated[0]) });
  } catch (error) {
    const message = String(error.stderr || error.message || '').toLowerCase();
    if (message.includes('unique constraint failed')) {
      res.status(409).json({ error: 'Slug is al in gebruik' });
      return;
    }
    console.error('Blog PUT error:', error);
    res.status(500).json({ error: 'Kon blogpost niet bijwerken' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.query || {};
  if (!id) {
    res.status(400).json({ error: 'ID is verplicht om te verwijderen' });
    return;
  }

  const result = await runSql(
    'DELETE FROM blog_posts WHERE id = @id;\nSELECT changes() AS changes;',
    { id: Number(id) },
    { json: true }
  );

  const changes = result?.[0]?.changes || 0;
  if (!changes) {
    res.status(404).json({ error: 'Blogpost niet gevonden' });
    return;
  }

  res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  try {
    await ensureDatabase();

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

