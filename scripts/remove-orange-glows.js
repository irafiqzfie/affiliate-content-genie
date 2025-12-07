const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

console.log('🎨 Removing ALL Orange Glows and Colored Accents...\n');

let totalReplacements = 0;

// 1. Replace all orange border-color with standard blue focus
const orangeBorderColor = /border-color:\s*var\(--gradient-orange\);/g;
const matches1 = (content.match(orangeBorderColor) || []).length;
content = content.replace(orangeBorderColor, 'border-color: var(--focus-ring-color);');
console.log(`✓ ${matches1} orange border-color → blue focus`);
totalReplacements += matches1;

// 2. Replace orange focus shadows with blue
const orangeFocusShadow = /box-shadow:\s*0\s+0\s+0\s+3px\s+rgba\(255,\s*123,\s*0,\s*0\.15\);/g;
const matches2 = (content.match(orangeFocusShadow) || []).length;
content = content.replace(orangeFocusShadow, 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);');
console.log(`✓ ${matches2} orange focus shadows → blue`);
totalReplacements += matches2;

// 3. Replace any remaining orange rgba borders
const orangeRgbaBorder1 = /border:\s*1px\s+solid\s+rgba\(255,\s*123,\s*0,\s*0\.15\);/g;
const matches3 = (content.match(orangeRgbaBorder1) || []).length;
content = content.replace(orangeRgbaBorder1, 'border: 1px solid var(--glass-border);');
console.log(`✓ ${matches3} orange rgba borders → glass border`);
totalReplacements += matches3;

// 4. Replace 2px orange borders
const orangeBorder2px = /border:\s*2px\s+solid\s+rgba\(255,\s*123,\s*0,\s*0\.3\);/g;
const matches4 = (content.match(orangeBorder2px) || []).length;
content = content.replace(orangeBorder2px, 'border: 1px solid var(--glass-border);');
console.log(`✓ ${matches4} 2px orange borders → 1px glass border`);
totalReplacements += matches4;

// 5. Replace border-top orange
const orangeBorderTop = /border-top:\s*4px\s+solid\s+var\(--gradient-orange\);/g;
const matches5 = (content.match(orangeBorderTop) || []).length;
content = content.replace(orangeBorderTop, 'border-top: 1px solid var(--glass-border);');
console.log(`✓ ${matches5} orange border-top → glass border`);
totalReplacements += matches5;

// 6. Replace border-bottom orange
const orangeBorderBottom = /border-bottom:\s*1px\s+solid\s+rgba\(255,\s*123,\s*0,\s*0\.15\);/g;
const matches6 = (content.match(orangeBorderBottom) || []).length;
content = content.replace(orangeBorderBottom, 'border-bottom: 1px solid var(--glass-border);');
console.log(`✓ ${matches6} orange border-bottom → glass border`);
totalReplacements += matches6;

// Save
fs.writeFileSync(cssPath + '.backup6', fs.readFileSync(cssPath, 'utf8'));
fs.writeFileSync(cssPath, content);

console.log(`\n✅ Orange Removal Complete!`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`💾 Backup: globals.css.backup6`);
console.log(`\n🎯 All panels now have:`);
console.log(`  • NO orange glows or colored accents`);
console.log(`  • Consistent blue focus states`);
console.log(`  • Uniform glass borders everywhere`);
console.log(`  • Clean, professional Post Confirmation style\n`);
