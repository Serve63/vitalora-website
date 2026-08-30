const fs = require('node:fs');
const path = require('node:path');
const articles = require('../content/blog/articles');

const root = path.resolve(__dirname, '..');
const baseUrl = 'https://www.vitalora.nl';
const editorialStylesheetVersion = 2;

const existingEditorial = [
  {
    id: 'vitalora-editorial-pfas-thuis',
    slug: 'pfas-zonder-paniek-thuis',
    title: 'PFAS zonder paniek: 6 nuchtere keuzes voor thuis',
    metaTitle: 'PFAS thuis: 6 nuchtere keuzes zonder paniek',
    description: 'Wat zijn PFAS en wat kun je thuis beïnvloeden? Zes haalbare keuzes rond pannen, textiel, voeding en drinkwater zonder angst of detoxclaims.',
    excerpt: 'Wat PFAS zijn, wat je wél kunt beïnvloeden en welke zes rustige keuzes thuis echt zinvol zijn.',
    publishedDate: '27 augustus 2026',
    published: '2026-08-27',
    modified: '2026-08-27',
    readTime: 7,
    featuredImage: '/assets/images/courses/clean-reset-v2/lesson-15-a.jpg',
    imageAlt: 'Twee mensen koken samen met verschillende pannen in een warme keuken',
    category: 'PFAS & thuis',
    status: 'published'
  },
  {
    id: 'vitalora-editorial-microplastics-thuis',
    slug: 'microplastics-thuis-zonder-obsessie',
    title: 'Microplastics thuis: minder blootstelling zonder obsessie',
    metaTitle: 'Microplastics thuis: minder blootstelling zonder obsessie',
    description: 'Wat weten we over microplastics en gezondheid? Lees welke rustige keuzes rond warmte, stof, water en plastic thuis werkelijk haalbaar zijn.',
    excerpt: 'De wetenschap is nog volop in beweging. Dit is wat we al weten en wat je rustig kunt doen.',
    publishedDate: '25 augustus 2026',
    published: '2026-08-25',
    modified: '2026-08-25',
    readTime: 8,
    featuredImage: '/assets/images/courses/clean-reset-v2/lesson-06-a.jpg',
    imageAlt: 'Warme huishoudelijke omgeving met alledaagse plastic producten',
    category: 'Microplastics',
    status: 'published'
  },
  {
    id: 'vitalora-editorial-keukenreset',
    slug: 'rustige-keukenreset',
    title: 'Een rustige keukenreset: klein beginnen, lang volhouden',
    metaTitle: 'Een rustige keukenreset: praktisch en haalbaar',
    description: 'Ruim je keuken stap voor stap slimmer in zonder alles weg te gooien. Een haalbare reset voor bewaren, verwarmen, pannen en dagelijkse routines.',
    excerpt: 'Geen volle vuilniszak en geen perfect plaatje, maar een haalbare keuken die elke dag prettiger werkt.',
    publishedDate: '22 augustus 2026',
    published: '2026-08-22',
    modified: '2026-08-22',
    readTime: 6,
    featuredImage: '/assets/images/courses/clean-reset-v2/lesson-13-a.jpg',
    imageAlt: 'Persoon ruimt in rustig tempo een warme keuken op',
    category: 'Praktisch thuis',
    status: 'published'
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function headingId(value) {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'onderdeel';
}

function articleRail(items, readTime) {
  return `<aside class="article-rail" aria-label="Artikelnavigatie">
        <a class="article-back" href="/blog"><span aria-hidden="true">←</span> Alle artikelen</a>
        <div class="article-rail__card">
          <p class="article-rail__eyebrow">In dit artikel</p>
          <ol>
${items.map(({ id, label }) => `            <li><a href="#${escapeHtml(id)}">${escapeHtml(label)}</a></li>`).join('\n')}
          </ol>
          <p class="article-rail__time">Ongeveer ${readTime} minuten lezen</p>
        </div>
      </aside>`;
}

function prepareExistingBody(bodyContent) {
  const used = new Set();
  const items = [];
  const html = bodyContent.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (match, attributes, labelHtml) => {
    const label = labelHtml.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    const existingId = attributes.match(/\sid=["']([^"']+)["']/i)?.[1];
    const baseId = existingId || headingId(label);
    let id = baseId;
    let suffix = 2;
    while (used.has(id)) id = `${baseId}-${suffix++}`;
    used.add(id);
    items.push({ id, label });
    const cleanAttributes = attributes.replace(/\s+id=["'][^"']+["']/i, '');
    return `<h2${cleanAttributes} id="${escapeHtml(id)}">${labelHtml}</h2>`;
  });

  return { html, items };
}

function jsonLd(article) {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description,
      image: `${baseUrl}${article.image}`,
      datePublished: article.published,
      dateModified: article.modified,
      mainEntityOfPage: `${baseUrl}/${article.slug}`,
      author: { '@type': 'Organization', name: 'Vitalora Redactie', url: baseUrl },
      publisher: { '@type': 'Organization', name: 'Vitalora', url: baseUrl }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: article.title, item: `${baseUrl}/${article.slug}` }
      ]
    }
  ]).replaceAll('<', '\\u003c');
}

