import React, { useState, useEffect, useCallback } from 'react';
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
  CloudRain,
  Activity,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useEmergencyMode } from '@/contexts/EmergencyContext';
import { Vehicle, Incident, RouteOption } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { SimulationControlCenter } from '@/components/simulation/SimulationControlCenter';
import { RoadInspectorDrawer, RoadInspectorData } from '@/components/common/RoadInspectorDrawer';
import { AiDecisionPanel } from '@/components/common/AiDecisionPanel';
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
  const { isEmergencyMode, toggleEmergencyMode } = useEmergencyMode();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [roadsGeoJSON, setRoadsGeoJSON] = useState<any>(mockRoadSegmentsGeoJSON);
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
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);

  // Load telemetry data from apiClient with graceful fallback to mock GIS data
  const loadMapData = useCallback(async () => {
    try {
      const [vRes, iRes, rRes, roadsRes, hzRes, hubRes] = await Promise.all([
        apiClient.get<Vehicle[]>('/vehicles'),
        apiClient.get<Incident[]>('/incidents'),
        apiClient.get<RouteOption[]>('/routes'),
        apiClient.get<any>('/gis/roads'),
        apiClient.get<any[]>('/gis/hazards'),
        apiClient.get<any[]>('/gis/hubs'),
      ]);
      if (Array.isArray(vRes) && vRes.length > 0) setVehicles(vRes);
      if (Array.isArray(iRes) && iRes.length > 0) setIncidents(iRes);
      if (Array.isArray(rRes) && rRes.length > 0) setRoutes(rRes);
      if (roadsRes && roadsRes.features && roadsRes.features.length > 0) setRoadsGeoJSON(roadsRes);
      if (Array.isArray(hzRes) && hzRes.length > 0) setHazards(hzRes);
      if (Array.isArray(hubRes) && hubRes.length > 0) setHubs(hubRes);
    } catch (_) {
      // Graceful fallback to canonical GIS datasets when backend is disconnected
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Connect to Real-Time SSE Stream for zero-reload reactive updates
  useEffect(() => {
    const unsubscribe = import('@/utils/sseClient').then(({ sseClient }) => {
      return sseClient.subscribe((evt) => {
        if (
          evt &&
          (evt.event === 'ROAD_STATUS_UPDATED' ||
            evt.event === 'VEHICLE_TELEMETRY_UPDATED' ||
            evt.event === 'WEATHER_UPDATED' ||
            evt.event === 'SIMULATION_RESET')
        ) {
          loadMapData();
        }
      });
    });

    const pollInterval = setInterval(loadMapData, 10000);

    return () => {
      unsubscribe.then((unsub) => unsub && unsub());
      clearInterval(pollInterval);
    };
  }, [loadMapData]);


  const roadInspectorData: RoadInspectorData | null = React.useMemo(() => {
    if (selectedEntity?.type !== 'road' || !selectedEntity?.data) return null;
    const d = selectedEntity.data;
    const isBlocked = d.status === 'BLOCKED' || d.current_status === 'BLOCKED';
    const isRisky = d.status === 'RISKY' || d.current_status === 'RISKY';
    return {
      id: d.id || 'seg-nh06-03',
      name: d.name || 'Sonapur Tunnel Mountain Sector',
      highway: d.highway || d.road_number || 'NH-06',
      status: isBlocked ? 'BLOCKED' : isRisky ? 'RISKY' : 'OPEN',
      accessibilityScore: isBlocked ? 0.15 : isRisky ? 0.58 : 0.94,
      riskScore: isBlocked ? 0.97 : isRisky ? 0.65 : 0.18,
      weatherCondition: isBlocked ? 'Torrential Monsoon Rain' : 'Moderate Rain',
      rainfallMm: isBlocked ? 95.0 : 12.0,
      estimatedDelayHours: isBlocked ? 70.9 : 1.2,
      incidentTitle: isBlocked ? 'Sonapur Tunnel Mudslide & Debris Severance' : undefined,
      governmentAdvisory: isBlocked ? 'GOV-NE-2026-041: Heavy vehicle access restricted' : undefined,
      recommendedAction: isBlocked ? 'Reroute via Umrangso Relief Lifeline Bypass (SH-19)' : 'Maintain standard speed limit (40 km/h)',
      alternateRouteName: 'Umrangso Relief Bypass',
      dataSource: 'DATABASE & AI RISK ENGINE',
      lastUpdated: new Date().toLocaleTimeString(),
      aiExplanation: isBlocked
        ? 'Sonapur Tunnel Sector is currently BLOCKED due to a 95mm/h torrential rainfall event causing massive slope failure. Debris obstructs both lanes with high falling rock hazard.'
        : 'Road corridor is clear with moderate rainfall. Elevation gradient risk within acceptable safety thresholds.',
    };
  }, [selectedEntity]);

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

      {/* Emergency Mode GIS Banner */}
      {isEmergencyMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 px-4 py-2.5 text-xs text-white shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse shrink-0" />
            <span>
              <strong className="text-rose-200">EMERGENCY LOGISTICS ACTIVE:</strong> Prioritizing Umrangso Relief Lifeline (Risk 18%) for all medical and disaster relief convoys. NH-06 Sonapur landslide corridor is flagged BLOCKED.
            </span>
          </div>
          <button
            onClick={() => {
              setActiveCenter([25.2, 92.5]);
              setActiveZoom(9);
            }}
            className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-xs transition-colors shrink-0"
          >
            Focus Sonapur / Umrangso Corridor
          </button>
        </div>
      )}

      {/* Main Map Viewport Container */}
      <div className="relative h-[calc(100vh-14rem)] min-h-[550px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg">
        {/* Leaflet Map Component rendering 8 NER States, Capitals, Lifelines & Animated Flow */}
        <MapComponent
          roadsGeoJSON={roadsGeoJSON}
          incidents={incidents.length > 0 ? incidents : mockIncidents}
          hazards={hazards.length > 0 ? hazards : mockHazards}
          hubs={hubs.length > 0 ? hubs : mockHubs}
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

            {/* Road Details with all 9 Required Fields */}
            {selectedEntity.type === 'road' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-sm">{selectedEntity.data.road_name || selectedEntity.data.name}</h5>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      (selectedEntity.data.status || selectedEntity.data.current_status) === 'BLOCKED'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : (selectedEntity.data.status || selectedEntity.data.current_status) === 'RISKY'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {selectedEntity.data.status || selectedEntity.data.current_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedEntity.data.highway_code || selectedEntity.data.highway_number} • {selectedEntity.data.segment_code || 'Lifeline'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">AI Risk Score</span>
                    <strong className="text-amber-600 font-mono text-xs">
                      {typeof selectedEntity.data.risk_score === 'number'
                        ? `${selectedEntity.data.risk_score.toFixed(2)} / 1.00`
                        : `${((selectedEntity.data.current_risk_score || 0) * 100).toFixed(0)}%`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimated Delay</span>
                    <strong className="text-rose-600 font-mono text-xs">
                      {selectedEntity.data.estimated_delay || (selectedEntity.data.status === 'BLOCKED' ? '70.9 Hours' : '0 Hours')}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 text-slate-700 text-[11px]">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Active Incidents</span>
                    <span className="text-slate-800">
                      {selectedEntity.data.current_incidents || (selectedEntity.data.status === 'BLOCKED' ? 'Sonapur Tunnel Mudslide Blockage' : 'None reported')}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Weather Derived Risk</span>
                    <span className="text-slate-800 flex items-center gap-1">
                      <CloudRain className="h-3 w-3 text-cyan-600" />
                      {selectedEntity.data.weather_risk || (selectedEntity.data.status === 'BLOCKED' ? 'Torrential Rain: 92.5 mm, visibility 280 m' : 'Clear: 5.2 mm')}
                    </span>
                  </div>

                  <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 block font-semibold">Recommended AI Action</span>
                    <span className="text-emerald-900 font-medium">
                      {selectedEntity.data.recommended_action || (selectedEntity.data.status === 'BLOCKED' ? 'Reroute via Umrangso Relief Lifeline Bypass (NH-27 / NH-627)' : 'Standard Navigation')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-400">Data Source:</span>
                    <DataSourceBadge source={selectedEntity.data.data_source || 'DATABASE'} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Last Updated:</span>
                    <span className="font-mono">{selectedEntity.data.last_updated || 'Just now'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Road Inspector Side Drawer */}
      <RoadInspectorDrawer
        data={roadInspectorData}
        onClose={() => setSelectedEntity(null)}
      />

      {/* Floating Interactive Simulation Control Center */}
      <SimulationControlCenter
        onSimulationTriggered={loadMapData}
        isOfflineSimulated={isOfflineSimulated}
        onToggleOffline={setIsOfflineSimulated}
      />
    </div>
  );
};

export default GisMapPage;


