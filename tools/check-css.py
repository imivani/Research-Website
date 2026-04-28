"""Check CSS file structural integrity for unclosed comments/strings/braces."""
import sys

path = r'C:\Users\busin.IVANS-OFFICE-PC\OneDrive\Documents\Codex\Research Website\styles.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

in_block = 0
in_comment = False
in_string = None
line = 1
issues = []
i = 0
BACKSLASH = '\\'
while i < len(content):
    c = content[i]
    nx = content[i+1] if i+1 < len(content) else ''
    if c == '\n':
        line += 1
    if not in_comment and in_string is None:
        if c == '/' and nx == '*':
            in_comment = True
            i += 2
            continue
        if c == '"' or c == "'":
            in_string = (c, line)
            i += 1
            continue
        if c == '{':
            in_block += 1
        elif c == '}':
            in_block -= 1
            if in_block < 0:
                issues.append(('extra close', line, content[max(0, i-40):i+40]))
                in_block = 0
    elif in_comment:
        if c == '*' and nx == '/':
            in_comment = False
            i += 2
            continue
    elif in_string is not None:
        if c == BACKSLASH:
            i += 2
            continue
        if c == in_string[0]:
            in_string = None
        elif c == '\n':
            issues.append(('unterminated string from line ' + str(in_string[1]), line, content[max(0, i-40):i+40]))
            in_string = None
    i += 1

print('final block depth:', in_block, 'in_comment:', in_comment, 'in_string:', in_string)
print('total lines:', line)
for issue in issues[:10]:
    print(issue)
