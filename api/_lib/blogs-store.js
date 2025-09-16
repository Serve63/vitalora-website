const { query, connectionMeta } = require('./db');

let initPromise = null;

async function ensureBlogTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const meta = connectionMeta && connectionMeta();
      console.log('Supabase host (init)', meta?.host);
      await query(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          meta_title TEXT,
          meta_description TEXT,
          content TEXT NOT NULL,
          featured_image TEXT,
          status TEXT DEFAULT 'draft',
          publish_date TEXT,
          published_date TEXT,
          read_time INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await query(
        'CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);'
      );
      await query(
        'CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_at ON blog_posts(updated_at DESC);'
      );
    })();
  }
  return initPromise;
}

function rowToBlog(row) {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  ensureBlogTable,
  rowToBlog,
};
