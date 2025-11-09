/**
 * Utility functions for content parsing and manipulation
 */

/**
 * Parse content sections from AI-generated text
 * @param text - Raw text from AI
 * @param keyMap - Mapping of headers to keys
 * @returns Parsed content object
 */
export function parseContent(
  text: string,
  keyMap: Record<string, string>
): Record<string, string[]> {
  const lines = text.split('\n');
  const parsed: Record<string, string[]> = {};
  let currentKey: string | null = null;
  let currentBlock: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    let matched = false;

    for (const [header, key] of Object.entries(keyMap)) {
      if (trimmed.startsWith(header)) {
        if (currentKey) {
          parsed[currentKey] = currentBlock;
        }
        currentKey = key;
        currentBlock = [];
        matched = true;
        break;
      }
    }

    if (!matched && currentKey && trimmed) {
      currentBlock.push(trimmed);
    }
  });

  if (currentKey) {
    parsed[currentKey] = currentBlock;
  }

  return parsed;
}

/**
 * Reconstruct content from parsed sections
 * @param parsed - Parsed content object
 * @param keyMap - Mapping of headers to keys (reversed)
 * @returns Reconstructed text
 */
export function reconstructContent(
  parsed: Record<string, string[]>,
  keyMap: Record<string, string>
): string {
  const reverseMap: Record<string, string> = {};
  for (const [header, key] of Object.entries(keyMap)) {
    reverseMap[key] = header;
  }

  let result = '';
  for (const [key, lines] of Object.entries(parsed)) {
    if (lines && lines.length > 0) {
      const header = reverseMap[key];
      if (header) {
        result += `${header}\n`;
        result += lines.join('\n') + '\n\n';
      }
    }
  }

  return result.trim();
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Download text as a file
 * @param content - Content to download
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 */
export function downloadAsFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date to readable string
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Extract error message from unknown error type
 * @param err - Unknown error object
 * @returns Error message string or null
 */
export function extractErrorMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const maybeMsg = (err as { message: unknown }).message;
    if (typeof maybeMsg === 'string') return maybeMsg;
  }
  return null;
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Count words in text
 * @param text - Text to count
 * @returns Word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
