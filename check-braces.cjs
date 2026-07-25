const fs = require('fs');

function braceCheck(file) {
  const s = fs.readFileSync(file, 'utf8');
  let braces = 0;
  let inStr = null;
  let escape = false;
  let line = 1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\n') line++;
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') braces++;
    if (ch === '}') {
      braces--;
      if (braces < 0) console.log(file, 'negative at', line);
    }
  }
  console.log(file, 'final braces', braces, 'lines', line);
}

braceCheck('src/components/AmountInput.test.tsx');

// Show last 30 lines with numbers
const lines = fs.readFileSync('src/components/AmountInput.test.tsx', 'utf8').split(/\n/);
lines.slice(-40).forEach((l, i) => console.log(String(lines.length - 40 + i + 1).padStart(4), l));