function header({ navigation = true } = {}) {
  return `<header class="editorial-header">
    <div class="editorial-shell editorial-header__inner">
      <a class="editorial-brand" href="/">Vitalora.nl</a>
${navigation ? `      <nav class="editorial-nav" aria-label="Hoofdnavigatie">
        <a href="/blog">Alle artikelen</a>
        <a href="/academy">Mijn Academy</a>
      </nav>` : ''}
    </div>
  </header>`;
}

function footer() {
  return `<footer class="editorial-footer">
    <div class="editorial-shell editorial-footer__inner">
      <span>© 2026 Vitalora · Nuchtere informatie voor haalbare gezondheid.</span>
      <span><a href="/privacy">Privacy</a> · <a href="/voorwaarden">Voorwaarden</a> · info@vitalora.nl</span>
    </div>
  </footer>`;
}

function ebookPromoAssets() {
  return `<link rel="stylesheet" href="/assets/css/blog-ebook-promo.css?v=3">
  <script defer src="/assets/js/blog-ebook-promo.js?v=3"></script>`;
}

function ebookPromo() {
  return `<aside class="blog-ebook-promo" data-blog-ebook-promo hidden role="dialog" aria-modal="true" aria-labelledby="blog-ebook-promo-title" aria-describedby="blog-ebook-promo-copy">
    <div class="blog-ebook-promo__panel" role="document">
      <button class="blog-ebook-promo__close" type="button" data-blog-ebook-promo-close aria-label="Sluit deze aanbieding">×</button>
      <div class="blog-ebook-promo__hero">
        <p class="blog-ebook-promo__eyebrow">Gratis ebook</p>
        <h2 class="blog-ebook-promo__title" id="blog-ebook-promo-title">Minder microplastics thuis</h2>
      </div>
      <div class="blog-ebook-promo__body">
        <div class="blog-ebook-promo__visual" aria-hidden="true">
          <div class="blog-ebook-promo__book"><span>Vitalora</span><strong>Minder microplastics thuis</strong><i>Praktische gids</i></div>
        </div>
        <div class="blog-ebook-promo__content">
          <p class="blog-ebook-promo__copy" id="blog-ebook-promo-copy">Ontdek in 12 minuten waar je microplastics tegenkomt en welke kleine keuzes je vandaag kunt maken.</p>
          <form class="blog-ebook-promo__form" data-blog-ebook-promo-form method="post" action="/api/lead-optin" novalidate>
            <label><span class="blog-ebook-promo__sr-only">Voornaam</span><input name="firstname" type="text" placeholder="Voornaam" autocomplete="given-name" required></label>
            <label><span class="blog-ebook-promo__sr-only">E-mailadres</span><input name="email" type="email" placeholder="E-mailadres" autocomplete="email" inputmode="email" required></label>
            <button class="blog-ebook-promo__cta" data-blog-ebook-promo-cta type="submit">Claim jouw exemplaar</button>
            <p class="blog-ebook-promo__feedback" data-blog-ebook-promo-feedback role="alert" hidden></p>
          </form>
          <p class="blog-ebook-promo__trust"><span aria-hidden="true">●</span> Je gegevens blijven privé · <a href="/privacy">privacy</a> · uitschrijven kan altijd</p>
        </div>
      </div>
    </div>
  </aside>`;
}

