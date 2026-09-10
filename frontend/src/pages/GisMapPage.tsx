import React, { useState, useEffect } from 'react';
import {
  Layers,
  Truck,
  AlertTriangle,
  Navigation,
  Compass,
  Sparkles,
  Phone,
  Clock,
  Gauge,
  Fuel,
  X,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Vehicle, Incident, RouteOption } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import MapComponent from '@/components/MapComponent';
import {
  mockRoadSegmentsGeoJSON,
  mockIncidents,
  mockHazards,
  mockHubs,
  mockVehicles,
  mockRoutePlanResponse,
} from '@/services/mockData';

// Pre-defined regional bounding presets for fast pan & zoom
const REGION_PRESETS = [
  { name: 'All NER Region', center: [26.1445, 92.5] as [number, number], zoom: 7 },
  { name: 'Guwahati Hub (Assam)', center: [26.1445, 91.7362] as [number, number], zoom: 11 },
  { name: 'Kohima - Imphal (NH-29)', center: [25.2, 94.0] as [number, number], zoom: 9 },
  { name: 'Shillong - Silchar (NH-6)', center: [25.2, 92.3] as [number, number], zoom: 9 },
  { name: 'Tezpur - Itanagar (NH-15)', center: [26.8, 93.2] as [number, number], zoom: 9 },
  { name: 'Sikkim Himalayan (NH-10)', center: [27.2, 88.5] as [number, number], zoom: 10 },
];

