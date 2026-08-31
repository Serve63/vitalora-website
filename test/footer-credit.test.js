const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const credit = '<a href="https://www.softora.nl/">Website gebouwd door Softora.nl</a>';
const creditPattern = /<a(?: class="copy")? href="https:\/\/www\.softora\.nl\/">Website gebouwd door Softora\.nl<\/a>/;

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function footer(file) {
  return read(file).match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
}

test('alle actieve openbare footervarianten vermelden Softora als websitebouwer', () => {
  const articleFiles = JSON.parse(read('blog-feed.json')).map(({ slug }) => `${slug}.html`);
  const publicFooterFiles = [
    'index.html',
    'academy.html',
    'post.html',
    'blog.html',
    'blog/index.html',
    'dopamine-voeding.html',
    'microplastics-een-diepgaande-uitleg.html',
    'suiker.html',
    'privacy.html',
    'privacy/index.html',
    'voorwaarden.html',
    'voorwaarden/index.html',
    'tk-ebook/index.html',
    ...articleFiles,
  ];

  publicFooterFiles.forEach((file) => {
    const htmlFooter = footer(file);
    assert.ok(htmlFooter, `${file} mist een footer`);
    assert.match(htmlFooter, creditPattern, `${file} mist de Softora-credit`);
    assert.equal((htmlFooter.match(/Website gebouwd door Softora\.nl/g) || []).length, 1, `${file} moet de credit exact één keer tonen`);
  });
});

test('de bloggenerator bewaakt de credit en houdt beide blogindexen gelijk', () => {
  assert.ok(read('scripts/build-blog.js').includes(credit));
  assert.equal(read('blog.html'), read('blog/index.html'));
});

test('de Academy-credit erft de donkere footerstijl en gebruikt de nieuwe cacheversie', () => {
  const academy = read('academy.html');
  const css = read('assets/css/academy-winter.css');

  assert.match(academy, /\/assets\/css\/academy-winter\.css\?v=7/);
  assert.match(css, /\.academy-footer a\s*\{[\s\S]*?color:\s*inherit;[\s\S]*?text-decoration:\s*none;/);
});
