import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Truck,
  AlertTriangle,
  Navigation,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  Sparkles,
  Phone,
  Clock,
  Gauge,
  Fuel,
  X,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Vehicle, Incident, RouteOption } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';

// Pre-defined regional bounding presets for fast pan & zoom
const REGION_PRESETS = [
  { name: 'All NER Region', center: [26.1445, 92.5] as [number, number], zoom: 7 },
  { name: 'Guwahati Hub (Assam)', center: [26.1445, 91.7362] as [number, number], zoom: 11 },
  { name: 'Kohima - Imphal (NH-29)', center: [25.2, 94.0] as [number, number], zoom: 9 },
  { name: 'Shillong - Silchar (NH-6)', center: [25.2, 92.3] as [number, number], zoom: 9 },
  { name: 'Tezpur - Itanagar (NH-15)', center: [26.8, 93.2] as [number, number], zoom: 9 },
  { name: 'Sikkim Himalayan (NH-10)', center: [27.2, 88.5] as [number, number], zoom: 10 },
];

const BASEMAP_TILES = {
  standard: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  topo: {
    name: 'OpenTopo (Terrain)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap &copy; OpenStreetMap',
  },
  dark: {
    name: 'Carto Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
};

export const GisMapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const layersGroupRef = useRef<any>({
    vehicles: null,
    incidents: null,
    routes: null,
    tileLayer: null,
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'vehicle' | 'incident' | 'route';
    data: any;
  } | null>(null);

  // Layer Toggles
  const [showVehicles, setShowVehicles] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<'standard' | 'topo' | 'dark'>('standard');
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Load telemetry data from apiClient
  useEffect(() => {
    async function loadMapData() {
      try {
        const [vRes, iRes, rRes] = await Promise.all([
          apiClient.get<Vehicle[]>('/vehicles'),
          apiClient.get<Incident[]>('/incidents'),
          apiClient.get<RouteOption[]>('/routes'),
        ]);
        setVehicles(Array.isArray(vRes) ? vRes : []);
        setIncidents(Array.isArray(iRes) ? iRes : []);
        setRoutes(Array.isArray(rRes) ? rRes : []);
      } catch (err) {
        console.error('Failed to load GIS map data:', err);
      }
    }
    loadMapData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Dynamically check or load Leaflet from window or import
    const initLeaflet = async () => {
      let L = (window as any).L;
      if (!L) {
        try {
          const leafletModule = await import('leaflet');
          L = leafletModule.default || leafletModule;
          (window as any).L = L;
        } catch {
          console.warn('Leaflet package loading from global/CDN');
        }
      }

      if (!L || leafletMapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [26.1445, 92.5],
        zoom: 7,
        zoomControl: false,
      });

      leafletMapRef.current = map;

      // Base tile layer
      const tileConfig = BASEMAP_TILES[basemap];
      layersGroupRef.current.tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 18,
      }).addTo(map);

      // Layer groups
      layersGroupRef.current.routes = L.layerGroup().addTo(map);
      layersGroupRef.current.incidents = L.layerGroup().addTo(map);
      layersGroupRef.current.vehicles = L.layerGroup().addTo(map);

      setIsMapReady(true);
    };

    initLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    const L = (window as any).L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (layersGroupRef.current.tileLayer) {
      map.removeLayer(layersGroupRef.current.tileLayer);
    }

    const tileConfig = BASEMAP_TILES[basemap];
    layersGroupRef.current.tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 18,
    }).addTo(map);
  }, [basemap]);

  // Render / Update Markers and Polylines on Map
  useEffect(() => {
    const L = (window as any).L;
    const map = leafletMapRef.current;
    if (!map || !L || !isMapReady) return;

    // --- 1. RENDER CORRIDOR POLYLINES ---
    const routesGroup = layersGroupRef.current.routes;
    routesGroup.clearLayers();

    if (showRoutes && routes.length > 0) {
      routes.forEach((route) => {
        const latLngs = route.waypoints.map((w) => [w.lat, w.lng]);
        const isHighRisk = route.riskScore > 60;
        const color = isHighRisk ? '#EF4444' : route.recommended ? '#10B981' : '#3B82F6';

        const polyline = L.polyline(latLngs, {
          color,
          weight: 5,
          opacity: 0.8,
          dashArray: isHighRisk ? '6, 8' : undefined,
        });

        polyline.on('click', () => {
          setSelectedEntity({ type: 'route', data: route });
        });

        polyline.bindTooltip(
          `<strong>${route.name}</strong><br/>Risk Score: ${route.riskScore}% | Delay: +${route.predictedDelayMinutes}m`,
          { sticky: true }
        );

        routesGroup.addLayer(polyline);
      });
    }

    // --- 2. RENDER INCIDENT HAZARD PINS ---
    const incidentsGroup = layersGroupRef.current.incidents;
    incidentsGroup.clearLayers();

    if (showIncidents && incidents.length > 0) {
      incidents.forEach((inc) => {
        const isCritical = inc.severity === 'critical' || inc.severity === 'high';
        const pinColor = isCritical ? 'bg-rose-500' : 'bg-amber-500';
        const ringColor = isCritical ? 'border-rose-300 ring-rose-500/30' : 'border-amber-300 ring-amber-500/30';

        const incidentIcon = L.divIcon({
          className: 'custom-incident-pin',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <span class="absolute h-8 w-8 rounded-full ${pinColor} opacity-75 animate-ping"></span>
              <div class="relative flex h-7 w-7 items-center justify-center rounded-full ${pinColor} text-white shadow-lg border-2 ${ringColor} ring-4 transition-transform group-hover:scale-125">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([inc.lat, inc.lng], { icon: incidentIcon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'incident', data: inc });
        });
        incidentsGroup.addLayer(marker);
      });
    }

    // --- 3. RENDER VEHICLE FLEET PINS ---
    const vehiclesGroup = layersGroupRef.current.vehicles;
    vehiclesGroup.clearLayers();

    if (showVehicles && vehicles.length > 0) {
      vehicles.forEach((veh) => {
        const isDelayed = veh.status === 'delayed';
        const isIdle = veh.status === 'idle' || veh.status === 'maintenance';
        const badgeColor = isDelayed ? 'bg-amber-500' : isIdle ? 'bg-slate-500' : 'bg-brand-600';

        const vehicleIcon = L.divIcon({
          className: 'custom-vehicle-pin',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl ${badgeColor} text-white shadow-md border-2 border-white ring-2 ring-slate-900/10 transition-transform group-hover:scale-125">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([veh.lat, veh.lng], { icon: vehicleIcon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'vehicle', data: veh });
        });
        vehiclesGroup.addLayer(marker);
      });
    }
  }, [vehicles, incidents, routes, showVehicles, showIncidents, showRoutes, isMapReady]);

  // Zoom / Pan helper
  const handleFlyTo = (center: [number, number], zoom: number) => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(center, zoom, { duration: 1.2 });
    }
  };

  const handleZoom = (delta: number) => {
    if (leafletMapRef.current) {
      const curZoom = leafletMapRef.current.getZoom();
      leafletMapRef.current.setZoom(curZoom + delta);
    }
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

        {/* Right: Layer Toggles & Basemap */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicles Layer Toggle */}
          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              showVehicles
                ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Vehicles ({vehicles.length})</span>
          </button>

          {/* Incidents Layer Toggle */}
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              showIncidents
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Hazards ({incidents.length})</span>
          </button>

          {/* Corridors / Routes Toggle */}
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              showRoutes
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Corridors ({routes.length})</span>
          </button>

          {/* Basemap Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setBasemap('standard')}
              className={`rounded-md px-2 py-1 font-medium transition-all ${
                basemap === 'standard' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setBasemap('topo')}
              className={`rounded-md px-2 py-1 font-medium transition-all ${
                basemap === 'topo' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Terrain
            </button>
            <button
              onClick={() => setBasemap('dark')}
              className={`rounded-md px-2 py-1 font-medium transition-all ${
                basemap === 'dark' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport Container */}
      <div className="relative h-[calc(100vh-14rem)] min-h-[550px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Floating Zoom & Recenter Controls */}
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-md">
          <button
            onClick={() => handleZoom(1)}
            title="Zoom In"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            title="Zoom Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="my-0.5 h-[1px] bg-slate-200" />
          <button
            onClick={() => handleFlyTo([26.1445, 92.5], 7)}
            title="Reset to Full Region"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-brand-600 transition-colors"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </div>

        {/* Floating Legend Overlay */}
        <div className="absolute left-4 bottom-4 z-10 hidden sm:block rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md max-w-xs text-xs">
          <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-brand-600" />
            <span>Map Legend</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-brand-600"></span>
              <span>Fleet Vehicle on Active Route</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Critical Incident / Landslide Hazard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-5 bg-emerald-500 rounded"></span>
              <span>Recommended Logistics Corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-5 bg-rose-500 border-b border-dashed border-white rounded"></span>
              <span>High-Risk Corridor (NH-29 Disrupted)</span>
            </div>
          </div>
        </div>

        {/* Entity Inspector Side Drawer (When marker or route is clicked) */}
        {selectedEntity && (
          <div className="absolute right-4 bottom-4 z-20 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                {selectedEntity.type === 'vehicle' && <Truck className="h-4 w-4 text-brand-600" />}
                {selectedEntity.type === 'incident' && <AlertTriangle className="h-4 w-4 text-rose-600" />}
                {selectedEntity.type === 'route' && <Navigation className="h-4 w-4 text-emerald-600" />}
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
                      {selectedEntity.data.plateNumber}
                    </span>
                    <StatusBadge status={selectedEntity.data.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {selectedEntity.data.vehicleType?.replace('_', ' ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-brand-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Speed</span>
                      <strong className="text-slate-800">{selectedEntity.data.speedKmh} km/h</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fuel Level</span>
                      <strong className="text-slate-800">{selectedEntity.data.fuelLevelPct}%</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Driver</span>
                    <strong className="text-slate-800">{selectedEntity.data.driverName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone</span>
                    <span className="font-mono text-brand-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedEntity.data.driverPhone}
                    </span>
                  </div>
                  {selectedEntity.data.assignedShipmentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Shipment</span>
                      <strong className="font-mono text-slate-800">
                        {selectedEntity.data.assignedShipmentId}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Incident Details */}
            {selectedEntity.type === 'incident' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-sm">{selectedEntity.data.title}</h5>
                    <StatusBadge status={selectedEntity.data.severity} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedEntity.data.highway} • {selectedEntity.data.state}
                  </p>
                </div>

                <p className="rounded-xl bg-rose-50/50 p-3 text-slate-700 border border-rose-100 text-[11px] leading-relaxed">
                  {selectedEntity.data.description}
                </p>

                {selectedEntity.data.aiClassification && (
                  <div className="rounded-xl bg-slate-900 text-slate-200 p-3 shadow-sm border border-slate-800">
                    <div className="flex items-center gap-1.5 text-brand-400 font-semibold mb-1 text-[11px]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI Hazard Analysis</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                      <span className="text-slate-400">Confidence Score:</span>
                      <strong className="text-white font-mono">
                        {(selectedEntity.data.aiClassification.confidence * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-slate-400">Estimated Clearance:</span>
                      <strong className="text-amber-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedEntity.data.aiClassification.predictedClearanceHours} hours
                      </strong>
                    </div>
                    {selectedEntity.data.aiClassification.suggestedDetourName && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400 block mb-0.5">Recommended Detour:</span>
                        <span className="text-emerald-400 font-medium">
                          {selectedEntity.data.aiClassification.suggestedDetourName}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Route Details */}
            {selectedEntity.type === 'route' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-sm">{selectedEntity.data.name}</h5>
                    <span
                      className={`font-mono font-bold text-xs ${
                        selectedEntity.data.riskScore > 60
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      Risk: {selectedEntity.data.riskScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedEntity.data.corridor}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Distance</span>
                    <strong className="text-slate-800">{selectedEntity.data.distanceKm} km</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Predicted Delay</span>
                    <strong className="text-rose-600 font-mono">
                      +{selectedEntity.data.predictedDelayMinutes} min
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Max Elevation Peak:</span>
                  <strong className="text-slate-800 font-mono">
                    {selectedEntity.data.elevationProfile?.maxElevationMeters} m
                  </strong>
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
