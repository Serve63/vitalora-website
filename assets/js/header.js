document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.querySelector('[data-include="site-header"]');
  if (!mount) return;
  
  try {
    const res = await fetch('/partials/header.html?v=2');
    if (!res.ok) {
      console.error('Failed to load header:', res.status);
      return;
    }
    mount.innerHTML = await res.text();

    // Markeer of we op de homepage zitten
    const path = location.pathname.toLowerCase().replace(/\/index\.html$/, '/');
    const isHome = path === '/';
    document.documentElement.classList.toggle('is-home', isHome);

    // Active link highlight (optioneel)
    mount.querySelectorAll('a[data-nav]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.toLowerCase() === path) a.classList.add('active');
    });
  } catch (error) {
    console.error('Error loading header:', error);
  }
});
