import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    # extremely naive parsing just for <div>s and <Component>s
    # skip single line comments
    if line.strip().startswith('//'): continue
    
    tags = re.findall(r'</?([A-Za-z0-9_-]+)(?:>|\s+[^>]*>)', line)
    for t in tags:
        if t.startswith('/'):
            depth -= 1
            print(f"Line {i+1}: <{t}> (depth {depth})")
        else:
            depth += 1
            print(f"Line {i+1}: <{t}> (depth {depth})")

