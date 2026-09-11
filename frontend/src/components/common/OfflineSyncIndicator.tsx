import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  SyncStats,
  getSyncStats,
  subscribeSyncStats,
  synchronizePendingQueue,
} from '@/utils/offlineQueue';

export const OfflineSyncIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [stats, setStats] = useState<SyncStats>(getSyncStats());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSyncStats((newStats) => {
      setStats(newStats);
    });
    return unsubscribe;
  }, []);

  const handleSyncNow = async () => {
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await synchronizePendingQueue();
      if (result.syncedCount > 0) {
        setSyncFeedback(`Synced ${result.syncedCount} report${result.syncedCount > 1 ? 's' : ''}`);
        setTimeout(() => setSyncFeedback(null), 4000);
      } else if (result.error) {
        setSyncFeedback(result.error);
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isSyncingActive = stats.syncInProgress || isManualSyncing;

  // Case 1: Client is offline
  if (!stats.isOnline) {
    return (
      <div
        role="status"
        title="Offline Mode: Field reports are safely queued in local storage."
        className={`inline-flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 shadow-sm ${className}`}
      >
        <WifiOff className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
        <span className="font-bold">OFFLINE</span>
        <span className="text-slate-400">|</span>
        <span>Pending Reports: <strong className="text-rose-900 font-semibold">{stats.pendingCount}</strong></span>
      </div>
    );
  }

  // Case 2: Online with pending reports to synchronize
  if (stats.pendingCount > 0) {
    return (
      <div
        role="status"
        className={`inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm ${className}`}
      >
        <Wifi className="h-3.5 w-3.5 text-amber-600" />
        <span>Pending Reports: <strong className="text-amber-900 font-bold">{stats.pendingCount}</strong></span>
        <button
          onClick={handleSyncNow}
          disabled={isSyncingActive}
          className="inline-flex items-center gap-1 rounded bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncingActive ? 'animate-spin' : ''}`} />
          <span>{isSyncingActive ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    );
  }

  // Case 3: Just synced feedback
  if (syncFeedback) {
    return (
      <div
        role="status"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>{syncFeedback}</span>
      </div>
    );
  }

  // Case 4: Normal online status (quiet pill)
  return (
    <div
      role="status"
      title="Online & Synchronized with Regional Command Backend"
      className={`hidden md:inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 px-2 py-1 text-[11px] font-medium text-emerald-700 ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
      <span>Online & Synced</span>
    </div>
  );
};

export default OfflineSyncIndicator;
