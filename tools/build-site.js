const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('site-inventory.json', 'utf8'));
const assetManifest = JSON.parse(fs.readFileSync('site-assets.json', 'utf8'));

const ORIGIN = 'https://imivani.com';
const EMAIL = 'business@imivani.com';
const LINKEDIN = 'https://www.linkedin.com/in/imivani/';

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
    title: 'School Reports',
    subtitle: 'Assignments & extracurriculars at Haskayne.',
    grid: 'grid-two',
    items: [
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

function documentTitle(pageTitle) {
  return `${pageTitle} - Ivan I.`;
}

function menuLinks(items, prefix, currentSlug) {
  return items.map(([slug, label]) => (
    `<a class="${currentSlug === slug ? 'active' : ''}" href="${prefix}${slug}/index.html">${escapeHtml(label)}</a>`
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
      <a class="${currentSlug === 'home' ? 'active' : ''}" href="${prefix}index.html">All Reports</a>
      <a class="${currentSlug === 'about' ? 'active' : ''}" href="${prefix}about/index.html">About Me</a>
      ${navDetails('I.C.B.C Reports', ICBC_MENU, prefix, currentSlug, icbcActive)}
      ${navDetails('Equity Research & Economic Reports', EQUITY_MENU, prefix, currentSlug, equityActive)}
      ${navDetails('School Reports', SCHOOL_MENU, prefix, currentSlug, schoolActive)}
      <span class="socials">
        <a href="${LINKEDIN}" aria-label="LinkedIn">in</a>
        <a class="mail-icon" href="mailto:${EMAIL}" aria-label="Email">&#9993;</a>
      </span>
    </nav>`;

  const mobileToggle = `
    <button class="mobile-menu-button" type="button" aria-expanded="false" aria-controls="mobile-navigation" data-mobile-menu-toggle>Menu</button>`;

  const mobilePanel = `
      <div class="mobile-panel nav" id="mobile-navigation" aria-label="Mobile navigation" data-mobile-menu-panel hidden>
        <a class="${currentSlug === 'home' ? 'active' : ''}" href="${prefix}index.html">All Reports</a>
        <a class="${currentSlug === 'about' ? 'active' : ''}" href="${prefix}about/index.html">About Me</a>
        ${navDetails('I.C.B.C Reports', ICBC_MENU, prefix, currentSlug, icbcActive)}
        ${navDetails('Equity Research & Economic Reports', EQUITY_MENU, prefix, currentSlug, equityActive)}
        ${navDetails('School Reports', SCHOOL_MENU, prefix, currentSlug, schoolActive)}
        <span class="socials">
          <a href="${LINKEDIN}" aria-label="LinkedIn">in</a>
          <a class="mail-icon" href="mailto:${EMAIL}" aria-label="Email">&#9993;</a>
        </span>
      </div>`;

  return `
    <header class="site-header">
      <a class="brand" href="${prefix}index.html" aria-label="Ivan I. home">II</a>
      ${desktop}
      ${mobileToggle}
      ${themeToggle()}
    </header>
    ${mobilePanel}`;
}

function themeToggle() {
  return `
      <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false" data-theme-toggle>
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
          <a href="${LINKEDIN}" aria-label="LinkedIn">in</a>
          <a class="mail-icon" href="mailto:${EMAIL}" aria-label="Email">&#9993;</a>
        </span>
        <a class="email" href="mailto:${EMAIL}">${EMAIL}</a>
      </div>
    </footer>`;
}

function shell({ title, description, prefix, currentSlug, body }) {
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description || 'A collection of research and economic reports.')}">
  <title>${escapeHtml(title)}</title>
  ${themeBoot}
  <link rel="stylesheet" href="${prefix}styles.css">
  <link rel="stylesheet" href="${prefix}styles-jpmorgan-overrides.css">
  <script src="${prefix}script.js" defer></script>
</head>
<body class="jpm-theme">
${header(prefix, currentSlug)}
${body}
${footer()}
</body>
</html>
`;
}

function renderCard(item, image, prefix, group, index) {
  const [slug, title, extraClass] = item;
  const src = image ? localAsset(image.src, prefix) : '';
  const featured = extraClass.includes('feature') ? 'true' : 'false';
  return `
    <a class="report-card ${extraClass}" href="${prefix}${slug}/index.html" data-report-card data-title="${escapeHtml(title)}" data-category="${escapeHtml(group.category)}" data-featured="${featured}" data-index="${index}">
      <figure>
        ${src ? `<img src="${src}" alt="${escapeHtml(image.alt || title)}" loading="lazy">` : ''}
        <figcaption>${escapeHtml(title)}</figcaption>
      </figure>
    </a>`;
}

function reportControls() {
  return `
    <div class="report-tools" data-report-tools>
      <label class="report-search">
        <span>Search reports</span>
        <input type="search" placeholder="Search by company, case, or topic" autocomplete="off" data-report-search>
      </label>
      <div class="report-filters" aria-label="Filter reports">
        <button type="button" class="is-active" data-report-filter="all" aria-pressed="true">All</button>
        <button type="button" data-report-filter="featured" aria-pressed="false">Featured</button>
        <button type="button" data-report-filter="icbc" aria-pressed="false">I.C.B.C</button>
        <button type="button" data-report-filter="equity" aria-pressed="false">Equity</button>
        <button type="button" data-report-filter="school" aria-pressed="false">School</button>
      </div>
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

function renderHome(prefix = '') {
  const page = homePage();
  const images = uniqueImages(page);
  let imageIndex = 0;
  let cardIndex = 0;
  const intro = `
    <section class="dark-band home-hero">
      <div class="wrap">
        <h1>All Reports</h1>
        <hr>
        ${reportControls()}
      </div>
    </section>`;
  const groups = HOME_GROUPS.map((group, index) => {
    const cards = group.items.map((item) => renderCard(item, images[imageIndex++], prefix, group, cardIndex++)).join('');
    const sectionNumber = String(index + 1).padStart(2, '0');
    const head = `
      <section class="dark-band section-head">
        <div class="wrap">
          <h2 data-section-number="${sectionNumber}">${escapeHtml(group.title)}</h2>
          <p>${escapeHtml(group.subtitle)}</p>
        </div>
      </section>`;
    return `<div class="report-group" data-report-section data-category="${escapeHtml(group.category)}">${head}
      <section class="cream-band gallery-block">
        <div class="wrap gallery-grid ${group.grid}">
          ${cards}
        </div>
      </section></div>`;
  }).join('');

  return shell({
    title: 'Ivan I.',
    description: page.metaDescription || 'A collection of my research & economic reports.',
    prefix,
    currentSlug: 'home',
    body: `<main>${intro}${groups}<div class="report-empty" data-report-empty hidden>No reports match the current search.</div></main>`,
  });
}

function renderAbout(prefix = '../') {
  const page = pageForSlug('about');
  const blocks = page.blocks || [];
  const image = uniqueImages(page)[0];
  const h1 = blocks.find((block) => block.tag === 'h1')?.text || 'About Me';
  const intro = blocks.filter((block) => block.tag === 'p' && block.text.length < 80).slice(0, 3);
  const paragraphs = blocks.filter((block) => block.tag === 'p' && block.text.length >= 80 && block.text !== EMAIL);

  const body = `
    <main>
      <section class="dark-band page-hero">
        <div class="wrap">
          <h1>${escapeHtml(h1)}</h1>
          <hr>
        </div>
      </section>
      <section class="cream-band">
        <div class="wrap about-layout">
          ${image ? `<img class="about-photo" src="${localAsset(image.src, prefix)}" alt="Ivan Imshenetskyy" loading="eager">` : ''}
          <div class="about-copy">
            <div class="about-kicker">
              ${intro.map((block) => `<div>${escapeHtml(block.text)}</div>`).join('')}
            </div>
            ${paragraphs.map((block) => `<p>${escapeHtml(block.text)}</p>`).join('')}
            <p><a class="button" href="${prefix}index.html">Back to Home</a></p>
          </div>
        </div>
      </section>
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
    paragraphs,
    images: uniqueImages(page),
    pdf: pdfAsset,
  };
}

function renderReport(slug, prefix = '../') {
  const data = reportData(slug);
  const meta = data.meta.map((block, index) => {
    const small = block.tag !== 'h2' || index > 0;
    const italic = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2}|Time Constraint|Constraints)\b/i.test(block.text);
    return `<div class="${small ? 'small' : ''} ${italic ? 'italic' : ''}">${escapeHtml(block.text)}</div>`;
  }).join('');
  const pdfButton = data.pdf ? `<a class="button" href="${prefix}${data.pdf.localPath}">Download PDF</a>` : '';
  const slides = data.images.map((image) => `
    <figure class="slide-card">
      <img src="${localAsset(image.src, prefix)}" alt="${escapeHtml(image.alt || data.title)}" loading="lazy">
    </figure>`).join('');

  const body = `
    <main>
      <section class="dark-band report-hero">
        <div class="wrap">
          <h1>${escapeHtml(data.title)}</h1>
          ${meta ? `<div class="report-meta">${meta}</div>` : ''}
          ${data.paragraphs.length ? `<div class="report-copy">${data.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>` : ''}
          ${pdfButton ? `<div class="button-row">${pdfButton}</div>` : ''}
        </div>
      </section>
      <section class="cream-band slide-gallery">
        <div class="wrap">
          <div class="slides">
            ${slides}
          </div>
          <div class="button-row">
            <a class="button" href="${prefix}index.html">Back to Home</a>
          </div>
        </div>
      </section>
    </main>`;

  return shell({
    title: documentTitle(data.title),
    description: data.page.metaDescription,
    prefix,
    currentSlug: slug,
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
    if (!pageForSlug(slug)) {
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