function articleHtml(article) {
  const sectionItems = article.sections.map((section) => ({
    ...section,
    id: headingId(section.heading)
  }));
  const sectionHtml = sectionItems.map((section) => `
      <section>
        <h2 id="${escapeHtml(section.id)}">${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('\n        ')}
      </section>`).join('');
  const faqHtml = article.faq.map(([question, answer]) => `
        <details class="faq-item">
          <summary>${escapeHtml(question)}<span aria-hidden="true"></span></summary>
          <p>${escapeHtml(answer)}</p>
        </details>`).join('');
  const sourceHtml = article.sources.map(([name, href]) => `<li><a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(name)}</a></li>`).join('');
  const relatedHtml = article.related.map(([name, href]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(name)}</a></li>`).join('');
  const tocItems = [
    { id: 'kort-antwoord', label: 'Het korte antwoord' },
    ...sectionItems.map(({ id, heading }) => ({ id, label: heading })),
    { id: 'veelgestelde-vragen', label: 'Veelgestelde vragen' }
  ];

  return `<!DOCTYPE html>
<html lang="nl" style="--ios-statusbar-color: #253129">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.metaTitle)} | Vitalora</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${baseUrl}/${article.slug}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="nl_NL">
  <meta property="og:site_name" content="Vitalora">
  <meta property="og:title" content="${escapeHtml(article.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(article.description)}">
  <meta property="og:url" content="${baseUrl}/${article.slug}">
  <meta property="og:image" content="${baseUrl}${article.image}">
  <meta property="og:image:alt" content="${escapeHtml(article.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(article.metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(article.description)}">
  <meta name="twitter:image" content="${baseUrl}${article.image}">
  <meta name="theme-color" content="#253129">
  <link rel="stylesheet" href="/assets/css/ios-statusbar.css?v=1">
  <link rel="stylesheet" href="/assets/css/fonts.css?v=12">
  <link rel="stylesheet" href="/assets/css/editorial-blog.css?v=${editorialStylesheetVersion}">
  ${ebookPromoAssets()}
  <link rel="icon" type="image/webp" href="/assets/images/vitalora logo.webp">
  <script type="application/ld+json">${jsonLd(article)}</script>
</head>
<body class="editorial-page page-blog-post">
  <div class="ios-status-bar-surface" aria-hidden="true"></div>
  ${header()}
  <main class="article-wrap article-page">
    <div class="article-shell">
      <nav class="breadcrumb" aria-label="Broodkruimel"><a href="/blog">Blog</a> <span aria-hidden="true">›</span> ${escapeHtml(article.category)}</nav>
      <section class="article-hero-grid" aria-labelledby="article-title">
        <header class="article-heading">
          <p class="article-category">${escapeHtml(article.category)}</p>
          <h1 class="blog-title" id="article-title">${escapeHtml(article.title)}</h1>
          <p class="article-deck">${escapeHtml(article.excerpt)}</p>
          <div class="article-meta">
            <span class="blog-date">${escapeHtml(article.displayDate)}</span>
            <span class="blog-read-time">${article.readTime} minuten leestijd</span>
            <span>Vitalora Redactie</span>
          </div>
        </header>
        <figure class="article-hero">
          <img class="blog-featured-image" src="${article.image}" width="1200" height="675" alt="${escapeHtml(article.imageAlt)}" fetchpriority="high">
        </figure>
      </section>
      <div class="article-layout">
        ${articleRail(tocItems, article.readTime)}
        <article class="blog-content">
          <section class="answer-box" aria-labelledby="kort-antwoord">
            <p class="answer-box__eyebrow">Direct antwoord</p>
            <h2 id="kort-antwoord">Het korte antwoord</h2>
            <p class="article-lead">${escapeHtml(article.quickAnswer)}</p>
          </section>
          <section class="key-points" aria-labelledby="belangrijkste-punten">
            <p class="key-points__title" id="belangrijkste-punten">Dit neem je mee</p>
            <ul>
              ${article.takeaways.map((point) => `<li>${escapeHtml(point)}</li>`).join('\n              ')}
            </ul>
          </section>
