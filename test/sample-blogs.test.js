const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('de openbare blogfeed bevat dertien unieke, direct leesbare redactionele artikelen', () => {
  const feed = JSON.parse(read('blog-feed.json'));

  assert.equal(feed.length, 13);
  assert.equal(new Set(feed.map((post) => post.slug)).size, 13);

  for (const post of feed) {
    assert.equal(post.status, 'published');
    assert.ok(post.title.length >= 30);
    assert.ok(post.excerpt.length >= 60);
    assert.ok(post.imageAlt.length >= 25);
    assert.ok(Number.isInteger(post.readTime) && post.readTime >= 5);
    assert.ok(fs.existsSync(path.join(root, post.featuredImage.slice(1))));

    const articlePath = `${post.slug}.html`;
    assert.ok(fs.existsSync(path.join(root, articlePath)));
    const article = read(articlePath);
    assert.match(article, /class="blog-title"/);
    assert.match(article, /class="blog-content"/);
    assert.match(article, /<h2>/);
    assert.match(article, /class="source-note"/);
    assert.match(article, /rel="canonical" href="https:\/\/www\.vitalora\.nl\//);
    assert.match(article, /application\/ld\+json/);
    assert.match(article, /Vitalora Redactie/);
    assert.doesNotMatch(article, /Servé Creusen, Gezondheidsexpert/);
    assert.ok(article.length > 6000, `${articlePath} moet echte inhoud bevatten`);
  }
});
test('de tien vernieuwde SEO-artikelen hebben unieke Image 2-beelden en uitgebreide inhoud', () => {
  const feed = JSON.parse(read('blog-feed.json'));
  const refreshed = feed.filter((post) => post.featuredImage.startsWith('/assets/images/blog/'));
  const hashes = new Set();

  assert.equal(refreshed.length, 10);
  for (const post of refreshed) {
    const imagePath = path.join(root, post.featuredImage.slice(1));
    const stat = fs.statSync(imagePath);
    assert.ok(stat.size < 200_000, `${post.featuredImage} moet web-geoptimaliseerd zijn`);
    hashes.add(crypto.createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex'));

    const article = read(`${post.slug}.html`);
    assert.match(article, /class="answer-box"/);
    assert.match(article, /class="key-points"/);
    assert.match(article, /class="faq-block"/);
    assert.match(article, /Goed om te weten:/);
  }
  assert.equal(hashes.size, 10);
});

test('de blogindex is serverleesbaar en gebruikt geen externe stockfoto-fallback', () => {
  const blog = read('blog.html');
  const nestedBlog = read('blog/index.html');
  const css = read('assets/css/editorial-blog.css');

  assert.equal(blog, nestedBlog);
  assert.equal((blog.match(/class="post-card"/g) || []).length, 13);
  assert.match(blog, /<h1>Gezondheid zonder ruis\.<\/h1>/);
  assert.match(blog, /rel="canonical" href="https:\/\/www\.vitalora\.nl\/blog"/);
  assert.doesNotMatch(blog, /source\.unsplash|images\.unsplash|fetch\('/);
  assert.match(css, /--editorial-moss:\s*#253129/);
  assert.match(css, /grid-template-columns:\s*repeat\(3/);
});
