(function(){
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

  fetch(`/data/courses/${slug}.json?v=1`).then(r=>{
    if(!r.ok) throw new Error('404');
    return r.json();
  }).then(course=>{
    // Titel/subtitle/badges
    el.title.textContent = course.title || 'Cursus';
    el.sub.textContent   = course.subtitle || '';
    el.crumb && (el.crumb.textContent = course.title || '');
    el.level.textContent = course.level || 'Theorie';
    if(course.duration_days){ el.days.textContent = `${course.duration_days} dagen`; el.days.classList.remove('hidden'); }
    if(Array.isArray(course.lessons)){ el.count.textContent = `${course.lessons.length} lessen`; el.count.classList.remove('hidden'); }

    // Render lessen
    const live = (course.lessons || []).filter(l => !l.draft);
    el.list.innerHTML = live.map(l => cardTpl(course, l)).join('');
  }).catch(err=>{
    console.error(err);
    el.title.textContent = 'Cursus niet gevonden';
    el.sub.textContent   = 'Controleer de URL of probeer later opnieuw.';
  });

  function cardTpl(course, l){
    const url = `/lesson-view.html?course=${course.slug}&lesson=${l.index}`;
    return `
      <article class="lesson-card">
        <div class="meta">
          <div class="idx chip">${l.index}</div>
          <div>
            <div class="title">${escapeHTML(l.title)}</div>
            <div class="chips">
              <span class="chip">${(l.duration_min||10)} min</span>
              <span class="chip">${escapeHTML(l.type || course.level || 'Theorie')}</span>
            </div>
          </div>
        </div>
        <a class="btn-start" href="${url}">
          Start les <span class="icon-play" aria-hidden="true"></span>
        </a>
      </article>`;
  }

  function escapeHTML(s){
    return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
})();
