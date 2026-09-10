// Centralized API Client with JWT injection, 401 interception, error normalization, and Demo Mode Mock Dispatcher

const AUTH_TOKEN_KEY = 'neuroute_auth_token';

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
  timestamp?: string; // TODO: confirm with backend
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;
  timestamp?: string;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, string[]>, timestamp?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.timestamp = timestamp;
  }
}

export interface MockRequestContext {
  query?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

export type MockHandler<T = unknown> = (context: MockRequestContext) => Promise<T> | T;

// Internal Mock Registry used to fulfill mock responses in Demo Mode
const mockRegistry: Map<string, MockHandler<unknown>> = new Map();

/**
 * Register a mock endpoint handler for Demo Mode.
 * @param method HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param endpoint Path pattern, e.g. '/dashboard/kpis' or '/incidents'
 * @param handler Function returning mock response data
 */
export function registerMockEndpoint<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  handler: MockHandler<T>
) {
  const key = `${method.toUpperCase()}:${endpoint}`;
  mockRegistry.set(key, handler as MockHandler<unknown>);
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  public get isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO_MODE === 'true';
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private handle401Unauthorized() {
    console.warn('[ApiClient] 401 Unauthorized encountered. Clearing session...');
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('neuroute_user');
      // Redirect to login if window is available
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true';
      }
    } catch (err) {
      console.error('[ApiClient] Error handling 401:', err);
    }
  }

  private async normalizeError(response: Response): Promise<ApiError> {
    const status = response.status;
    let message = `Request failed with status ${status}`;
    let errors: Record<string, string[]> | undefined = undefined;
    let timestamp: string | undefined = undefined;

    try {
      const data = await response.json();
      if (data && typeof data === 'object') {
        message = data.message || data.error || message;
        errors = data.errors;
        timestamp = data.timestamp; // TODO: confirm with backend
      }
    } catch {
      // Body was not JSON (e.g. 502 Bad Gateway HTML)
      message = response.statusText || message;
    }

    if (status === 401) {
      this.handle401Unauthorized();
    }

    return new ApiError(message, status, errors, timestamp);
  }

  /**
   * Core request executor that transparently routes to mockRegistry in Demo Mode
   * or executes standard fetch in Live API mode.
   */
  public async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // --- DEMO / MOCK ENDPOINT EXECUTION ---
    const registryKey = `${method}:${cleanEndpoint.split('?')[0]}`;
    const mockHandler = mockRegistry.get(registryKey);
    const isAiRoute = cleanEndpoint.startsWith('/ai/');

    if (this.isDemoMode || (mockHandler && !isAiRoute)) {
      if (mockHandler) {
        // Simulate minor network jitter (150ms - 350ms) for realistic UI loading states
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 150));
        
        // Parse mock query params
        const queryParams: Record<string, string> = {};
        if (options.params) {
          Object.entries(options.params).forEach(([k, v]) => {
            if (v !== undefined) queryParams[k] = String(v);
          });
        }

        return (await mockHandler({
          query: queryParams,
          body: options.body,
          params: {},
        })) as T;
      } else if (this.isDemoMode) {
        console.warn(
          `[DemoMode] No mock handler registered for ${registryKey}. Returning empty object stub.`
        );
        return {} as T;
      }
    }

    // --- LIVE API EXECUTION ---
    let url = `${this.baseURL}${cleanEndpoint}`;

    // Query parameters
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Build headers with JWT injection
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (!options.skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Standard Bearer JWT format
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          const registryKey = `${method}:${cleanEndpoint.split('?')[0]}`;
          const mockHandler = mockRegistry.get(registryKey);
          if (mockHandler) {
            const queryParams: Record<string, string> = {};
            if (options.params) {
              Object.entries(options.params).forEach(([k, v]) => {
                if (v !== undefined) queryParams[k] = String(v);
              });
            }
            return (await mockHandler({
              query: queryParams,
              body: options.body,
              params: {},
            })) as T;
          }
        }
        throw await this.normalizeError(response);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError('Request was aborted', 0);
      }
      const registryKey = `${method}:${cleanEndpoint.split('?')[0]}`;
      const mockHandler = mockRegistry.get(registryKey);
      if (mockHandler) {
        const queryParams: Record<string, string> = {};
        if (options.params) {
          Object.entries(options.params).forEach(([k, v]) => {
            if (v !== undefined) queryParams[k] = String(v);
          });
        }
        return (await mockHandler({
          query: queryParams,
          body: options.body,
          params: {},
        })) as T;
      }
      throw new ApiError(
        err instanceof Error ? err.message : 'Network error occurred. Check connection.',
        0
      );
    }
  }

  // Convenience HTTP helpers
  public get<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  public post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  public put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PUT', endpoint, { ...options, body });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PATCH', endpoint, { ...options, body });
  }

  public delete<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
