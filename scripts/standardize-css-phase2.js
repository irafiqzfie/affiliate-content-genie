const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

console.log('🎨 Phase 2: Advanced CSS Standardization...\n');

// Backup
fs.writeFileSync(cssPath + '.backup2', content);
console.log('✓ Backup created: globals.css.backup2\n');

let totalReplacements = 0;

// 1. REM-BASED SPACING STANDARDIZATION
console.log('1. Standardizing rem-based spacing values...');

// Map rem values to CSS variables
// 0.5rem = 8px, 1rem = 16px, 1.5rem = 24px, 2rem = 32px, 2.5rem = 40px
const remReplacements = [
  // Gap values
  { pattern: /gap:\s*0\.5rem;/g, value: 'gap: var(--spacing-xs);', desc: 'gap: 0.5rem → --spacing-xs' },
  { pattern: /gap:\s*1rem;/g, value: 'gap: var(--spacing-sm);', desc: 'gap: 1rem → --spacing-sm' },
  { pattern: /gap:\s*1\.5rem;/g, value: 'gap: var(--spacing-md);', desc: 'gap: 1.5rem → --spacing-md' },
  { pattern: /gap:\s*2rem;/g, value: 'gap: var(--spacing-lg);', desc: 'gap: 2rem → --spacing-lg' },
  { pattern: /gap:\s*2\.5rem;/g, value: 'gap: var(--spacing-xl);', desc: 'gap: 2.5rem → --spacing-xl' },
  
  // Single padding values
  { pattern: /padding:\s*0\.5rem;/g, value: 'padding: var(--spacing-xs);', desc: 'padding: 0.5rem → --spacing-xs' },
  { pattern: /padding:\s*1rem;/g, value: 'padding: var(--spacing-sm);', desc: 'padding: 1rem → --spacing-sm' },
  { pattern: /padding:\s*1\.5rem;/g, value: 'padding: var(--spacing-md);', desc: 'padding: 1.5rem → --spacing-md' },
  { pattern: /padding:\s*2rem;/g, value: 'padding: var(--spacing-lg);', desc: 'padding: 2rem → --spacing-lg' },
  { pattern: /padding:\s*2\.5rem;/g, value: 'padding: var(--spacing-xl);', desc: 'padding: 2.5rem → --spacing-xl' },
  
  // Single margin values
  { pattern: /margin:\s*0\.5rem;/g, value: 'margin: var(--spacing-xs);', desc: 'margin: 0.5rem → --spacing-xs' },
  { pattern: /margin:\s*1rem;/g, value: 'margin: var(--spacing-sm);', desc: 'margin: 1rem → --spacing-sm' },
  { pattern: /margin:\s*1\.5rem;/g, value: 'margin: var(--spacing-md);', desc: 'margin: 1.5rem → --spacing-md' },
  { pattern: /margin:\s*2rem;/g, value: 'margin: var(--spacing-lg);', desc: 'margin: 2rem → --spacing-lg' },
];

remReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 2. STANDARDIZE WIDTH/HEIGHT PROPERTIES WITH PX
console.log('\n2. Standardizing common px-based dimensions...');

const pxDimensionReplacements = [
  { pattern: /min-height:\s*8px;/g, value: 'min-height: var(--spacing-xs);', desc: 'min-height: 8px → --spacing-xs' },
  { pattern: /min-height:\s*16px;/g, value: 'min-height: var(--spacing-sm);', desc: 'min-height: 16px → --spacing-sm' },
  { pattern: /min-height:\s*24px;/g, value: 'min-height: var(--spacing-md);', desc: 'min-height: 24px → --spacing-md' },
  { pattern: /min-height:\s*32px;/g, value: 'min-height: var(--spacing-lg);', desc: 'min-height: 32px → --spacing-lg' },
  { pattern: /min-height:\s*40px;/g, value: 'min-height: var(--spacing-xl);', desc: 'min-height: 40px → --spacing-xl' },
];

pxDimensionReplacements.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 3. STANDARDIZE BORDER RADIUS WITH 8PX (most common)
console.log('\n3. Standardizing 8px border-radius (most common value)...');

const borderRadius8px = [
  { pattern: /border-radius:\s*8px(?!\s*\d)/g, value: 'border-radius: var(--border-radius)', desc: '8px → --border-radius (8px)' },
];

borderRadius8px.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// 4. STANDARDIZE 12PX BORDER RADIUS
console.log('\n4. Standardizing 12px border-radius...');

const borderRadius12px = [
  { pattern: /border-radius:\s*12px(?!\s*\d)/g, value: 'border-radius: var(--radius-md)', desc: '12px → --radius-md' },
];

borderRadius12px.forEach(({ pattern, value, desc }) => {
  const matches = (content.match(pattern) || []).length;
  if (matches > 0) {
    content = content.replace(pattern, value);
    console.log(`  ✓ ${matches} replacements: ${desc}`);
    totalReplacements += matches;
  }
});

// Save
fs.writeFileSync(cssPath, content);

console.log(`\n✅ Phase 2 Complete!`);
console.log(`📊 Total additional replacements: ${totalReplacements}`);
console.log(`💾 Backup: globals.css.backup2`);
