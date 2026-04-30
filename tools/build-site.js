const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('site-inventory.json', 'utf8'));
const assetManifest = JSON.parse(fs.readFileSync('site-assets.json', 'utf8'));

const ORIGIN = 'https://imivani.com';
const EMAIL = 'business@imivani.com';
const LINKEDIN = 'https://www.linkedin.com/in/imivani/';
const FAVICON_VERSION = '20260428';
const LINKEDIN_LABEL = 'linkedin.com/in/imivani';

const ICBC_MENU = [
  ['rogers', 'Rogers Comm.'],
  ['hydroone', 'Hydro One'],
  ['markle', 'Markle Waste Systems'],
  ['diamond', 'The Diamond Standard'],
  ['westmillscarpet', 'Westmills Carpet'],
  ['ameritrade', 'Ameritrade M&A'],
  ['lakeshore-plumbing', 'Lakeshore Plumbing'],
  ['newearth', 'New Earth Mining'],
  ['windfarm', 'EnergyDirect Wind Farm'],
  ['ptarmigan', 'Ptarmigan Resources Inc.'],
  ['ashfield-industries-dungaven-acquisition', 'Ashfield Industries, Dungaven Acquisition'],
  ['nfi-group', 'NFI Group'],
  ['cataraqui-building-supplies', 'Cataraqui Building Supplies'],
  ['galaxyresources', 'Galaxy Resources'],
  ['parks-capital', 'Parks Capital - LBO'],
  ['weyerhaeuser-beyond-lumber', 'Weyerhaeuser, Beyond Lumber'],
  ['quintessentially-canadian', 'Quintessentially Canadian'],
  ['sketch', 'SKETCH - Financing the Future'],
];

const EQUITY_MENU = [
  ['sde', 'Spartan Delta Research Report (HFC)'],
  ['altagas', 'AltaGas Research Report (CFA)'],
  ['xeqt', 'XEQT Report - Anna'],
  ['sanctions', 'Sanctions & Wedges - Russian Markets'],
  ['sdeonepager', 'Spartan Delta One Pager'],
  ['walmart', 'Valuing Walmart'],
];

const SCHOOL_MENU = [
  ['dateflow', 'DateFlow'],
  ['btma-og-data-to-drive-commercial-decisions', 'O&G Data to Drive Commercial Decisions'],
  ['griffiths-energy-international', 'Griffiths Energy International'],
  ['the-lehman-brothers-collapse', 'The Lehman Brothers Collapse'],
  ['techmajority', 'An Argument for Tech Majority Voting Rights'],
];

const HOME_GROUPS = [
  {
    key: 'preliminary',
    category: 'icbc',
    title: 'I.C.B.C Preliminary & Finals',
    subtitle: 'Teams of two competing in Canada\'s oldest, largest, and most prestigious international case competition.',
    grid: 'grid-featured',
    items: [
      ['hydroone', 'Preliminary Case | Hydro One', 'feature'],
      ['rogers', 'Finals Case | Rogers Communication', 'feature'],
    ],
  },
  {
    key: 'equity',
    category: 'equity',
    title: 'Equity Research & Economic Reports',
    subtitle: 'Academic research and competitive casework.',
    grid: 'grid-featured',
    items: [
      ['sde', 'Spartan Delta Research Report (HFC)', 'feature'],
      ['altagas', 'AltaGas Research Report (CFA)', 'feature'],
      ['sanctions', 'Sanctions, Friction & Wedges in Russia Crude Markets', ''],
      ['sdeonepager', 'Spartan Delta One Pager', ''],
      ['xeqt', 'ETF Selection for Anna', ''],
      ['walmart', 'Valuing Wal-Mart', ''],
    ],
  },
  {
    key: 'fall',
    category: 'icbc',
    title: 'I.C.B.C Fall Cases',
    subtitle: 'Completed within structured three-hour sessions.',
    grid: 'grid-three',
    items: [
      ['markle', 'Markle Waste Systems', ''],
      ['diamond', 'Diamond Standard', ''],
      ['windfarm', 'EnergyDirect Wind Farm', ''],
      ['westmillscarpet', 'Westmills Carpet', ''],
      ['lakeshore-plumbing', 'Lakeshore Plumbing & Heating', ''],
      ['ameritrade', 'Ameritrade M&A Deal', ''],
      ['newearth', 'New Earth Mining', ''],
      ['parks-capital', 'Parks Capital - LBO', ''],
      ['quintessentially-canadian', 'Quintessentially Canadian', ''],
      ['sketch', 'SKETCH: Financing The Future', ''],
      ['ashfield-industries-dungaven-acquisition', 'Ashfield Weighs', ''],
      ['nfi-group', 'NFI', ''],
      ['weyerhaeuser-beyond-lumber', 'Weyerhaeuser', ''],
      ['galaxyresources', 'Galaxy Resources', ''],
      ['ptarmigan', 'Ptarmigan Resources Inc.', ''],
      ['cataraqui-building-supplies', 'Cataraqui Building Supplies', ''],
    ],
  },
  {
    key: 'school',
    category: 'school',
    title: 'Academic & Case Reports',
    subtitle: 'Selected academic projects, case work, and applied finance analysis from Haskayne.',
    grid: 'grid-two',
    items: [
      ['dateflow', 'DateFlow Document-to-Calendar Concept', ''],
      ['btma-og-data-to-drive-commercial-decisions', 'BTMA 317 Final Report', ''],
      ['the-lehman-brothers-collapse', 'Lehman Brothers Collapse', ''],
      ['griffiths-energy-international', 'Governance Case Study', ''],
      ['techmajority', 'An Argument for Tech Majority Rights', ''],
    ],
  },
];

const assetByUrl = new Map(assetManifest.assets.map((asset) => [asset.url, asset]));
const docsByUrl = new Map(assetManifest.assets.filter((asset) => asset.type === 'doc').map((asset) => [asset.url, asset]));
const icbcSlugs = new Set(ICBC_MENU.map(([slug]) => slug));
const equitySlugs = new Set(EQUITY_MENU.map(([slug]) => slug));
const schoolSlugs = new Set(SCHOOL_MENU.map(([slug]) => slug));

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugFromUrl(url) {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
  return pathname || 'home';
}

