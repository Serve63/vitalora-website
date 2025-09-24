// Route-scope: zet route-klassen op document element
(function(){
  const path = location.pathname.toLowerCase();
  
  // Homepage detectie
  if (path === '/' || path === '/index.html' || path === '/home' || path === '/home/') {
    document.documentElement.classList.add('route-home');
  }
  
  // Course overview detectie
  if (path.includes('/course-view') || path.includes('/cursus/')) {
    document.documentElement.classList.add('route-courses');
  }
  
  // Academy detectie
  if (path.includes('/academy') || path.includes('/dashboard')) {
    document.documentElement.classList.add('route-academy');
  }
  
  // Blog detectie
  if (path.includes('/blog') || path.includes('/blogs')) {
    document.documentElement.classList.add('route-blog');
  }
  
  // Ebook detectie
  if (path.includes('/detox') || path.includes('/landing')) {
    document.documentElement.classList.add('route-ebook');
  }
})();
