/**
 * Client-side image caching system
 * Caches 3D model results based on image content hash
 * Prevents duplicate API calls during testing
 */

export interface CachedResult {
  taskId: string;
  modelUrl: string | null;
  imageHash: string;
  timestamp: number;
  status: 'SUCCEEDED' | 'FAILED';
}

const CACHE_KEY_PREFIX = 'image3d_cache_';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate SHA-256 hash from image data URL
 * Uses Web Crypto API for fast hashing
 */
export async function hashImageData(imageDataUrl: string): Promise<string> {
  // Extract base64 data from data URL
  const base64Data = imageDataUrl.includes(',')
    ? imageDataUrl.split(',')[1]
    : imageDataUrl;

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Save result to localStorage cache
 */
export function cacheResult(imageHash: string, result: Omit<CachedResult, 'imageHash' | 'timestamp'>): void {
  try {
    const cacheKey = CACHE_KEY_PREFIX + imageHash;
    const cachedData: CachedResult = {
      ...result,
      imageHash,
      timestamp: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    console.log('📦 [CACHE] Saved result for hash:', imageHash.substring(0, 16) + '...');
  } catch (error) {
    console.warn('Failed to cache result:', error);
  }
}

/**
 * Get cached result from localStorage
 * Returns null if not found or expired
 */
export function getCachedResult(imageHash: string): CachedResult | null {
  try {
    const cacheKey = CACHE_KEY_PREFIX + imageHash;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const data: CachedResult = JSON.parse(cached);

    // Check if cache is expired
    const age = Date.now() - data.timestamp;
    if (age > CACHE_DURATION_MS) {
      console.log('🗑️ [CACHE] Expired cache for hash:', imageHash.substring(0, 16) + '...');
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log('✅ [CACHE] Found cached result for hash:', imageHash.substring(0, 16) + '...');
    return data;
  } catch (error) {
    console.warn('Failed to get cached result:', error);
    return null;
  }
}

/**
 * Clear all cached results
 */
export function clearCache(): void {
  try {
    const keys = Object.keys(localStorage);
    let cleared = 0;

    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
        cleared++;
      }
    }

    console.log(`🗑️ [CACHE] Cleared ${cleared} cached results`);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; totalSizeKB: number } {
  try {
    const keys = Object.keys(localStorage);
    let count = 0;
    let totalSize = 0;

    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        count++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }

    return {
      count,
      totalSizeKB: Math.round(totalSize / 1024),
    };
  } catch (error) {
    return { count: 0, totalSizeKB: 0 };
  }
}
