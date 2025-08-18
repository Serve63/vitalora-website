document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.querySelector('[data-include="site-header"]');
  if (!mount) return;
  
  try {
    const res = await fetch('/partials/header.html?v=1');
    if (!res.ok) {
      console.error('Failed to load header:', res.status);
      return;
    }
    mount.innerHTML = await res.text();

    // Active link highlight (optioneel)
    const path = location.pathname.replace(/\/index\.html$/, '/').toLowerCase();
    mount.querySelectorAll('a[data-nav]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.toLowerCase() === path) a.classList.add('active');
    });
  } catch (error) {
    console.error('Error loading header:', error);
  }
});
