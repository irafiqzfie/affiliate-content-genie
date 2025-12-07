/**
 * In-memory placeholder cache to avoid uploading SVGs to R2
 * This eliminates ~70% of Class A operations (based on AI generation failure rate)
 */

const placeholderCache = new Map<string, string>();

export function getPlaceholderDataUrl(keywords: string): string {
  const cacheKey = keywords.substring(0, 50);
  
  // Return cached placeholder if available
  if (placeholderCache.has(cacheKey)) {
    return placeholderCache.get(cacheKey)!;
  }
  
  // Generate SVG placeholder
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#6366f1"/>
    <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
      ${keywords.substring(0, 30)}
    </text>
  </svg>`;
  
  // Convert to data URL (no upload needed!)
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  
  // Cache for reuse
  placeholderCache.set(cacheKey, dataUrl);
  
  return dataUrl;
}

export function getErrorPlaceholderDataUrl(): string {
  const cacheKey = '__error__';
  
  if (placeholderCache.has(cacheKey)) {
    return placeholderCache.get(cacheKey)!;
  }
  
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#ef4444"/>
    <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="20" font-family="Arial">
      Image Generation Failed
    </text>
  </svg>`;
  
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  placeholderCache.set(cacheKey, dataUrl);
  
  return dataUrl;
}

// Clear cache periodically to prevent memory leaks
setInterval(() => {
  if (placeholderCache.size > 100) {
    const keysToDelete = Array.from(placeholderCache.keys()).slice(0, 50);
    keysToDelete.forEach(key => placeholderCache.delete(key));
    console.log('🧹 Cleared old placeholder cache entries');
  }
}, 60000); // Every 1 minute
