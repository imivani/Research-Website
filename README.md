# Ivan I. Static Website

This is a static HTML/CSS rebuild of the Squarespace site at `https://imivani.com/`.

## Preview

The site can be opened directly from `index.html`, or served locally:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

## Structure

- `index.html` - homepage / all reports
- `about/index.html` - about page
- report folders such as `rogers/index.html`, `sde/index.html`, and `walmart/index.html`
- `styles.css` - shared visual styling
- `assets/images` - mirrored images and slide assets
- `assets/docs` - mirrored PDFs that were public on Squarespace
- `tools` - helper scripts used to crawl, download, and generate the static pages

## Deployment

Upload the contents of this folder to any static host, such as Netlify, Cloudflare Pages, GitHub Pages, or a normal web host. The homepage should be `index.html`.
