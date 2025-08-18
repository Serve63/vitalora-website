document.addEventListener('DOMContentLoaded', async () => {
  // Niet op les-overzichten
  if (document.documentElement.classList.contains('course-overview')) return;

  const mount = document.querySelector('[data-include="site-header"]');
  if (!mount) return;

  const res = await fetch('/partials/header.html?v=3');
  mount.innerHTML = await res.text();

  const p = location.pathname.toLowerCase().replace(/\/index\.html$/, '/');
  const isHome = (p === '/' || p === '');
  document.documentElement.classList.toggle('is-home', isHome);
});
