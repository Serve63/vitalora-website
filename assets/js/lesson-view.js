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

    function setText(sel,v){ const e=document.querySelector(sel); if(e) e.textContent=v; }
    function setHTML(sel,v){ const e=document.querySelector(sel); if(e) e.innerHTML=v; }
    function setHref(sel,v){ const e=document.querySelector(sel); if(e&&v) e.setAttribute('href',v); }
    function setBadge(sel,v){ const e=document.querySelector(sel); if(e){ e.textContent=v; e.classList.remove('hidden'); } }
  }).catch(()=> showError('Les kon niet geladen worden.'));

  function showError(msg){
    const t=document.getElementById('lessonTitle'); if(t) t.textContent='Fout bij laden';
    const c=document.getElementById('lessonContent'); if(c) c.innerHTML = `<div class="card"><p>${msg}</p></div>`;
  }
})();
