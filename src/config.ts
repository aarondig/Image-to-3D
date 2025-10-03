export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '', // Empty string for production (relative paths)
  maxImageBytes: 10 * 1024 * 1024, // 10MB (increased for high-res photos)
  maxImageDimension: 1024, // Increased to 1024px for better quality
  pollIntervalMs: 5000,
};
