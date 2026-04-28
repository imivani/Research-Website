"""Split the about page profile-details into a charcoal Experience section + cream rest."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ABOUT_PATHS = [
    'about/index.html',
    'jpmorgan-style/about/index.html',
]


def patch(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'class="charcoal-band experience-band"' in c:
        return False  # already split

    # Change the opening section class
    c = c.replace(
        '<section class="cream-band profile-details">',
        '<section class="charcoal-band experience-band">',
        1,
    )

    # Insert a section break before the profile-grid div.
    # Look for `</div>` followed by whitespace then `<div class="profile-grid">`.
    pattern = re.compile(
        r'(\s*)</div>(\s*)<div class="profile-grid">',
        re.MULTILINE,
    )
    replacement = (
        r'\1</div>\1</div>\1</section>\1\1<section class="cream-band profile-details">\1<div class="wrap">\2<div class="profile-grid">'
    )
    c, n = pattern.subn(replacement, c, count=1)
    if n == 0:
        return False

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    return True


def main():
    for rel in ABOUT_PATHS:
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            print(f'SKIP {rel}: missing')
            continue
        ok = patch(p)
        print(f'{"OK" if ok else "SKIP"} {rel}')


if __name__ == '__main__':
    main()
