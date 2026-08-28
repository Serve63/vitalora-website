const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const fallbackColor = '#253129';
const stylesheetHref = '/assets/css/ios-statusbar.css?v=1';
const checkOnly = process.argv.includes('--check');

function trackedHtmlFiles() {
  return execFileSync('git', ['ls-files', '*.html'], {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim().split('\n').filter(Boolean);
}

function themeColor(source) {
  const tag = source.match(/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/i)?.[0];
  return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] || fallbackColor;
}

function ensureThemeColor(source, color) {
  if (/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/i.test(source)) return source;
  const tag = `  <meta name="theme-color" content="${color}">`;
  const viewport = /<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/i;
  if (viewport.test(source)) return source.replace(viewport, (match) => `${match}\n${tag}`);
  return source.replace(/<head\b[^>]*>/i, (match) => `${match}\n${tag}`);
}

function ensureStylesheet(source) {
  if (source.includes('/assets/css/ios-statusbar.css')) return source;
  const theme = /<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/i;
  return source.replace(theme, (match) => `${match}\n  <link rel="stylesheet" href="${stylesheetHref}">`);
}

function ensureHtmlColorVariable(source, color) {
  return source.replace(/<html\b([^>]*)>/i, (tag, attributes) => {
    const style = attributes.match(/\bstyle=(["'])(.*?)\1/i);
    if (!style) return `<html${attributes} style="--ios-statusbar-color: ${color}">`;
    const cleaned = style[2]
      .replace(/(?:^|;)\s*--ios-statusbar-color\s*:[^;]*/i, '')
      .replace(/^\s*;|;\s*$/g, '')
      .trim();
    const value = `${cleaned ? `${cleaned}; ` : ''}--ios-statusbar-color: ${color}`;
    return tag.replace(style[0], `style=${style[1]}${value}${style[1]}`);
  });
}

function ensureSurface(source) {
  if (/class=["'][^"']*\bios-status-bar-surface\b[^"']*["']/i.test(source)) return source;
  return source.replace(/<body\b([^>]*)>/i, (match) => (
    `${match}\n  <div class="ios-status-bar-surface" aria-hidden="true"></div>`
  ));
}

function transform(source) {
  if (!/<html\b/i.test(source) || !/<head\b/i.test(source) || !/<body\b/i.test(source)) return source;
  const color = themeColor(source);
  return ensureSurface(ensureHtmlColorVariable(ensureStylesheet(ensureThemeColor(source, color)), color));
}

const changed = [];
for (const relativePath of trackedHtmlFiles()) {
  const filePath = path.join(repoRoot, relativePath);
  const before = fs.readFileSync(filePath, 'utf8');
  const after = transform(before);
  if (after === before) continue;
  changed.push(relativePath);
  if (!checkOnly) fs.writeFileSync(filePath, after);
}

if (checkOnly && changed.length) {
  console.error(`[ios-statusbar] ${changed.length} HTML-documenten missen de globale statusbalkcontracten.`);
  for (const file of changed) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`[ios-statusbar] ${checkOnly ? 'Gecontroleerd' : 'Bijgewerkt'}: ${changed.length} HTML-documenten.`);
