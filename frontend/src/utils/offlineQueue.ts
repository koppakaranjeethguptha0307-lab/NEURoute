/**
 * NEURoute — Offline Field Report Queue & Auto-Synchronization Utility
 * Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
 * 
 * Provides local-first, resilient offline buffering for emergency field officers,
 * SDRF responders, and transit operators in low-connectivity mountain terrains.
 * Automatically synchronizes with /api/v1/incidents/field-reports/sync upon reconnection.
 */

import { getApiBaseUrl } from '@/utils/apiConfig';

export interface OfflineFieldReport {
  client_report_uuid: string;
  title: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  captured_at: string;
  photo_reference?: string;
  photos?: string[];
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  error_message?: string;
  created_at: number;
}

export interface SyncStats {
  isOnline: boolean;
  pendingCount: number;
  totalBuffered: number;
  lastSyncAt: string | null;
  syncInProgress: boolean;
}

const STORAGE_KEY = 'neuroute_offline_field_reports';
const LAST_SYNC_KEY = 'neuroute_last_sync_timestamp';

type Listener = (stats: SyncStats) => void;
const listeners: Set<Listener> = new Set();

let isSyncing = false;

// Generate RFC4122 compliant UUID v4
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let _simulatedOffline = false;

export function setSimulatedOffline(offline: boolean): void {
  _simulatedOffline = offline;
  notifyListeners();
}

export function isSimulatedOffline(): boolean {
  return _simulatedOffline;
}

export function isOnline(): boolean {
  if (_simulatedOffline) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}


export function getOfflineReports(): OfflineFieldReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('[OfflineQueue] Failed to parse local storage reports:', err);
    return [];
  }
}

function saveOfflineReports(reports: OfflineFieldReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    notifyListeners();
  } catch (err) {
    console.error('[OfflineQueue] Failed to save reports to local storage:', err);
  }
}

export function getPendingReports(): OfflineFieldReport[] {
  return getOfflineReports().filter((r) => r.sync_status === 'PENDING' || r.sync_status === 'FAILED');
}

export function getPendingCount(): number {
  return getPendingReports().length;
}

export function getSyncStats(): SyncStats {
  const all = getOfflineReports();
  const pending = all.filter((r) => r.sync_status === 'PENDING' || r.sync_status === 'FAILED').length;
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);

  return {
    isOnline: isOnline(),
    pendingCount: pending,
    totalBuffered: all.length,
    lastSyncAt: lastSync,
    syncInProgress: isSyncing,
  };
}

function notifyListeners(): void {
  const stats = getSyncStats();
  listeners.forEach((listener) => {
    try {
      listener(stats);
    } catch (e) {
      console.error('[OfflineQueue] Listener error:', e);
    }
  });
}

