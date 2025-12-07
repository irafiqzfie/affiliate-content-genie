const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

console.log('🎨 Starting CSS Standardization...\n');

// Backup original
fs.writeFileSync(cssPath + '.backup', content);
console.log('✓ Backup created: globals.css.backup\n');

let totalReplacements = 0;

// 1. BORDER RADIUS STANDARDIZATION
console.log('1. Standardizing border-radius values...');
const borderRadiusReplacements = [
  { pattern: /border-radius:\s*6px(?!\s*\d)/g, value: 'border-radius: var(--radius-sm)', desc: '6px → --radius-sm' },
  { pattern: /border-radius:\s*10px(?!\s*\d)/g, value: 'border-radius: var(--radius-md)', desc: '10px → --radius-md' },
  { pattern: /border-radius:\s*16px(?!\s*\d)/g, value: 'border-radius: var(--radius-lg)', desc: '16px → --radius-lg' },
  { pattern: /border-radius:\s*20px(?!\s*\d)/g, value: 'border-radius: var(--radius-full)', desc: '20px → --radius-full' },
];

borderRadiusReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 2. PADDING STANDARDIZATION (single value)
console.log('\n2. Standardizing padding values...');
const paddingReplacements = [
  { pattern: /padding:\s*8px;/g, value: 'padding: var(--spacing-xs);', desc: '8px → --spacing-xs' },
  { pattern: /padding:\s*16px;/g, value: 'padding: var(--spacing-sm);', desc: '16px → --spacing-sm' },
  { pattern: /padding:\s*24px;/g, value: 'padding: var(--spacing-md);', desc: '24px → --spacing-md' },
  { pattern: /padding:\s*32px;/g, value: 'padding: var(--spacing-lg);', desc: '32px → --spacing-lg' },
  { pattern: /padding:\s*40px;/g, value: 'padding: var(--spacing-xl);', desc: '40px → --spacing-xl' },
];

paddingReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 3. GAP STANDARDIZATION
console.log('\n3. Standardizing gap values...');
const gapReplacements = [
  { pattern: /gap:\s*8px;/g, value: 'gap: var(--spacing-xs);', desc: '8px → --spacing-xs' },
  { pattern: /gap:\s*16px;/g, value: 'gap: var(--spacing-sm);', desc: '16px → --spacing-sm' },
  { pattern: /gap:\s*24px;/g, value: 'gap: var(--spacing-md);', desc: '24px → --spacing-md' },
  { pattern: /gap:\s*32px;/g, value: 'gap: var(--spacing-lg);', desc: '32px → --spacing-lg' },
];

gapReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 4. MARGIN STANDARDIZATION (single value)
console.log('\n4. Standardizing margin values...');
const marginReplacements = [
  { pattern: /margin:\s*8px;/g, value: 'margin: var(--spacing-xs);', desc: '8px → --spacing-xs' },
  { pattern: /margin:\s*16px;/g, value: 'margin: var(--spacing-sm);', desc: '16px → --spacing-sm' },
  { pattern: /margin:\s*24px;/g, value: 'margin: var(--spacing-md);', desc: '24px → --spacing-md' },
  { pattern: /margin:\s*32px;/g, value: 'margin: var(--spacing-lg);', desc: '32px → --spacing-lg' },
];

marginReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 5. TRANSITION STANDARDIZATION
console.log('\n5. Standardizing transition durations...');
const transitionReplacements = [
  { pattern: /transition:\s*all\s+0\.15s\b/g, value: 'transition: all var(--transition-fast)', desc: '0.15s → --transition-fast' },
  { pattern: /transition:\s*all\s+150ms\b/g, value: 'transition: all var(--transition-fast)', desc: '150ms → --transition-fast' },
  { pattern: /transition:\s*all\s+0\.2s\b/g, value: 'transition: all var(--transition-base)', desc: '0.2s → --transition-base' },
  { pattern: /transition:\s*all\s+0\.25s\b/g, value: 'transition: all var(--transition-base)', desc: '0.25s → --transition-base' },
  { pattern: /transition:\s*all\s+250ms\b/g, value: 'transition: all var(--transition-base)', desc: '250ms → --transition-base' },
  { pattern: /transition:\s*all\s+0\.3s\b/g, value: 'transition: all var(--transition-smooth)', desc: '0.3s → --transition-smooth' },
  { pattern: /transition:\s*all\s+350ms\b/g, value: 'transition: all var(--transition-smooth)', desc: '350ms → --transition-smooth' },
];

transitionReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// Save standardized content
fs.writeFileSync(cssPath, content);

console.log(`\n✅ CSS Standardization Complete!`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`💾 Backup: globals.css.backup`);
console.log(`\n⚠️  Please run 'npm run build' to verify the changes.`);
