const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

let depth = 0;
let lines = content.split('\n');

// very primitive tag counting
let tagRegex = /<\/?([a-zA-Z0-9]+)(>|\s+[^>]*>)/g;

for (let i = 490; i < lines.length; i++) {
  let line = lines[i];
  // skip comments and simple self closing tags for basic check
  if (line.trim().startsWith('//')) continue;
  
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
     let tag = match[0];
     if (tag.startsWith('</')) {
        depth--;
        console.log(`Line ${i+1}: ${tag} (depth ${depth})`);
     } else if (!tag.endsWith('/>')) {
        depth++;
        console.log(`Line ${i+1}: ${tag} (depth ${depth})`);
     }
  }
}