export function subscribeSyncStats(listener: Listener): () => void {
  listeners.add(listener);
  listener(getSyncStats());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Save report to local storage queue.
 */
export function enqueueOfflineReport(data: {
  title: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  latitude: number;
  longitude: number;
  photo_reference?: string;
  photos?: string[];
}): OfflineFieldReport {
  const now = new Date();
  const newReport: OfflineFieldReport = {
    client_report_uuid: generateUUID(),
    title: data.title || `${data.category} incident at (${data.latitude.toFixed(3)}, ${data.longitude.toFixed(3)})`,
    category: data.category.toUpperCase(),
    severity: data.severity || 'MEDIUM',
    description: data.description || 'Reported via field officer mobile terminal',
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: now.toISOString(),
    captured_at: now.toISOString(),
    photo_reference: data.photo_reference,
    photos: data.photos || (data.photo_reference ? [data.photo_reference] : []),
    sync_status: 'PENDING',
    created_at: Date.now(),
  };

  const existing = getOfflineReports();
  // Prevent duplicate UUID insertion
  if (!existing.some((r) => r.client_report_uuid === newReport.client_report_uuid)) {
    existing.unshift(newReport);
    saveOfflineReports(existing);
  }

  return newReport;
}

/**
 * Synchronize all pending offline field reports with the real backend.
 * Idempotently posts batch to /api/v1/incidents/field-reports/sync.
 */
export async function synchronizePendingQueue(): Promise<{
  syncedCount: number;
  failedCount: number;
  error?: string;
}> {
  if (isSyncing) {
    return { syncedCount: 0, failedCount: 0 };
  }

  if (!isOnline()) {
    return { syncedCount: 0, failedCount: getPendingCount(), error: 'Client is offline' };
  }

  const reports = getOfflineReports();
  const pending = reports.filter((r) => r.sync_status === 'PENDING' || r.sync_status === 'FAILED');

  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  notifyListeners();

  try {
    // Format according to FieldReportSync backend schema
    const payload = pending.map((r) => ({
      client_report_uuid: r.client_report_uuid,
      title: r.title,
      category: r.category,
      severity: r.severity,
      description: r.description,
      latitude: r.latitude,
      longitude: r.longitude,
      captured_at: r.captured_at,
      photos: r.photos || [],
    }));

    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/incidents/field-reports/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Mark all pending as SYNCED
      const updatedReports = reports.map((r) => {
        if (pending.some((p) => p.client_report_uuid === r.client_report_uuid)) {
          return { ...r, sync_status: 'SYNCED' as const, error_message: undefined };
        }
        return r;
      });

      saveOfflineReports(updatedReports);
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      return { syncedCount: pending.length, failedCount: 0 };
    } else {
      const errorText = await response.text();
      const updatedReports = reports.map((r) => {
        if (pending.some((p) => p.client_report_uuid === r.client_report_uuid)) {
          return { ...r, sync_status: 'FAILED' as const, error_message: `HTTP ${response.status}: ${errorText.substring(0, 100)}` };
        }
        return r;
      });
      saveOfflineReports(updatedReports);
      return { syncedCount: 0, failedCount: pending.length, error: `Sync failed with status ${response.status}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error during sync';
    const updatedReports = reports.map((r) => {
      if (pending.some((p) => p.client_report_uuid === r.client_report_uuid)) {
        return { ...r, sync_status: 'FAILED' as const, error_message: msg };
      }
      return r;
    });
    saveOfflineReports(updatedReports);
    return { syncedCount: 0, failedCount: pending.length, error: msg };
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}

/**
 * Unified Submission: Submits to live backend when online; automatically falls back
 * to local offline queue when network is unavailable.
 */
export async function submitFieldReport(data: {
  title: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  latitude: number;
  longitude: number;
  photo_reference?: string;
  photos?: string[];
}): Promise<{
  success: boolean;
  isOffline: boolean;
  queued: boolean;
  reportUuid: string;
  incident?: unknown;
}> {
  // If definitely offline, queue immediately
  if (!isOnline()) {
    const queued = enqueueOfflineReport(data);
    return {
      success: true,
      isOffline: true,
      queued: true,
      reportUuid: queued.client_report_uuid,
    };
  }

  // If online, attempt direct submission to /api/v1/incidents
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        category: data.category.toUpperCase(),
        severity: data.severity,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
      }),
    });

    if (response.ok) {
      const createdIncident = await response.json();
      return {
        success: true,
        isOffline: false,
        queued: false,
        reportUuid: generateUUID(),
        incident: createdIncident,
      };
    } else {
      // If server error or offline drop, queue locally
      const queued = enqueueOfflineReport(data);
      return {
        success: true,
        isOffline: true,
        queued: true,
        reportUuid: queued.client_report_uuid,
      };
    }
  } catch (err) {
    console.warn('[OfflineQueue] Live submission failed. Buffering in offline queue:', err);
    const queued = enqueueOfflineReport(data);
    return {
      success: true,
      isOffline: true,
      queued: true,
      reportUuid: queued.client_report_uuid,
    };
  }
}

// Set up automatic reconnection listeners in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[OfflineQueue] Connection restored! Triggering automatic synchronization...');
    notifyListeners();
    synchronizePendingQueue().then((res) => {
      if (res.syncedCount > 0) {
        console.info(`[OfflineQueue] Successfully synchronized ${res.syncedCount} buffered field reports to backend.`);
      }
    });
  });

  window.addEventListener('offline', () => {
    console.warn('[OfflineQueue] Connection lost. Operating in offline buffered mode.');
    notifyListeners();
  });
}
