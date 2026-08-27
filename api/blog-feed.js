const { query } = require('./_lib/db');
const { ensureBlogTable, rowToBlog } = require('./_lib/blogs-store');
const fs = require('node:fs');
const path = require('node:path');

function readStaticFeed() {
  const feedPath = path.join(__dirname, '..', 'blog-feed.json');
  return JSON.parse(fs.readFileSync(feedPath, 'utf8'));
}

function mergePublishedPosts(databasePosts, staticPosts) {
  const bySlug = new Map();
  for (const post of databasePosts || []) {
    if (post && post.slug) bySlug.set(post.slug, post);
  }
  for (const post of staticPosts || []) {
    if (post && post.slug) bySlug.set(post.slug, post);
  }
  return Array.from(bySlug.values());
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const slug = req.query && req.query.slug ? String(req.query.slug) : null;
    const staticFeed = readStaticFeed();
    const staticPost = slug ? staticFeed.find((post) => post.slug === slug) : null;
    if (staticPost) {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
      res.status(200).json({ success: true, data: staticPost });
      return;
    }

    await ensureBlogTable();
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
    const merged = mergePublishedPosts(result.rows.map(rowToBlog), staticFeed);
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ success: true, data: merged });
  } catch (error) {
    console.error('Blog feed error:', error);
    try {
      const fallback = readStaticFeed();
      const slug = req.query && req.query.slug ? String(req.query.slug) : null;
      if (slug) {
        const post = fallback.find((item) => item.slug === slug);
        if (!post) {
          res.status(404).json({ error: 'Blogpost niet gevonden' });
          return;
        }
        res.status(200).json({ success: true, data: post, source: 'static-fallback' });
        return;
      }
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
      res.status(200).json({ success: true, data: fallback, source: 'static-fallback' });
    } catch (fallbackError) {
      console.error('Static blog feed fallback error:', fallbackError);
      res.status(500).json({ error: 'Kon blog feed niet laden' });
    }
  }
};
