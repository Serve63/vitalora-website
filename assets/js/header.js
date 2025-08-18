document.addEventListener('DOMContentLoaded', async () => {
  // Als je de header op bepaalde routes verbergt, laat deze guard staan:
  if (document.documentElement.classList.contains('course-overview')) return;

  const mount = document.querySelector('[data-include="site-header"]');
  if (!mount) return;

  const res = await fetch('/partials/header.html?v=4');
  mount.innerHTML = await res.text();

  // ✅ Home = alleen root of index.html
  const path = new URL(window.location.href).pathname.toLowerCase();
  const normalized = path
    .replace(/\/index\.html$/, '/')   // …/index.html -> /
    .replace(/\/home\/?$/, '/');      // optioneel: …/home -> /

  const isHome = (normalized === '/' || normalized === '');
  document.documentElement.classList.toggle('is-home', isHome);
});
