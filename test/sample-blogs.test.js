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
    assert.match(article, /class="article-hero-grid"/);
    assert.match(article, /class="article-layout"/);
    assert.match(article, /class="article-rail"/);
    assert.match(article, /<h2(?:\s[^>]*)?>/);
    assert.match(article, /class="source-note"/);
    assert.match(article, /rel="canonical" href="https:\/\/www\.vitalora\.nl\//);
    assert.match(article, /application\/ld\+json/);
    assert.match(article, /Vitalora Redactie/);
    assert.doesNotMatch(article, /Servé Creusen, Gezondheidsexpert/);
    assert.ok(article.length > 6000, `${articlePath} moet echte inhoud bevatten`);

    const ids = [...article.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${articlePath} moet unieke element-id's hebben`);
    const rail = article.match(/<aside class="article-rail"[\s\S]*?<\/aside>/)?.[0] || '';
    for (const match of rail.matchAll(/href="#([^"]+)"/g)) {
      assert.match(article, new RegExp(`id="${match[1]}"`), `${articlePath} mist inhoudsanker #${match[1]}`);
    }
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
  assert.equal((blog.match(/<a class="post-card(?:\s[^"}]*)?"/g) || []).length, 13);
  assert.equal((blog.match(/class="post-card post-card--featured"/g) || []).length, 1);
  assert.match(blog, /<h1>Gezondheid zonder ruis\.<\/h1>/);
  assert.match(blog, /rel="canonical" href="https:\/\/www\.vitalora\.nl\/blog"/);
  assert.match(blog, /\/assets\/css\/editorial-blog\.css\?v=2/);
  assert.match(blog, /id="nieuwste-artikelen"/);
  assert.match(blog, /13 artikelen · met bronnen gecontroleerd/);
  assert.doesNotMatch(blog, /onafhankelijk gecontroleerd/);
  assert.doesNotMatch(blog, /source\.unsplash|images\.unsplash|fetch\('/);
  assert.match(css, /--editorial-moss:\s*#253129/);
  assert.match(css, /grid-template-columns:\s*repeat\(3/);
  assert.match(css, /grid-template-columns:\s*232px minmax\(0, 720px\)/);
  assert.match(css, /a\.post-card\.post-card--featured/);
  assert.match(css, /background:\s*var\(--editorial-moss\) !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

  const font = fs.readFileSync(path.join(root, 'assets/fonts/Quicksand-400.woff2'));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.match(css, /\.\.\/fonts\/Quicksand-400\.woff2/);
  assert.doesNotMatch(css, /Quicksand-VariableFont_wght\.woff2/);
});
