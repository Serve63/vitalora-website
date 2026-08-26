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
  assert.match(html, /course-reader\.css\?v=19/);
  assert.match(html, /course-view\.js\?v=15/);
  assert.match(script, /clean-reset[^\n]*\.json\?v=6|courses\/\$\{encodeURIComponent\(state\.slug\)\}\.json\?v=6/);
});

test('alleen Clean Reset krijgt de warme winterse readerlayout', () => {
  const html = read('course-view.html');
  const css = read('assets/css/course-reader.css');
  const script = read('assets/js/course-view.js');

  assert.match(html, /slug === 'clean-reset'[\s\S]*classList\.add\('clean-reset-reader'\)/);
  assert.match(html, /'clean-reset': \['#bf7654', '#7a4b3a'\]/);
  assert.match(css, /html\.clean-reset-reader\s*\{[\s\S]*--sidebar-bg:\s*#253129/);
  assert.match(css, /html\.clean-reset-reader \.lesson-head\s*\{[\s\S]*grid-template-columns:/);
  assert.match(css, /html\.clean-reset-reader \.content\s*\{[\s\S]*max-width:\s*740px/);
  assert.match(css, /html\.clean-reset-reader \.lesson-arrival\s*\{[\s\S]*border-radius:\s*18px/);
  assert.match(css, /html\.clean-reset-reader \.sidebar\s*\{[\s\S]*position:\s*fixed[\s\S]*transform:\s*translateX\(-105%\)/);
  assert.match(css, /html\.clean-reset-reader body\.sidebar-open \.sidebar\s*\{[\s\S]*translateX\(0\)/);
  assert.match(css, /html\.clean-reset-reader \.mobile-menu\s*\{[\s\S]*display:\s*grid/);
  assert.match(css, /:root\s*\{[\s\S]*--sidebar-bg:\s*#2954b3/, 'De standaardstijl voor andere cursussen moet blijven bestaan');
  assert.match(script, /'clean-reset': \{ a: '#bf7654', b: '#7a4b3a', brand: '#bf7654' \}/);
  assert.match(script, /matchMedia\('\(max-width: 760px\)'\)[\s\S]*classList\.remove\('sidebar-open'\)/);
});
