const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('alle historische blogroutes blijven op hun eigen slug via de gedeelde adapter', () => {
  const config = JSON.parse(read('vercel.json'));
  const legacyRoutes = config.rewrites.filter(({ destination }) => destination.startsWith('/post.html?slug='));

  assert.equal(legacyRoutes.length, 60);
  assert.equal(new Set(legacyRoutes.map(({ source }) => source)).size, 60);

  for (const route of legacyRoutes) {
    const sourceSlug = route.source.slice(1);
    const destinationSlug = route.destination.split('slug=')[1];
    assert.equal(destinationSlug, sourceSlug, `${route.source} moet zijn eigen slug behouden`);
  }
});

test('rechtstreeks bereikbare historische html-bestanden zijn zelf cursusvrij en hebben de ebookkaart', () => {
  const config = JSON.parse(read('vercel.json'));
  const legacySlugs = config.rewrites
    .filter(({ destination }) => destination.startsWith('/post.html?slug='))
    .map(({ source }) => source.slice(1));
  const localSources = legacySlugs.filter((slug) => fs.existsSync(path.join(root, `${slug}.html`)));
  const directFiles = [...localSources.map((slug) => `${slug}.html`), 'dopamine-voeding.html', 'suiker.html'];
  const forbidden = /Mijn Academy|Vitalora Academy|Clean Reset|detox-cursus|href=["']\/?academy|detox programma/i;

  assert.equal(localSources.length, 17);
  for (const file of directFiles) {
    const html = read(file);
    assert.doesNotMatch(html, forbidden, file);
    assert.match(html, /assets\/css\/ebook-optin-modal\.css\?v=7/, file);
    assert.match(html, /assets\/js\/blog-ebook-promo\.js\?v=7/, file);
    assert.equal((html.match(/data-blog-ebook-promo hidden/g) || []).length, 1, file);
  }

  assert.deepEqual(
    config.redirects.find(({ source }) => source === '/blog-post.html'),
    { source: '/blog-post.html', destination: '/blog', permanent: true }
  );
  assert.deepEqual(
    config.rewrites.find(({ source }) => source === '/dopamine-voeding'),
    { source: '/dopamine-voeding', destination: '/dopamine-voeding.html' }
  );
  assert.deepEqual(
    config.rewrites.find(({ source }) => source === '/behoefte-aan-suiker'),
    { source: '/behoefte-aan-suiker', destination: '/suiker.html' }
  );
});

test('de historische adapter behoudt alle laadpaden en renderer-contracten', () => {
  const post = read('post.html');
  const requiredIds = ['post-title', 'post-date', 'post-read-time', 'featured-image', 'post-content'];

  for (const id of requiredIds) assert.match(post, new RegExp(`id="${id}"`));
  assert.match(post, /class="editorial-page page-blog-post legacy-blog-post"/);
  assert.match(post, /class="blog-content legacy-blog-content"/);
  assert.doesNotMatch(post, /class="blog-content legacy-blog-content"[^>]*aria-live/);
  assert.doesNotMatch(post, /<span>Vitalora Redactie<\/span>/);
  assert.match(post, /\/assets\/css\/editorial-blog\.css\?v=2/);
  assert.doesNotMatch(post, /fonts\.googleapis\.com|#2954B4|data-include="site-header"/i);

  const staticCall = post.indexOf('let post = await fetchStatic(slug)');
  const apiCall = post.indexOf('post = await fetchPublicApi(slug)');
  const localCall = post.indexOf('post = await fetchFromLocal(slug)');
  assert.ok(staticCall > -1 && staticCall < apiCall && apiCall < localCall);
  assert.match(post, /localStorage\.getItem\('vitalora_blog_posts'\)/);
  assert.match(post, /\/api\/blog-feed\?slug=/);
  assert.match(post, /doc\.querySelector\('\.blog-content'\) \|\| doc\.querySelector\('article'\) \|\| doc\.querySelector\('main'\)/);
  assert.match(post, /readTime:\s*readTimeMatch \? Number\.parseInt/);
  assert.match(post, /replace\(\/\^📅\\s\*\/[^)]*\)/);
  assert.doesNotMatch(post, /post\.readTime \|\| 5|readTimeEl \? Number\.parseInt\([^\n]+\|\| 5/);
});

test('lokale historische broninhoud blijft passief en past in de editorial adapter', () => {
  const config = JSON.parse(read('vercel.json'));
  const legacySlugs = config.rewrites
    .filter(({ destination }) => destination.startsWith('/post.html?slug='))
    .map(({ source }) => source.slice(1));
  const localSources = legacySlugs.filter((slug) => fs.existsSync(path.join(root, `${slug}.html`)));

  assert.equal(localSources.length, 17);
  for (const slug of localSources) {
    const html = read(`${slug}.html`);
    const content = html.match(/<div class="blog-content">([\s\S]*?)<\/div>/)?.[1]
      || html.match(/<article class="blog-content">([\s\S]*?)<\/article>/)?.[1];
    assert.match(html, /<h1|class="blog-title"/);
    assert.ok(content, `${slug}.html moet uitleesbare bloginhoud bevatten`);
    assert.doesNotMatch(content, /<script|<style|<iframe|<form|\son\w+=/i);
  }

  const editor = read('blog-editor.html');
  assert.match(editor, /post\.html\?slug=/);
});

test('legacy componenten hebben alleen binnen de adapter een warme fallbackstijl', () => {
  const css = read('assets/css/editorial-blog.css');

  assert.match(css, /\.legacy-blog-content \.summary-box/);
  assert.match(css, /\.legacy-blog-content \.highlight-box/);
  assert.match(css, /\.legacy-blog-content \.image-placeholder \{ display: none; \}/);
  assert.match(css, /\.legacy-blog-content table/);
  assert.match(css, /\.legacy-article-hero:empty \{ display: none; \}/);
  assert.match(css, /\.legacy-blog-content pre[\s\S]*?color:\s*#f8efe5/);
});
