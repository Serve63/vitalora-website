(function () {
  'use strict';

  const aliasToSlug = {
    'detox-cursus': 'clean-reset',
    powerfoods: 'powerfoods-superfood-specerij',
    'juiste-balans': 'de-juiste-balans',
    '30-dagen-challenge': '30-dagen-challenge',
    'everyday-nutrition': 'everyday-nutrition-praktisch-gezond',
    'mindful-energy': 'mindful-energy-innerlijke-rust',
    'energie-hormonen': 'energie-hormonen-balans'
  };

  const slugToAlias = Object.fromEntries(
    Object.entries(aliasToSlug).map(([alias, slug]) => [slug, alias])
  );

  const themes = {
    'clean-reset': { a: '#3a9aea', b: '#2563eb', brand: '#3a9aea' },
    'powerfoods-superfood-specerij': { a: '#ef4444', b: '#dc2626', brand: '#ef4444' },
    'de-juiste-balans': { a: '#f59e0b', b: '#d97706', brand: '#f59e0b' },
    '30-dagen-challenge': { a: '#f59e0b', b: '#d97706', brand: '#f59e0b' },
    'everyday-nutrition-praktisch-gezond': { a: '#fbbf24', b: '#eab308', brand: '#fbbf24' },
    'mindful-energy-innerlijke-rust': { a: '#a78bfa', b: '#8b5cf6', brand: '#a78bfa' },
    'energie-hormonen-balans': { a: '#84cc16', b: '#65a30d', brand: '#84cc16' }
  };

  const displayTitles = {
    'clean-reset': 'Clean Reset',
    'powerfoods-superfood-specerij': 'PowerFoods: Superfood & Specerij™',
    'de-juiste-balans': 'De Juiste Balans: Energie & Hormonen',
    '30-dagen-challenge': '30 Dagen Challenge',
    'everyday-nutrition-praktisch-gezond': 'Everyday Nutrition: Praktisch & Gezond™',
    'mindful-energy-innerlijke-rust': 'Mindful Energy: Innerlijke Rust',
    'energie-hormonen-balans': 'Energie & Hormonen Balans'
  };

  const cleanResetChapters = [
    { start: 1, end: 4, title: 'Regie zonder angst' },
    { start: 5, end: 9, title: 'Stoffen begrijpen' },
    { start: 10, end: 13, title: 'Keuken & drinkwater' },
    { start: 14, end: 17, title: 'Huis & verzorging' },
    { start: 18, end: 21, title: 'Je lichaam ondersteunen' },
    { start: 22, end: 24, title: 'Jouw resetplan' }
  ];

  const state = {
    slug: null,
    course: null,
    lessons: [],
    groups: [],
    current: null,
    completed: new Set()
  };

  const $ = (selector) => document.querySelector(selector);

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function getLocationState() {
    const params = new URLSearchParams(window.location.search);
    const pathPart = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
    const slug = params.get('course') || aliasToSlug[pathPart] || 'clean-reset';
    const lessonParam = params.get('lesson');
    return { slug, lessonParam };
  }

  function normalizeUrl(slug, lesson) {
    if (window.location.pathname !== '/course-view.html') return;
    const alias = slugToAlias[slug];
    if (!alias) return;
    const nextPath = lesson ? `/${alias}?lesson=${encodeURIComponent(lesson.index)}` : `/${alias}`;
    window.history.replaceState(null, '', nextPath);
  }

  function hexToRgb(hex) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return '58, 154, 234';
    return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16)).join(', ');
  }

  function applyTheme(theme, slug) {
    const active = themes[slug] || theme || themes['clean-reset'];
    const root = document.documentElement.style;
    root.setProperty('--brand', active.brand || active.a);
    root.setProperty('--brand-dark', active.b || active.brand || active.a);
    root.setProperty('--brand-rgb', hexToRgb(active.brand || active.a));
  }

  function readCompleted() {
    const result = new Set();
    const contentVersion = Number(state.course?.content_version || 1);
    const usesVersionedProgress = state.slug === 'clean-reset' && contentVersion >= 2;

    if (!usesVersionedProgress) {
      try {
        const stored = JSON.parse(localStorage.getItem('completedLessons') || '[]');
        if (Array.isArray(stored)) stored.forEach((value) => result.add(String(value)));
      } catch (error) {
        // Keep the reader available when storage is blocked or malformed.
      }
    }

    state.lessons.forEach((lesson) => {
      try {
        const versionedKey = `progress:${state.slug}:v${contentVersion}:${lesson.id}:done`;
        const lessonKey = `progress:${state.slug}:${lesson.id}:done`;
        const isDone = localStorage.getItem(usesVersionedProgress ? versionedKey : lessonKey) === 'true'
          || (usesVersionedProgress && localStorage.getItem(lessonKey) === 'true');
        if (isDone) {
          result.add(String(lesson.index));
          result.add(String(lesson.id));
        }
      } catch (error) {
        // Ignore individual storage failures.
      }
    });
    return result;
  }

  function isComplete(lesson) {
    return state.completed.has(String(lesson.index)) || state.completed.has(String(lesson.id));
  }

  function lessonView(lesson) {
    return lesson;
  }

  function shortTitle(title) {
    return String(title || '').replace(/^((les|dag)\s*\d+\s*:\s*)/i, '');
  }

  function sidebarTitle(lesson, view) {
    return shortTitle(view.title);
  }

  function lessonHref(lesson) {
    return `/course-view.html?course=${encodeURIComponent(state.slug)}&lesson=${encodeURIComponent(lesson.index)}`;
  }

  function lessonPath(slug, lesson) {
    const alias = slugToAlias[slug];
    return alias
      ? `/${alias}?lesson=${encodeURIComponent(lesson.index)}`
      : `/course-view.html?course=${encodeURIComponent(slug)}&lesson=${encodeURIComponent(lesson.index)}`;
  }

  function updateLessonUrl(slug, lesson, method) {
    window.history[method]({ course: slug, lesson: lesson.index }, '', lessonPath(slug, lesson));
  }

  function buildGroups() {
    const blueprint = state.slug === 'clean-reset' ? cleanResetChapters : null;
    if (blueprint) {
      state.groups = blueprint.map((chapter, index) => ({
        number: index + 1,
        title: chapter.title,
        lessons: state.lessons.filter((lesson) => lesson.index >= chapter.start && lesson.index <= chapter.end)
      })).filter((group) => group.lessons.length);
      return;
    }

    state.groups = [];
    for (let index = 0; index < state.lessons.length; index += 5) {
      state.groups.push({
        number: state.groups.length + 1,
        title: `Hoofdstuk ${state.groups.length + 1}`,
        lessons: state.lessons.slice(index, index + 5)
      });
    }
  }

  function renderSidebar() {
    const nav = $('#sNav');
    const completedCount = state.lessons.filter(isComplete).length;
    const percentage = state.lessons.length ? (completedCount / state.lessons.length) * 100 : 0;
    $('#sProgCount').textContent = `${completedCount} / ${state.lessons.length}`;
    $('#sProgFill').style.width = `${percentage}%`;

    nav.innerHTML = state.groups.map((group) => `
      <div class="s-ch-label">Hfdst. ${group.number} · ${escapeHTML(group.title)}</div>
      ${group.lessons.map((lesson) => {
        const active = lesson.index === state.current.index;
        const complete = isComplete(lesson);
        const view = lessonView(lesson);
        return `
          <a class="s-lesson${active ? ' active' : ''}${complete ? ' complete' : ''}"
             href="${lessonHref(lesson)}"
             data-lesson-index="${escapeHTML(lesson.index)}"
             aria-label="${escapeHTML(view.title)}"${active ? ' aria-current="page"' : ''}>
            <span class="s-num">${String(lesson.index).padStart(2, '0')}</span>
            <span class="s-lesson-title">${escapeHTML(sidebarTitle(lesson, view))}</span>
            <span class="s-dot" aria-hidden="true"></span>
          </a>`;
      }).join('')}
    `).join('');
  }

  function getChapterNumber(lesson) {
    const group = state.groups.find((item) => item.lessons.some((entry) => entry.id === lesson.id));
    return group ? group.number : 1;
  }

  function extractContent(lesson) {
    const holder = document.createElement('div');
    holder.innerHTML = String(lesson.content_html || '').trim();
    const headings = holder.querySelectorAll(':scope > h2, :scope > h3');
    headings.forEach((heading) => {
      if (/^(🌱\s*)?(les|dag)\s*\d+/i.test(heading.textContent.trim())) heading.remove();
    });

    const firstParagraph = holder.querySelector(':scope > p');
    const lead = firstParagraph ? firstParagraph.textContent.trim() : 'Neem rustig de tijd voor deze stap van je cursus.';
    firstParagraph?.remove();
    return { lead, html: holder.innerHTML || '<p>De inhoud van deze les wordt binnenkort toegevoegd.</p>' };
  }

  function renderParagraphs(paragraphs, className = '') {
    return (paragraphs || []).map((paragraph) => `<p${className ? ` class="${className}"` : ''}>${escapeHTML(paragraph)}</p>`).join('');
  }

  function renderBullets(items, ordered = false) {
    if (!Array.isArray(items) || !items.length) return '';
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag} class="${ordered ? 'step-list' : 'flist'}">${items.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</${tag}>`;
  }

  function renderLessonImage(image) {
    if (!image || !String(image.src || '').startsWith('/assets/')) return '';
    return `
      <figure class="course-figure">
        <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt || '')}" loading="lazy" decoding="async">
        ${image.caption ? `<figcaption>${escapeHTML(image.caption)}</figcaption>` : ''}
      </figure>`;
  }

  function renderCallout(kind, text) {
    if (!text) return '';
    const labels = { note: 'Praktisch', warning: 'Let op' };
    return `
      <aside class="lesson-callout lesson-callout-${kind}">
        <span class="callout-label">${labels[kind] || 'Notitie'}</span>
        <p>${escapeHTML(text)}</p>
      </aside>`;
  }

  function renderStructuredLesson(lesson) {
    const imageAfterSection = Number(lesson.image?.after_section || 0);
    const sections = (lesson.sections || []).map((section, index) => `
      <section class="sec">
        <div class="sec-eyebrow">Stap ${String(index + 1).padStart(2, '0')}</div>
        <h2>${escapeHTML(section.title)}</h2>
        ${renderParagraphs(section.paragraphs)}
        ${renderBullets(section.bullets)}
        ${renderCallout('note', section.note)}
        ${renderCallout('warning', section.warning)}
      </section>
      ${lesson.image && imageAfterSection === index + 1 ? renderLessonImage(lesson.image) : ''}
    `).join('');

    const assignment = lesson.assignment ? `
      <section class="lesson-action" aria-labelledby="lesson-action-title">
        <div class="action-topline">
          <span class="action-kicker">Jouw actie</span>
          ${lesson.assignment.time ? `<span class="action-time">${escapeHTML(lesson.assignment.time)}</span>` : ''}
        </div>
        <h2 id="lesson-action-title">${escapeHTML(lesson.assignment.title)}</h2>
        ${lesson.assignment.intro ? `<p>${escapeHTML(lesson.assignment.intro)}</p>` : ''}
        ${renderBullets(lesson.assignment.steps, true)}
        ${lesson.assignment.reflection ? `
          <div class="reflection">
            <span>Reflectievraag</span>
            <p>${escapeHTML(lesson.assignment.reflection)}</p>
          </div>` : ''}
      </section>` : '';

    const remember = Array.isArray(lesson.remember) && lesson.remember.length ? `
      <section class="lesson-remember">
        <div class="remember-kicker">Neem mee</div>
        <h2>Onthoud dit</h2>
        ${renderBullets(lesson.remember)}
      </section>` : '';

    const sources = Array.isArray(lesson.sources) && lesson.sources.length ? `
      <section class="lesson-sources">
        <h2>Betrouwbare verdieping</h2>
        <p>Deze links brengen je naar de oorspronkelijke publieke informatie waarop deze les steunt.</p>
        <ul>
          ${lesson.sources.map((source) => `
            <li><a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)}<span aria-hidden="true">↗</span></a></li>
          `).join('')}
        </ul>
      </section>` : '';

    return `
      <div class="lesson-opening">
        ${renderParagraphs(lesson.opening)}
      </div>
      ${lesson.image && imageAfterSection === 0 ? renderLessonImage(lesson.image) : ''}
      ${sections}
      ${assignment}
      ${remember}
      ${sources}`;
  }

  function decorateContent(html) {
    const holder = document.createElement('div');
    holder.innerHTML = String(html || '').trim();
    const sections = document.createElement('div');
    let section = null;
    let sectionNumber = 0;

    Array.from(holder.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;

      const isSectionHeading = node.nodeType === Node.ELEMENT_NODE
        && node.tagName.toLowerCase() === 'h2';
      if (isSectionHeading) {
        if (section) sections.appendChild(section);
        section = document.createElement('div');
        section.className = 'sec';
        sectionNumber += 1;
        const eyebrow = document.createElement('div');
        eyebrow.className = 'sec-eyebrow';
        eyebrow.textContent = `Sectie ${String(sectionNumber).padStart(2, '0')}`;
        section.appendChild(eyebrow);
      }

      if (!section) {
        section = document.createElement('div');
        section.className = 'sec';
      }
      section.appendChild(node);
    });

    if (section) sections.appendChild(section);
    sections.querySelectorAll('ul').forEach((list) => list.classList.add('flist'));
    sections.querySelectorAll('blockquote').forEach((quote) => quote.classList.add('pq'));
    return sections.innerHTML || '<p>De inhoud van deze les wordt binnenkort toegevoegd.</p>';
  }

  function clockIcon() {
    return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="6" cy="6" r="5"/><path d="M6 3.5v2.75L7.5 8"/></svg>';
  }

  function renderLesson() {
    const view = lessonView(state.current);
    const isStructured = Array.isArray(view.sections) && view.sections.length > 0;
    const content = view.lead
      ? { lead: view.lead, html: view.content_html }
      : extractContent(state.current);
    const chapter = getChapterNumber(state.current);

    $('#sCourse').textContent = (displayTitles[state.slug] || state.course.title || 'Cursus').split(':')[0];
    $('#tbLabel').textContent = `Les ${String(state.current.index).padStart(2, '0')}`;
    $('#tbTitle').textContent = shortTitle(view.title);
    $('#rtBadge').textContent = `${view.duration_min || 10} min leestijd`;
    $('#lessonNumber').textContent = `Les ${String(state.current.index).padStart(2, '0')} van ${state.lessons.length}`;
    $('#lessonDuration').innerHTML = `${clockIcon()} ${view.duration_min || 10} minuten`;
    $('#lessonTitle').textContent = shortTitle(view.title);
    $('#lessonLead').textContent = content.lead;
    $('#lessonTags').innerHTML = `
      <span class="tag tag-o">${escapeHTML(view.type || state.course.level || 'Theorie')}</span>
      <span class="tag tag-o">Hoofdstuk ${chapter}</span>`;
    $('#lessonContent').innerHTML = isStructured
      ? renderStructuredLesson(view)
      : decorateContent(content.html);
  }

  function renderPage() {
    const title = displayTitles[state.slug] || state.course.title || 'Cursus';
    updateDocumentTitle();
    $('#sCourse').textContent = title.split(':')[0];
    renderSidebar();
    renderLesson();
  }

  function updateDocumentTitle() {
    const title = displayTitles[state.slug] || state.course.title || 'Cursus';
    document.title = `${shortTitle(lessonView(state.current).title)} | ${title} | Vitalora`;
  }

  function updateSidebarActive() {
    document.querySelectorAll('#sNav .s-lesson').forEach((link) => {
      const active = link.dataset.lessonIndex === String(state.current.index);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function showLesson(lesson, { push = false } = {}) {
    if (!lesson) return;
    state.current = lesson;
    if (push) updateLessonUrl(state.slug, lesson, 'pushState');
    updateSidebarActive();
    updateDocumentTitle();
    renderLesson();
  }

  function showError(message) {
    $('#lessonTitle').textContent = 'Les kon niet worden geladen';
    $('#lessonLead').textContent = message;
    $('#lessonContent').innerHTML = `<div class="reader-error">${escapeHTML(message)}</div>`;
  }

  function setupReaderInteractions() {
    const menu = $('#mobileMenu');
    const nav = $('#sNav');
    nav?.addEventListener('click', (event) => {
      const link = event.target.closest('a.s-lesson');
      if (!link || (event.button !== undefined && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const requested = state.lessons.find((lesson) => String(lesson.index) === link.dataset.lessonIndex);
      if (!requested) return;
      event.preventDefault();
      if (requested.index !== state.current.index) showLesson(requested, { push: true });
    });
    menu?.addEventListener('click', () => {
      const open = document.body.classList.toggle('sidebar-open');
      menu.setAttribute('aria-expanded', String(open));
    });
    $('#sidebarScrim')?.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
      menu?.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.body.classList.remove('sidebar-open');
        menu?.setAttribute('aria-expanded', 'false');
      }
    });

    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      $('#rFill').style.width = `${percentage}%`;
    }, { passive: true });
    window.addEventListener('popstate', () => {
      const locationState = getLocationState();
      if (locationState.slug !== state.slug) {
        window.location.reload();
        return;
      }
      const requested = state.lessons.find((lesson) => String(lesson.index) === String(locationState.lessonParam));
      if (requested) showLesson(requested);
    });
  }

  async function loadReader() {
    const locationState = getLocationState();
    state.slug = locationState.slug;
    applyTheme(themes[state.slug], state.slug);

    try {
      const response = await fetch(`/data/courses/${encodeURIComponent(state.slug)}.json?v=5`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('course-not-found');
      state.course = await response.json();
      state.lessons = (state.course.lessons || []).filter((lesson) => !lesson.draft);
      if (!state.lessons.length) throw new Error('no-lessons');
      state.completed = readCompleted();
      buildGroups();
      const requested = locationState.lessonParam && state.lessons.find((lesson) => String(lesson.index) === String(locationState.lessonParam) || lesson.id === locationState.lessonParam);
      state.current = requested || state.lessons.find((lesson) => !isComplete(lesson)) || state.lessons[0];
      normalizeUrl(state.slug, state.current);
      applyTheme(state.course.theme, state.slug);
      renderPage();
    } catch (error) {
      showError('Controleer de URL of probeer het later opnieuw.');
    }
  }

  setupReaderInteractions();
  loadReader();
})();
