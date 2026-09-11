import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  AlertTriangle,
  CloudRain,
  Truck,
  Clock,
  ArrowRight,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { sseClient } from '@/utils/sseClient';
import { OperationalAlert, AlertCategory, AlertSeverity } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import {
  SupportedLanguage,
  getSelectedAlertLanguage,
  setSelectedAlertLanguage,
  localizeAlert,
} from '@/utils/i18nAlerts';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Multilingual Alerts State
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getSelectedAlertLanguage());

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setSelectedAlertLanguage(lang);
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const hasAlertsRef = React.useRef(alerts.length > 0);
  hasAlertsRef.current = alerts.length > 0;

  const fetchAlerts = useCallback(async (isBackground = false) => {
    if (!isBackground && !hasAlertsRef.current) {
      setIsLoading(true);
    }
    try {
      const data = await apiClient.get<OperationalAlert[]>('/alerts');
      const rawList = Array.isArray(data) ? data : [];
      const normalized: OperationalAlert[] = rawList.map((a: any) => ({
        ...a,
        id: String(a.id),
        title: a.title || 'Operational Advisory',
        message: a.message || '',
        read: a.read ?? a.is_read ?? false,
        timestamp: a.timestamp || a.created_at || new Date().toISOString(),
        severity: (a.severity?.toLowerCase() || 'info') as AlertSeverity,
        category: (a.category?.toLowerCase() || 'operational') as AlertCategory,
      }));
      setAlerts(normalized);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = sseClient.subscribe((evt) => {
      if (
        evt &&
        (evt.event === 'SIMULATION_RESET' ||
          evt.event === 'ROAD_STATUS_UPDATED' ||
          evt.event === 'COLD_CHAIN_ALERT' ||
          evt.event === 'WEATHER_UPDATED' ||
          evt.event === 'DEMO_SCENARIO_COMPLETED')
      ) {
        fetchAlerts(true);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [fetchAlerts]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/alerts/mark-all-read');
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Mark single as read
  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      try {
        await apiClient.patch(`/alerts/${id}/read`);
      } catch {
        await apiClient.patch('/alerts/read', { id });
      }
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  // Filtering logic
  const filteredAlerts = alerts.filter((alert) => {
    const title = alert.title || '';
    const message = alert.message || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || alert.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' || alert.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesTab = activeTab === 'all' || (activeTab === 'unread' && !alert.read);

    return matchesSearch && matchesSeverity && matchesCategory && matchesTab;
  });

  // Localize alerts according to selected language
  const localizedAlerts = filteredAlerts.map((alert) => {
    const loc = localizeAlert(alert.title, alert.message, currentLanguage);
    return {
      ...alert,
      title: loc.title,
      message: loc.message,
    };
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'weather':
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'hazard':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'fleet':
        return <Truck className="h-4 w-4 text-emerald-500" />;
      case 'delay':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 mb-1">
            <Bell className="h-3.5 w-3.5" />
            Live Operations & Weather Telemetry Feed
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Real-Time Operational Alerts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hazard warnings, monsoon alerts, bottleneck detours, and consignment delay notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4 text-brand-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Unread vs All Pill Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'unread'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-mono">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredAlerts.length} filtered notices
          </span>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alert keywords..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings</option>
              <option value="info">Informational</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Alert Categories</option>
              <option value="hazard">Hazard & Road Obstruction</option>
              <option value="weather">Weather & Rain Alerts</option>
              <option value="fleet">Fleet & Telematics</option>
              <option value="delay">Consignment Delays</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Alerts Found"
            description="All operational channels are clear. No notices match your filter parameters."
            actionText="Clear All Filters"
            onAction={() => {
              setSearchTerm('');
              setSeverityFilter('all');
              setCategoryFilter('all');
              setActiveTab('all');
            }}
          />
        ) : (
          localizedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 transition-all ${
                alert.read
                  ? 'border-slate-200 bg-white/70 opacity-80'
                  : 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  {getCategoryIcon(alert.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={alert.severity} className="text-[10px] py-0 px-2" />
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {alert.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(alert.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {!alert.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping"></span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {alert.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 justify-end">
                {!alert.read && (
                  <button
                    onClick={(e) => handleMarkSingleRead(alert.id, e)}
                    title="Mark as Read"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Mark Read</span>
                  </button>
                )}

                {alert.actionUrl && (
                  <Link
                    to={alert.actionUrl}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
                  >
                    <span>View Context</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
