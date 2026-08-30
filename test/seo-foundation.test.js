const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('onbekende paden vallen niet langer terug op een blog-shell met status 200', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const redirects = read('_redirects');

  assert.equal(vercel.rewrites.some((rewrite) => rewrite.source === '/:slug'), false);
  assert.doesNotMatch(redirects, /^\/\*\s+\/post\.html/m);
  assert.doesNotMatch(redirects, /^\/:slug\s+\/post\.html/m);
  const notFound = read('404.html');
  assert.match(notFound, /meta name="robots" content="noindex,follow"/);
  assert.match(notFound, /class="article-wrap not-found-page"/);
  assert.match(notFound, /\/assets\/css\/editorial-blog\.css\?v=3/);
});
test('robots en sitemap zijn echte crawlbare bestanden met alleen canonieke blog-URL’s', () => {
  const robots = read('robots.txt');
  const sitemap = read('sitemap.xml');
  const feed = JSON.parse(read('blog-feed.json'));

  assert.match(robots, /^User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/www\.vitalora\.nl\/sitemap\.xml/);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

  for (const post of feed) {
    assert.match(sitemap, new RegExp(`<loc>https://www\\.vitalora\\.nl/${post.slug}</loc>`));
  }
  assert.doesNotMatch(sitemap, /zuiveringszout-baking-soda|\/waterkers<|\/eiwitpoeders<|\/oligofructose</);
});

test('historische URL-waarde gaat via permanente redirects naar de gekozen canonical', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const expected = new Map([
    ['/zuiveringszout-baking-soda', '/is-zuiveringszout-hetzelfde-als-baking-soda'],
    ['/waterkers', '/is-waterkers-gezond'],
    ['/eiwitpoeders', '/afvallen-met-eiwitpoeder'],
    ['/oligofructose', '/is-oligofructose-slecht']
  ]);

  for (const [source, destination] of expected) {
    const redirect = vercel.redirects.find((item) => item.source === source);
    assert.deepEqual(redirect, { source, destination, permanent: true });
    const htmlRedirect = vercel.redirects.find((item) => item.source === `${source}.html`);
    assert.deepEqual(htmlRedirect, { source: `${source}.html`, destination, permanent: true });
  }
});

test('iedere gepubliceerde blog heeft een expliciete Vercel-route en statische canonical', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const feed = JSON.parse(read('blog-feed.json'));

  for (const post of feed) {
    const rewrite = vercel.rewrites.find((item) => item.source === `/${post.slug}`);
    assert.ok(rewrite, `rewrite ontbreekt voor /${post.slug}`);
    assert.equal(rewrite.destination, `/${post.slug}.html`);
    assert.match(read(`${post.slug}.html`), new RegExp(`rel="canonical" href="https://www\\.vitalora\\.nl/${post.slug}"`));
  }
});

test('de API kan bij een ontbrekende database veilig terugvallen op de statische feed', () => {
  const api = read('api/blog-feed.js');

  assert.match(api, /function readStaticFeed\(\)/);
  assert.match(api, /source: 'static-fallback'/);
  assert.match(api, /mergePublishedPosts/);
  assert.match(api, /s-maxage=300/);
});
