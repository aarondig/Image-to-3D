/**
 * Safely handles URLs to prevent rendering "undefined" or invalid URLs
 */

/**
 * Returns a safe URL for use in href/src attributes
 * Returns undefined if the URL is invalid, which prevents rendering
 */
export function safeHref(url: string | undefined | null): string | undefined {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined') {
    return undefined;
  }
  return url;
}

/**
 * Returns a safe URL or a fallback
 * Useful for image src where you want a placeholder
 */
export function safeHrefOr(url: string | undefined | null, fallback: string): string {
  const safe = safeHref(url);
  return safe || fallback;
}

/**
 * Type guard to check if a URL is valid before using it
 */
export function isValidUrl(url: unknown): url is string {
  return typeof url === 'string' && url.trim() !== '' && url !== 'undefined';
}
