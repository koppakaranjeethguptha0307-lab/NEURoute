import React from 'react';
import {
  Truck,
  Navigation,
  Thermometer,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Compass,
  CheckCircle,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const DriverDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Driver Command Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <Truck className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-200">
                Driver Navigation Telematics
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4" /> GPS Live Lock
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Driver Console: {user?.name || 'Transport Operator'}</h1>
            <p className="text-sm text-blue-100/90">
              Vehicle: <span className="font-bold text-white">AS-01-EC-9001</span> (Refrigerated Vaccine Truck)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25">
            <Navigation className="h-4 w-4" />
            Resume Turn-by-Turn GPS
          </button>
        </div>
      </div>

      {/* Driver Telematics Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Destination & Route</span>
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">Shillong Civil Hospital</p>
          <p className="mt-1 text-xs text-blue-600 font-semibold">Via NH-06 Lifeline Corridor</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Estimated Arrival (ETA)</span>
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">1h 45m</p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">On-time (14:30 IST)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Cold Chain Payload</span>
            <Thermometer className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-indigo-600">3.8 °C</p>
          <p className="mt-1 text-xs text-slate-500">Optimal range: 2.0°C – 8.0°C</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Speed & Fuel</span>
            <Compass className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">42 km/h</p>
          <p className="mt-1 text-xs text-slate-500">Fuel level: 88% (Tank Full)</p>
        </div>
      </div>

      {/* Main Grid: Active Route Map & Shipment Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Interactive GPS Route & Turn Guidance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Navigation Route</h2>
                <p className="text-xs text-slate-500">Guwahati Hub → Shillong Life Corridor</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                OPTIMAL ROUTE
              </span>
            </div>

            {/* GPS Simulation Box */}
            <div className="mt-4 relative h-64 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative text-center p-6 text-white z-10">
                <Navigation className="mx-auto h-12 w-12 text-blue-400 animate-pulse transform rotate-45" />
                <h3 className="mt-3 text-lg font-bold">Turn Right onto NH-06 Highway</h3>
                <p className="text-xs text-blue-200 mt-1">In 850 meters near Jorabat Junction</p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                  <span className="rounded-lg bg-blue-600/50 px-3 py-1 text-blue-100 border border-blue-400/30">
                    Remaining: 68.2 KM
                  </span>
                  <span className="rounded-lg bg-emerald-600/50 px-3 py-1 text-emerald-100 border border-emerald-400/30">
                    Alt: 1,450 m
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cold Chain Live Telemetry */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">Cold Chain Payload Sensor Telemetry</h3>
            <p className="text-xs text-slate-500 mb-4">Continuous temperature & humidity tracking for Essential Essential Medical Supplies</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center">
                <span className="text-xs text-slate-500 font-medium">Refrigeration Unit</span>
                <p className="mt-1 text-xl font-bold text-blue-700">COMPRESSOR ACTIVE</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                <span className="text-xs text-slate-500 font-medium">Current Temperature</span>
                <p className="mt-1 text-2xl font-bold text-emerald-700">3.8 °C</p>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-center">
                <span className="text-xs text-slate-500 font-medium">Cargo Compartment Humidity</span>
                <p className="mt-1 text-2xl font-bold text-purple-700">45 %</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Active Shipment & Warnings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">Assigned Consignment</h3>
            
            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Tracking ID</span>
                <span className="font-bold text-slate-900">SHP-NER-2026-089</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Cargo Type</span>
                <span className="font-semibold text-slate-900">Life-Saving Vaccines & Insulin</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Weight</span>
                <span className="font-semibold text-slate-900">2,450 KG</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Consignee</span>
                <span className="font-semibold text-slate-900">Meghalaya Health Directorate</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Route Hazard Advisory
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Ground control reports dense fog & minor rockfall risk near Km 42 (Nongpoh stretch). Keep speed below 35 km/h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboardPage;
