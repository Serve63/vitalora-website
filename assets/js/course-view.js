// Helper
function qs(name, d=window.location.search) {
  const m = new URLSearchParams(d).get(name);
  return m && decodeURIComponent(m);
}

(async function initCourse(){
  const courseSlug = qs("course");
  if (!courseSlug) {
    console.error("Geen course meegegeven.");
    return renderError("Cursus niet gevonden.");
  }

  // Laad precies deze cursus (geen fallback!)
  const res = await fetch(`/data/courses/${courseSlug}.json?v=1`);
  if (!res.ok) return renderError("Cursus niet gevonden.");
  const course = await res.json();

  // Vul UI
  setText("#courseTitle", course.title);
  setText("#courseSubtitle", course.subtitle);
  setText("#courseLevel", course.level || "Theorie");

  // Render lessen (verberg conceptlessen)
  const lessons = (course.lessons || []).filter(l => !l.draft);
  const lessonsContainer = document.querySelector("#lessonsList");
  
  if (lessonsContainer && lessons.length) {
    lessonsContainer.innerHTML = lessons.map(lesson => `
      <div class="lesson-card">
        <div class="lesson-info">
          <h3>${lesson.title}</h3>
          <div class="lesson-meta">
            <span class="badge duration">${lesson.duration_min || 10} min</span>
            <span class="badge type">${course.level || "Theorie"}</span>
          </div>
        </div>
        <a href="/lesson-view.html?course=${course.slug}&lesson=${lesson.index}" class="btn start-lesson">
          Start les
        </a>
      </div>
    `).join('');
  } else {
    lessonsContainer.innerHTML = '<p>Er zijn nog geen gepubliceerde lessen beschikbaar.</p>';
  }

  // helpers
  function setText(sel, v){ const el=document.querySelector(sel); if(el&&v) el.textContent=v; }
  function renderError(msg){ 
    const container = document.querySelector("#courseContent") || document.querySelector("main");
    if(container) container.innerHTML = `<div class='card'><p>${msg}</p></div>`; 
  }
})();
