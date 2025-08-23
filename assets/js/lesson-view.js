// Fetch course + lesson en vul hero + content, zonder cross-course fallback
(function(){
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const slug = qs('course');
  let lessonParam = qs('lesson');
  if(!slug){ return showError('Cursus niet gevonden.'); }

  fetch(`/data/courses/${slug}.json?v=1`).then(r=>{
    if(!r.ok) throw new Error('404');
    return r.json();
  }).then(course=>{
    const lessons = (course.lessons||[]).filter(l => !l.draft);
    if(!lessons.length) return showError('Er zijn nog geen gepubliceerde lessen.');

    let lesson;
    if(lessonParam && /^\d+$/.test(lessonParam)){
      lesson = lessons.find(l => l.index === parseInt(lessonParam,10));
    }else if(lessonParam){
      lesson = lessons.find(l => l.id === lessonParam);
    }else{
      lesson = lessons[0];
    }
    if(!lesson) return showError('Les niet gevonden.');

    // Hero
    setText('#lessonCourseName', course.title || '');
    setText('#lessonTitle', lesson.title || '');
    setBadge('#badgeIndex', `Les ${lesson.index} van ${course.lessons.length}`);
    setBadge('#badgeDuration', `${lesson.duration_min || 10} min`);
    setBadge('#badgeType', lesson.type || course.level || 'Theorie');

    // Back link
    setHref('#backToLessons', `/course-view.html?course=${course.slug}`);

    // Content
    const placeholder = `
      <div class="card">
        <p>De inhoud van deze les wordt binnenkort toegevoegd.</p>
        <p class="muted">Tip: klik op "Les Voltooien" pas wanneer de inhoud live staat.</p>
      </div>`;
    setHTML('#lessonContent', (lesson.content_html||'').trim() || placeholder);

    // Progress namespace
    const doneKey = `progress:${course.slug}:${lesson.id}:done`;
    const doneBtn = document.querySelector('#markComplete');
    const doneMsg = document.querySelector('#completeStatus');
    if(localStorage.getItem(doneKey)==='true' && doneMsg){ doneMsg.textContent='Les voltooid ✓'; }
    doneBtn?.addEventListener('click', ()=>{ localStorage.setItem(doneKey,'true'); if(doneMsg) doneMsg.textContent='Les voltooid ✓'; });

    // Setup navigation
    setupNavigation(course, lessons, lesson);

    // Apply theme colors
    applyTheme(course.theme, document.getElementById('lessonHero'));
    
    // Show content with fade-in effect
    setTimeout(() => {
      document.getElementById('lessonHero').style.opacity = '1';
      document.getElementById('lessonHero').style.visibility = 'visible';
      document.querySelector('.lesson.container').style.opacity = '1';
      document.querySelector('.lesson.container').style.visibility = 'visible';
    }, 100);

    function setText(sel,v){ const e=document.querySelector(sel); if(e) e.textContent=v; }
    function setHTML(sel,v){ const e=document.querySelector(sel); if(e) e.innerHTML=v; }
    function setHref(sel,v){ const e=document.querySelector(sel); if(e&&v) e.setAttribute('href',v); }
    function setBadge(sel,v){ const e=document.querySelector(sel); if(e){ e.textContent=v; e.classList.remove('hidden'); } }
  }).catch(()=> showError('Les kon niet geladen worden.'));

  function setupNavigation(course, lessons, currentLesson) {
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

    // Previous lesson button
    const prevBtn = document.querySelector('#prevLesson');
    if (prevBtn && prevLesson) {
      prevBtn.href = `/lesson-view.html?course=${course.slug}&lesson=${prevLesson.id}`;
      prevBtn.style.display = 'inline-flex';
    } else if (prevBtn) {
      prevBtn.style.display = 'none';
    }

    // Next lesson button
    const nextBtn = document.querySelector('#nextLesson');
    if (nextBtn && nextLesson) {
      nextBtn.href = `/lesson-view.html?course=${course.slug}&lesson=${nextLesson.id}`;
      nextBtn.style.display = 'inline-flex';
    } else if (nextBtn) {
      nextBtn.style.display = 'none';
    }
  }

  function applyTheme(theme, heroEl){
    if(!theme) return;
    if(heroEl && theme.grad_a) heroEl.style.setProperty('--grad-a', theme.grad_a);
    if(heroEl && theme.grad_b) heroEl.style.setProperty('--grad-b', theme.grad_b);
    if(theme.brand) document.documentElement.style.setProperty('--brand', theme.brand);
  }

  function showError(msg){
    const t=document.getElementById('lessonTitle'); if(t) t.textContent='Fout bij laden';
    const c=document.getElementById('lessonContent'); if(c) c.innerHTML = `<div class="card"><p>${msg}</p></div>`;
    
    // Show content even on error
    setTimeout(() => {
      document.getElementById('lessonHero').style.opacity = '1';
      document.getElementById('lessonHero').style.visibility = 'visible';
      document.querySelector('.lesson.container').style.opacity = '1';
      document.querySelector('.lesson.container').style.visibility = 'visible';
    }, 100);
  }
})();
