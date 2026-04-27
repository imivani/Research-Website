const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const startUrl = process.argv[2] || 'https://imivani.com/';
const outFile = path.resolve(process.argv[3] || 'site-inventory.json');
const outDir = path.dirname(outFile);
const origin = new URL(startUrl).origin;
const port = 9400 + Math.floor(Math.random() * 1000);
const profileDir = path.join(process.env.TEMP || process.cwd(), `codex-crawl-${Date.now()}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForEndpoint() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome DevTools endpoint did not start');
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });
    this.ws.addEventListener('message', (event) => {
      const raw = typeof event.data === 'string' ? event.data : event.data.toString();
      const msg = JSON.parse(raw);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message}: ${msg.error.data || ''}`));
        else resolve(msg.result);
        return;
      }
      if (msg.method) {
        const list = this.waiters.get(msg.method) || [];
        this.waiters.set(msg.method, []);
        list.forEach((resolve) => resolve(msg.params || {}));
      }
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`Timed out: ${method}`));
      }, 45000);
    });
  }

  waitFor(method, timeout = 25000) {
    return new Promise((resolve, reject) => {
      const list = this.waiters.get(method) || [];
      list.push(resolve);
      this.waiters.set(method, list);
      setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function newPage() {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error(`Could not create tab: ${res.status} ${await res.text()}`);
  const target = await res.json();
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return { target, cdp };
}

function normalizePageUrl(href) {
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return null;
    if (/\.(png|jpe?g|gif|webp|svg|pdf|zip|docx?|xlsx?|pptx?)$/i.test(url.pathname)) return null;
    url.hash = '';
    url.search = '';
    return url.href.replace(/\/$/, '/') ;
  } catch {
    return null;
  }
}

const extractExpression = `(() => {
  const clean = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const toAbs = (value) => {
    try { return value ? new URL(value, location.href).href : ''; } catch { return ''; }
  };
  const urlsFromCss = (value) => {
    const urls = [];
    if (!value || value === 'none') return urls;
    const regex = /url\\(["']?([^"')]+)["']?\\)/g;
    let match;
    while ((match = regex.exec(value))) urls.push(toAbs(match[1]));
    return urls;
  };
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const anchors = [...document.querySelectorAll('a[href]')].map((a) => ({
    text: clean(a.innerText || a.getAttribute('aria-label') || a.querySelector('img')?.alt || ''),
    href: toAbs(a.getAttribute('href')),
    visible: visible(a)
  }));
  const images = [...document.querySelectorAll('img')].map((img) => ({
    alt: img.alt || '',
    src: toAbs(img.currentSrc || img.src),
    rawSrc: toAbs(img.getAttribute('src')),
    srcset: img.getAttribute('srcset') || '',
    width: img.naturalWidth,
    height: img.naturalHeight,
    renderedWidth: Math.round(img.getBoundingClientRect().width),
    renderedHeight: Math.round(img.getBoundingClientRect().height),
    visible: visible(img)
  }));
  const media = [...document.querySelectorAll('iframe[src], embed[src], object[data], video[src], video[poster], source[src], source[srcset]')].map((el) => ({
    tag: el.tagName.toLowerCase(),
    src: toAbs(el.getAttribute('src') || el.getAttribute('data') || el.getAttribute('poster') || ''),
    srcset: el.getAttribute('srcset') || '',
    type: el.getAttribute('type') || '',
    title: el.getAttribute('title') || ''
  }));
  const cssImages = [];
  for (const el of [...document.querySelectorAll('body *')]) {
    const cs = getComputedStyle(el);
    for (const url of urlsFromCss(cs.backgroundImage)) {
      cssImages.push({ url, text: clean(el.innerText).slice(0, 120), tag: el.tagName.toLowerCase() });
    }
  }
  const headings = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => ({
    level: h.tagName.toLowerCase(),
    text: clean(h.innerText)
  })).filter((h) => h.text);
  const blocks = [...document.querySelectorAll('h1,h2,h3,h4,p,a.sqs-block-button-element,figcaption')]
    .filter(visible)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: clean(el.innerText || el.textContent),
      href: el.tagName.toLowerCase() === 'a' ? toAbs(el.getAttribute('href')) : '',
      className: typeof el.className === 'string' ? el.className.slice(0, 120) : ''
    }))
    .filter((block) => block.text);
  const sections = [...document.querySelectorAll('header, main section, article, footer, .page-section, [data-section-id]')]
    .filter(visible)
    .slice(0, 30)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className.slice(0, 160) : '',
        text: clean(el.innerText).slice(0, 700),
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
      };
    });
  const html = document.documentElement.outerHTML;
  const fileUrls = [...html.matchAll(/https?:\\/\\/[^"'<>)\\\\\\s]+\\.(?:pdf|png|jpe?g|webp|gif|svg|docx?|xlsx?|pptx?)(?:\\?[^"'<>)\\\\\\s]*)?/gi)]
    .map((m) => m[0].replace(/&amp;/g, '&'));
  return {
    url: location.href,
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.content || '',
    text: clean(document.body.innerText).slice(0, 6000),
    headings,
    blocks,
    anchors,
    images,
    media,
    cssImages,
    fileUrls,
    sections,
    scrollHeight: document.documentElement.scrollHeight
  };
})()`;

async function inspect(cdp, url) {
  const loaded = cdp.waitFor('Page.loadEventFired', 30000).catch(() => null);
  await cdp.send('Page.navigate', { url });
  await loaded;
  await sleep(1800);
  await cdp.send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `new Promise((resolve) => {
      let y = 0;
      const step = Math.max(500, Math.floor(innerHeight * 0.85));
      const timer = setInterval(() => {
        scrollTo(0, y);
        y += step;
        if (y > document.documentElement.scrollHeight + innerHeight) {
          clearInterval(timer);
          setTimeout(() => { scrollTo(0, 0); resolve(true); }, 500);
        }
      }, 100);
    })`,
  }).catch(() => null);
  await sleep(600);
  const result = await cdp.send('Runtime.evaluate', { expression: extractExpression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`Extract failed for ${url}`);
  return result.result.value;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore' });

  const pages = [];
  const queue = [startUrl];
  const queued = new Set(queue.map(normalizePageUrl).filter(Boolean));
  const visited = new Set();
  let target;
  let cdp;

  try {
    await waitForEndpoint();
    ({ target, cdp } = await newPage());

    while (queue.length && pages.length < 80) {
      const url = queue.shift();
      const normalized = normalizePageUrl(url);
      if (!normalized || visited.has(normalized)) continue;
      visited.add(normalized);
      console.log(`Inspecting ${normalized}`);
      const page = await inspect(cdp, normalized);
      pages.push(page);

      for (const anchor of page.anchors) {
        const next = normalizePageUrl(anchor.href);
        if (!next || queued.has(next) || visited.has(next)) continue;
        queued.add(next);
        queue.push(next);
      }
    }

    const assets = new Map();
    const externals = new Map();
    for (const page of pages) {
      const candidates = [
        ...page.images.flatMap((image) => [image.src, image.rawSrc]),
        ...page.cssImages.map((image) => image.url),
        ...page.media.flatMap((item) => [item.src]),
        ...page.fileUrls,
        ...page.anchors.map((anchor) => anchor.href).filter((href) => /\.(pdf|png|jpe?g|webp|gif|svg|docx?|xlsx?|pptx?)(?:\?|$)/i.test(href)),
      ].filter(Boolean);
      for (const url of candidates) {
        const key = url.replace(/&amp;/g, '&');
        if (!assets.has(key)) assets.set(key, { url: key, pages: [] });
        assets.get(key).pages.push(page.url);
      }
      for (const anchor of page.anchors) {
        try {
          const url = new URL(anchor.href);
          if (url.origin !== origin && !anchor.href.startsWith('mailto:')) {
            if (!externals.has(anchor.href)) externals.set(anchor.href, { href: anchor.href, text: anchor.text, pages: [] });
            externals.get(anchor.href).pages.push(page.url);
          }
        } catch {}
      }
    }

    const inventory = {
      crawledAt: new Date().toISOString(),
      origin,
      pages: pages.map((page) => ({
        ...page,
        anchors: page.anchors.filter((anchor, index, all) =>
          index === all.findIndex((other) => other.href === anchor.href && other.text === anchor.text)
        ),
      })),
      assets: [...assets.values()].map((asset) => ({
        url: asset.url,
        pages: [...new Set(asset.pages)],
      })),
      externalLinks: [...externals.values()].map((link) => ({
        ...link,
        pages: [...new Set(link.pages)],
      })),
    };
    fs.writeFileSync(outFile, JSON.stringify(inventory, null, 2));
    console.log(JSON.stringify({
      pages: inventory.pages.length,
      assets: inventory.assets.length,
      externalLinks: inventory.externalLinks.length,
      outFile,
    }, null, 2));
  } finally {
    if (target) {
      await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
    }
    if (cdp) cdp.close();
    chrome.kill();
    await sleep(300);
    try {
      fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 });
    } catch {}
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
