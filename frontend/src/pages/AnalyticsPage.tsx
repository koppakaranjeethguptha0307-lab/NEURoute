import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { DistrictAnalytics, MonthlyTrend } from '@/types';
import { Skeleton } from '@/components/common/LoadingSkeleton';

export const AnalyticsPage: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictAnalytics[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('monsoon'); // 'last30' | 'monsoon' | 'ytd'
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [districtsRes, trendsRes] = await Promise.all([
        apiClient.get<DistrictAnalytics[]>('/analytics/districts'),
        apiClient.get<MonthlyTrend[]>('/analytics/trends'),
      ]);
      setDistricts(Array.isArray(districtsRes) ? districtsRes : []);
      setTrends(Array.isArray(trendsRes) ? trendsRes : []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export report simulation
  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['District,State,Incidents,AvgDelayMins,RiskRating']
        .concat(
          districts.map(
            (d) => `${d.district},${d.state},${d.incidentCount},${d.averageDelayMins},${d.riskRating}%`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEURoute_Regional_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDistricts = districts.filter(
    (d) => selectedStateFilter === 'all' || d.state.toLowerCase() === selectedStateFilter.toLowerCase()
  );

  const maxIncidentsMonth = Math.max(...trends.map((t) => t.incidents), 1);
  const maxDistrictIncidents = Math.max(...districts.map((d) => d.incidentCount), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200 mb-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Regional Corridors & Hazard Intelligence Analytics
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Performance & District Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monsoon delay seasonality, district risk indices, and corridor accessibility across 8 NER states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-xs">
            <button
              onClick={() => setTimeRange('last30')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                timeRange === 'last30' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('monsoon')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                timeRange === 'monsoon' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monsoon 2026
            </button>
            <button
              onClick={() => setTimeRange('ytd')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                timeRange === 'ytd' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Year to Date
            </button>
          </div>

          {/* Export Report Action */}
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top High-Level Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Avg Delay Impact
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              3.8 hrs
            </span>
            <span className="text-xs font-semibold text-rose-600 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +1.2h in monsoon
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Average freight transit delay</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Recorded Hazards
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">148</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowDownRight className="h-3.5 w-3.5" />
              -14% post-clearance
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Across 8 NER states this season</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Corridor Resilience
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              81.4%
            </span>
            <span className="text-xs font-medium text-emerald-600">Bypass efficiency</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Successful AI re-routings</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Highest Risk Sector
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">Kohima (NH-29)</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-semibold">82% Risk Index rating</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Monsoon Incidents & Delay Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Monthly Incident Frequency & Delays</h3>
                <p className="text-xs text-slate-500">Monsoon surge patterns across April – September 2026</p>
              </div>
              <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                Peak Monsoon in Jul
              </span>
            </div>

            {isLoading ? (
              <Skeleton className="h-60 w-full rounded-xl" />
            ) : (
              <div className="space-y-4 pt-2">
                {trends.map((item, idx) => {
                  const pct = (item.incidents / maxIncidentsMonth) * 100;
                  const isMonsoonPeak = item.month.includes('Monsoon');

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{item.month}</span>
                        <div className="flex items-center gap-3 text-[11px] font-mono">
                          <span className="text-slate-500">{item.shipmentVolume} shipments</span>
                          <span className="text-amber-600 font-semibold">+{item.avgDelayHours}h delay</span>
                          <strong className="text-slate-900 w-16 text-right font-bold">
                            {item.incidents} hazards
                          </strong>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMonsoonPeak ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-brand-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Data aggregated from NER Highway Authorities</span>
            <span className="font-semibold text-slate-800">148 total hazards logged</span>
          </div>
        </div>

        {/* Chart 2: District Risk Index & Incident Density */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">District Incident Density</h3>
                <p className="text-xs text-slate-500">Incident count across high-vulnerability hill sectors</p>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-60 w-full rounded-xl" />
            ) : (
              <div className="space-y-3.5 pt-2">
                {districts.slice(0, 6).map((district, idx) => {
                  const pct = (district.incidentCount / maxDistrictIncidents) * 100;
                  const isHigh = district.riskRating > 60;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {district.district} ({district.state})
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-slate-500">{district.averageDelayMins}m avg delay</span>
                          <span
                            className={`font-bold ${
                              isHigh ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {district.incidentCount} incidents ({district.riskRating}% risk)
                          </span>
                        </div>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh ? 'bg-rose-500' : district.riskRating > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Updated hourly via field telematics</span>
            <span className="text-brand-600 font-semibold cursor-pointer">View full matrix below ↓</span>
          </div>
        </div>
      </div>

      {/* District Analytics Leaderboard Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">District Hazard & Delay Scorecard</h3>
            <p className="text-xs text-slate-500">
              Comparative risk indices, transit delay averages, and incident frequency by administrative district
            </p>
          </div>

          {/* State Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All NER States</option>
              <option value="Assam">Assam</option>
              <option value="Meghalaya">Meghalaya</option>
              <option value="Nagaland">Nagaland</option>
              <option value="Manipur">Manipur</option>
              <option value="Arunachal Pradesh">Arunachal Pradesh</option>
              <option value="Mizoram">Mizoram</option>
              <option value="Tripura">Tripura</option>
              <option value="Sikkim">Sikkim</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-center">Incident Frequency</th>
                  <th className="py-3 px-4 text-center">Avg Transit Delay</th>
                  <th className="py-3 px-4 text-right">Terrain Risk Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDistricts.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.district}</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.state}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-slate-900">{d.incidentCount}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                        +{d.averageDelayMins} mins
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold ${
                          d.riskRating > 60
                            ? 'text-rose-600'
                            : d.riskRating > 30
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {d.riskRating}% Risk
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

export default AnalyticsPage;
