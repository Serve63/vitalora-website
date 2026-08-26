const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('de openbare blogfeed bevat drie volledige redactionele starterblogs', () => {
  const feed = JSON.parse(read('blog-feed.json'));

  assert.equal(feed.length, 3);
  assert.equal(new Set(feed.map((post) => post.slug)).size, 3);

  for (const post of feed) {
    assert.equal(post.status, 'published');
    assert.ok(post.title.length >= 30);
    assert.ok(post.excerpt.length >= 60);
    assert.ok(Number.isInteger(post.readTime) && post.readTime >= 5);
    assert.match(post.featuredImage, /^\/assets\/images\/courses\/clean-reset-v2\//);
    assert.ok(fs.existsSync(path.join(root, post.featuredImage.slice(1))));

    const articlePath = `${post.slug}.html`;
    assert.ok(fs.existsSync(path.join(root, articlePath)));
    const article = read(articlePath);
    assert.match(article, /class="blog-title"/);
    assert.match(article, /class="blog-content"/);
    assert.match(article, /<h2>/);
    assert.match(article, /class="source-note"/);
    assert.match(article, /https:\/\/(www\.)?(rivm\.nl|voedingscentrum\.nl|efsa\.europa\.eu)/);
    assert.ok(article.length > 3500, `${articlePath} moet echte inhoud bevatten`);
  }
});

test('de blogdetailrenderer neemt beeld en leestijd uit de statische artikelen over', () => {
  const post = read('post.html');
  const liveBlog = read('blog/index.html');
  const warmCss = read('assets/css/warm-pages.css');

  assert.match(post, /doc\.querySelector\('\.blog-read-time'\)/);
  assert.match(post, /doc\.querySelector\('\.blog-featured-image'\)/);
  assert.match(post, /featuredImage:\s*featuredImageEl/);
  assert.match(post, /slug:\s*sl/);
  assert.match(post, /status:\s*'published'/);
  assert.ok(post.indexOf('await fetchStatic(slug)') < post.indexOf('await fetchPublicApi(slug)'));
  assert.match(post, /post && !isStaticPost/);
  assert.match(liveBlog, /Always add the editorial starter collection/);
  assert.match(liveBlog, /new Set\(publishedPosts\.map/);
  assert.match(warmCss, /body\.page-blog\s*\{[\s\S]*display:\s*block !important/);
  assert.match(warmCss, /\.page-blog \.blog-grid\s*\{[\s\S]*repeat\(3, 320px\)/);
});
