// For production: Leave VITE_API_BASE_URL unset to use relative API paths
// For local dev: Set VITE_API_BASE_URL=http://localhost:5173 in .env.local
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  maxImageBytes: 10 * 1024 * 1024,
  maxImageDimension: 1024,
  pollIntervalMs: 5000,
};