function pageForSlug(slug) {
  return inventory.pages.find((page) => slugFromUrl(page.url) === slug);
}

function homePage() {
  return inventory.pages.find((page) => new URL(page.url).pathname === '/') || pageForSlug('home');
}

function localAsset(url, prefix) {
  if (/^assets\//.test(url)) return `${prefix}${url}`;
  const asset = assetByUrl.get(url);
  if (!asset || !asset.localPath) return url;
  return `${prefix}${asset.localPath}`;
}

function uniqueImages(page) {
  const seen = new Set();
  return page.images
    .filter((image) => {
      const alt = (image.alt || '').trim();
      const isLogo = /^Ivan I\.?$/i.test(alt) || /\/blank\.png(?:\?|$)/i.test(image.src);
      return image.visible && image.src && !isLogo && image.renderedWidth >= 20 && image.renderedHeight >= 20;
    })
    .filter((image) => {
      if (seen.has(image.src)) return false;
      seen.add(image.src);
      return true;
    });
}

function firstImageForSlug(slug) {
  const page = pageForSlug(slug);
  if (!page) return null;
  return uniqueImages(page)[0] || null;
}

function documentTitle(pageTitle) {
  return `${pageTitle} - Ivan I.`;
}

function homeHref(prefix) {
  return `${prefix}index.html`;
}

function pageHref(prefix, slug) {
  return `${prefix}${slug}/index.html`;
}

function menuLinks(items, prefix, currentSlug) {
  return items.map(([slug, label]) => (
    `<a class="${currentSlug === slug ? 'active' : ''}" href="${pageHref(prefix, slug)}">${escapeHtml(label)}</a>`
  )).join('');
}

function navDetails(label, items, prefix, currentSlug, active) {
  return `
    <details>
      <summary class="${active ? 'active' : ''}">${escapeHtml(label)}</summary>
      <div class="nav-menu">
        ${menuLinks(items, prefix, currentSlug)}
      </div>
    </details>`;
}

function header(prefix, currentSlug) {
  const icbcActive = icbcSlugs.has(currentSlug);
  const equityActive = equitySlugs.has(currentSlug);
  const schoolActive = schoolSlugs.has(currentSlug);

  const desktop = `
    <nav class="nav desktop-nav" aria-label="Primary navigation">
      <a class="${currentSlug === 'home' ? 'active' : ''}" href="${homeHref(prefix)}">Home</a>
      <a class="${currentSlug === 'about' ? 'active' : ''}" href="${pageHref(prefix, 'about')}">About Me</a>
      ${navDetails('I.C.B.C Reports', ICBC_MENU, prefix, currentSlug, icbcActive)}
      ${navDetails('Equity Research & Economic Reports', EQUITY_MENU, prefix, currentSlug, equityActive)}
      ${navDetails('Academic & Case Reports', SCHOOL_MENU, prefix, currentSlug, schoolActive)}
      <span class="socials">
        <a class="linkedin-icon" href="${LINKEDIN}" aria-label="LinkedIn">in</a>
        <a class="mail-icon" href="mailto:${EMAIL}" aria-label="Email">&#9993;</a>
      </span>
    </nav>`;

  const mobileLinkedin = `
    <a class="header-linkedin linkedin-icon" href="${LINKEDIN}" aria-label="LinkedIn">in</a>`;

  const mobileSearch = currentSlug === 'home' ? `
    <button class="header-search-button" type="button" aria-label="Search reports" aria-expanded="false" aria-controls="report-search" data-mobile-search-toggle>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
        <line x1="16" y1="16" x2="20.5" y2="20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      </svg>
    </button>` : '';

  const mobileToggle = `
    <button class="mobile-menu-button" type="button" aria-expanded="false" aria-controls="mobile-navigation" aria-label="Open menu" data-mobile-menu-toggle>
      <span class="hamburger-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>`;

  const mobilePanel = `
      <div class="mobile-panel nav" id="mobile-navigation" aria-label="Mobile navigation" data-mobile-menu-panel>
        <a class="${currentSlug === 'home' ? 'active' : ''}" href="${homeHref(prefix)}">Home</a>
        <a class="${currentSlug === 'about' ? 'active' : ''}" href="${pageHref(prefix, 'about')}">About Me</a>
        ${navDetails('I.C.B.C Reports', ICBC_MENU, prefix, currentSlug, icbcActive)}
        ${navDetails('Equity Research & Economic Reports', EQUITY_MENU, prefix, currentSlug, equityActive)}
        ${navDetails('Academic & Case Reports', SCHOOL_MENU, prefix, currentSlug, schoolActive)}
        <span class="socials">
          <a class="linkedin-icon" href="${LINKEDIN}" aria-label="LinkedIn">in</a>
          <a class="mail-icon" href="mailto:${EMAIL}" aria-label="Email">&#9993;</a>
        </span>
      </div>`;

  return `
    <header class="site-header">
      <a class="brand" href="${homeHref(prefix)}" aria-label="Ivan I. home">II</a>
      ${desktop}
      ${themeToggle()}
      ${mobileLinkedin}
      ${mobileSearch}
      ${mobileToggle}
    </header>
    ${mobilePanel}`;
}

function themeToggle() {
  return `
      <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false" data-theme-toggle>
        <svg class="theme-toggle-icon" data-theme-icon="moon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"></path>
        </svg>
        <svg class="theme-toggle-icon" data-theme-icon="sun" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" fill="currentColor"></circle>
          <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="2" x2="12" y2="5"></line>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="5" y2="12"></line>
            <line x1="19" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="4.93" x2="7.05" y2="7.05"></line>
            <line x1="16.95" y1="16.95" x2="19.07" y2="19.07"></line>
            <line x1="4.93" y1="19.07" x2="7.05" y2="16.95"></line>
            <line x1="16.95" y1="7.05" x2="19.07" y2="4.93"></line>
          </g>
        </svg>
        <span class="theme-toggle-track" aria-hidden="true">
          <span class="theme-toggle-dot"></span>
        </span>
        <span class="theme-toggle-text">Dark</span>
      </button>`;
}

function footer() {
  return `
    <footer class="footer">
      <div class="wrap">
        <h3>Ivan Imshenetskyy</h3>
        <span class="socials">
          <a class="linkedin-icon" href="${LINKEDIN}" aria-label="LinkedIn">in</a>
          <a class="mail-icon" href="mailto:${EMAIL}" aria-label="Email">&#9993;</a>
        </span>
        <a class="email" href="mailto:${EMAIL}">${EMAIL}</a>
      </div>
    </footer>`;
}

function shell({ title, description, prefix, currentSlug, body, bodyAttrs = '' }) {
  const googleTag = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-8ZYVR9G2FD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8ZYVR9G2FD');
</script>`;
  const themeBoot = `<script>
    try {
      const savedTheme = localStorage.getItem('portfolio-theme');
      document.documentElement.dataset.theme = savedTheme || 'light';
    } catch {
      document.documentElement.dataset.theme = 'light';
    }
  </script>`;

  return `<!doctype html>
<html lang="en">
<head>
  ${googleTag}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description || 'A collection of research and economic reports.')}">
  <title>${escapeHtml(title)}</title>
  ${themeBoot}
  <link rel="icon" type="image/x-icon" href="/assets/favicon/favicon.ico?v=${FAVICON_VERSION}">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32.png?v=${FAVICON_VERSION}">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16.png?v=${FAVICON_VERSION}">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/favicon-180.png?v=${FAVICON_VERSION}">
  <link rel="manifest" href="/assets/favicon/site.webmanifest?v=${FAVICON_VERSION}">
  <meta name="theme-color" content="#8f5a39">
  <link rel="stylesheet" href="${prefix}styles.css">
  <link rel="stylesheet" href="${prefix}styles-jpmorgan-overrides.css">
  <script src="${prefix}script.js" defer></script>
