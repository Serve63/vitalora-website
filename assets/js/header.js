document.addEventListener('DOMContentLoaded', async () => {
  if (document.documentElement.classList.contains('route-courses')) return;

  const mount = document.querySelector('[data-include="site-header"]');
  if (!mount) return;

  const res = await fetch('/partials/header.html?v=4');
  mount.innerHTML = await res.text();

  // Belt & suspenders: naast .route-home zetten we ook .is-home
  const path = location.pathname.toLowerCase().replace(/\/index\.html$/, '/');
  const isHome = (path === '/' || path === '');
  document.documentElement.classList.toggle('is-home', isHome);
});