${sectionHtml}
          <section class="faq-block">
            <p class="section-kicker">Praktisch beantwoord</p>
            <h2 id="veelgestelde-vragen">Veelgestelde vragen</h2>${faqHtml}
          </section>
          <section class="source-note">
            <p class="section-kicker">Transparant</p>
            <h2 id="bronnen-en-controle">Bronnen en controle</h2>
            <p>De Vitalora Redactie heeft dit artikel op 27 augustus 2026 opnieuw opgebouwd en claims gecontroleerd aan de hand van onderstaande bronnen.</p>
            <ul>${sourceHtml}</ul>
            <p class="editorial-disclaimer"><strong>Goed om te weten:</strong> deze uitleg is algemeen en vervangt geen diagnose of persoonlijk advies van arts, apotheker of diëtist. Neem bij ernstige, nieuwe of aanhoudende klachten contact op met een zorgverlener.</p>
          </section>
          <section class="related-links">
            <p class="section-kicker">Volgende stap</p>
            <h2>Lees rustig verder</h2>
            <ul>${relatedHtml}</ul>
          </section>
          <aside class="course-bridge">
            <div>
              <p class="course-bridge__eyebrow">Vitalora Academy</p>
              <h2>Minder ruis, meer rustige regie</h2>
              <p>In Clean Reset leer je gezondheidsclaims, blootstelling en haalbare keuzes stap voor stap beoordelen zonder dat je huis of voeding een angstproject wordt.</p>
            </div>
            <a href="/academy">Bekijk de Academy <span aria-hidden="true">→</span></a>
          </aside>
        </article>
      </div>
    </div>
  </main>
  ${ebookPromo()}
  ${footer()}
</body>
</html>`;
}

function existingArticleHtml(article, bodyContent) {
  const normalized = {
    ...article,
    image: article.featuredImage,
    displayDate: article.publishedDate
  };
  const preparedBody = prepareExistingBody(bodyContent);
  return `<!DOCTYPE html>
<html lang="nl" style="--ios-statusbar-color: #253129">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(normalized.metaTitle)} | Vitalora</title>
  <meta name="description" content="${escapeHtml(normalized.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${baseUrl}/${normalized.slug}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="nl_NL">
  <meta property="og:site_name" content="Vitalora">
  <meta property="og:title" content="${escapeHtml(normalized.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(normalized.description)}">
  <meta property="og:url" content="${baseUrl}/${normalized.slug}">
  <meta property="og:image" content="${baseUrl}${normalized.image}">
  <meta property="og:image:alt" content="${escapeHtml(normalized.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#253129">
  <link rel="stylesheet" href="/assets/css/ios-statusbar.css?v=1">
  <link rel="stylesheet" href="/assets/css/fonts.css?v=12">
  <link rel="stylesheet" href="/assets/css/editorial-blog.css?v=${editorialStylesheetVersion}">
  ${ebookPromoAssets()}
  <link rel="icon" type="image/webp" href="/assets/images/vitalora logo.webp">
  <script type="application/ld+json">${jsonLd(normalized)}</script>
