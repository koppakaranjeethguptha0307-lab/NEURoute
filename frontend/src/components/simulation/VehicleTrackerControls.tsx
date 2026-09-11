import React, { useState } from 'react';
import { Play, Pause, FastForward, RotateCcw, Truck, Navigation, Gauge, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { DataSourceBadge } from '../common/DataSourceBadge';

interface VehicleTrackerControlsProps {
  vehicleId?: number;
  onVehicleUpdated?: () => void;
}

export const VehicleTrackerControls: React.FC<VehicleTrackerControlsProps> = ({
  vehicleId = 1,
  onVehicleUpdated,
}) => {
  const [isAutoTracking, setIsAutoTracking] = useState<boolean>(false);
  const [trackingInterval, setTrackingInterval] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number>(48);
  const [headingDeg, setHeadingDeg] = useState<number>(137);
  const [progressPct, setProgressPct] = useState<number>(35);
  const [loading, setLoading] = useState<boolean>(false);

  const handleStepVehicle = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<any>('/simulation/gps-step', {
        vehicle_id: vehicleId,
        step_fraction: 0.5,
      });

      if (res) {
        setSpeedKmh(res.speed_kmh || 52);
        setHeadingDeg(res.heading_deg || 142);
        setProgressPct(Math.min(100, (res.route_progress_pct || progressPct + 5)));
        if (onVehicleUpdated) onVehicleUpdated();
      }
    } catch (_) {
      // Local fallback
      setProgressPct((prev) => (prev >= 100 ? 10 : prev + 5));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoTracking = () => {
    if (isAutoTracking) {
      if (trackingInterval) clearInterval(trackingInterval);
      setTrackingInterval(null);
      setIsAutoTracking(false);
    } else {
      setIsAutoTracking(true);
      const timer = window.setInterval(async () => {
        await handleStepVehicle();
      }, 3000);
      setTrackingInterval(timer);
    }
  };

  const handleResetVehicle = async () => {
    if (trackingInterval) clearInterval(trackingInterval);
    setTrackingInterval(null);
    setIsAutoTracking(false);
    setProgressPct(0);
    try {
      await apiClient.post('/simulation/reset');
      if (onVehicleUpdated) onVehicleUpdated();
    } catch (_) {}
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
              Live Software Vehicle Telemetry Tracker
              <span className={`h-2 w-2 rounded-full ${isAutoTracking ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
            </h4>
            <p className="text-[10px] text-slate-500">AS-01-EC-3312 • Guwahati → Sonapur → Umrangso → Silchar</p>
          </div>
        </div>

        <DataSourceBadge source="SIMULATED" label="GPS SOURCE: SIMULATED" />
      </div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[9px] uppercase">Speed</span>
          <strong className="text-slate-900 font-bold">{speedKmh.toFixed(0)} km/h</strong>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[9px] uppercase">Heading</span>
          <strong className="text-slate-900 font-bold">{headingDeg.toFixed(0)}°</strong>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[9px] uppercase">Accuracy</span>
          <strong className="text-slate-900 font-bold">8 m</strong>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[9px] uppercase">Progress</span>
          <strong className="text-brand-600 font-bold">{progressPct.toFixed(0)}%</strong>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleToggleAutoTracking}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold shadow-xs transition-all ${
            isAutoTracking
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isAutoTracking ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isAutoTracking ? 'Pause Tracking' : 'Start Live Tracking'}</span>
        </button>

        <button
          onClick={handleStepVehicle}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          title="Manually advance vehicle along GIS route waypoints"
        >
          <FastForward className="h-3.5 w-3.5 text-slate-600" />
          <span>Step GPS</span>
        </button>

        <button
          onClick={handleResetVehicle}
          className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          title="Reset vehicle position to Guwahati hub"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
