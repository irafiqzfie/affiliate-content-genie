# UI Standardization Script
# This script standardizes all design elements in globals.css

$cssFile = "src/app/globals.css"
$content = Get-Content $cssFile -Raw

Write-Host "Starting UI Standardization..." -ForegroundColor Cyan

# Backup original
Copy-Item $cssFile "$cssFile.backup"

# 1. STANDARDIZE BORDER RADIUS
Write-Host "`n1. Standardizing border-radius values..." -ForegroundColor Yellow

# Replace common inconsistent border-radius values with CSS variables
$replacements = @{
    'border-radius:\s*6px' = 'border-radius: var(--radius-sm)'
    'border-radius:\s*10px' = 'border-radius: var(--radius-md)'
    'border-radius:\s*20px' = 'border-radius: var(--radius-full)'
    'border-radius:\s*16px' = 'border-radius: var(--radius-lg)'
}

foreach ($pattern in $replacements.Keys) {
    $replacement = $replacements[$pattern]
    $beforeCount = ([regex]::Matches($content, $pattern)).Count
    $content = $content -replace $pattern, $replacement
    $afterCount = ([regex]::Matches($content, $pattern)).Count
    $changed = $beforeCount - $afterCount
    if ($changed -gt 0) {
        Write-Host "  ✓ Replaced $changed instances: $pattern → $replacement" -ForegroundColor Green
    }
}

# 2. STANDARDIZE BOX SHADOWS
Write-Host "`n2. Standardizing box-shadow values..." -ForegroundColor Yellow

# Simple shadow replacements (exact matches only to avoid breaking complex shadows)
$content = $content -replace 'box-shadow:\s*0\s+1px\s+2px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.05\)', 'box-shadow: var(--shadow-xs)'
$content = $content -replace 'box-shadow:\s*0\s+2px\s+4px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.1\)', 'box-shadow: var(--shadow-sm)'
$content = $content -replace 'box-shadow:\s*0\s+4px\s+12px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.15\)', 'box-shadow: var(--shadow-md)'
$content = $content -replace 'box-shadow:\s*0\s+8px\s+24px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.25\)', 'box-shadow: var(--shadow-lg)'
Write-Host "  ✓ Standardized box-shadow values" -ForegroundColor Green

# 3. STANDARDIZE PADDING VALUES
Write-Host "`n3. Standardizing padding values..." -ForegroundColor Yellow

# Replace common padding patterns
$paddingReplacements = @{
    'padding:\s*8px' = 'padding: var(--spacing-xs)'
    'padding:\s*16px' = 'padding: var(--spacing-sm)'
    'padding:\s*24px' = 'padding: var(--spacing-md)'
    'padding:\s*32px' = 'padding: var(--spacing-lg)'
    'padding:\s*40px' = 'padding: var(--spacing-xl)'
}

foreach ($pattern in $paddingReplacements.Keys) {
    $replacement = $paddingReplacements[$pattern]
    $beforeCount = ([regex]::Matches($content, $pattern)).Count
    $content = $content -replace $pattern, $replacement
    $afterCount = ([regex]::Matches($content, $pattern)).Count
    $changed = $beforeCount - $afterCount
    if ($changed -gt 0) {
        Write-Host "  ✓ Replaced $changed instances: $pattern → $replacement" -ForegroundColor Green
    }
}

# 4. STANDARDIZE GAP VALUES
Write-Host "`n4. Standardizing gap values..." -ForegroundColor Yellow

$gapReplacements = @{
    'gap:\s*8px' = 'gap: var(--spacing-xs)'
    'gap:\s*16px' = 'gap: var(--spacing-sm)'
    'gap:\s*24px' = 'gap: var(--spacing-md)'
    'gap:\s*32px' = 'gap: var(--spacing-lg)'
}

foreach ($pattern in $gapReplacements.Keys) {
    $replacement = $gapReplacements[$pattern]
    $beforeCount = ([regex]::Matches($content, $pattern)).Count
    $content = $content -replace $pattern, $replacement
    $afterCount = ([regex]::Matches($content, $pattern)).Count
    $changed = $beforeCount - $afterCount
    if ($changed -gt 0) {
        Write-Host "  ✓ Replaced $changed instances: $pattern → $replacement" -ForegroundColor Green
    }
}

# 5. STANDARDIZE TRANSITION DURATIONS
Write-Host "`n5. Standardizing transition durations..." -ForegroundColor Yellow

$transitionReplacements = @{
    'transition:\s*all\s+0\.15s' = 'transition: all var(--transition-fast)'
    'transition:\s*all\s+0\.2s' = 'transition: all var(--transition-base)'
    'transition:\s*all\s+0\.25s' = 'transition: all var(--transition-base)'
    'transition:\s*all\s+0\.3s' = 'transition: all var(--transition-smooth)'
    'transition:\s*all\s+150ms' = 'transition: all var(--transition-fast)'
    'transition:\s*all\s+250ms' = 'transition: all var(--transition-base)'
    'transition:\s*all\s+350ms' = 'transition: all var(--transition-smooth)'
}

foreach ($pattern in $transitionReplacements.Keys) {
    $replacement = $transitionReplacements[$pattern]
    $beforeCount = ([regex]::Matches($content, $pattern)).Count
    $content = $content -replace $pattern, $replacement
    $afterCount = ([regex]::Matches($content, $pattern)).Count
    $changed = $beforeCount - $afterCount
    if ($changed -gt 0) {
        Write-Host "  ✓ Replaced $changed instances: $pattern → $replacement" -ForegroundColor Green
    }
}

# Save standardized content
$content | Set-Content $cssFile -NoNewline

Write-Host "`n✅ UI Standardization Complete!" -ForegroundColor Green
Write-Host "Backup saved as: $cssFile.backup" -ForegroundColor Cyan
Write-Host "`nPlease review the changes and run 'npm run build' to verify." -ForegroundColor Yellow
