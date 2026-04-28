"""Rename All Reports to Home in nav, and All reports to Back to home in back-links."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def patch_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    # Nav bar links: <a ...>All Reports</a>
    content = re.sub(r'>All Reports<', '>Home<', content)
    # Report back link: <a class="report-back-link" ...>All reports <span>→</span></a>
    content = re.sub(r'>All reports <span>', '>Back to home <span>', content)
    if content == original:
        return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return True


def main():
    count = 0
    for dirpath, _, filenames in os.walk(ROOT):
        # Skip .claude (worktrees, etc.)
        if '.claude' in dirpath.split(os.sep):
            continue
        for fn in filenames:
            if fn != 'index.html':
                continue
            p = os.path.join(dirpath, fn)
            if patch_file(p):
                rel = os.path.relpath(p, ROOT)
                print(f'OK {rel}')
                count += 1
    print(f'Total: {count} files patched')


if __name__ == '__main__':
    main()
