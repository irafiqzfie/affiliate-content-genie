const fs = require('fs');
const path = require('path');

console.log('🎨 Standardizing All Panel Styles to Match Post Confirmation...\n');

// Define the baseline standard from Post Confirmation Modal
const STANDARD_PANEL_STYLE = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-sm)', // 6px small rounded corners
  shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  padding: 'var(--spacing-md)', // 24px
};

console.log('📋 Baseline Standard (Post Confirmation Modal):');
console.log('  Background: var(--glass-bg)');
console.log('  Border: 1px solid var(--glass-border)');
console.log('  Border Radius: var(--radius-sm) (6px)');
console.log('  Shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3)');
console.log('  Padding: var(--spacing-md) (24px)\n');

// Files to update
const files = [
  {
    path: 'src/app/globals.css',
    type: 'css',
  },
  {
    path: 'src/app/components/ConsentModal.module.css',
    type: 'css-module',
  },
];

let totalChanges = 0;

files.forEach(({ path: filePath, type }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  console.log(`\n📄 Processing ${filePath}...`);

  if (type === 'css-module') {
    // Consent Modal Module Standardization
    
    // 1. Fix border-radius: 20px → var(--radius-sm)
    content = content.replace(
      /border-radius:\s*20px\s*!important;/g,
      'border-radius: var(--radius-sm) !important;'
    );
    
    // 2. Fix border: 1px solid rgba(255, 255, 255, 0.2) → var(--glass-border)
    content = content.replace(
      /border:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.2\)\s*!important;/g,
      'border: 1px solid var(--glass-border) !important;'
    );
    
    // 3. Fix gradient background → var(--glass-bg)
    content = content.replace(
      /background:\s*linear-gradient\(135deg,\s*rgba\(13,\s*15,\s*27,\s*0\.98\),\s*rgba\(20,\s*25,\s*40,\s*0\.98\)\)\s*!important;/g,
      'background: var(--glass-bg) !important;'
    );
    
    // 4. Fix box-shadow to standard
    content = content.replace(
      /box-shadow:\s*0\s+20px\s+60px\s+rgba\(0,\s*0,\s*0,\s*0\.5\)\s*!important;/g,
      'box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;'
    );
    
    // 5. Standardize accordion border-radius: 12px → var(--radius-sm)
    content = content.replace(
      /(\.accordionSection[\s\S]*?)border-radius:\s*12px\s*!important;/g,
      '$1border-radius: var(--radius-sm) !important;'
    );
    
    // 6. Fix nested border colors to use var(--glass-border)
    content = content.replace(
      /border:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.1\)\s*!important;/g,
      'border: 1px solid var(--glass-border) !important;'
    );
    
  } else {
    // globals.css Standardization
    
    // 1. Standardize all 2px borders to 1px for panels/cards/modals
    const panelSelectors = [
      '.form-card',
      '.output-card',
      '.scheduled-preview-card',
      '.scheduled-post-card',
      '.saved-item-card',
      '.analysis-card',
      '.video-card',
      '.image-generation-card',
      '.modal-content',
    ];
    
    // Replace 2px solid with 1px solid for panels
    content = content.replace(
      /border:\s*2px\s+solid\s+var\(--glass-border\);/g,
      'border: 1px solid var(--glass-border);'
    );
    
    content = content.replace(
      /border:\s*2px\s+solid\s+rgba\(255,\s*123,\s*0,\s*0\.3\);/g,
      'border: 1px solid var(--glass-border);'
    );
    
    // 2. Standardize all border-radius: 12px → var(--radius-sm) for consistency
    // (Keep 12px only for specific larger cards if needed, but standardize panels)
    content = content.replace(
      /border-radius:\s*var\(--radius-md\);/g,
      'border-radius: var(--radius-sm);'
    );
    
    // 3. Fix any remaining rgba border colors to use var(--glass-border)
    content = content.replace(
      /border:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.15\);/g,
      'border: 1px solid var(--glass-border);'
    );
    
    content = content.replace(
      /border:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.1\);/g,
      'border: 1px solid var(--glass-border);'
    );
    
    // 4. Standardize box-shadow for all panels
    content = content.replace(
      /box-shadow:\s*0\s+4px\s+12px\s+rgba\(0,\s*0,\s*0,\s*0\.3\);/g,
      'box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);'
    );
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath + '.backup5', originalContent);
    fs.writeFileSync(fullPath, content);
    console.log(`  ✓ Updated ${filePath}`);
    console.log(`  ✓ Backup: ${filePath}.backup5`);
    totalChanges++;
  } else {
    console.log(`  → No changes needed`);
  }
});

console.log(`\n✅ Panel Standardization Complete!`);
console.log(`📊 Files updated: ${totalChanges}`);
console.log(`\n🎯 All panels now use:`);
console.log(`  • Consistent small rounded corners (var(--radius-sm) = 6px)`);
console.log(`  • Uniform border thickness (1px solid var(--glass-border))`);
console.log(`  • Standard background (var(--glass-bg))`);
console.log(`  • Unified shadow (0 8px 32px 0 rgba(0, 0, 0, 0.3))`);
console.log(`  • Professional, cohesive design language throughout\n`);
