/**
 * Utility to resolve and normalize the NEURoute API base URL for development and production.
 * Ensures consistent target endpoint construction regardless of environment variable format.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  
  if (!envUrl || envUrl.trim() === '' || envUrl.trim() === '/') {
    return '/api/v1';
  }

  let cleanUrl = envUrl.trim().replace(/\/+$/, '');

  // Strip trailing /auth or /login if erroneously appended in environment variable
  cleanUrl = cleanUrl.replace(/\/auth$/, '').replace(/\/login$/, '');

  // Normalize path suffixes:
  // 1. If it ends with /api/v1, return as is.
  // 2. If it ends with /api, append /v1.
  // 3. If it is relative (starts with /), ensure /api/v1 prefix.
  // 4. If absolute URL, append /api/v1.
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  } else if (cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/v1`;
  } else if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return `${cleanUrl}/api/v1`;
  } else if (cleanUrl.startsWith('/')) {
    return cleanUrl.startsWith('/api') ? '/api/v1' : `/api/v1${cleanUrl}`;
  }

  return cleanUrl;
}

export default getApiBaseUrl;
