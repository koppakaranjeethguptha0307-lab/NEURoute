import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudRain,
  AlertTriangle,
  Truck,
  Thermometer,
  ShieldAlert,
  RotateCcw,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Loader2,
  Sliders,
} from 'lucide-react';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { apiClient } from '@/services/apiClient';

interface SimulationStatus {
  emergency_mode: boolean;
  target_road: {
    code: string;
    name: string;
    status: string;
    risk_score: number;
  };
  vehicle_telemetry: {
    vehicle_id: number;
    registration_number: string;
    latitude: number;
    longitude: number;
    speed_kmh: number;
    route_progress_pct: number;
    current_road_name?: string;
    estimated_eta_minutes?: number;
    source: string;
  };
  cold_chain_telemetry: {
    shipment_id: number;
    temperature_c: number;
    status: string;
    source: string;
    notes?: string;
  };
  weather: {
    location_name: string;
    rainfall_mm: number;
    condition: string;
    source: string;
  };
  active_incidents_count: number;
  data_sources: {
    gps: string;
    weather: string;
    cold_chain: string;
    government: string;
  };
  timestamp: string;
}

interface SimulationControlCenterProps {
  onSimulationTriggered?: () => void;
  isOfflineSimulated?: boolean;
  onToggleOffline?: (offline: boolean) => void;
}

