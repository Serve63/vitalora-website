const { query } = require('./_lib/db');
const { ensureBlogTable, rowToBlog } = require('./_lib/blogs-store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    await ensureBlogTable();
    const slug = req.query && req.query.slug ? String(req.query.slug) : null;
    if (slug) {
      const single = await query(
        `SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at
         FROM blog_posts
         WHERE slug = $1 AND status = 'published'
         LIMIT 1`,
        [slug]
      );
      if (!single.rowCount) {
        res.status(404).json({ error: 'Blogpost niet gevonden' });
        return;
      }
      res.status(200).json({ success: true, data: rowToBlog(single.rows[0]) });
      return;
    }

    const result = await query(
      `SELECT id, title, slug, meta_title, meta_description, content, featured_image, status, publish_date, published_date, read_time, created_at, updated_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY COALESCE(NULLIF(published_date, ''), to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3Z')) DESC, updated_at DESC
       LIMIT 100`
    );
    res.status(200).json({ success: true, data: result.rows.map(rowToBlog) });
  } catch (error) {
    console.error('Blog feed error:', error);
    res.status(500).json({ error: 'Kon blog feed niet laden' });
  }
};
