"""Add favicon link tags to every index.html in the site."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FAVICON_BLOCK = '''  <link rel="icon" type="image/x-icon" href="/assets/favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/favicon-180.png">
  <link rel="manifest" href="/assets/favicon/site.webmanifest">
  <meta name="theme-color" content="#8f5a39">'''


def patch_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'rel="icon"' in content:
        # Already has favicon — replace existing block.
        content = re.sub(
            r'(?:\s*<link rel="icon"[^>]*>\s*\n)+'
            r'(?:\s*<link rel="apple-touch-icon"[^>]*>\s*\n)?'
            r'(?:\s*<link rel="manifest"[^>]*>\s*\n)?'
            r'(?:\s*<meta name="theme-color"[^>]*>\s*\n)?',
            '\n' + FAVICON_BLOCK + '\n',
            content,
            count=1,
        )
    else:
        # Insert before the first stylesheet link.
        content = re.sub(
            r'(\s*<link rel="stylesheet")',
            '\n' + FAVICON_BLOCK + r'\1',
            content,
            count=1,
        )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return True


def main():
    count = 0
    for dirpath, _, filenames in os.walk(ROOT):
        if '.claude' in dirpath.split(os.sep):
            continue
        for fn in filenames:
            if fn != 'index.html':
                continue
            p = os.path.join(dirpath, fn)
            patch_file(p)
            count += 1
    print(f'Total: {count} files patched')


if __name__ == '__main__':
    main()