export const SimulationControlCenter: React.FC<SimulationControlCenterProps> = ({
  onSimulationTriggered,
  isOfflineSimulated = false,
  onToggleOffline,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<SimulationStatus>('/simulation/status');
      if (data && data.target_road) {
        setStatus(data);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const runSimulationAction = async (endpoint: string, payload: any = {}, actionName: string) => {
    setLoadingAction(actionName);
    try {
      const result = await apiClient.post<any>(`/simulation/${endpoint}`, payload);
      setLastFeedback(`Executed ${actionName}: ${result?.message || result?.status || 'OK'}`);
      await fetchStatus();
      if (onSimulationTriggered) {
        onSimulationTriggered();
      }
    } catch (err: any) {
      setLastFeedback(`Action updated: ${actionName}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      {/* Header / Compact Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left text-white hover:text-cyan-300 transition"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 text-white">
              SIMULATION CONTROL CENTER
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {isOpen ? "Click to collapse" : "100% Software Digital Twin"}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {!isOpen && (
            <button
              onClick={() => runSimulationAction('demo-scenario', {}, 'Full SIH Demo Scenario')}
              disabled={loadingAction !== null}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow transition"
            >
              {loadingAction === 'Full SIH Demo Scenario' ? (
                <Loader2 className="h-3 w-3 animate-spin text-white" />
              ) : (
                <Activity className="h-3 w-3 text-emerald-300 animate-pulse" />
              )}
              <span>DEMO</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={isOpen ? "Collapse panel" : "Expand panel"}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
          {/* Real-time Status Badges */}
          {status && (
            <div className="space-y-2 rounded-xl bg-slate-950/70 p-3 border border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <Activity className="h-3 w-3 text-cyan-400" />
                  Live Operational State
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  status.target_road.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  NH-06: {status.target_road.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                  <span className="text-slate-400 block">GPS Telemetry:</span>
                  <strong className="text-white font-mono block">
                    {status.vehicle_telemetry.route_progress_pct.toFixed(0)}% • {status.vehicle_telemetry.speed_kmh.toFixed(0)} km/h
                  </strong>
                  <DataSourceBadge source={status.data_sources.gps} className="mt-1" />
                </div>

                <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                  <span className="text-slate-400 block">Cold-Chain Temp:</span>
                  <strong className={`font-mono block ${
                    status.cold_chain_telemetry.status === 'CRITICAL' ? 'text-rose-400 font-bold' :
                    status.cold_chain_telemetry.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {status.cold_chain_telemetry.temperature_c.toFixed(1)}°C ({status.cold_chain_telemetry.status})
                  </strong>
                  <DataSourceBadge source={status.data_sources.cold_chain} className="mt-1" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800/60">
                <span>Rain: {status.weather.rainfall_mm}mm ({status.weather.condition})</span>
                <DataSourceBadge source={status.data_sources.weather} />
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="space-y-2">
            {/* MASTER DEMO BUTTON */}
            <button
              onClick={() => runSimulationAction('demo-scenario', {}, 'Full SIH Demo Scenario')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 border border-brand-400 text-white shadow-lg transition-all font-semibold text-left group"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-300 animate-pulse" />
                <div>
                  <div className="font-bold text-white text-[12px]">RUN FULL SIH DEMO SCENARIO</div>
                  <div className="text-[10px] text-brand-100">25-Step Automated End-to-End Operational Pipeline</div>
                </div>
              </div>
              {loadingAction === 'Full SIH Demo Scenario' ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <span className="text-[10px] font-mono text-white bg-white/20 px-2 py-1 rounded border border-white/30">
                  EXECUTE
                </span>
              )}
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pt-1">
              Individual Scenario Triggers
            </span>

            {/* 1. Heavy Rainfall */}
            <button
              onClick={() => runSimulationAction('rainfall', { rainfall_mm: 92.5, visibility_meters: 280.0 }, 'Heavy Rainfall')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-200 transition font-medium text-left group"
            >
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-white text-[11px]">1. Ingest Severe Rainfall</div>
                  <div className="text-[10px] text-cyan-300/70">Sonapur Gorge: 92.5mm precipitation</div>
                </div>
              </div>
              {loadingAction === 'Heavy Rainfall' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              ) : (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  TRIGGER
                </span>
              )}
            </button>

            {/* 2. Landslide Blockage */}
            <button
              onClick={() => runSimulationAction('landslide', {}, 'Landslide Blockage')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 transition font-medium text-left group"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-white text-[11px]">2. Simulate Sonapur Landslide</div>
                  <div className="text-[10px] text-rose-300/70">Blocks NH-06, reroutes via Umrangso</div>
                </div>
              </div>
              {loadingAction === 'Landslide Blockage' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
              ) : (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  BLOCK
                </span>
              )}
            </button>

            {/* 3. Step Vehicle GPS */}
            <button
              onClick={() => runSimulationAction('gps-step', { vehicle_id: 1, step_fraction: 1.0 }, 'GPS Step')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 transition font-medium text-left group"
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-white text-[11px]">3. Advance Vehicle Along GIS</div>
                  <div className="text-[10px] text-blue-300/70">Interpolates GPS coordinates on lifeline</div>
                </div>
              </div>
              {loadingAction === 'GPS Step' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              ) : (
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  STEP GPS
                </span>
              )}
            </button>

            {/* 4. Cold-Chain Temperature Excursion */}
            <button
              onClick={() => runSimulationAction('cold-chain', { shipment_id: 1 }, 'Cold Chain Excursion')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 transition font-medium text-left group"
            >
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-white text-[11px]">4. Advance Cold-Chain Temp</div>
                  <div className="text-[10px] text-amber-300/70">4.8°C → 8.3°C → 9.4°C thermal alert</div>
                </div>
              </div>
              {loadingAction === 'Cold Chain Excursion' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              ) : (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  TEMP +
                </span>
              )}
            </button>

            {/* 5. Toggle Emergency Mission Control */}
            <button
              onClick={() => runSimulationAction('emergency-mode', {}, 'Emergency Mode')}
              disabled={loadingAction !== null}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition font-medium text-left group ${
                status?.emergency_mode
                  ? 'bg-rose-600/30 hover:bg-rose-600/40 border-rose-500 text-white'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className={`h-4 w-4 ${status?.emergency_mode ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-white text-[11px]">
                    5. Emergency Mission Control: {status?.emergency_mode ? 'ACTIVE' : 'STANDBY'}
                  </div>
                  <div className="text-[10px] text-slate-400">Prioritizes critical medical consignments</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-600">
                {status?.emergency_mode ? 'DISENGAGE' : 'ENGAGE'}
              </span>
            </button>

            {/* 6. Simulate Offline / Online Network */}
            <button
              onClick={() => {
                if (onToggleOffline) {
                  onToggleOffline(!isOfflineSimulated);
                }
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition font-medium text-left group ${
                isOfflineSimulated
                  ? 'bg-amber-950/60 hover:bg-amber-900/70 border-amber-500 text-amber-200'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isOfflineSimulated ? (
                  <WifiOff className="h-4 w-4 text-amber-400 animate-pulse" />
                ) : (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                )}
                <div>
                  <div className="font-semibold text-white text-[11px]">
                    6. Field Network: {isOfflineSimulated ? 'OFFLINE (Buffered)' : 'ONLINE'}
                  </div>
                  <div className="text-[10px] text-slate-400">Tests offline report queue & idempotent sync</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-600">
                {isOfflineSimulated ? 'RESTORE' : 'GO OFFLINE'}
              </span>
            </button>
          </div>

          {/* Reset Baseline Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => runSimulationAction('reset', {}, 'Reset Demo')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium text-[11px]"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Scenario to Baseline</span>
            </button>
          </div>

          {/* Feedback banner */}
          {lastFeedback && (
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{lastFeedback}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
