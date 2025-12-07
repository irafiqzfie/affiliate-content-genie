const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

console.log('🎨 Converting all --border-radius to --radius-sm for 6px consistency...\n');

// Replace all var(--border-radius) with var(--radius-sm)
const pattern = /border-radius:\s*var\(--border-radius\);/g;
const matches = (content.match(pattern) || []).length;

content = content.replace(pattern, 'border-radius: var(--radius-sm);');

// Save
fs.writeFileSync(cssPath + '.backup7', fs.readFileSync(cssPath, 'utf8'));
fs.writeFileSync(cssPath, content);

console.log(`✓ ${matches} instances: var(--border-radius) → var(--radius-sm)`);
console.log(`\n✅ Complete!`);
console.log(`📊 All border-radius now use var(--radius-sm) (6px)`);
console.log(`💾 Backup: globals.css.backup7\n`);