</head>
<body class="jpm-theme"${bodyAttrs ? ` ${bodyAttrs}` : ''}>
${header(prefix, currentSlug)}
${body}
${footer()}
</body>
</html>
`;
}

function renderCard(item, image, prefix, group, index) {
  const [slug, title, extraClass] = item;
  const custom = CUSTOM_REPORTS[slug];
  const src = custom?.cardImage ? `${prefix}${custom.cardImage}` : image ? localAsset(image.src, prefix) : '';
  const alt = custom?.cardAlt || image?.alt || title;
  const featured = extraClass.includes('feature') ? 'true' : 'false';
  const data = reportData(slug);
  const description = reportCardDescription(slug, title, data);
  const category = categoryLabel(group.category);
  const date = reportDate(data, slug);
  const output = data.download?.output || `${data.images.length} visual${data.images.length === 1 ? '' : 's'}`;
  const searchable = `${title} ${category} ${date} ${output} ${description}`;
  return `
    <a class="report-card ${extraClass}" href="${pageHref(prefix, slug)}" data-report-card data-slug="${escapeHtml(slug)}" data-title="${escapeHtml(title)}" data-search="${escapeHtml(searchable)}" data-category="${escapeHtml(group.category)}" data-featured="${featured}" data-index="${index}">
      <span class="report-card-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="report-card-media">
        ${src ? `<span class="report-card-image-wrap"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy"></span>` : ''}
      </span>
      <span class="report-card-body">
        <span class="report-card-kicker">
          <span>${escapeHtml(category)}</span>
          <span>${escapeHtml(date)}</span>
          <span>${escapeHtml(output)}</span>
        </span>
        <span class="report-card-title">${escapeHtml(title)}</span>
        <span class="report-card-description">${escapeHtml(description)}</span>
        <span class="report-card-action">View report <span>&rarr;</span></span>
      </span>
    </a>`;
}

function reportControls() {
  return `
    <div class="report-tools" data-report-tools>
      <div class="report-filter-panel">
        <span class="report-filter-label">Filter by</span>
        <div class="report-filters" aria-label="Filter reports">
          <button type="button" class="is-active" data-report-filter="all" aria-pressed="true">All</button>
          <button type="button" data-report-filter="icbc" aria-pressed="false">I.C.B.C</button>
          <button type="button" data-report-filter="equity" aria-pressed="false">Equity</button>
          <button type="button" data-report-filter="school" aria-pressed="false">Academic</button>
        </div>
      </div>
      <label class="report-search">
        <span>Search reports</span>
        <input id="report-search" type="search" placeholder="Search by company, case, or topic" autocomplete="off" data-report-search>
      </label>
      <label class="report-sort">
        <span>Sort</span>
        <select data-report-sort>
          <option value="default">Editorial order</option>
          <option value="featured">Featured first</option>
          <option value="az">A-Z</option>
        </select>
      </label>
      <p class="report-count" data-report-count></p>
    </div>`;
}

function renderFeaturedShowcase(prefix = '') {
  const slides = FEATURED_REPORTS.map((report, index) => {
    const imageHtml = `<img src="${prefix}${escapeHtml(report.featuredImage)}" alt="${escapeHtml(report.featuredAlt)}" loading="${index === 0 ? 'eager' : 'lazy'}">`;
    return `
      <article class="featured-carousel-slide${index === 0 ? ' is-active' : ''}" data-featured-slide="${index}" aria-hidden="${index === 0 ? 'false' : 'true'}" style="--featured-accent: ${report.accent}; --featured-tint: ${report.tint}; --featured-soft: ${report.soft};">
        <a class="featured-carousel-media" href="${pageHref(prefix, report.slug)}">
          ${imageHtml}
          <span class="featured-image-mark" aria-hidden="true">${escapeHtml(report.imageMark)}</span>
        </a>
        <div class="featured-carousel-copy">
          <span class="featured-report-index">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <span class="featured-report-eyebrow">${escapeHtml(report.eyebrow)}</span>
            <h2>${escapeHtml(report.title)}</h2>
            <p>${escapeHtml(report.description)}</p>
            <a class="featured-report-action" href="${pageHref(prefix, report.slug)}">View report <span>&rarr;</span></a>
          </div>
        </div>
      </article>`;
  }).join('');
  const dots = FEATURED_REPORTS.map((report, index) => `
    <button type="button" class="${index === 0 ? 'is-active' : ''}" data-featured-dot="${index}" aria-label="Show ${escapeHtml(report.title)}" aria-pressed="${index === 0 ? 'true' : 'false'}"></button>`).join('');

  return `
    <section class="cream-band featured-reports" data-featured-showcase>
      <div class="wrap">
        <div class="featured-carousel" data-featured-carousel>
          <div class="featured-carousel-track">
            ${slides}
          </div>
          <div class="featured-carousel-controls" aria-label="Featured report controls">
            <button type="button" data-featured-prev aria-label="Previous featured report">&larr;</button>
            <span data-featured-status>1 / ${FEATURED_REPORTS.length}</span>
            <button type="button" data-featured-next aria-label="Next featured report">&rarr;</button>
          </div>
          <div class="featured-carousel-dots" aria-label="Featured report slides">
            ${dots}
          </div>
        </div>
      </div>
    </section>`;
}

function renderFeaturedIntro(prefix = '') {
  return `
    <section class="featured-intro">
      <div class="wrap featured-intro-block">
        <div class="featured-intro-copy">
          <h1>Featured Reports</h1>
          <p>Selected finance, energy valuation, capital markets, and academic case work.</p>
        </div>
        <nav class="featured-intro-actions" aria-label="Featured report actions">
          <a href="#all-reports">View Research <span>&rarr;</span></a>
          <a href="${pageHref(prefix, 'about')}">View Experience <span>&rarr;</span></a>
          <a href="mailto:${EMAIL}">Contact <span>&rarr;</span></a>
        </nav>
      </div>
    </section>`;
}

function renderHome(prefix = '') {
  const page = homePage();
  const images = uniqueImages(page);
  let imageIndex = 0;
  let cardIndex = 0;
  const libraryIntro = `
    <section class="dark-band home-hero">
      <div class="wrap" id="all-reports">
        <h1>All Reports</h1>
        <hr>
        ${reportControls()}
      </div>
    </section>`;
  const groups = HOME_GROUPS.map((group, index) => {
    const cards = group.items.map((item) => renderCard(item, images[imageIndex++], prefix, group, cardIndex++)).join('');
    const sectionNumber = String(index + 1).padStart(2, '0');
    const head = `
      <div class="section-head">
        <div>
          <span>${sectionNumber}</span>
          <h2>${escapeHtml(group.title)}</h2>
        </div>
        <p>${escapeHtml(group.subtitle)}</p>
      </div>`;
    return `<section class="report-group" data-report-section data-category="${escapeHtml(group.category)}">
      <div class="wrap report-block ${index % 2 === 1 ? 'report-block-charcoal' : ''}">
        ${head}
        <div class="report-feature-list">
          ${cards}
        </div>
      </div>
    </section>`;
  }).join('');

  return shell({
    title: 'Ivan I.',
    description: 'Selected finance, energy valuation, capital markets, transaction analysis, and academic case work by Ivan Imshenetskyy.',
    prefix,
    currentSlug: 'home',
    body: `<main>${renderFeaturedIntro(prefix)}${renderFeaturedShowcase(prefix)}${libraryIntro}${groups}<div class="report-empty" data-report-empty hidden>No reports match the current search.</div></main>`,
  });
}

const PROFILE_STATS = [
  { value: '7+', label: 'years of client-facing business experience' },
  { value: '2+', label: 'years of energy-focused valuation experience' },
  { value: '200+', label: 'client projects delivered through FluxFrame' },
  { value: '120K+', label: 'subscribers across digital media channels' },
];

const FEATURED_REPORTS = [
  {
    slug: 'hydroone',
    title: 'Hydro One - Cost of Capital',
    eyebrow: 'I.C.B.C Finance',
    description: 'A regulator-focused WACC and valuation case built around allowed ROE, policy risk, and Canadian utility market mechanics.',
    featuredImage: 'assets/featured/hydro-one-transmission.jpg',
    featuredAlt: 'Hydro One transmission towers and power lines in Ontario',
    imageMark: 'Hydro One',
    accent: '#2e75b8',
    tint: 'rgba(46, 117, 184, 0.26)',
    soft: '#b9e6fb',
  },
  {
    slug: 'rogers',
    title: 'Rogers Communications',
    eyebrow: 'I.C.B.C Finals',
    description: 'A finals case balancing strategic alternatives, capital allocation, and telecommunications operating realities under time pressure.',
    featuredImage: 'assets/featured/rogers-5g-towers-aerial.jpg',
    featuredAlt: 'Rogers wireless tower infrastructure over a forested highway corridor',
    imageMark: 'Rogers',
    accent: '#c8102e',
    tint: 'rgba(200, 16, 46, 0.24)',
    soft: '#ffd7dc',
  },
  {
    slug: 'sde',
    title: 'Spartan Delta Research',
    eyebrow: 'Equity Research',
    description: 'Energy-focused public equity research combining asset-level valuation, peer benchmarking, and investment thesis development.',
    featuredImage: 'assets/featured/spartan-delta-operations.png',
    featuredAlt: 'Spartan Delta operating landscape with pumpjacks and Alberta foothills',
    imageMark: 'Spartan Delta',
    accent: '#2d6b3f',
    tint: 'rgba(45, 107, 63, 0.25)',
    soft: '#c7e7cf',
  },
  {
    slug: 'altagas',
    title: 'AltaGas Research Pitch',
    eyebrow: 'CFA Research Challenge',
    description: 'Institutional-quality fundamental research supported by detailed financial modeling, peer valuation, and strategic analysis.',
    featuredImage: 'assets/featured/altagas-ripet.jpg',
    featuredAlt: 'AltaGas Ridley Island Propane Export Terminal from above',
    imageMark: 'AltaGas',
    accent: '#0b5d88',
    tint: 'rgba(11, 93, 136, 0.24)',
    soft: '#c8e9f6',
  },
  {
    slug: 'dateflow',
    title: 'DateFlow',
    eyebrow: 'ENTI 317 Slide Deck',
    description: 'A document-to-calendar platform concept presented through a clean student venture slide deck.',
    featuredImage: 'assets/dateflow/dateflow-deck-page-01.png',
    featuredAlt: 'DateFlow blue slide deck cover page',
    imageMark: 'DateFlow',
    accent: '#2a7fb8',
    tint: 'rgba(42, 127, 184, 0.22)',
    soft: '#d8efff',
  },
];

const REPORT_DATE_OVERRIDES = {
  hydroone: 'Nov 2025',
};

const REPORT_PARAGRAPH_OVERRIDES = {
  'btma-og-data-to-drive-commercial-decisions': [
    'An analysis of governance failure, capital structure pressure, and leadership accountability. The project followed data from upstream planning through midstream market analytics and downstream commercial execution to understand where business decisions break across the energy value chain.',
    'Through interviews with professionals across Cenovus and Plains Midstream, the analysis traced how assumptions are created, transformed, and ultimately exposed to financial consequences. The findings showed that upstream feels data failures first, midstream trades speed over perfection, and downstream absorbs every error in P&L.',
    'The conclusion was direct: digital transformation in energy is not only a technical challenge. It is a change management problem where alignment, trust, and ownership matter more than dashboards or systems.',
  ],
};

const CUSTOM_REPORTS = {
  dateflow: {
    title: 'DateFlow',
    description: 'DateFlow is a document-to-calendar concept presented through an ENTI 317 slide deck.',
    cardImage: 'assets/dateflow/dateflow-deck-page-01.png',
    cardAlt: 'DateFlow slide deck cover page',
    meta: [
      { tag: 'h2', text: 'ENTI 317 Slide Deck' },
      { tag: 'p', text: 'Apr 2026' },
      { tag: 'p', text: 'Document-to-calendar platform concept' },
    ],
    paragraphs: [
      'DateFlow was presented as a student-focused document-to-calendar platform for ENTI 317. The deck frames the problem, product concept, customer workflow, and business assumptions behind a tool designed to turn course materials into organized deadlines and calendar actions.',
    ],
    images: [
      { src: 'assets/dateflow/dateflow-deck-page-01.png', alt: 'DateFlow slide deck page 1' },
      { src: 'assets/dateflow/dateflow-deck-page-02.png', alt: 'DateFlow slide deck page 2' },
      { src: 'assets/dateflow/dateflow-deck-page-03.png', alt: 'DateFlow slide deck page 3' },
      { src: 'assets/dateflow/dateflow-deck-page-04.png', alt: 'DateFlow slide deck page 4' },
      { src: 'assets/dateflow/dateflow-deck-page-05.png', alt: 'DateFlow slide deck page 5' },
      { src: 'assets/dateflow/dateflow-deck-page-06.png', alt: 'DateFlow slide deck page 6' },
      { src: 'assets/dateflow/dateflow-deck-page-07.png', alt: 'DateFlow slide deck page 7' },
      { src: 'assets/dateflow/dateflow-deck-page-08.png', alt: 'DateFlow slide deck page 8' },
      { src: 'assets/dateflow/dateflow-deck-page-09.png', alt: 'DateFlow slide deck page 9' },
      { src: 'assets/dateflow/dateflow-deck-page-10.png', alt: 'DateFlow slide deck page 10' },
      { src: 'assets/dateflow/dateflow-deck-page-11.png', alt: 'DateFlow slide deck page 11' },
      { src: 'assets/dateflow/dateflow-deck-page-12.png', alt: 'DateFlow slide deck page 12' },
      { src: 'assets/dateflow/dateflow-deck-page-13.png', alt: 'DateFlow slide deck page 13' },
      { src: 'assets/dateflow/dateflow-deck-page-14.png', alt: 'DateFlow slide deck page 14' },
      { src: 'assets/dateflow/dateflow-deck-page-15.png', alt: 'DateFlow slide deck page 15' },
      { src: 'assets/dateflow/dateflow-deck-page-16.png', alt: 'DateFlow slide deck page 16' },
    ],
    download: {
      localPath: 'assets/docs/dateflow-assignment-4-slide-deck.pdf',
      label: 'Download PDF',
      output: 'PDF deck',
    },
  },
};

const PROFILE_TIMELINE = [
  {
    period: '2018 - 2024',
    role: 'Co-Founder',
    org: 'FluxFrame Digital',
    logo: 'assets/profile-logos/fluxframe.jpeg',
    initials: 'ff',
    detail: 'Bootstrapped and scaled a web and graphic design firm to peak $20K monthly net income, delivering 200+ client projects while building early operating, client management, and execution discipline.',
  },
  {
    period: 'May - Sep 2024',
    role: 'Finance Intern, Commercial Real Estate',
    org: 'Manchester Properties Inc.',
    logo: 'assets/profile-logos/manchester-properties.jpeg',
    initials: 'MPI',
    detail: 'Supported financial analysis, lease tracking, and valuation work across a commercial real estate portfolio with approximately $50M in assets under administration.',
  },
  {
    period: 'Sep 2024 - Aug 2025',
    role: 'Commercial Decision Analyst, Co-op',
    org: 'Cenovus Energy',
    logo: 'assets/profile-logos/cenovus.jpeg',
    initials: 'CV',
    detail: 'Supported upstream and downstream commercial decision-making through economic reporting, financial modeling, and materials for commercial leadership.',
  },
  {
    period: 'Aug 2025 - Jan 2026',
    role: 'Strategic Delivery Analyst, Contract',
    org: 'Cenovus Energy',
    logo: 'assets/profile-logos/cenovus.jpeg',
    initials: 'CV',
    detail: 'Supported executive-level reporting and financial analysis for senior downstream commercial leadership, including advanced modeling for Branded Dealer Cardlock sites.',
  },
  {
    period: 'Jan 2026 - Present',
    role: 'Teaching Assistant, SGMA 668',
    org: 'Haskayne School of Business',
    logo: 'assets/profile-logos/haskayne.jpeg',
    initials: 'H',
    detail: 'Teaching assistant for MBA Acquisitions in Entrepreneurship.',
  },
  {
    period: 'Starting May 2026',
    role: 'Incoming Summer Analyst, Global Transaction Banking',
    org: 'CIBC Capital Markets',
    logo: 'assets/profile-logos/cibc-capital-markets.jpeg',
    initials: 'C',
    detail: 'Incoming summer analyst role focused on global transaction banking at CIBC Capital Markets.',
  },
];

const PROFILE_EDUCATION = [
  {
    title: 'Haskayne School of Business',
    meta: 'Bachelor of Commerce, Finance - 2027',
    logo: 'assets/profile-logos/haskayne.jpeg',
    detail: 'Finance concentration at the University of Calgary.',
  },
  {
    title: 'Henry Wise Wood High School',
    meta: '2017 - 2021',
    logo: 'assets/profile-logos/henry-wise-wood.jpeg',
    detail: 'Graduated with 95% overall.',
  },
];

const PROFILE_AWARDS = [
  {
    title: '1st Place at CIRI Capital Power Buy-Side Target Case Competition',
    meta: 'Investor relations case competition',
  },
  {
    title: '1st Place at TD Securities Investment Banking Case Competition',
    meta: 'Transaction analysis and pitch execution',
  },
  {
    title: 'Top 3 Finalist, Finance Stream, Inter-Collegiate Business Competition 2026',
    meta: 'National undergraduate case competition',
  },
  {
    title: 'Local Finalist, CFA Research Challenge',
    meta: 'Equity research and valuation',
  },
  {
    title: 'RBC Fast Pitch Semifinalist, 2025',
    meta: 'Venture pitch competition',
  },
];

const PROFILE_LEADERSHIP = [
  {
    title: 'Vice President, Equity Research',
    meta: 'Haskayne Finance Club',
  },
  {
    title: 'COO',
    meta: 'DeNovo Student Investment Fund',
  },
  {
    title: 'Portfolio Manager, Energy',
    meta: 'DeNovo Student Investment Fund',
  },
  {
    title: 'Equity Research Analyst',
    meta: 'Haskayne Finance Club',
  },
  {
    title: 'VP Finance',
    meta: 'Tech Start UCalgary',
  },
  {
    title: 'Student Ambassador',
    meta: 'Cenovus Energy',
  },
];

const PROFILE_CERTIFICATIONS = [
  {
    title: 'Corporate Valuation for M&A and Capital Markets',
    issuer: 'Training The Street',
    meta: 'Issued Oct 2024',
    logo: 'assets/profile-logos/training-the-street.jpeg',
  },
  {
    title: 'Financial Modeling Certification',
    issuer: 'Financial Modeling Institute',
    meta: 'Issued Feb 2024',
    logo: 'assets/profile-logos/fmi.jpeg',
  },
];

function profileStats() {
  return PROFILE_STATS.map((item) => `
    <div class="profile-stat">
      <strong>${escapeHtml(item.value)}</strong>
      <span>${escapeHtml(item.label)}</span>
    </div>`).join('');
}

function profileTimeline(prefix) {
  return PROFILE_TIMELINE.map((item, index) => `
    <article class="progression-item">
      <div class="progression-marker">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <span class="progression-logo">
          <span>${escapeHtml(item.initials)}</span>
          <img src="${prefix}${escapeHtml(item.logo)}" alt="" loading="lazy">
        </span>
      </div>
      <div class="progression-content">
        <span>${escapeHtml(item.period)}</span>
        <h3>${escapeHtml(item.role)}</h3>
        <h4>${escapeHtml(item.org)}</h4>
        <p>${escapeHtml(item.detail)}</p>
      </div>
    </article>`).join('');
}

function profileEducation(prefix) {
  return PROFILE_EDUCATION.map((item, index) => `
    <article class="profile-credential-row">
      <span class="profile-mini-logo"><img src="${prefix}${escapeHtml(item.logo)}" alt="" loading="lazy"></span>
      <div class="profile-credential-copy">
        <span class="profile-row-label">${String(index + 1).padStart(2, '0')} / School</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.meta)}</p>
        <p class="profile-row-detail">${escapeHtml(item.detail)}</p>
      </div>
    </article>`).join('');
}

function profileCertifications(prefix) {
  return PROFILE_CERTIFICATIONS.map((item, index) => `
    <article class="profile-credential-row">
      <span class="profile-mini-logo"><img src="${prefix}${escapeHtml(item.logo)}" alt="" loading="lazy"></span>
      <div class="profile-credential-copy">
        <span class="profile-row-label">${String(index + 1).padStart(2, '0')} / Certification</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.issuer)}</p>
        <p class="profile-row-detail">${escapeHtml(item.meta)}</p>
      </div>
    </article>`).join('');
}

function profileIndexedList(items, label) {
  return `<div class="profile-index-list">${items.map((item, index) => `
    <article class="profile-index-row">
      <span class="profile-index-number">${String(index + 1).padStart(2, '0')}</span>
      <div class="profile-index-copy">
        <span class="profile-row-label">${escapeHtml(label)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.meta)}</p>
      </div>
    </article>`).join('')}</div>`;
}

function profilePanel(number, title, content, className = '') {
  return `
            <section class="profile-panel ${className}">
              <header class="profile-panel-heading">
                <span>${escapeHtml(number)}</span>
                <h2>${escapeHtml(title)}</h2>
              </header>
              <div class="profile-panel-body">
                ${content}
              </div>
            </section>`;
}

function profileDetailsSection(prefix) {
  return `
      <section class="experience-band">
        <div class="wrap profile-block profile-block-charcoal">
          <div class="profile-intro">
            <h2>Experience & Progression</h2>
            <p>A progression from entrepreneurial execution to energy finance, capital markets, and investment research.</p>
          </div>
          <div class="progression-shell">
            ${profileTimeline(prefix)}
          </div>
        </div>
      </section>
      <section class="profile-details">
        <div class="wrap profile-block profile-block-cream">
          <div class="profile-grid profile-credential-grid">
            ${profilePanel('01', 'Education', profileEducation(prefix), 'profile-panel-wide profile-panel-education')}
            ${profilePanel('02', 'Awards', profileIndexedList(PROFILE_AWARDS, 'Recognition'), 'profile-panel-awards')}
            ${profilePanel('03', 'Leadership', profileIndexedList(PROFILE_LEADERSHIP, 'Role'), 'profile-panel-leadership')}
            ${profilePanel('04', 'Certifications', profileCertifications(prefix), 'profile-panel-certifications')}
          </div>
          <div class="button-row profile-actions">
            <a class="button" href="${homeHref(prefix)}">Back to Home</a>
          </div>
        </div>
      </section>`;
}

function renderAbout(prefix = '../') {
  const page = pageForSlug('about');
  const blocks = page.blocks || [];
  const image = uniqueImages(page)[0];
  const h1 = blocks.find((block) => block.tag === 'h1')?.text || 'About Me';
  const intro = blocks.filter((block) => block.tag === 'p' && block.text.length < 80).slice(0, 3);
  const paragraphs = [
    'I am a fourth-year finance student at the University of Calgary with experience across capital markets, energy valuation, commercial decision analysis, and student investment leadership. My background combines entrepreneurial execution through FluxFrame with finance experience spanning transaction analysis, NAV modeling, downstream commercial reporting, and case competition work.',
    'I started building graphics and digital products in my early teens, eventually founding FluxFrame, where I managed 200+ client projects, grew a YouTube channel to 120,000+ subscribers, and learned how execution, accountability, and cash flow shape real businesses. My pivot into finance came through the TD Securities M&A Challenge, where transaction analysis showed me I was most engaged in valuation, assumptions, and decision-making under uncertainty.',
  ];

  const body = `
    <main>
      <section class="dark-band page-hero">
        <div class="wrap">
          <h1>${escapeHtml(h1)}</h1>
          <hr>
        </div>
      </section>
      <section class="about-intro-section">
        <div class="wrap about-layout about-block">
          ${image ? `<img class="about-photo" src="${localAsset(image.src, prefix)}" alt="Ivan Imshenetskyy" loading="eager">` : ''}
          <div class="about-copy">
            <div class="about-kicker">
              ${intro.map((block) => `<div>${escapeHtml(block.text)}</div>`).join('')}
            </div>
            <div class="about-proof-stats">
              ${profileStats()}
            </div>
            ${paragraphs.map((text, index) => `<p>${index === 0 ? renderReportParagraph(text, { text: 'capital markets, energy valuation, commercial decision analysis, and student investment leadership' }) : escapeHtml(text)}</p>`).join('')}
          </div>
        </div>
      </section>
      ${profileDetailsSection(prefix)}
    </main>`;

  return shell({
    title: 'About - Ivan I.',
    description: page.metaDescription,
    prefix,
    currentSlug: 'about',
    body,
  });
}

function isFooterBlock(block) {
  return block.text === EMAIL || block.text === 'Ivan Imshenetskyy' || block.text === 'Back to Home';
}

function reportData(slug) {
  const custom = CUSTOM_REPORTS[slug];
  if (custom) {
    return {
      page: {
        title: custom.title,
        metaDescription: custom.description,
      },
      title: custom.title,
      meta: custom.meta,
      paragraphs: custom.paragraphs,
      images: custom.images,
      pdf: null,
      download: custom.download,
    };
  }

  const page = pageForSlug(slug);
  const blocks = (page.blocks || []).filter((block) => !isFooterBlock(block));
  const title = blocks.find((block) => block.tag === 'h1')?.text || page.headings?.[0]?.text || slug;
  const afterTitle = blocks.slice(blocks.findIndex((block) => block.tag === 'h1') + 1)
    .filter((block) => block.tag !== 'a' || block.text === 'Download PDF');
  const pdfBlock = afterTitle.find((block) => block.tag === 'a' && /\.pdf(\?|$)/i.test(block.href));
  const pdfAsset = pdfBlock ? docsByUrl.get(pdfBlock.href) : null;
  const meta = [];
  const paragraphs = [];

  for (const block of afterTitle) {
    if (block.tag === 'a') continue;
    if (block.text.length > 110) {
      paragraphs.push(block.text);
    } else if (block.tag !== 'p' || block.text !== EMAIL) {
      meta.push({ tag: block.tag, text: block.text });
    }
  }

  return {
    page,
    title,
    meta,
    paragraphs: REPORT_PARAGRAPH_OVERRIDES[slug] || paragraphs,
    images: uniqueImages(page),
    pdf: pdfAsset,
    download: pdfAsset ? {
      localPath: pdfAsset.localPath,
      label: 'Download PDF',
      output: 'PDF available',
    } : null,
  };
}

const PASSAGE_KEYWORDS = /\b(recommendation|valuation|cash flows?|EBITDA|WACC|LBO|acquisition|synergies|financial modeling|peer valuation|risk|growth|governance|financing|investment|strategic|market|operations|thesis|returns?)\b/gi;

function sentenceParts(text) {
  return text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
}

function selectedPassage(paragraphs) {
  let best = null;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    sentenceParts(paragraph).forEach((sentence) => {
      const text = sentence.trim();
      if (text.length < 48) return;

      const keywordScore = (text.match(PASSAGE_KEYWORDS) || []).length;
      const leadScore = paragraphIndex === 0 ? 1 : 0;
      const score = keywordScore + leadScore;

      if (!best || score > best.score) {
        best = { paragraphIndex, text, score };
      }
    });
  });

  return best;
}

function renderReportParagraph(text, passage) {
  const escaped = escapeHtml(text);
  if (!passage) return escaped;

  const escapedPassage = escapeHtml(passage.text);
  const index = escaped.indexOf(escapedPassage);
  if (index === -1) return escaped;

  return `${escaped.slice(0, index)}<strong class="copy-passage">${escapedPassage}</strong>${escaped.slice(index + escapedPassage.length)}`;
}

function categoryForSlug(slug) {
  const group = HOME_GROUPS.find((section) => section.items.some(([itemSlug]) => itemSlug === slug));
  return group?.title || 'Selected research';
}

function reportDate(data, slug) {
  if (REPORT_DATE_OVERRIDES[slug]) return REPORT_DATE_OVERRIDES[slug];
  return data.meta.find((block) => /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b.*\b20\d{2}\b|\b20\d{2}\b/i.test(block.text))?.text || 'Portfolio work';
}

function reportContext(data, slug) {
  return data.meta.find((block) => !/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2}|Team Members|Constraints|Time Constraint)\b/i.test(block.text))?.text
    || categoryForSlug(slug);
}

function categoryLabel(category) {
  return {
    icbc: 'I.C.B.C',
    equity: 'Equity Research',
    school: 'Academic & Case',
  }[category] || category;
}

function reportCardDescription(slug, title, data) {
  const custom = CUSTOM_REPORTS[slug];
  if (custom?.description) return custom.description;

  const featured = FEATURED_REPORTS.find((report) => report.slug === slug);
  if (featured?.description) return featured.description;

  const firstParagraph = data.paragraphs.find((paragraph) => paragraph.length > 80);
  if (firstParagraph) {
    const sentence = sentenceParts(firstParagraph)[0]?.trim() || firstParagraph;
    return sentence.length > 190 ? `${sentence.slice(0, 187).trim()}...` : sentence;
  }

  return `${title} presented as part of Ivan Imshenetskyy's selected research, case competition, and academic work.`;
}

