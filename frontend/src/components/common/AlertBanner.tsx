import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { OperationalAlert } from '@/types';
import { getSelectedAlertLanguage, localizeAlert } from '@/utils/i18nAlerts';

export const AlertBanner: React.FC = () => {
  const [criticalAlert, setCriticalAlert] = useState<OperationalAlert | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const currentLang = getSelectedAlertLanguage();

  useEffect(() => {
    async function loadCriticalAlert() {
      try {
        const alerts = await apiClient.get<OperationalAlert[]>('/alerts');
        if (Array.isArray(alerts)) {
          const topCritical = alerts.find((a) => (a.severity === 'critical' || a.severity === 'warning') && !a.read);
          if (topCritical) {
            setCriticalAlert(topCritical);
          }
        }
      } catch (err) {
        console.error('Failed to load alert banner:', err);
      }
    }
    loadCriticalAlert();
  }, []);

  if (!criticalAlert || isDismissed) return null;

  const loc = localizeAlert(criticalAlert.title, criticalAlert.message, currentLang);

  return (
    <div className="relative z-20 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 px-6 py-2.5 text-xs text-white shadow-md border-b border-rose-800/60">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/30 text-rose-300 ring-1 ring-rose-500/50">
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-rose-400" />
        </span>
        <div className="truncate">
          <strong className="font-bold text-rose-200 uppercase tracking-wider mr-2 text-[11px]">
            Regional Hazard Alert:
          </strong>
          <span className="text-slate-200">{loc.title}</span>
          <span className="hidden md:inline text-slate-400 ml-2">— {loc.message}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          to={criticalAlert.actionUrl || '/incidents'}
          className="inline-flex items-center gap-1 rounded-md bg-rose-600/80 hover:bg-rose-600 px-2.5 py-1 font-semibold text-white transition-colors"
        >
          <span>View Clearance Details</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setIsDismissed(true)}
          title="Dismiss Alert"
          className="rounded p-1 text-slate-400 hover:bg-rose-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;
