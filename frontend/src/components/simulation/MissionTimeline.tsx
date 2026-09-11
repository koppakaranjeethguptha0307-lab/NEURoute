import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  Thermometer,
  Truck,
  Cpu,
  Navigation,
  Activity,
  Clock,
  Sparkles,
} from 'lucide-react';
import { sseClient } from '@/utils/sseClient';

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'warning' | 'critical' | 'pending';
  icon: React.ReactNode;
}

const BASELINE_STEPS: TimelineStep[] = [
  {
    id: 'step-1',
    label: 'Medical Consignment Dispatched',
    description: 'SHP-2026-MED-01 departed Guwahati Hub',
    status: 'completed',
    icon: <Truck className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: 'step-2',
    label: 'Software Telemetry Tracking Active',
    description: 'Vehicle AS-01-EC-3312 en-route via NH-06',
    status: 'completed',
    icon: <Navigation className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 'step-3',
    label: 'Monsoon Torrential Rain Ingested',
    description: 'Sonapur Gorge: 95.0 mm/h precipitation',
    status: 'warning',
    icon: <CloudRain className="h-4 w-4 text-amber-500" />,
  },
  {
    id: 'step-4',
    label: 'Sonapur Landslide Severance',
    description: 'NH-06 completely BLOCKED. Clearance +70.9h',
    status: 'critical',
    icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
  },
  {
    id: 'step-5',
    label: 'Digital Government Advisory Active',
    description: 'GOV-NE-2026-041: Heavy vehicles restricted',
    status: 'warning',
    icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
  },
  {
    id: 'step-6',
    label: 'Cold-Chain Temperature Excursion',
    description: 'Temp: 9.2°C (Allowed: 2.0°C - 8.0°C) CRITICAL',
    status: 'critical',
    icon: <Thermometer className="h-4 w-4 text-rose-500" />,
  },
  {
    id: 'step-7',
    label: 'Multi-Factor AI Rerouting Engaged',
    description: 'Evaluated 3 candidates. Primary NH-06 REJECTED',
    status: 'active',
    icon: <Cpu className="h-4 w-4 text-brand-500" />,
  },
  {
    id: 'step-8',
    label: 'Umrangso Relief Bypass Selected',
    description: 'Bypasses choke point. Saved 69.6 hours delay',
    status: 'completed',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: 'step-9',
    label: 'Emergency Mission Control Engaged',
    description: 'Priority medical clearance granted on SH-19',
    status: 'completed',
    icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  },
];

export const MissionTimeline: React.FC = () => {
  const [steps, setSteps] = useState<TimelineStep[]>(BASELINE_STEPS);
  const [lastEventTime, setLastEventTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const unsub = sseClient.subscribe((evt) => {
      if (!evt) return;
      setLastEventTime(new Date().toLocaleTimeString());

      if (evt.event === 'SIMULATION_RESET') {
        setSteps(BASELINE_STEPS);
      } else if (evt.event === 'ROAD_STATUS_UPDATED') {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 'step-4' ? { ...s, status: 'critical', timestamp: new Date().toLocaleTimeString() } : s
          )
        );
      } else if (evt.event === 'COLD_CHAIN_ALERT') {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 'step-6' ? { ...s, status: 'critical', timestamp: new Date().toLocaleTimeString() } : s
          )
        );
      } else if (evt.event === 'GOVERNMENT_ADVISORY') {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 'step-5' ? { ...s, status: 'warning', timestamp: new Date().toLocaleTimeString() } : s
          )
        );
      } else if (evt.event === 'EMERGENCY_MODE_TOGGLED' || evt.event === 'DEMO_SCENARIO_COMPLETED') {
        setSteps((prev) =>
          prev.map((s) => ({ ...s, status: s.status === 'pending' ? 'completed' : s.status }))
        );
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
              SIH Mission Progress Timeline
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h3>
            <p className="text-[11px] text-slate-500">Live 25-step operational incident response sequence</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>Last Event: {lastEventTime}</span>
        </div>
      </div>

      {/* Steps List */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => (
          <div key={step.id} className="relative flex items-start gap-3 group">
            {/* Dot Node */}
            <div
              className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white transition-all ${
                step.status === 'completed'
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50 shadow-xs'
                  : step.status === 'critical'
                  ? 'border-rose-500 text-rose-600 bg-rose-50 shadow-sm animate-pulse'
                  : step.status === 'warning'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : step.status === 'active'
                  ? 'border-brand-500 text-brand-600 bg-brand-50 ring-2 ring-brand-200'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              {step.icon}
            </div>

            {/* Step Body */}
            <div className="flex-1 rounded-xl bg-slate-50/80 p-3 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                  {step.label}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    step.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : step.status === 'critical'
                      ? 'bg-rose-100 text-rose-800 font-bold'
                      : step.status === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {step.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