function renderReportSnapshot(data, slug) {
  const facts = [
    ['Context', reportContext(data, slug)],
    ['Date', reportDate(data, slug)],
    ['Gallery', `${data.images.length} visual${data.images.length === 1 ? '' : 's'}`],
    ['Output', data.download?.output || 'Case deck'],
  ];

  return `
    <div class="report-snapshot" aria-label="Report snapshot">
      ${facts.map(([label, value]) => `
        <div class="report-snapshot-item">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>`).join('')}
    </div>`;
}

function renderReport(slug, prefix = '../') {
  const data = reportData(slug);
  const meta = data.meta.map((block, index) => {
    const small = block.tag !== 'h2' || index > 0;
    const italic = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2}|Time Constraint|Constraints)\b/i.test(block.text);
    return `<div class="${small ? 'small' : ''} ${italic ? 'italic' : ''}">${escapeHtml(block.text)}</div>`;
  }).join('');
  const downloadButton = data.download ? `<a class="button" href="${prefix}${data.download.localPath}">${escapeHtml(data.download.label)}</a>` : '';
  const slides = data.images.map((image) => `
    <figure class="slide-card">
      <img src="${localAsset(image.src, prefix)}" alt="${escapeHtml(image.alt || data.title)}" loading="lazy">
    </figure>`).join('');
  const passage = selectedPassage(data.paragraphs);
  const insight = passage ? `
    <aside class="report-insight">
      <span>Key read</span>
      <p>${escapeHtml(passage.text)}</p>
    </aside>` : '';
  const reportCopyHtml = data.paragraphs.map((paragraph, index) => {
    const paragraphPassage = passage?.paragraphIndex === index ? passage : null;
    return `<p>${renderReportParagraph(paragraph, paragraphPassage)}</p>`;
  }).join('');

  const body = `
    <main>
      <section class="report-hero report-hero-modern">
        <div class="wrap report-hero-grid report-detail-block">
          <div class="report-title-panel">
            <a class="report-back-link" href="${homeHref(prefix)}">Back to home <span>&rarr;</span></a>
            <h1>${escapeHtml(data.title)}</h1>
          </div>
          <aside class="report-context-panel">
            ${meta ? `<div class="report-meta">${meta}</div>` : ''}
            ${downloadButton ? `<div class="button-row">${downloadButton}</div>` : ''}
          </aside>
          ${renderReportSnapshot(data, slug)}
          ${insight}
          ${data.paragraphs.length ? `<div class="report-copy">${reportCopyHtml}</div>` : ''}
        </div>
      </section>
      <section class="slide-gallery">
        <div class="wrap slide-gallery-block">
          <div class="gallery-heading">
            <h2>Report Gallery</h2>
            <p>${data.images.length} visual${data.images.length === 1 ? '' : 's'} from the underlying deck and analysis.</p>
          </div>
          <div class="slides">
            ${slides}
          </div>
          <div class="button-row">
            <a class="button" href="${homeHref(prefix)}">Back to Home</a>
          </div>
        </div>
      </section>
    </main>`;

  return shell({
    title: documentTitle(data.title),
    description: data.page.metaDescription,
    prefix,
    currentSlug: slug,
    bodyAttrs: `data-report-slug="${escapeHtml(slug)}"`,
    body,
  });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function main() {
  writeFile('index.html', renderHome(''));
  writeFile(path.join('home', 'index.html'), renderHome('../'));
  writeFile(path.join('about', 'index.html'), renderAbout('../'));

  const slugs = [...new Set([
    ...ICBC_MENU.map(([slug]) => slug),
    ...EQUITY_MENU.map(([slug]) => slug),
    ...SCHOOL_MENU.map(([slug]) => slug),
  ])];

  for (const slug of slugs) {
    if (!pageForSlug(slug) && !CUSTOM_REPORTS[slug]) {
      console.warn(`Missing page for ${slug}`);
      continue;
    }
    writeFile(path.join(slug, 'index.html'), renderReport(slug, '../'));
  }

  console.log(JSON.stringify({
    home: 'index.html',
    pages: slugs.length + 2,
  }, null, 2));
}

main();
