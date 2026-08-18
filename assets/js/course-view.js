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
    'clean-reset': 'Clean Reset: Detox & Gifstoffen',
    'powerfoods-superfood-specerij': 'PowerFoods: Superfood & Specerij™',
    'de-juiste-balans': 'De Juiste Balans: Energie & Hormonen',
    '30-dagen-challenge': '30 Dagen Challenge',
    'everyday-nutrition-praktisch-gezond': 'Everyday Nutrition: Praktisch & Gezond™',
    'mindful-energy-innerlijke-rust': 'Mindful Energy: Innerlijke Rust',
    'energie-hormonen-balans': 'Energie & Hormonen Balans'
  };

  const cleanResetChapters = [
    { start: 1, end: 5, title: 'Introductie' },
    { start: 6, end: 10, title: 'Voeding' },
    { start: 11, end: 15, title: 'Supplementen' },
    { start: 16, end: 20, title: 'Leefstijl' },
    { start: 21, end: 25, title: 'Reset & behoud' },
    { start: 26, end: 30, title: 'BPA & ftalaten' },
    { start: 31, end: 35, title: 'Parabenen & verzorging' },
    { start: 36, end: 40, title: 'Leefstijl verdiept' },
    { start: 41, end: 45, title: 'Voeding & supplementen' },
    { start: 46, end: 51, title: 'Leefomgeving & afronding' }
  ];

  const readerOverrides = {
    'clean-reset:1': {
      title: 'Welkom & intentie van de cursus',
      lead: 'De fundering voor alles wat volgt — waarom je hier bent, wat Clean Reset je gaat brengen, en hoe je dit programma het beste benadert.',
      duration_min: 12,
      type: 'Introductie',
      content_html: `
        <p>Stel je voor: je lichaam is een huis waarin jij al je hele leven woont. Dag en nacht zorgt dat huis voor jou — het beschermt je, geeft je energie, herstelt zich telkens weer. Maar zonder dat je het doorhad, zijn er door de jaren heen kleine scheurtjes ontstaan. Niet omdat je iets verkeerd deed, maar omdat de wereld waarin we leven veranderde.</p>
        <p>Je ademt lucht in die niet meer zo puur is als honderd jaar geleden. Je drinkt water waar onzichtbare deeltjes in zweven. Je eet voeding die bewerkt, bespoten of verpakt is. En zo bouwt dat huis, jouw lichaam, ongemerkt steeds meer bagage op.</p>
        <p>Toxines. Stoffen waar je niet om hebt gevraagd. Stoffen die je niet ziet, maar die wel invloed hebben op hoe je je voelt, hoe je presteert, hoe je veroudert. Dat is precies waar deze cursus over gaat.</p>
        <h2>Waarom jij hier bent</h2>
        <p>Je bent hier omdat je diep van binnen voelt dat het anders kan. Misschien herken je het: vermoeid wakker worden terwijl je genoeg geslapen hebt. Last van concentratie-dips midden op de dag. Een hormonale disbalans die je lijf of gemoed onderuit haalt. Of gewoon het besef: ik leef gezond, maar tóch voel ik me niet optimaal.</p>
        <blockquote><p>Dat is geen toeval. Het is het resultaat van die stille, onzichtbare belasting waar we allemaal mee te maken hebben.</p></blockquote>
        <h2>Wat deze cursus je gaat brengen</h2>
        <p>Clean Reset is geen hype, geen snelle detox-kuur waarbij je drie dagen op sap leeft. Het is een fundamenteel herstartpunt. Een manier om:</p>
        <ul>
          <li>Bewust te worden van de stoffen die je nu nog tegenhouden</li>
          <li>Te leren hoe je lichaam van nature wil ontgiften — en hoe jij dat proces kunt ondersteunen</li>
          <li>Praktisch aan de slag te gaan met voeding, supplementen en leefstijl</li>
          <li>Slim keuzes te maken zodat je blootstelling drastisch afneemt</li>
          <li>Een nieuwe standaard te creëren voor jezelf, die je de rest van je leven vooruit helpt</li>
        </ul>
        <blockquote><p>Dit is niet alleen een cursus die je informatie geeft — dit is een cursus die je transformatie geeft.</p></blockquote>
        <h2>De intentie</h2>
        <p>Mijn intentie met Clean Reset is helder: jou de regie teruggeven. Je lichaam kán meer dan je denkt, als je het de juiste omstandigheden geeft. Jij gaat ontdekken hoe krachtig een lichaam kan zijn dat minder toxische ballast hoeft te dragen.</p>
        <p>Dat betekent meer energie. Meer focus. Een beter herstel. En misschien wel het belangrijkste: een gevoel van lichtheid, vrijheid in je lijf, omdat je weet dat je niet langer onbewust volloopt met stoffen die je helemaal niet nodig hebt.</p>
        <h2>Jouw commitment</h2>
        <p>Dit is jouw startpunt. Vanaf vandaag kies jij voor helderheid. Voor bewustzijn. Voor verandering die écht blijft hangen.</p>
        <p>Zie deze cursus als een belofte aan jezelf: dat je niet genoegen neemt met "wel oké", maar dat je voor het beste gaat wat jouw lichaam je te bieden heeft.</p>
        <blockquote><p>Welkom bij Clean Reset. Dit is het begin van jouw nieuwe standaard.</p></blockquote>`
    }
  };

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
    try {
      const stored = JSON.parse(localStorage.getItem('completedLessons') || '[]');
      if (Array.isArray(stored)) stored.forEach((value) => result.add(String(value)));
    } catch (error) {
      // Keep the reader available when storage is blocked or malformed.
    }
    state.lessons.forEach((lesson) => {
      try {
        if (localStorage.getItem(`progress:${state.slug}:${lesson.id}:done`) === 'true') {
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
    const override = readerOverrides[`${state.slug}:${lesson.index}`];
    return override ? { ...lesson, ...override } : lesson;
  }

  function shortTitle(title) {
    return String(title || '').replace(/^((les|dag)\s*\d+\s*:\s*)/i, '');
  }

  function lessonHref(lesson) {
    return `/course-view.html?course=${encodeURIComponent(state.slug)}&lesson=${encodeURIComponent(lesson.index)}`;
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
             title="${escapeHTML(view.title)}">
            <span class="s-num">${String(lesson.index).padStart(2, '0')}</span>
            <span class="s-lesson-title">${escapeHTML(shortTitle(view.title))}</span>
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
    const content = view.lead
      ? { lead: view.lead, html: view.content_html }
      : extractContent(state.current);
    const chapter = getChapterNumber(state.current);

    $('#sCourse').textContent = (displayTitles[state.slug] || state.course.title || 'Cursus').split(':')[0];
    $('#tbLabel').textContent = `Les ${String(state.current.index).padStart(2, '0')}`;
    $('#tbTitle').textContent = shortTitle(view.title);
    $('#rtBadge').textContent = `${view.duration_min || 10} min leestijd`;
    $('#lessonNumber').textContent = `Les ${String(state.current.index).padStart(2, '0')} van ${state.lessons.length}`;
    $('#lessonTitle').textContent = shortTitle(view.title);
    $('#lessonLead').textContent = content.lead;
    $('#lessonTags').innerHTML = `
      <span class="tag tag-g">${clockIcon()} ${view.duration_min || 10} minuten</span>
      <span class="tag tag-o">${escapeHTML(view.type || state.course.level || 'Theorie')}</span>
      <span class="tag tag-o">Hoofdstuk ${chapter}</span>`;
    $('#lessonContent').innerHTML = decorateContent(content.html);
  }

  function renderPage() {
    const title = displayTitles[state.slug] || state.course.title || 'Cursus';
    document.title = `${shortTitle(lessonView(state.current).title)} | ${title} | Vitalora`;
    $('#sCourse').textContent = title.split(':')[0];
    renderSidebar();
    renderLesson();
  }

  function showError(message) {
    $('#lessonTitle').textContent = 'Les kon niet worden geladen';
    $('#lessonLead').textContent = message;
    $('#lessonContent').innerHTML = `<div class="reader-error">${escapeHTML(message)}</div>`;
  }

  function setupReaderInteractions() {
    const menu = $('#mobileMenu');
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
  }

  async function loadReader() {
    const locationState = getLocationState();
    state.slug = locationState.slug;
    applyTheme(themes[state.slug], state.slug);

    try {
      const response = await fetch(`/data/courses/${encodeURIComponent(state.slug)}.json?v=4`, { credentials: 'same-origin' });
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
