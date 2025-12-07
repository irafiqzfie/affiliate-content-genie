const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

console.log('🎨 Phase 3: Font Size Standardization...\n');

// Backup
fs.writeFileSync(cssPath + '.backup3', content);
console.log('✓ Backup created: globals.css.backup3\n');

let totalReplacements = 0;

// FONT SIZE STANDARDIZATION
console.log('1. Standardizing font-size values...');

// Map common font sizes to CSS variables
// --font-size-xs: 0.75rem (12px)
// --font-size-sm: 0.875rem (14px)
// --font-size-base: 1rem (16px)
// --font-size-lg: 1.125rem (18px)
// --font-size-xl: 1.25rem (20px)

const fontSizeReplacements = [
  { pattern: /font-size:\s*0\.75rem;/g, value: 'font-size: var(--font-size-xs);', desc: '0.75rem → --font-size-xs' },
  { pattern: /font-size:\s*0\.875rem;/g, value: 'font-size: var(--font-size-sm);', desc: '0.875rem → --font-size-sm' },
  { pattern: /font-size:\s*1rem;/g, value: 'font-size: var(--font-size-base);', desc: '1rem → --font-size-base' },
  { pattern: /font-size:\s*1\.125rem;/g, value: 'font-size: var(--font-size-lg);', desc: '1.125rem → --font-size-lg' },
  { pattern: /font-size:\s*1\.25rem;/g, value: 'font-size: var(--font-size-xl);', desc: '1.25rem → --font-size-xl' },
  { pattern: /font-size:\s*14px;/g, value: 'font-size: var(--font-size-sm);', desc: '14px → --font-size-sm' },
];

fontSizeReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// Save
fs.writeFileSync(cssPath, content);

console.log(`\n✅ Phase 3 Complete!`);
console.log(`📊 Total font-size replacements: ${totalReplacements}`);
console.log(`💾 Backup: globals.css.backup3`);
console.log(`\n📋 Summary of all phases:`);
console.log(`  Phase 1: 90 replacements (border-radius, padding, gap, transitions)`);
console.log(`  Phase 2: 217 replacements (rem spacing, border-radius)`);
console.log(`  Phase 3: ${totalReplacements} replacements (font-size)`);
console.log(`  Total: ${90 + 217 + totalReplacements} standardized values`);
