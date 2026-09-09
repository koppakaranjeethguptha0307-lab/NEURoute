import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';
import { mockNerBoundaryGeoJSON, mockNerStateCapitals } from '../services/mockData';

// Road status colors conforming to NEURote domain enum (OPEN, RISKY, BLOCKED, UNKNOWN)
const ROAD_STYLES = {
  OPEN: {
    color: '#10b981', // Solid emerald green
    weight: 4,
    opacity: 0.9,
    lineCap: 'round',
  },
  RISKY: {
    color: '#f59e0b', // Solid amber
    weight: 4.5,
    opacity: 0.95,
    lineCap: 'round',
  },
  BLOCKED: {
    color: '#ef4444', // RED DASHED LINE
    weight: 5,
    opacity: 1.0,
    dashArray: '8, 8',
    lineCap: 'square',
  },
  UNKNOWN: {
    color: '#6b7280', // Neutral grey
    weight: 3,
    opacity: 0.7,
    lineCap: 'round',
  },
};

// SVG Markers Generator for Leaflet
function createCustomMarker(svgContent, bgCircle = '#0f172a', borderColor = '#06b6d4', size = 32) {
  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bgCircle};
      border: 2px solid ${borderColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      cursor: pointer;
    ">
      ${svgContent}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Icons
const INCIDENT_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const VEHICLE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const HUB_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Geographic bounds of Northeast India (Sikkim to Arunachal & Mizoram/Tripura)
const NER_STRICT_BOUNDS = L.latLngBounds([21.2, 87.5], [29.8, 97.6]);

export const MapComponent = ({
  roadsGeoJSON,
  incidents,
  hazards,
  hubs,
  vehicles,
  routePlan,
  activeCenter,
  activeZoom,
  onSelectEntity,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerControlRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Layer groups refs with dedicated NER Boundary and State Capitals layers
  const layersRef = useRef({
    nerBoundary: L.layerGroup(),
    nerCapitals: L.layerGroup(),
    roads: L.layerGroup(),
    incidents: L.layerGroup(),
    hazards: L.layerGroup(),
    hubs: L.layerGroup(),
    vehicles: L.layerGroup(),
    routes: L.layerGroup(),
  });

  // 1. Map Initialization with Northeast India Focus & Max Bounds
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Standard OpenStreetMap base tile layer (Default - No watermark / completely open)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    // Dark Basemap tile layer
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    // Terrain Basemap tile layer
    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenTopoMap contributors',
      maxZoom: 17,
    });

    // Create Map strictly centered and bounded to Northeast India
    const map = L.map(mapContainerRef.current, {
      center: activeCenter || [26.15, 93.0],
      zoom: activeZoom || 7.2,
      minZoom: 6.5,
      maxZoom: 18,
      maxBounds: NER_STRICT_BOUNDS,
      maxBoundsViscosity: 0.92,
      layers: [
        osmLayer,
        layersRef.current.nerBoundary,
        layersRef.current.nerCapitals,
        layersRef.current.roads,
        layersRef.current.incidents,
        layersRef.current.routes,
        layersRef.current.vehicles,
      ],
      zoomControl: false,
    });

    // Move zoom control to bottom right for cleaner layout
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Base maps
    const baseMaps = {
      'OpenStreetMap Standard (Default)': osmLayer,
      'Carto Dark Matter': darkLayer,
      'OpenTopo Terrain': terrainLayer,
    };

    // Overlay layers controlled via Leaflet's own layer control
    const overlayMaps = {
      '🇮🇳 NER Regional Boundary': layersRef.current.nerBoundary,
      '🏛️ NER State Capitals & Gateways': layersRef.current.nerCapitals,
      '🛣️ Road Segments (GeoJSON)': layersRef.current.roads,
      '⚠️ Active Incidents': layersRef.current.incidents,
      '⚡ Regional Hazard Zones': layersRef.current.hazards,
      '🏢 Logistics Hubs': layersRef.current.hubs,
      '🚛 Fleet Vehicles Telemetry': layersRef.current.vehicles,
      '📍 AI Planned / Alternate Routes': layersRef.current.routes,
    };

    const layerControl = L.control.layers(baseMaps, overlayMaps, {
      position: 'topright',
      collapsed: false,
    });
    layerControl.addTo(map);
    layerControlRef.current = layerControl;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Center / Zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current && activeCenter && activeZoom) {
      mapInstanceRef.current.flyTo(activeCenter, activeZoom, {
        duration: 1.2,
      });
    }
  }, [activeCenter, activeZoom]);

  // Toggle Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // 2. Render Northeast India (NER) Boundary Outline Layer
  useEffect(() => {
    const boundaryLayer = layersRef.current.nerBoundary;
    boundaryLayer.clearLayers();

    if (!mockNerBoundaryGeoJSON) return;

    const geoJsonLayer = L.geoJSON(mockNerBoundaryGeoJSON, {
      style: {
        color: '#0284c7', // High-tech Sky Blue / Cyan
        weight: 2.5,
        dashArray: '6, 6',
        opacity: 0.85,
        fillColor: '#0284c7',
        fillOpacity: 0.03,
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        layer.bindPopup(`
          <div style="min-width: 240px;">
            <div class="popup-title" style="color: #38bdf8;">
              🇮🇳 ${props.region_name || 'Northeast India (NER)'}
            </div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:4px; line-height:1.4;">
              ${props.description || ''}
            </div>
            <div style="margin-top:6px; font-size:11px; color:#94a3b8;">
              <strong>8 States:</strong> ${props.states ? props.states.join(', ') : 'All NER'}
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">
              <strong>Total Theater Area:</strong> 262,179 km²
            </div>
            <div style="font-size:11px; color:#fbbf24; margin-top:2px; font-weight:600;">
              98% International Border Perimeter (Bangladesh, Bhutan, China, Myanmar)
            </div>
          </div>
        `);
      },
    });

    boundaryLayer.addLayer(geoJsonLayer);
  }, []);

  // 3. Render Northeast India 8 State Capitals & Strategic Gateways Layer
  useEffect(() => {
    const capitalsLayer = layersRef.current.nerCapitals;
    capitalsLayer.clearLayers();

    if (!mockNerStateCapitals || !mockNerStateCapitals.length) return;

    mockNerStateCapitals.forEach((cap) => {
      const isGateway = cap.is_main_gateway;
      const html = `
        <div class="ner-capital-marker ${isGateway ? 'gateway' : ''}">
          <div class="capital-dot"></div>
          <div class="capital-label">${cap.name.split('/')[0]}</div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'custom-capital-icon',
        iconSize: [110, 26],
        iconAnchor: [55, 13],
        popupAnchor: [0, -12],
      });

      const marker = L.marker(cap.coordinates, { icon });
      marker.bindPopup(`
        <div style="min-width: 210px;">
          <div class="popup-title" style="color: #38bdf8;">
            🏛️ ${cap.name} (${cap.state})
          </div>
          <div style="font-size:11px; color:#f59e0b; font-weight:600; margin-top:2px;">
            ${cap.tag}
          </div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:4px; line-height:1.4;">
            ${cap.description}
          </div>
        </div>
      `);

      capitalsLayer.addLayer(marker);
    });
  }, []);

  // 4. Render Road Segments Layer (OPEN, RISKY, BLOCKED=red dashed, UNKNOWN)
  useEffect(() => {
    const roadsLayer = layersRef.current.roads;
    roadsLayer.clearLayers();

    if (!roadsGeoJSON || !roadsGeoJSON.features) return;

    const geoJsonLayer = L.geoJSON(roadsGeoJSON, {
      style: (feature) => {
        const status = feature.properties?.current_status || 'UNKNOWN';
        return ROAD_STYLES[status] || ROAD_STYLES.UNKNOWN;
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const status = p.current_status || 'UNKNOWN';

        const popupContent = `
          <div style="min-width: 200px;">
            <div class="popup-title">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${
                status === 'OPEN' ? '#10b981' : status === 'RISKY' ? '#f59e0b' : status === 'BLOCKED' ? '#ef4444' : '#6b7280'
              };"></span>
              ${p.name || 'Road Segment'}
            </div>
            <table style="width:100%; font-size:11px; border-collapse:collapse; margin-top:6px;">
              <tr><td style="color:#94a3b8; padding:2px 0;">Code:</td><td style="font-weight:600;">${p.segment_code || 'N/A'}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Highway:</td><td style="font-weight:600;">${p.highway_number || 'N/A'}</td></tr>
              ${p.state ? `<tr><td style="color:#94a3b8; padding:2px 0;">State:</td><td style="font-weight:600; color:#38bdf8;">${p.state}</td></tr>` : ''}
              <tr><td style="color:#94a3b8; padding:2px 0;">Status:</td><td style="font-weight:700; color:${
                status === 'BLOCKED' ? '#f87171' : status === 'RISKY' ? '#fbbf24' : '#34d399'
              };">${status}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Length:</td><td>${p.length_km ? `${p.length_km} km` : 'N/A'}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Risk Score:</td><td>${p.risk_score !== undefined ? p.risk_score : 'N/A'}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Lifeline:</td><td>${p.is_critical_lifeline ? 'Yes (Critical)' : 'No'}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Speed Limit:</td><td>${p.speed_limit_kmh ? `${p.speed_limit_kmh} km/h` : 'N/A'}</td></tr>
            </table>
          </div>
        `;
        layer.bindPopup(popupContent);

        layer.on('click', () => {
          if (onSelectEntity) {
            onSelectEntity({ type: 'road', data: p });
          }
        });
      },
    });

    roadsLayer.addLayer(geoJsonLayer);
  }, [roadsGeoJSON, onSelectEntity]);

  // 3. Render Incidents Layer
  useEffect(() => {
    const incidentsLayer = layersRef.current.incidents;
    incidentsLayer.clearLayers();

    if (!incidents || !incidents.length) return;

    incidents.forEach((inc) => {
      const lat = inc.latitude;
      const lng = inc.longitude;
      if (!lat || !lng) return;

      const marker = L.marker([lat, lng], {
        icon: createCustomMarker(INCIDENT_SVG, '#450a0a', '#ef4444', 34),
      });

      const popupContent = `
        <div style="min-width: 220px;">
          <div class="popup-title" style="color:#fca5a5;">
            ⚠️ ${inc.title || 'Incident'}
          </div>
          <table style="width:100%; font-size:11px; border-collapse:collapse; margin-top:6px;">
            <tr><td style="color:#94a3b8; padding:2px 0;">Category:</td><td style="font-weight:600;">${inc.category || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Severity:</td><td style="font-weight:700; color:#ef4444;">${inc.severity || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Status:</td><td style="font-weight:600;">${inc.status || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Blocked Lanes:</td><td>${inc.blocked_lanes ?? 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Passable (Heavy):</td><td>${inc.passable_by_heavy_vehicles ? 'Yes' : 'No (Impasse)'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Clearance Est:</td><td>${inc.estimated_clearance_hours ? `${inc.estimated_clearance_hours} hrs` : 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Reported At:</td><td>${inc.reported_at ? new Date(inc.reported_at).toLocaleTimeString() : 'N/A'}</td></tr>
          </table>
          ${inc.description ? `<div style="font-size:11px; color:#cbd5e1; margin-top:6px; border-top:1px solid #334155; padding-top:4px;">${inc.description}</div>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectEntity) {
          onSelectEntity({ type: 'incident', data: inc });
        }
      });

      incidentsLayer.addLayer(marker);
    });
  }, [incidents, onSelectEntity]);

  // 4. Render Hazard Zones Layer
  useEffect(() => {
    const hazardsLayer = layersRef.current.hazards;
    hazardsLayer.clearLayers();

    if (!hazards || !hazards.length) return;

    hazards.forEach((hz) => {
      if (!hz.latitude || !hz.longitude) return;

      const circle = L.circle([hz.latitude, hz.longitude], {
        radius: (hz.radius_km || 5) * 1000,
        color: hz.severity === 'CRITICAL' ? '#dc2626' : '#ea580c',
        fillColor: hz.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 6',
      });

      const popupContent = `
        <div style="min-width: 180px;">
          <div class="popup-title" style="color:#fdba74;">
            ⚡ ${hz.name || 'Hazard Hotspot'}
          </div>
          <table style="width:100%; font-size:11px; border-collapse:collapse; margin-top:4px;">
            <tr><td style="color:#94a3b8; padding:2px 0;">Type:</td><td>${hz.hazard_type || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Severity:</td><td style="font-weight:600; color:#f97316;">${hz.severity || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">State:</td><td>${hz.state || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Radius:</td><td>${hz.radius_km ? `${hz.radius_km} km` : 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Active:</td><td>${hz.is_active ? 'Yes' : 'No'}</td></tr>
          </table>
        </div>
      `;
      circle.bindPopup(popupContent);

      circle.on('click', () => {
        if (onSelectEntity) {
          onSelectEntity({ type: 'hazard', data: hz });
        }
      });

      hazardsLayer.addLayer(circle);
    });
  }, [hazards, onSelectEntity]);

  // 5. Render Logistics Hubs Layer
  useEffect(() => {
    const hubsLayer = layersRef.current.hubs;
    hubsLayer.clearLayers();

    if (!hubs || !hubs.length) return;

    hubs.forEach((hub) => {
      if (!hub.latitude || !hub.longitude) return;

      const marker = L.marker([hub.latitude, hub.longitude], {
        icon: createCustomMarker(HUB_SVG, '#3b0764', '#c084fc', 32),
      });

      const popupContent = `
        <div style="min-width: 200px;">
          <div class="popup-title" style="color:#e9d5ff;">
            🏢 ${hub.name || 'Logistics Hub'}
          </div>
          <table style="width:100%; font-size:11px; border-collapse:collapse; margin-top:4px;">
            <tr><td style="color:#94a3b8; padding:2px 0;">Type:</td><td style="font-weight:600;">${hub.hub_type || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">State:</td><td>${hub.state || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Capacity:</td><td>${hub.capacity_tonnes ? `${hub.capacity_tonnes} tonnes` : 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Emergency Depot:</td><td>${hub.is_emergency_depot ? 'Yes (Lifeline)' : 'Standard'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Contact:</td><td>${hub.contact_phone || 'N/A'}</td></tr>
          </table>
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectEntity) {
          onSelectEntity({ type: 'hub', data: hub });
        }
      });

      hubsLayer.addLayer(marker);
    });
  }, [hubs, onSelectEntity]);

  // 6. Render Vehicles Layer
  useEffect(() => {
    const vehiclesLayer = layersRef.current.vehicles;
    vehiclesLayer.clearLayers();

    if (!vehicles || !vehicles.length) return;

    vehicles.forEach((v) => {
      if (!v.current_lat || !v.current_lng) return;

      const marker = L.marker([v.current_lat, v.current_lng], {
        icon: createCustomMarker(VEHICLE_SVG, '#082f49', '#38bdf8', 34),
      });

      const popupContent = `
        <div style="min-width: 220px;">
          <div class="popup-title" style="color:#7dd3fc;">
            🚛 ${v.registration_number || 'Vehicle'}
          </div>
          <table style="width:100%; font-size:11px; border-collapse:collapse; margin-top:4px;">
            <tr><td style="color:#94a3b8; padding:2px 0;">Type:</td><td style="font-weight:600;">${v.vehicle_type || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Status:</td><td style="font-weight:700; color:#38bdf8;">${v.status || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Speed:</td><td>${v.speed_kmh !== undefined ? `${v.speed_kmh} km/h` : '0 km/h'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Heading:</td><td>${v.heading_deg !== undefined ? `${v.heading_deg}°` : 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Fuel Level:</td><td>${v.fuel_level_percent !== undefined ? `${v.fuel_level_percent}%` : 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Driver:</td><td>${v.driver_name || 'Unassigned'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Driver Phone:</td><td>${v.driver_phone || 'N/A'}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Telemetry:</td><td>${v.last_telemetry_at ? new Date(v.last_telemetry_at).toLocaleTimeString() : 'Live'}</td></tr>
          </table>
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectEntity) {
          onSelectEntity({ type: 'vehicle', data: v });
        }
      });

      vehiclesLayer.addLayer(marker);
    });
  }, [vehicles, onSelectEntity]);

  // 7. Render AI Routes Layer
  useEffect(() => {
    const routesLayer = layersRef.current.routes;
    routesLayer.clearLayers();

    if (!routePlan) return;

    const allRoutes = [];
    if (routePlan.recommended_route) {
      allRoutes.push(routePlan.recommended_route);
    }
    if (routePlan.alternative_routes && routePlan.alternative_routes.length) {
      allRoutes.push(...routePlan.alternative_routes);
    }

    allRoutes.forEach((route) => {
      if (!route.geometry_coordinates || !route.geometry_coordinates.length) return;

      const latLngs = route.geometry_coordinates.map((coord) => [coord[1], coord[0]]);

      let strokeColor = '#3b82f6';
      let dashPattern = null;
      let strokeWidth = 4;

      if (route.criterion === 'SAFEST') {
        strokeColor = '#10b981'; // Emerald Green
        strokeWidth = 5.5;
      } else if (route.criterion === 'FASTEST') {
        strokeColor = route.blocked_segments_count > 0 ? '#ef4444' : '#f59e0b';
        dashPattern = route.blocked_segments_count > 0 ? '6, 8' : null;
        strokeWidth = 4;
      } else if (route.criterion === 'PRIORITY') {
        strokeColor = '#06b6d4'; // Cyan
        strokeWidth = 4.5;
      }

      const polyline = L.polyline(latLngs, {
        color: strokeColor,
        weight: strokeWidth,
        opacity: route.is_recommended ? 0.95 : 0.65,
        dashArray: dashPattern,
        lineCap: 'round',
      });

      const popupContent = `
        <div style="min-width: 240px;">
          <div class="popup-title" style="color:${strokeColor};">
            ${route.is_recommended ? '⭐ RECOMMENDED: ' : ''}${route.title || 'Route Option'}
          </div>
          <div style="font-size:11px; color:#cbd5e1; margin-bottom:6px;">${route.summary || ''}</div>
          <table style="width:100%; font-size:11px; border-collapse:collapse;">
            <tr><td style="color:#94a3b8; padding:2px 0;">Criterion:</td><td style="font-weight:700; color:${strokeColor};">${route.criterion}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Distance:</td><td style="font-weight:600;">${route.distance_km} km</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Est Duration:</td><td>${route.estimated_duration_hours} hrs</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Safety Score:</td><td>${route.safety_score * 100}%</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Delay Hours:</td><td>+${route.estimated_delay_hours} hrs</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Blocked Bottlenecks:</td><td style="color:${route.blocked_segments_count > 0 ? '#ef4444' : '#10b981'}; font-weight:600;">${route.blocked_segments_count}</td></tr>
          </table>
          ${
            route.ai_explanation && route.ai_explanation.length
              ? `
              <div style="margin-top:6px; border-top:1px solid #334155; padding-top:4px;">
                <div style="font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase;">AI Rationale:</div>
                <ul style="padding-left:14px; font-size:10px; color:#e2e8f0; margin-top:2px;">
                  ${route.ai_explanation.map((e) => `<li>${e}</li>`).join('')}
                </ul>
              </div>
            `
              : ''
          }
        </div>
      `;
      polyline.bindPopup(popupContent);

      polyline.on('click', () => {
        if (onSelectEntity) {
          onSelectEntity({ type: 'route', data: route });
        }
      });

      routesLayer.addLayer(polyline);
    });
  }, [routePlan, onSelectEntity]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapContainerRef}
        id="neuroute-gis-map"
        className="map-canvas"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '12px',
          zIndex: 400,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(51, 65, 85, 0.7)',
          borderRadius: '8px',
          padding: '8px',
          color: '#f8fafc',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
};

export default MapComponent;
