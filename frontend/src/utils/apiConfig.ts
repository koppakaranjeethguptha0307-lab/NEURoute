/**
 * Utility to resolve and normalize the NEURoute API base URL for development and production.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  
  if (!envUrl) {
    return '/api/v1';
  }

  // Trim trailing slashes
  let cleanUrl = envUrl.trim().replace(/\/+$/, '');

  // If the user specified a domain (e.g., https://neuroute-backend.onrender.com) without /api/v1, append it
  if (!cleanUrl.endsWith('/api/v1') && !cleanUrl.endsWith('/api/v1/')) {
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      cleanUrl = `${cleanUrl}/api/v1`;
    }
  }

  return cleanUrl;
}

export default getApiBaseUrl;
