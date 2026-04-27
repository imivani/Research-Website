const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'jpmorgan-style');
const excluded = new Set([
  '.git',
  'assets',
  'screenshots',
  'tools',
  'jpmorgan-style',
]);

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

function htmlDirs() {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !excluded.has(entry.name))
    .filter((entry) => fs.existsSync(path.join(root, entry.name, 'index.html')))
    .map((entry) => entry.name);
}

function enhanceHtml(content) {
  const themeBoot = `<script>
    try {
      const savedTheme = localStorage.getItem('portfolio-theme');
      document.documentElement.dataset.theme = savedTheme || 'light';
    } catch {
      document.documentElement.dataset.theme = 'light';
    }
  </script>`;
  const toggle = `
      <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false" data-theme-toggle>
        <span class="theme-toggle-track" aria-hidden="true">
          <span class="theme-toggle-dot"></span>
        </span>
        <span class="theme-toggle-text">Dark</span>
      </button>`;

  let enhanced = content.includes('class="jpm-theme"')
    ? content
    : content.replace('<body>', '<body class="jpm-theme">');
  if (!enhanced.includes('portfolio-theme')) {
    enhanced = enhanced.replace('<link rel="stylesheet"', `${themeBoot}\n  <link rel="stylesheet"`);
  }
  if (!enhanced.includes('data-theme-toggle')) {
    enhanced = enhanced.replace('</header>', `${toggle}\n    </header>`);
  }
  return enhanced;
}

function enhanceHtmlFiles() {
  const files = [
    path.join(outDir, 'index.html'),
    ...htmlDirs().map((dir) => path.join(outDir, dir, 'index.html')),
  ];

  for (const file of files) {
    fs.writeFileSync(file, enhanceHtml(fs.readFileSync(file, 'utf8')));
  }
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  copyFile(path.join(root, 'index.html'), path.join(outDir, 'index.html'));
  copyFile(path.join(root, 'styles.css'), path.join(outDir, 'styles.css'));
  copyFile(path.join(root, 'styles-jpmorgan-overrides.css'), path.join(outDir, 'styles-jpmorgan-overrides.css'));
  copyFile(path.join(root, 'script.js'), path.join(outDir, 'script.js'));
  copyFile(path.join(root, 'README.md'), path.join(outDir, 'README.md'));
  copyDir(path.join(root, 'assets'), path.join(outDir, 'assets'));

  for (const dir of htmlDirs()) {
    copyDir(path.join(root, dir), path.join(outDir, dir));
  }

  enhanceHtmlFiles();

  console.log(JSON.stringify({
    outDir,
    pages: 1 + htmlDirs().length,
    css: path.join(outDir, 'styles.css'),
  }, null, 2));
}

main();
