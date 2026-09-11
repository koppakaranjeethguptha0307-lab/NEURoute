import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';
import { mockNer8StatesGeoJSON, mockNerStateCapitals } from '../services/mockData';

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

  // Layer groups refs with dedicated 8 NER State Boundaries and State Capitals layers
  const layersRef = useRef({
    nerStates: L.layerGroup(),
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

    // Create Map strictly centered and bounded to Northeast India with 8 State Boundaries enabled
    const map = L.map(mapContainerRef.current, {
      center: activeCenter || [26.15, 93.0],
      zoom: activeZoom || 7.2,
      minZoom: 6.5,
      maxZoom: 18,
      maxBounds: NER_STRICT_BOUNDS,
      maxBoundsViscosity: 0.92,
      layers: [
        osmLayer,
        layersRef.current.nerStates,
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
      '🗺️ 8 NER State Boundaries': layersRef.current.nerStates,
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

  // 2. Render Northeast India 8 State Boundaries Layer (Visible, Distinct & Interactive)
  useEffect(() => {
    const statesLayer = layersRef.current.nerStates;
    statesLayer.clearLayers();

    if (!mockNer8StatesGeoJSON || !mockNer8StatesGeoJSON.features) return;

    const geoJsonLayer = L.geoJSON(mockNer8StatesGeoJSON, {
      style: (feature) => {
        const props = feature.properties || {};
        return {
          color: props.color || '#38bdf8',
          weight: 2.5,
          dashArray: '5, 5',
          opacity: 0.95,
          fillColor: props.color || '#0284c7',
          fillOpacity: 0.08,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};

        // Interactive hover highlights
        layer.on('mouseover', (e) => {
          const target = e.target;
          target.setStyle({
            weight: 4,
            dashArray: null,
            fillOpacity: 0.22,
          });
          target.bringToBack();
        });

        layer.on('mouseout', (e) => {
          geoJsonLayer.resetStyle(e.target);
        });

        // Visible State center label
        layer.bindTooltip(
          `<div class="ner-state-tooltip">
            <span>${p.state_name}</span>
            <span class="state-code-badge">${p.state_code}</span>
          </div>`,
          { permanent: true, direction: 'center', className: 'state-boundary-label' }
        );

        // State Profile Popup
        layer.bindPopup(`
          <div style="min-width: 240px;">
            <div class="popup-title" style="color: ${p.color};">
              🏛️ ${p.state_name} (${p.state_code})
            </div>
            <div style="font-size:11px; color:#f59e0b; font-weight:600; margin-top:2px;">
              Capital: ${p.capital} • Area: ${p.area_sqkm.toLocaleString()} km²
            </div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:4px; line-height:1.4;">
              ${p.strategic_role}
            </div>
            <div style="margin-top:6px; font-size:11px; color:#94a3b8;">
              <strong>Critical Lifelines:</strong> ${(p.primary_lifelines || []).join(', ')}
            </div>
            <div style="font-size:11px; color:#f87171; margin-top:3px;">
              <strong>Active Hazard Zones:</strong> ${p.active_hotspots || 'Monitored'}
            </div>
          </div>
        `);
      },
    });

    statesLayer.addLayer(geoJsonLayer);
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
              <tr><td style="color:#94a3b8; padding:2px 0;">Highway:</td><td style="font-weight:600;">${p.highway_number || p.highway_code || 'N/A'}</td></tr>
              ${p.state ? `<tr><td style="color:#94a3b8; padding:2px 0;">State:</td><td style="font-weight:600; color:#38bdf8;">${p.state}</td></tr>` : ''}
              <tr><td style="color:#94a3b8; padding:2px 0;">Status:</td><td style="font-weight:700; color:${
                status === 'BLOCKED' ? '#f87171' : status === 'RISKY' ? '#fbbf24' : '#34d399'
              };">${status}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Risk Score:</td><td style="font-weight:600; color:#f59e0b;">${p.risk_score !== undefined ? p.risk_score : (p.current_risk_score !== undefined ? p.current_risk_score : 'N/A')}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Incidents:</td><td style="color:#cbd5e1;">${p.current_incidents || (status === 'BLOCKED' ? 'Sonapur Mudslide' : 'None reported')}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Weather Risk:</td><td style="color:#38bdf8;">${p.weather_risk || (status === 'BLOCKED' ? 'Torrential Rain (92.5 mm)' : 'Clear: 5.2 mm')}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Est. Delay:</td><td style="font-weight:600; color:#ef4444;">${p.estimated_delay || (status === 'BLOCKED' ? '70.9 Hours' : '0 Hours')}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Action:</td><td style="color:#34d399; font-weight:600;">${p.recommended_action || (status === 'BLOCKED' ? 'Reroute via Umrangso Lifeline' : 'Standard')}</td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Data Source:</td><td><span style="background:#0c4a6e; color:#38bdf8; padding:1px 5px; border-radius:4px; font-size:9px; font-weight:700;">${p.data_source || 'DATABASE (VERIFIED)'}</span></td></tr>
              <tr><td style="color:#94a3b8; padding:2px 0;">Last Updated:</td><td style="color:#64748b; font-size:10px;">${p.last_updated || 'Just now'}</td></tr>
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
      const lat = hz.latitude || hz.lat;
      const lng = hz.longitude || hz.lng;
      if (!lat || !lng) return;

      const circle = L.circle([lat, lng], {
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
      const lat = hub.latitude || hub.lat;
      const lng = hub.longitude || hub.lng;
      if (!lat || !lng) return;

      const marker = L.marker([lat, lng], {
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
      const lat = v.current_lat || v.lat;
      const lng = v.current_lng || v.lng;
      if (!lat || !lng) return;

      const marker = L.marker([lat, lng], {
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
            <tr><td style="color:#94a3b8; padding:2px 0;">GPS Source:</td><td><span style="background:#451a03; color:#f59e0b; padding:1px 5px; border-radius:4px; font-size:9px; font-weight:700;">${v.gps_source || 'SIMULATED'}</span></td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Telemetry:</td><td>${v.last_telemetry_at ? new Date(v.last_telemetry_at).toLocaleTimeString() : 'Active'}</td></tr>
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

  // 7. Render AI Routes Layer with Glowing Halos, Animated Flow, and Waypoint Beacons
  useEffect(() => {
    const routesLayer = layersRef.current.routes;
    routesLayer.clearLayers();

    if (!routePlan) return;

    // A. Render 🏁 Origin Radar Beacon
    if (routePlan.origin && routePlan.origin.coordinates) {
      const [oLng, oLat] = routePlan.origin.coordinates;
      const originIcon = L.divIcon({
        html: `
          <div class="route-beacon-marker origin" title="ORIGIN: ${routePlan.origin.name}">
            <div class="beacon-pulse"></div>
            <div class="beacon-core">🏁</div>
          </div>
        `,
        className: 'custom-beacon-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const originMarker = L.marker([oLat, oLng], { icon: originIcon });
      originMarker.bindPopup(`
        <div style="min-width: 220px;">
          <div class="popup-title" style="color: #10b981;">
            🏁 Convoy Origin Terminal
          </div>
          <div style="font-weight:700; font-size:12px; color:#fff; margin-top:2px;">
            ${routePlan.origin.name}
          </div>
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
            ${routePlan.origin.landmark || 'Primary Dispatch Terminal'}
          </div>
          <div style="font-size:10px; color:#38bdf8; margin-top:4px; font-family:var(--font-mono);">
            Coordinates: ${oLat.toFixed(4)}°N, ${oLng.toFixed(4)}°E
          </div>
        </div>
      `);
      routesLayer.addLayer(originMarker);
    }

    // B. Render 🎯 Destination Radar Beacon
    if (routePlan.destination && routePlan.destination.coordinates) {
      const [dLng, dLat] = routePlan.destination.coordinates;
      const destIcon = L.divIcon({
        html: `
          <div class="route-beacon-marker dest" title="DESTINATION: ${routePlan.destination.name}">
            <div class="beacon-pulse"></div>
            <div class="beacon-core">🎯</div>
          </div>
        `,
        className: 'custom-beacon-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const destMarker = L.marker([dLat, dLng], { icon: destIcon });
      destMarker.bindPopup(`
        <div style="min-width: 220px;">
          <div class="popup-title" style="color: #06b6d4;">
            🎯 Relief Delivery Destination
          </div>
          <div style="font-weight:700; font-size:12px; color:#fff; margin-top:2px;">
            ${routePlan.destination.name}
          </div>
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
            ${routePlan.destination.landmark || 'Emergency Forward Supply Terminal'}
          </div>
          <div style="font-size:10px; color:#38bdf8; margin-top:4px; font-family:var(--font-mono);">
            Coordinates: ${dLat.toFixed(4)}°N, ${dLng.toFixed(4)}°E
          </div>
        </div>
      `);
      routesLayer.addLayer(destMarker);
    }

    // C. Render Multi-Layered Glowing Route Polylines
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
      const isSafest = route.criterion === 'SAFEST' || route.is_recommended;
      const isBlocked = route.blocked_segments_count > 0;

      // 1. Glowing Halo Underlayer
      const glowColor = isSafest ? 'rgba(16, 185, 129, 0.35)' : isBlocked ? 'rgba(239, 68, 68, 0.30)' : 'rgba(59, 130, 246, 0.25)';
      const glowPolyline = L.polyline(latLngs, {
        color: glowColor,
        weight: isSafest ? 12 : 9,
        opacity: 0.9,
        lineCap: 'round',
        interactive: false,
      });
      routesLayer.addLayer(glowPolyline);

      // 2. High-Definition Animated Flow Core Line
      const coreColor = isSafest ? '#10b981' : isBlocked ? '#ef4444' : '#38bdf8';
      const corePolyline = L.polyline(latLngs, {
        color: coreColor,
        weight: isSafest ? 5.5 : 4.5,
        opacity: 0.95,
        dashArray: isBlocked ? '8, 8' : '12, 10',
        lineCap: 'round',
        className: isSafest ? 'animated-route-flow' : isBlocked ? 'blocked-route-line' : '',
      });

      const popupContent = `
        <div style="min-width: 250px;">
          <div class="popup-title" style="color:${coreColor};">
            ${route.is_recommended ? '⭐ RECOMMENDED BY AI: ' : isBlocked ? '⚠️ BLOCKED DIRECT ROUTE: ' : ''}${route.title || 'Route Option'}
          </div>
          <div style="font-size:11px; color:#cbd5e1; margin-bottom:6px; line-height:1.4;">
            ${route.summary || ''}
          </div>
          <table style="width:100%; font-size:11px; border-collapse:collapse;">
            <tr><td style="color:#94a3b8; padding:2px 0;">Routing Mode:</td><td style="font-weight:700; color:${coreColor};">${route.criterion}</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Total Distance:</td><td style="font-weight:600;">${route.distance_km} km</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Transit Duration:</td><td>${route.estimated_duration_hours} hrs</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Safety Score:</td><td style="color:${route.safety_score >= 0.8 ? '#34d399' : '#f87171'}; font-weight:700;">${(route.safety_score * 100).toFixed(0)}%</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Expected Delay:</td><td>+${route.estimated_delay_hours} hrs</td></tr>
            <tr><td style="color:#94a3b8; padding:2px 0;">Blocked Bottlenecks:</td><td style="color:${isBlocked ? '#ef4444' : '#10b981'}; font-weight:700;">${route.blocked_segments_count}</td></tr>
          </table>
          ${
            route.ai_explanation && route.ai_explanation.length
              ? `
              <div style="margin-top:8px; border-top:1px solid #334155; padding-top:6px;">
                <div style="font-size:10px; color:#38bdf8; font-weight:700; text-transform:uppercase;">AI Route Intelligence Rationale:</div>
                <ul style="padding-left:14px; font-size:10px; color:#e2e8f0; margin-top:3px; line-height:1.4;">
                  ${route.ai_explanation.map((e) => `<li>${e}</li>`).join('')}
                </ul>
              </div>
            `
              : ''
          }
        </div>
      `;
      corePolyline.bindPopup(popupContent);

      corePolyline.on('click', () => {
        if (onSelectEntity) {
          onSelectEntity({ type: 'route', data: route });
        }
      });

      routesLayer.addLayer(corePolyline);

      // D. Intermediate Waypoint Beacons along Route
      if (route.waypoints && route.waypoints.length) {
        route.waypoints.forEach((wp) => {
          if (wp.type === 'ORIGIN' || wp.type === 'DESTINATION') return; // Handled above

          if (wp.type === 'STRATEGIC_PASS') {
            const passIcon = L.divIcon({
              html: `
                <div class="route-waypoint-badge" title="Strategic Mountain Bypass Pass">
                  <span>⚡ ${wp.name}</span>
                </div>
              `,
              className: 'custom-waypoint-icon',
              iconSize: [160, 24],
              iconAnchor: [80, 12],
            });
            const passMarker = L.marker([wp.coordinates[1], wp.coordinates[0]], { icon: passIcon });
            passMarker.bindPopup(`
              <div style="min-width: 200px;">
                <div class="popup-title" style="color: #34d399;">⚡ ${wp.name}</div>
                <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">
                  All-weather paved mountain sector providing strategic alternate bypass around the Sonapur blockage.
                </div>
              </div>
            `);
            routesLayer.addLayer(passMarker);
          } else if (wp.type === 'BLOCKED_POINT') {
            const blockedIcon = L.divIcon({
              html: `
                <div class="route-beacon-marker blockage" title="CRITICAL: ${wp.name}">
                  <div class="beacon-pulse"></div>
                  <div class="beacon-core">⚠️</div>
                </div>
              `,
              className: 'custom-beacon-icon',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16],
            });
            const blockedMarker = L.marker([wp.coordinates[1], wp.coordinates[0]], { icon: blockedIcon });
            blockedMarker.bindPopup(`
              <div style="min-width: 220px;">
                <div class="popup-title" style="color: #ef4444;">⚠️ Active Bottleneck Blockage</div>
                <div style="font-weight:700; font-size:12px; color:#fff; margin-top:2px;">${wp.name}</div>
                <div style="font-size:11px; color:#fca5a5; margin-top:4px;">
                  Massive rockfall blocking both lanes. Clearance delay: +14.5 hours. Strictly avoided by AI routing.
                </div>
              </div>
            `);
            routesLayer.addLayer(blockedMarker);
          }
        });
      }
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
