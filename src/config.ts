export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  maxImageBytes: 2 * 1024 * 1024, // 2MB
  maxImageDimension: 768,
  pollIntervalMs: 5000,
};
