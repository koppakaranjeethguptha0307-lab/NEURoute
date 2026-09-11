import React from 'react';
import { X, MapPin, AlertTriangle, CloudRain, Clock, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';
import { DataSourceBadge } from './DataSourceBadge';

export interface RoadInspectorData {
  id: string;
  name: string;
  highway: string;
  status: 'OPEN' | 'RISKY' | 'BLOCKED';
  accessibilityScore: number;
  riskScore: number;
  weatherCondition: string;
  rainfallMm: number;
  estimatedDelayHours: number;
  incidentTitle?: string;
  governmentAdvisory?: string;
  recommendedAction: string;
  alternateRouteName: string;
  dataSource: string;
  lastUpdated: string;
  aiExplanation: string;
}

interface RoadInspectorDrawerProps {
  data: RoadInspectorData | null;
  onClose: () => void;
  onRerouteTriggered?: () => void;
}

export const RoadInspectorDrawer: React.FC<RoadInspectorDrawerProps> = ({
  data,
  onClose,
  onRerouteTriggered,
}) => {
  if (!data) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500 text-white uppercase">
              {data.highway}
            </span>
            <h3 className="text-sm font-bold truncate">{data.name}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">GIS Road Sector Intelligence</p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* Status Card */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          data.status === 'BLOCKED' ? 'bg-rose-50 border-rose-200 text-rose-900' :
          data.status === 'RISKY' ? 'bg-amber-50 border-amber-200 text-amber-900' :
          'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div>
            <span className="text-[10px] uppercase tracking-wider block opacity-75 font-semibold">Current Status</span>
            <strong className="text-sm font-bold uppercase">{data.status}</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider block opacity-75 font-semibold">Risk Score</span>
            <strong className="text-sm font-mono font-bold">{(data.riskScore * 100).toFixed(0)}%</strong>
          </div>
        </div>

        {/* Provenance Badge */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
          <span className="text-slate-600 font-medium">Data Provenance:</span>
          <DataSourceBadge source={data.dataSource} />
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block font-medium">Weather Exposure</span>
            <strong className="text-slate-900 font-bold block mt-0.5">{data.weatherCondition}</strong>
            <span className="text-[10px] text-slate-400 font-mono">{data.rainfallMm} mm/h</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block font-medium">Estimated Delay</span>
            <strong className="text-rose-600 font-bold font-mono block mt-0.5">+{data.estimatedDelayHours} hrs</strong>
            <span className="text-[10px] text-slate-400">Bottleneck queue</span>
          </div>
        </div>

        {/* Active Disruption & Government Advisory */}
        {data.incidentTitle && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              Active Incident
            </span>
            <p className="font-semibold">{data.incidentTitle}</p>
          </div>
        )}

        {data.governmentAdvisory && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              Government Restriction
            </span>
            <p className="font-semibold">{data.governmentAdvisory}</p>
          </div>
        )}

        {/* AI Explanation Drawer Section */}
        <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
          <div className="flex items-center gap-1.5 text-brand-400 font-bold text-[11px] uppercase tracking-wide">
            <Cpu className="h-3.5 w-3.5 text-brand-400" />
            <span>WHY IS THIS ROAD {data.status}?</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {data.aiExplanation}
          </p>
        </div>

        {/* Recommended Bypass Action */}
        <div className="p-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-900 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block">
            Recommended Operational Action
          </span>
          <p className="font-bold text-slate-900">{data.recommendedAction}</p>
          <div className="flex items-center justify-between text-[11px] font-medium text-brand-800 pt-1 border-t border-brand-200/60">
            <span>Bypass via: {data.alternateRouteName}</span>
            {onRerouteTriggered && (
              <button
                onClick={onRerouteTriggered}
                className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-900 transition"
              >
                <span>Reroute</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
