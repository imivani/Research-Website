const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const inventoryPath = path.resolve(process.argv[2] || 'site-inventory.json');
const outPath = path.resolve(process.argv[3] || 'site-assets.json');
const assetRoot = path.resolve(process.argv[4] || 'assets');
const imageDir = path.join(assetRoot, 'images');
const docDir = path.join(assetRoot, 'docs');

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

function slugify(value) {
  return (value || 'asset')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'asset';
}

function extensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const ext = path.extname(decodeURIComponent(parsed.pathname)).toLowerCase();
    if (ext) return ext.replace('.jpeg', '.jpg');
  } catch {}
  return '.bin';
}

function localName(url, label) {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
  return `${slugify(label)}-${hash}${extensionFromUrl(url)}`;
}

function isUsefulImage(image) {
  if (!image || !image.src || !image.visible) return false;
  if (image.renderedWidth < 20 || image.renderedHeight < 20) return false;
  return /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(image.src);
}

function uniqueByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

const images = uniqueByUrl(inventory.pages.flatMap((page) =>
  page.images.filter(isUsefulImage).map((image) => ({
    type: 'image',
    url: image.src,
    label: image.alt || page.headings?.[0]?.text || page.title || 'image',
    sourcePage: page.url,
  }))
));

const docs = uniqueByUrl(inventory.pages.flatMap((page) =>
  page.anchors
    .filter((anchor) => /\.(pdf|docx?|xlsx?|pptx?)(\?|$)/i.test(anchor.href))
    .map((anchor) => ({
      type: 'doc',
      url: anchor.href,
      label: anchor.text || page.headings?.[0]?.text || 'document',
      sourcePage: page.url,
    }))
));

const assets = [
  ...images.map((asset) => ({
    ...asset,
    localPath: path.join('assets', 'images', localName(asset.url, asset.label)).replace(/\\/g, '/'),
  })),
  ...docs.map((asset) => ({
    ...asset,
    localPath: path.join('assets', 'docs', localName(asset.url, asset.label)).replace(/\\/g, '/'),
  })),
];

async function download(asset, index, total) {
  const target = path.resolve(asset.localPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    return { ...asset, status: 'exists', bytes: fs.statSync(target).size };
  }
  const response = await fetch(asset.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Codex static site migration',
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(target, buffer);
  if ((index + 1) % 25 === 0 || index === total - 1) {
    console.log(`Downloaded ${index + 1}/${total}`);
  }
  return {
    ...asset,
    status: 'downloaded',
    bytes: buffer.length,
    contentType: response.headers.get('content-type') || '',
  };
}

(async () => {
  fs.mkdirSync(imageDir, { recursive: true });
  fs.mkdirSync(docDir, { recursive: true });

  const results = [];
  const failures = [];
  let next = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (next < assets.length) {
      const index = next++;
      const asset = assets[index];
      try {
        results[index] = await download(asset, index, assets.length);
      } catch (error) {
        failures.push({ ...asset, error: error.message });
        results[index] = { ...asset, status: 'failed', error: error.message };
        console.error(`Failed ${asset.url}: ${error.message}`);
      }
    }
  });
  await Promise.all(workers);

  const manifest = {
    createdAt: new Date().toISOString(),
    imageCount: images.length,
    docCount: docs.length,
    assets: results,
    failures,
  };
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({
    images: images.length,
    docs: docs.length,
    failures: failures.length,
    outPath,
  }, null, 2));
})();
