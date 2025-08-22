(function(){
  // Deze pagina is een cursus-overzicht
  document.documentElement.classList.add('course-overview');
  
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const slug = qs('course');
  if(!slug){ console.error('Geen course'); return; }

  const el = {
    title:  document.getElementById('courseTitle'),
    sub:    document.getElementById('courseSubtitle'),
    level:  document.getElementById('badgeLevel'),
    days:   document.getElementById('badgeDays'),
    count:  document.getElementById('badgeLessons'),
    list:   document.getElementById('lessonList'),
    crumb:  document.getElementById('courseCrumb'),
    hero:   document.getElementById('courseHero')
  };

  fetch(`/data/courses/${slug}.json?v=2`).then(r=>{
    if(!r.ok) throw new Error('404');
    return r.json();
  }).then(course=>{
    console.log('Course loaded:', course);
    console.log('Total lessons:', course.lessons?.length);
    console.log('Draft lessons:', course.lessons?.filter(l => l.draft).length);
    console.log('Live lessons:', course.lessons?.filter(l => !l.draft).length);
    
    // Titel/subtitle/badges
    el.title.textContent = course.title || 'Cursus';
    el.sub.textContent   = course.subtitle || '';
    el.crumb && (el.crumb.textContent = course.title || '');
    el.level.textContent = course.level || 'Theorie';
    if(course.duration_days){ el.days.textContent = `${course.duration_days} dagen`; el.days.classList.remove('hidden'); }
    if(Array.isArray(course.lessons)){ el.count.textContent = `${course.lessons.length} lessen`; el.count.classList.remove('hidden'); }

    // Render lessen
    const live = (course.lessons || []).filter(l => !l.draft);
    console.log('Rendering lessons:', live.length);
    el.list.innerHTML = live.map(l => cardTpl(course, l)).join('');

    // Apply theme colors (per pagina, geen globale side-effects)
    applyTheme(course.theme, document.getElementById('courseHero'));
    
    // Apply animated circle colors based on course theme
    applyCircleColors(course.theme);
    
    // Show content with fade-in effect
    setTimeout(() => {
      el.hero.style.opacity = '1';
      document.querySelector('.course.container').style.opacity = '1';
    }, 100);
  }).catch(err=>{
    console.error(err);
    el.title.textContent = 'Cursus niet gevonden';
    el.sub.textContent   = 'Controleer de URL of probeer later opnieuw.';
    
    // Show error state
    el.hero.style.opacity = '1';
    document.querySelector('.course.container').style.opacity = '1';
  });

  function applyTheme(theme, heroEl){
    if(!theme) return;
    if(heroEl && theme.grad_a) heroEl.style.setProperty('--grad-a', theme.grad_a);
    if(heroEl && theme.grad_b) heroEl.style.setProperty('--grad-b', theme.grad_b);
    if(theme.brand) document.documentElement.style.setProperty('--brand', theme.brand);
  }

  function applyCircleColors(theme){
    if(!theme) return;
    
    // Get the main brand color for circles
    const brandColor = theme.brand || theme.grad_a || '#3b82f6';
    
    // Convert hex to RGB for opacity variations
    const hex = brandColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Apply different opacity levels to each circle
    const circles = [
      { element: '.floating-circle-1', opacity: 0.06 },
      { element: '.floating-circle-2', opacity: 0.05 },
      { element: '.floating-circle-3', opacity: 0.04 },
      { element: '.floating-circle-4', opacity: 0.03 },
      { element: '.floating-circle-5', opacity: 0.05 }
    ];
    
    circles.forEach(circle => {
      const elements = document.querySelectorAll(circle.element);
      elements.forEach(el => {
        el.style.background = `rgba(${r}, ${g}, ${b}, ${circle.opacity})`;
      });
    });
  }

  function cardTpl(course, l){
    const url = `/lesson-view.html?course=${course.slug}&lesson=${l.index}`;
    return `
      <article class="lesson-card" onclick="window.location.href='${url}'" style="cursor: pointer;">
        <div class="meta">
          <div class="idx">${l.index}</div>
          <div class="content">
            <div class="title">${escapeHTML(l.title)}</div>
            <div class="chips">
              <span class="chip">${(l.duration_min||10)} min</span>
              <span class="chip">${escapeHTML(l.type || course.level || 'Theorie')}</span>
            </div>
          </div>
        </div>
        <a class="btn-start" href="${url}" onclick="event.stopPropagation()">
          Start les <span class="icon-play" aria-hidden="true"></span>
        </a>
      </article>`;
  }

  function escapeHTML(s){
    return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
})();
