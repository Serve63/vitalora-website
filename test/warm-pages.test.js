const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('nieuwe en historische blogs gebruiken de redactionele laag en login en Clean Reset behouden hun warme laag', () => {
  const blog = read('blog.html');
  const liveBlogRoute = read('blog/index.html');
  const post = read('post.html');
  const login = read('login/index.html');
  const cleanReset = read('clean-reset.html');
  const warmCss = read('assets/css/warm-pages.css');

  const editorialCss = read('assets/css/editorial-blog.css');

  assert.match(blog, /<body class="editorial-index page-blog">/);
  assert.match(liveBlogRoute, /<body class="editorial-index page-blog">/);
  assert.match(blog, /\/assets\/css\/editorial-blog\.css\?v=5/);
  assert.match(liveBlogRoute, /\/assets\/css\/editorial-blog\.css\?v=5/);
  assert.match(post, /<body class="editorial-page page-blog-post legacy-blog-post">/);
  assert.doesNotMatch(post, /Alle artikelen|article-back|editorial-nav/);
  assert.match(post, /\/assets\/css\/editorial-blog\.css\?v=5/);
  assert.doesNotMatch(post, /\/assets\/css\/warm-pages\.css/);
  assert.match(login, /<body class="page-login">/);
  assert.match(cleanReset, /<body class="page-clean-reset">/);
  [login, cleanReset].forEach((html) => {
    assert.match(html, /\/assets\/css\/warm-pages\.css\?v=2/);
    assert.match(html, /meta name="theme-color" content="#253129"/);
  });
  assert.match(post, /meta name="theme-color" content="#253129"/);
  assert.match(blog, /meta name="theme-color" content="#253129"/);
  assert.match(liveBlogRoute, /meta name="theme-color" content="#253129"/);
  assert.match(warmCss, /\.page-blog/);
  assert.match(warmCss, /\.page-blog-post/);
  assert.match(warmCss, /\.page-login/);
  assert.match(warmCss, /\.page-clean-reset/);
  assert.doesNotMatch(warmCss, /(^|\n)(body|\.site-header|\.login-container|\.hero-text)\s*\{/);
  assert.match(editorialCss, /body\.editorial-page/);
  assert.match(editorialCss, /body\.editorial-index/);
});

test('Clean Reset gebruikt het warme Image 2-cursusbeeld op desktop en mobiel', () => {
  const html = read('clean-reset.html');
  const imagePath = path.join(root, 'assets/images/clean-reset-course-v2.jpg');

  assert.equal((html.match(/\/assets\/images\/clean-reset-course-v2\.jpg/g) || []).length, 2);
  assert.ok(fs.existsSync(imagePath));
  assert.ok(fs.statSync(imagePath).size < 500_000);
  assert.doesNotMatch(html, /Clean-reset%202025\.png/);
});

test('de warme login behoudt code 000000 en verwerkt ook een lege plakactie veilig', () => {
  const login = read('login/index.html');

  assert.match(login, /new Set\(\['058267', '000000'\]\)/);
  assert.match(login, /if \(!pastedData\.length\) return;/);
  assert.match(login, /sessionStorage\.setItem\('academySession','ok'\)/);
});
