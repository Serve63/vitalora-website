// Helper
function qs(name, d=window.location.search) {
  const m = new URLSearchParams(d).get(name);
  return m && decodeURIComponent(m);
}

(async function initLesson(){
  const courseSlug = qs("course");   // bv. "de-juiste-balans"
  let lessonParam  = qs("lesson");   // bv. "1" of "les-1-welkom"
  if (!courseSlug) {
    console.error("Geen course meegegeven.");
    return renderError("Cursus niet gevonden.");
  }

  // 1) Laad precies deze cursus (geen fallback!)
  const res = await fetch(`/data/courses/${courseSlug}.json?v=1`);
  if (!res.ok) return renderError("Cursus niet gevonden.");
  const course = await res.json();

  // 2) Vind de juiste les op index of id
  const lessons = (course.lessons || []).filter(l => !l.draft);
  if (!lessons.length) return renderError("Er zijn nog geen gepubliceerde lessen.");

  let lesson;
  if (lessonParam && /^\d+$/.test(lessonParam)) {
    const idx = parseInt(lessonParam, 10);
    lesson = lessons.find(l => l.index === idx);
  } else if (lessonParam) {
    lesson = lessons.find(l => l.id === lessonParam);
  } else {
    lesson = lessons[0]; // default naar eerste gepubliceerde les
  }
  if (!lesson) return renderError("Les niet gevonden.");

  // 3) Vul UI
  setText("#courseTitle", course.title);
  setText("#lessonTitle", lesson.title);
  setHTML("#lessonContent", lesson.content_html);

  // badges
  setText("#badgeDuration", `${lesson.duration_min || 10} minuten`);
  setText("#badgeType", course.level || "Theorie");

  // 4) Links
  setHref("#backToLessons", `/course-view.html?course=${course.slug}`);
  setHref("#prevLesson", lesson.index > 1 ? `/lesson-view.html?course=${course.slug}&lesson=${lesson.index-1}` : null);
  setHref("#nextLesson", `/lesson-view.html?course=${course.slug}&lesson=${lesson.index+1}`);

  // 5) LocalStorage progress namespacing (voorkomt mixen met Clean Reset)
  const doneKey = `progress:${course.slug}:${lesson.id}:done`;
  const doneBtn = document.querySelector("#markComplete");
  const doneNote = document.querySelector("#completeStatus");
  if (localStorage.getItem(doneKey) === "true") doneNote && (doneNote.textContent = "Les voltooid ✓");
  doneBtn && doneBtn.addEventListener("click", () => {
    localStorage.setItem(doneKey, "true");
    doneNote && (doneNote.textContent = "Les voltooid ✓");
  });

  // helpers
  function setText(sel, v){ const el=document.querySelector(sel); if(el&&v) el.textContent=v; }
  function setHTML(sel, v){ const el=document.querySelector(sel); if(el&&v) el.innerHTML=v; }
  function setHref(sel, v){ const el=document.querySelector(sel); if(!el) return; if(v) el.setAttribute("href", v); else el.remove(); }
  function renderError(msg){ setHTML("#lessonContent", `<div class='card'><p>${msg}</p></div>`); }
})();