export const GisMapPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeCenter, setActiveCenter] = useState<[number, number]>([26.1445, 92.5]);
  const [activeZoom, setActiveZoom] = useState<number>(7);

  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'vehicle' | 'incident' | 'route' | 'road' | 'hub' | 'hazard';
    data: any;
  } | null>(null);

  // Layer Toggles
  const [showVehicles, setShowVehicles] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);

  // Load telemetry data from apiClient with graceful fallback to mock GIS data
  useEffect(() => {
    async function loadMapData() {
      try {
        const [vRes, iRes, rRes] = await Promise.all([
          apiClient.get<Vehicle[]>('/vehicles'),
          apiClient.get<Incident[]>('/incidents'),
          apiClient.get<RouteOption[]>('/routes'),
        ]);
        if (Array.isArray(vRes) && vRes.length > 0) setVehicles(vRes);
        if (Array.isArray(iRes) && iRes.length > 0) setIncidents(iRes);
        if (Array.isArray(rRes) && rRes.length > 0) setRoutes(rRes);
      } catch (err) {
        console.warn('Backend API unavailable, using canonical GIS datasets:', err);
      }
    }
    loadMapData();
  }, []);

  const handleFlyTo = (center: [number, number], zoom: number) => {
    setActiveCenter(center);
    setActiveZoom(zoom);
  };

  return (
    <div className="space-y-4">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        {/* Left: Quick Region Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" />
            Focus:
          </span>
          {REGION_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleFlyTo(preset.center, preset.zoom)}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Right: Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              showVehicles
                ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Vehicles ({vehicles.length > 0 ? vehicles.length : mockVehicles.length})</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              showIncidents
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Hazards ({incidents.length > 0 ? incidents.length : mockIncidents.length})</span>
          </button>

          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              showRoutes
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Corridors ({routes.length > 0 ? routes.length : 2})</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport Container */}
      <div className="relative h-[calc(100vh-14rem)] min-h-[550px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg">
        {/* Leaflet Map Component rendering 8 NER States, Capitals, Lifelines & Animated Flow */}
        <MapComponent
          roadsGeoJSON={mockRoadSegmentsGeoJSON}
          incidents={incidents.length > 0 ? incidents : mockIncidents}
          hazards={mockHazards}
          hubs={mockHubs}
          vehicles={vehicles.length > 0 ? vehicles : mockVehicles}
          routePlan={mockRoutePlanResponse}
          activeCenter={activeCenter}
          activeZoom={activeZoom}
          onSelectEntity={(entity: any) => setSelectedEntity(entity)}
        />

        {/* Floating Legend Overlay */}
        <div className="absolute left-4 bottom-4 z-10 hidden sm:block rounded-xl border border-slate-200/80 bg-slate-900/90 text-white p-3 shadow-xl backdrop-blur-md max-w-xs text-xs">
          <div className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>NER GIS Intelligence Map</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              <span>8 State Capitals & Strategic Gateways</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span>Active Fleet Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Critical Incidents / Landslide Hazard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-5 bg-emerald-400 rounded"></span>
              <span>AI Recommended Corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-5 bg-rose-500 border-b border-dashed border-white rounded"></span>
              <span>Disrupted / Blocked Corridor (NH-29)</span>
            </div>
          </div>
        </div>

        {/* Entity Inspector Side Drawer (When marker, route, hub, or road is clicked) */}
        {selectedEntity && (
          <div className="absolute right-4 bottom-4 z-20 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                {selectedEntity.type === 'vehicle' && <Truck className="h-4 w-4 text-brand-600" />}
                {selectedEntity.type === 'incident' && <AlertTriangle className="h-4 w-4 text-rose-600" />}
                {selectedEntity.type === 'route' && <Navigation className="h-4 w-4 text-emerald-600" />}
                {selectedEntity.type === 'road' && <MapPin className="h-4 w-4 text-cyan-600" />}
                {selectedEntity.type === 'hub' && <Layers className="h-4 w-4 text-purple-600" />}
                {selectedEntity.type === 'hazard' && <ShieldAlert className="h-4 w-4 text-amber-600" />}
                <h4 className="text-sm font-bold text-slate-900 capitalize">
                  {selectedEntity.type} Inspector
                </h4>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Vehicle Details */}
            {selectedEntity.type === 'vehicle' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {selectedEntity.data.registration_number || selectedEntity.data.plateNumber}
                    </span>
                    <StatusBadge status={selectedEntity.data.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {(selectedEntity.data.vehicle_type || selectedEntity.data.vehicleType)?.replace('_', ' ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-brand-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Speed</span>
                      <strong className="text-slate-800">
                        {selectedEntity.data.speed_kmh || selectedEntity.data.speedKmh || 0} km/h
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fuel Level</span>
                      <strong className="text-slate-800">
                        {selectedEntity.data.fuel_level_percent || selectedEntity.data.fuelLevelPct || 85}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Driver</span>
                    <strong className="text-slate-800">
                      {selectedEntity.data.driver_name || selectedEntity.data.driverName || 'Assigned Driver'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone</span>
                    <span className="font-mono text-brand-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedEntity.data.driver_phone || selectedEntity.data.driverPhone || '+91 98765 43210'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Incident Details */}
            {selectedEntity.type === 'incident' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-sm">
                      {selectedEntity.data.title || selectedEntity.data.incident_type}
                    </h5>
                    <StatusBadge status={selectedEntity.data.severity} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedEntity.data.highway || selectedEntity.data.location_name} • {selectedEntity.data.state || 'NER Sector'}
                  </p>
                </div>

                <p className="rounded-xl bg-rose-50/50 p-3 text-slate-700 border border-rose-100 text-[11px] leading-relaxed">
                  {selectedEntity.data.description}
                </p>

                <div className="rounded-xl bg-slate-900 text-slate-200 p-3 shadow-sm border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Intelligence Assessment</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Passable Heavy Vehicles:</span>
                    <strong className="text-white font-mono">
                      {selectedEntity.data.passable_by_heavy_vehicles ? 'YES' : 'NO (Blocked)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Est. Clearance Time:</span>
                    <strong className="text-amber-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedEntity.data.estimated_clearance_hours || 12} hours
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Route Details */}
            {selectedEntity.type === 'route' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-sm">
                      {selectedEntity.data.title || selectedEntity.data.name || 'Logistics Corridor'}
                    </h5>
                    <span className="font-mono font-bold text-xs text-emerald-600">
                      Score: {((selectedEntity.data.safety_score || 0.95) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedEntity.data.summary || selectedEntity.data.corridor}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Distance</span>
                    <strong className="text-slate-800">{selectedEntity.data.distance_km || selectedEntity.data.distanceKm} km</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Transit Duration</span>
                    <strong className="text-emerald-600 font-mono">
                      {selectedEntity.data.estimated_duration_hours} hrs
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Road Details */}
            {selectedEntity.type === 'road' && (
              <div className="space-y-3 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">{selectedEntity.data.road_name}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedEntity.data.highway_code} • {selectedEntity.data.state} Sector
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Status</span>
                    <strong className={`font-mono ${selectedEntity.data.status === 'BLOCKED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {selectedEntity.data.status}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Risk Level</span>
                    <strong className="text-amber-600 font-mono">
                      {(selectedEntity.data.current_risk_score * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GisMapPage;

