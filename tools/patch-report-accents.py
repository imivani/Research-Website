"""Add data-report-slug attribute to body of each report page in main."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REPORT_SLUGS = [
    'altagas', 'ameritrade', 'ashfield-industries-dungaven-acquisition',
    'btma-og-data-to-drive-commercial-decisions', 'cataraqui-building-supplies',
    'diamond', 'galaxyresources', 'griffiths-energy-international', 'hydroone',
    'lakeshore-plumbing', 'markle', 'newearth', 'nfi-group', 'parks-capital',
    'ptarmigan', 'quintessentially-canadian', 'rogers', 'sanctions', 'sde',
    'sdeonepager', 'sketch', 'techmajority', 'the-lehman-brothers-collapse',
    'walmart', 'westmillscarpet', 'weyerhaeuser-beyond-lumber', 'windfarm',
    'xeqt',
]

BODY_RE = re.compile(r'<body class="jpm-theme"(?:\s+data-report-slug="[^"]*")?>')


def patch_file(path, slug):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content, n = BODY_RE.subn(
        f'<body class="jpm-theme" data-report-slug="{slug}">', content, count=1,
    )
    if n == 0:
        return False, 'no <body class="jpm-theme"> found'
    if new_content == content:
        return False, 'unchanged'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True, 'patched'


def main():
    for slug in REPORT_SLUGS:
        p = os.path.join(ROOT, slug, 'index.html')
        if not os.path.exists(p):
            print(f'SKIP {slug}: missing')
            continue
        ok, msg = patch_file(p, slug)
        status = 'OK' if ok else 'SKIP'
        print(f'{status} {slug}: {msg}')


if __name__ == '__main__':
    main()
