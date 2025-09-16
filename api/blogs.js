const { query } = require('./_lib/db');
const { ensureBlogTable, rowToBlog } = require('./_lib/blogs-store');
const { requireStaff } = require('./staff/login.js');

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (_) {
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
  const values = [];
  const where = [];

  if (id) {
    values.push(Number(id));
    where.push(`id = $${values.length}`);
  }
  if (slug) {
    values.push(slug);
    where.push(`slug = $${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  let sql =
    'SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at FROM blog_posts';

  if (where.length) sql += ' WHERE ' + where.join(' AND ');

  if (id || slug) {
    sql += ' LIMIT 1';
  } else {
    sql += ' ORDER BY updated_at DESC, created_at DESC';
  }

  const result = await query(sql, values);

  if (id || slug) {
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'Blogpost niet gevonden' });
      return;
    }
    res.status(200).json({ success: true, data: rowToBlog(row) });
    return;
  }

  res.status(200).json({ success: true, data: result.rows.map(rowToBlog) });
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
  const readTime =
    typeof body.readTime === 'number' && !Number.isNaN(body.readTime)
      ? Math.max(0, Math.round(body.readTime))
      : null;

  try {
    const insert = await query(
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
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
      RETURNING id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at;`,
      [
        title,
        slug,
        body.metaTitle || '',
        body.metaDescription || '',
        content,
        body.featuredImage || null,
        status,
        body.publishDate || null,
        body.publishedDate || null,
        readTime,
        now,
      ]
    );
    res.status(201).json({ success: true, data: rowToBlog(insert.rows[0]) });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('duplicate key value') || message.includes('slug')) {
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
  const params = [];

  function push(field, value) {
    params.push(value);
    updates.push(`${field} = $${params.length}`);
  }

  if ('title' in body) {
    const title = (body.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'Titel is verplicht' });
      return;
    }
    push('title', title);
  }
  if ('slug' in body) {
    const slug = (body.slug || '').trim();
    if (!slug) {
      res.status(400).json({ error: 'Slug is verplicht' });
      return;
    }
    push('slug', slug);
  }
  if ('metaTitle' in body) push('meta_title', body.metaTitle || '');
  if ('metaDescription' in body) push('meta_description', body.metaDescription || '');
  if ('content' in body) {
    const content = body.content || '';
    if (!content) {
      res.status(400).json({ error: 'Inhoud is verplicht' });
      return;
    }
    push('content', content);
  }
  if ('featuredImage' in body) push('featured_image', body.featuredImage || null);
  if ('status' in body) {
    const status = body.status;
    if (!isValidStatus(status)) {
      res.status(400).json({ error: 'Ongeldige status' });
      return;
    }
    push('status', status);
  }
  if ('publishDate' in body) push('publish_date', body.publishDate || null);
  if ('publishedDate' in body) push('published_date', body.publishedDate || null);
  if ('readTime' in body) {
    let readTime = null;
    if (body.readTime !== null && body.readTime !== undefined && body.readTime !== '') {
      const parsed = Number(body.readTime);
      readTime = Number.isNaN(parsed) ? null : Math.max(0, Math.round(parsed));
    }
    push('read_time', readTime);
  }

  if (!updates.length) {
    res.status(400).json({ error: 'Geen velden om bij te werken' });
    return;
  }

  params.push(new Date().toISOString());
  updates.push(`updated_at = $${params.length}`);

  params.push(Number(targetId));
  const idPosition = params.length;

  try {
    const updateResult = await query(
      `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = $${idPosition} RETURNING id;`,
      params
    );
    if (!updateResult.rowCount) {
      res.status(404).json({ error: 'Blogpost niet gevonden' });
      return;
    }
    const refreshed = await query(
      'SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at FROM blog_posts WHERE id = $1',
      [Number(targetId)]
    );
    res.status(200).json({ success: true, data: rowToBlog(refreshed.rows[0]) });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('duplicate key value') || message.includes('slug')) {
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

  const result = await query('DELETE FROM blog_posts WHERE id = $1 RETURNING id;', [Number(id)]);
  if (!result.rowCount) {
    res.status(404).json({ error: 'Blogpost niet gevonden' });
    return;
  }

  res.status(200).json({ success: true });
}

async function handler(req, res) {
  try {
    const staff = requireStaff(req);
    if (!staff) {
      res.status(401).json({ error: 'Niet ingelogd' });
      return;
    }

    await ensureBlogTable();

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

module.exports = handler;

