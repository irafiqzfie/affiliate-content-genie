/**
 * Image Generation Utility
 * 
 * Prevents redundant image generation API calls by:
 * - Checking for existing image URLs before regenerating
 * - Implementing idempotency guards
 * - Using memoization for image URL lookups
 */

/**
 * Guard to prevent regeneration if imageUrl already exists
 * Returns true if we should skip generation and use existing image
 */
export function shouldSkipImageGeneration(existingImageUrl: string | null | undefined): boolean {
  return !!(existingImageUrl && existingImageUrl.trim().length > 0);
}

/**
 * Validate if an image URL is a valid data URL or external URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if it's a data URL
  if (url.startsWith('data:image/')) return true;
  
  // Check if it's a valid external URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract image metadata for logging/telemetry
 */
export function extractImageMetadata(imageUrl: string) {
  return {
    isDataUrl: imageUrl.startsWith('data:'),
    isPlaceholder: imageUrl.includes('placeholder') || imageUrl.includes('data:'),
    mimeType: imageUrl.startsWith('data:') 
      ? imageUrl.match(/data:(image\/\w+)/)?.[1] 
      : 'external',
    size: imageUrl.length
  };
}

/**
 * Create an idempotency key for image generation
 * Based on product analysis to prevent duplicate generations
 */
export function createImageIdempotencyKey(
  userId: string,
  productLink: string,
  conditionImageHash?: string
): string {
  // Simple hash combining user + product + condition image
  const components = [userId, productLink, conditionImageHash || 'no-image'].join('::');
  return btoa(components).slice(0, 32); // Base64 encode and truncate
}

/**
 * Log image generation telemetry
 */
export function logImageGenerationTelemetry(
  event: 'generation_started' | 'generation_skipped' | 'generation_completed' | 'generation_failed',
  data: {
    key: string;
    hasExistingUrl?: boolean;
    prompt?: string;
    error?: string;
    duration?: number;
  }
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...data
  };
  
  // In production, this would send to analytics service
  console.log(`📊 [Image Generation Telemetry] ${event}:`, logEntry);
}
