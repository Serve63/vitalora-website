const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('desktop houdt de cursusnavigatie vast terwijl de lespagina scrollt', () => {
  const css = read('assets/css/course-reader.css');
  const body = css.match(/body\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const sidebar = css.match(/\.sidebar\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const main = css.match(/\.main\s*\{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(body, /height:\s*100dvh/);
  assert.match(body, /overflow:\s*hidden/);
  assert.match(sidebar, /height:\s*100dvh/);
  assert.match(sidebar, /overflow-y:\s*auto/);
  assert.match(main, /height:\s*100dvh/);
  assert.match(main, /overflow-y:\s*auto/);
  assert.match(css, /\.sidebar::\-webkit-scrollbar\s*\{[\s\S]*?width:\s*0/);
});

test('mobiel zet de sidebar terug in de normale paginastroom', () => {
  const css = read('assets/css/course-reader.css');
  const mobile = css.match(/@media \(max-width: 760px\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(mobile, /\.sidebar\s*\{[\s\S]*?position:\s*relative/);
  assert.match(mobile, /height:\s*auto/);
  assert.match(mobile, /overflow:\s*visible/);
  assert.match(mobile, /\.main\s*\{[\s\S]*?height:\s*auto/);
  assert.match(mobile, /\.main\s*\{[\s\S]*?overflow:\s*visible/);
});

test('leesvoortgang luistert naar het scrollende cursusdeel', () => {
  const script = read('assets/js/course-view.js');
  assert.match(script, /\$\('#main'\)\.addEventListener\('scroll', updateReadingProgress/);
  assert.match(script, /reader\.scrollTop/);
  assert.match(script, /reader\.scrollHeight/);
});

test('de cursuspagina gebruikt de nieuwe cacheversies van readerstijl en gedrag', () => {
  const html = read('course-view.html');
  const script = read('assets/js/course-view.js');
  assert.match(html, /course-reader\.css\?v=17/);
  assert.match(html, /course-view\.js\?v=13/);
  assert.match(script, /clean-reset[^\n]*\.json\?v=6|courses\/\$\{encodeURIComponent\(state\.slug\)\}\.json\?v=6/);
});