</head>
<body class="editorial-page page-blog-post">
  <div class="ios-status-bar-surface" aria-hidden="true"></div>
  ${header()}
  <main class="article-wrap article-page">
    <div class="article-shell">
      <nav class="breadcrumb" aria-label="Broodkruimel"><a href="/blog">Blog</a> <span aria-hidden="true">›</span> ${escapeHtml(normalized.category)}</nav>
      <section class="article-hero-grid" aria-labelledby="article-title">
        <header class="article-heading">
          <p class="article-category">${escapeHtml(normalized.category)}</p>
          <h1 class="blog-title" id="article-title">${escapeHtml(normalized.title)}</h1>
          <p class="article-deck">${escapeHtml(normalized.excerpt)}</p>
          <div class="article-meta">
            <span class="blog-date">${escapeHtml(normalized.displayDate)}</span>
            <span class="blog-read-time">${normalized.readTime} minuten leestijd</span>
            <span>Vitalora Redactie</span>
          </div>
        </header>
        <figure class="article-hero">
          <img class="blog-featured-image" src="${normalized.image}" width="1200" height="675" alt="${escapeHtml(normalized.imageAlt)}" fetchpriority="high">
        </figure>
      </section>
      <div class="article-layout">
        ${articleRail(preparedBody.items, normalized.readTime)}
        <article class="blog-content">${preparedBody.html}</article>
      </div>
    </div>
  </main>
  ${ebookPromo()}
  ${footer()}
</body>
</html>`;
}

function toFeed(article) {
  return {
    id: `vitalora-seo-${article.slug}`,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    publishedDate: article.displayDate.replace('Bijgewerkt op ', ''),
    published: article.published,
    modified: article.modified,
    readTime: article.readTime,
    featuredImage: article.image,
    imageAlt: article.imageAlt,
    category: article.category,
    status: 'published'
  };
}

function blogIndex(feed) {
  const [featuredPost, ...remainingPosts] = feed;
  const featuredCard = `
      <a class="post-card post-card--featured" href="/${featuredPost.slug}">
        <div class="post-card__media">
          <img src="${featuredPost.featuredImage}" width="960" height="540" alt="${escapeHtml(featuredPost.imageAlt || '')}">
        </div>
        <div class="post-card__body">
          <p class="post-card__category">Uitgelicht · ${escapeHtml(featuredPost.category || 'Vitalora Redactie')}</p>
          <h2>${escapeHtml(featuredPost.title)}</h2>
          <p class="post-card__excerpt">${escapeHtml(featuredPost.excerpt)}</p>
          <div class="post-card__footer">
            <span class="post-card__meta">${featuredPost.readTime} min leestijd · ${escapeHtml(featuredPost.publishedDate)}</span>
            <span class="post-card__cta">Lees artikel <span aria-hidden="true">→</span></span>
          </div>
        </div>
      </a>`;
  const cards = remainingPosts.map((post) => `
      <a class="post-card" href="/${post.slug}">
        <div class="post-card__media">
          <img src="${post.featuredImage}" width="640" height="360" alt="${escapeHtml(post.imageAlt || '')}" loading="lazy">
        </div>
        <div class="post-card__body">
          <p class="post-card__category">${escapeHtml(post.category || 'Vitalora Redactie')}</p>
          <h2>${escapeHtml(post.title)}</h2>
          <p class="post-card__excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="post-card__footer">
            <span class="post-card__meta">${post.readTime} min leestijd · ${escapeHtml(post.publishedDate)}</span>
            <span class="post-card__arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </a>`).join('');

  return `<!DOCTYPE html>
<html lang="nl" style="--ios-statusbar-color: #253129">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gezondheid zonder ruis | Vitalora Blog</title>
  <meta name="description" content="Nuchtere, warme en praktisch gecontroleerde artikelen over voeding, blootstelling en gezonde keuzes thuis.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${baseUrl}/blog">
  <meta property="og:title" content="Gezondheid zonder ruis | Vitalora Blog">
  <meta property="og:description" content="Nuchtere, warme en praktisch gecontroleerde artikelen over voeding, blootstelling en gezonde keuzes thuis.">
  <meta property="og:url" content="${baseUrl}/blog">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#253129">
  <link rel="stylesheet" href="/assets/css/ios-statusbar.css?v=1">
  <link rel="stylesheet" href="/assets/css/fonts.css?v=12">
  <link rel="stylesheet" href="/assets/css/editorial-blog.css?v=${editorialStylesheetVersion}">
  ${ebookPromoAssets()}
  <link rel="icon" type="image/webp" href="/assets/images/vitalora logo.webp">
</head>
<body class="editorial-index page-blog">
  <div class="ios-status-bar-surface" aria-hidden="true"></div>
  ${header({ navigation: false })}
  <main class="editorial-shell">
    <section class="index-hero">
      <div>
        <p class="index-eyebrow">Vitalora Journal</p>
        <h1>Gezondheid zonder ruis.</h1>
      </div>
      <div class="index-hero__intro">
        <p>Heldere antwoorden, eerlijke grenzen en kleine keuzes waar je thuis echt iets aan hebt—met bronnen die je zelf kunt controleren.</p>
        <a href="#nieuwste-artikelen">Ontdek de nieuwste artikelen <span aria-hidden="true">↓</span></a>
      </div>
    </section>
    <section class="featured-story" aria-label="Uitgelicht artikel">${featuredCard}
    </section>
    <div class="index-section-heading" id="nieuwste-artikelen">
      <div>
        <p class="index-eyebrow">Nieuw in het journal</p>
        <h2>Lees verder</h2>
      </div>
      <span>${feed.length} artikelen · met bronnen gecontroleerd</span>
    </div>
    <section class="blog-grid" aria-label="Nieuwste artikelen">${cards}
    </section>
  </main>
  ${ebookPromo()}
  ${footer()}
</body>
</html>`;
}

