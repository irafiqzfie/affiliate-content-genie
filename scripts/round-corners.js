const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

console.log('🔄 Rounding Sharp Corners...\n');

// Backup
fs.writeFileSync(cssPath + '.backup4', content);
console.log('✓ Backup created: globals.css.backup4\n');

let totalReplacements = 0;

// Replace border-radius: 0; with border-radius: var(--radius-sm);
console.log('1. Converting sharp corners to small rounded corners...');

// Match "border-radius: 0;" or "border-radius: 0px;" but not compound values like "0 8px 8px 0"
const pattern = /border-radius:\s*0(?:px)?;(?!\s*\/)/g;
const matches = (content.match(pattern) || []).length;

if (matches > 0) {
  content = content.replace(pattern, 'border-radius: var(--radius-sm);');
  console.log(`  ✓ ${matches} replacements: border-radius: 0 → var(--radius-sm) (6px)`);
  totalReplacements += matches;
}

// Save
fs.writeFileSync(cssPath, content);

console.log(`\n✅ Sharp Corners Rounded!`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`💾 Backup: globals.css.backup4`);
console.log(`\n🎨 All sharp edges now have small rounded corners (6px)`);
