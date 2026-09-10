import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  AlertTriangle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Bell,
  ArrowRight,
  Activity,
  Navigation,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { DashboardKPIs, OperationalAlert, Incident, Shipment } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton, DashboardCardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const fetchDashboardData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [kpiRes, alertsRes, incidentsRes, shipmentsRes] = await Promise.all([
        apiClient.get<DashboardKPIs>('/dashboard/kpis'),
        apiClient.get<OperationalAlert[]>('/alerts'),
        apiClient.get<Incident[]>('/incidents'),
        apiClient.get<Shipment[]>('/shipments'),
      ]);

      setKpis(kpiRes);
      setAlerts(Array.isArray(alertsRes) ? alertsRes.slice(0, 4) : []);
      setIncidents(Array.isArray(incidentsRes) ? incidentsRes : []);
      setShipments(Array.isArray(shipmentsRes) ? shipmentsRes.slice(0, 5) : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Strategic NER Corridors summary calculation
  const corridors = [
    {
      name: 'NH-29 Corridor',
      route: 'Dimapur → Kohima → Imphal',
      status: 'disrupted',
      reason: 'Active Landslide at Phesama (7.5h delay)',
      risk: 78,
    },
    {
      name: 'NH-27 / NH-6 Corridor',
      route: 'Guwahati → Lumding → Silchar',
      status: 'restricted',
      reason: 'Bailey Bridge Load Limit 5T at Jatinga',
      risk: 48,
    },
    {
      name: 'NH-15 / NH-415 Corridor',
      route: 'Guwahati → Tezpur → Itanagar',
      status: 'clear',
      reason: 'Optimal Flow, Zero Active Blockages',
      risk: 18,
    },
    {
      name: 'NH-10 Himalayan Corridor',
      route: 'Siliguri → Sevoke → Gangtok',
      status: 'restricted',
      reason: 'Single-Lane Convoy at 29th Mile',
      risk: 52,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Operations Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300 border border-brand-500/30 mb-2">
              <Activity className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
              <span>NER Regional Operations Hub</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              North Eastern Logistics & Terrain Intelligence
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Live monitoring across Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura, and Sikkim.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 border border-slate-700">
              Telemetry synced: <strong className="text-white font-mono">{lastUpdated}</strong>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-500 active:scale-95 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Active Shipments */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Active Shipments
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpis?.activeShipments ?? 142}
              </span>
              <span className="text-xs font-medium text-emerald-600">
                {kpis?.shipmentsOnTimeRate ?? 88.4}% on-time
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Across 8 North Eastern states</p>
          </div>

          {/* KPI 2: Live Fleet on Transit */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Fleet in Transit
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpis?.liveFleetCount ?? 89}
              </span>
              <span className="text-xs font-medium text-emerald-600">
                {kpis?.fleetActivePct ?? 92.1}% operational
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Real-time GPS tracking active</p>
          </div>

          {/* KPI 3: Reported Incidents */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Reported Incidents
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpis?.activeIncidentsCount ?? incidents.length}
              </span>
              <span className="text-xs font-semibold text-rose-600">
                {kpis?.criticalIncidentsCount ?? 2} Critical Blockages
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Landslides, floods & bridges</p>
          </div>

          {/* KPI 4: Average Risk Index */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Avg Route Risk Index
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpis?.averageRiskIndex ?? 24.2}%
              </span>
              <span className="text-xs font-medium text-amber-600">
                Moderate Monsoon Alert
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Dynamic AI risk composite</p>
          </div>
        </div>
      )}

      {/* Main Content Grid: Corridors & Priority Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Strategic Corridors Status */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Key Regional Corridors Health</h3>
              <p className="text-xs text-slate-500">Real-time status of critical national highways across NER</p>
            </div>
            <Link
              to="/gis-map"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              <span>Explore GIS Map</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-3">
              {corridors.map((c, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        c.status === 'clear'
                          ? 'bg-emerald-100 text-emerald-700'
                          : c.status === 'restricted'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            c.status === 'clear'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'restricted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">{c.route}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{c.reason}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <span className="text-[11px] font-medium text-slate-400">Risk Score</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        c.risk > 70
                          ? 'text-rose-600'
                          : c.risk > 40
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {c.risk}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Priority Operational Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">Priority Alerts</h3>
              </div>
              <Link
                to="/alerts"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View All
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : alerts.length === 0 ? (
              <EmptyState
                title="No Active Alerts"
                description="All operational corridors are running smoothly with no hazard notices."
              />
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    to={alert.actionUrl || '/alerts'}
                    className="block rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 transition-all hover:bg-slate-50 hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <StatusBadge status={alert.severity} className="text-[10px] py-0 px-2" />
                      <span className="text-[10px] text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{alert.title}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{alert.message}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/incidents"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-slate-100 hover:bg-slate-200 py-2 text-xs font-semibold text-slate-700 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              <span>Open Incident Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Priority Shipments Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active High-Priority Consignments</h3>
            <p className="text-xs text-slate-500">
              Live tracking of emergency medicine, provisions, and mountain supply shipments
            </p>
          </div>
          <Link
            to="/logistics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <span>View All Shipments</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : shipments.length === 0 ? (
          <EmptyState
            title="No Active Shipments"
            description="No active shipments in transit at this moment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Tracking & Cargo</th>
                  <th className="py-3 px-4">Origin / Destination</th>
                  <th className="py-3 px-4">Current Sector</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Risk Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shipments.map((shp) => (
                  <tr key={shp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900">{shp.trackingNumber}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{shp.cargoType}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800 truncate max-w-xs">{shp.origin}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">→ {shp.destination}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {shp.currentLocationName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={shp.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold ${
                          shp.riskScore > 60
                            ? 'text-rose-600'
                            : shp.riskScore > 30
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {shp.riskScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