function sitemap(feed) {
  const fixed = [
    ['/', '2026-08-27', '1.0'],
    ['/blog', '2026-08-27', '0.9'],
    ['/academy', '2026-08-27', '0.8'],
    ['/clean-reset', '2026-08-27', '0.8'],
    ['/login', '2026-08-27', '0.5']
  ];
  const urls = fixed.concat(feed.map((post) => [`/${post.slug}`, post.modified || post.published || '2026-08-27', '0.8']));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([pathname, modified, priority]) => `  <url>
    <loc>${baseUrl}${pathname}</loc>
    <lastmod>${modified}</lastmod>
    <changefreq>${pathname === '/blog' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

for (const article of articles) {
  fs.writeFileSync(path.join(root, `${article.slug}.html`), articleHtml(article));
}

for (const article of existingEditorial) {
  const articlePath = path.join(root, `${article.slug}.html`);
  const current = fs.readFileSync(articlePath, 'utf8');
  const content = current.match(/<article class="blog-content">([\s\S]*?)<\/article>/)?.[1];
  if (!content) throw new Error(`Kon bestaande artikelinhoud niet lezen: ${article.slug}`);
  fs.writeFileSync(articlePath, existingArticleHtml(article, content));
}

const feed = [...articles.map(toFeed), ...existingEditorial]
  .sort((a, b) => String(b.modified || b.published).localeCompare(String(a.modified || a.published)) || a.title.localeCompare(b.title, 'nl'));

fs.writeFileSync(path.join(root, 'blog-feed.json'), `${JSON.stringify(feed, null, 2)}\n`);
const index = blogIndex(feed);
fs.writeFileSync(path.join(root, 'blog.html'), index);
fs.mkdirSync(path.join(root, 'blog'), { recursive: true });
fs.writeFileSync(path.join(root, 'blog/index.html'), index);
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap(feed));
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /personeel\nDisallow: /personeel-dashboard\nDisallow: /marketingmachine\n\nSitemap: ${baseUrl}/sitemap.xml\n`);

console.log(`Built ${articles.length} SEO articles, ${feed.length} feed entries, sitemap.xml and robots.txt.`);
