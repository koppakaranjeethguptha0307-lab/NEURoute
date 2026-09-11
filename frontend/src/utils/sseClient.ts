/**
 * NEURote — Resilient Managed Server-Sent Events (SSE) Client
 * Prevents browser console error flooding (ERR_CONNECTION_REFUSED) during backend offline/reconnection
 */

type EventCallback = (data: any) => void;

class ResilientSSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Set<EventCallback> = new Set();
  private reconnectTimeout: number | null = null;
  private isConnecting: boolean = false;
  private consecutiveFailures: number = 0;
  private url: string;

  constructor() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.url = `${cleanBase}/events/stream`;
  }

  public subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    if (this.listeners.size === 1) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect() {
    if (this.eventSource || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.consecutiveFailures = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach((listener) => {
            try {
              listener(parsed);
            } catch (err) {
              // Ignore listener errors
            }
          });
        } catch (_) {}
      };

      this.eventSource.onerror = () => {
        // CLOSE immediately to stop browser native frantic 1-second auto-retry loop
        // which floods the console with net::ERR_CONNECTION_REFUSED
        this.disconnect();

        this.consecutiveFailures++;
        // Exponential backoff: 8s, 16s, max 30s
        const backoffMs = Math.min(30000, 8000 * Math.pow(1.5, Math.min(this.consecutiveFailures, 4)));

        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }

        if (this.listeners.size > 0) {
          this.reconnectTimeout = window.setTimeout(() => {
            this.connect();
          }, backoffMs);
        }
      };
    } catch (_) {
      this.isConnecting = false;
    }
  }

  private disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }
}

export const sseClient = new ResilientSSEClient();
