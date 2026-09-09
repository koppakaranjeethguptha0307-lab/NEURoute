import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  AlertTriangle,
  Truck,
  Building2,
  Zap,
  Navigation,
  Compass,
  RefreshCw,
  Info,
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  MapPin,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { MapComponent } from '../components/MapComponent';

// Predefined North Eastern Region Presets (8 States & Strategic Corridors)
const REGION_PRESETS = [
  { id: 'all', name: '🇮🇳 All Northeast India (NER)', center: [26.15, 93.0], zoom: 7.2 },
  { id: 'nh06', name: '⛰️ NH-06 Meghalaya Lifeline (Shillong-Silchar)', center: [25.4, 92.2], zoom: 9 },
  { id: 'brahmaputra', name: '🌁 Brahmaputra Valley (Guwahati-Dibrugarh)', center: [26.6, 93.5], zoom: 8 },
  { id: 'nh29', name: '🏔️ Nagaland & Manipur (Kohima-Imphal)', center: [25.2, 94.0], zoom: 9 },
  { id: 'arunachal', name: '🌲 Arunachal Frontier (Itanagar-Tawang)', center: [27.3, 92.8], zoom: 8 },
  { id: 'mizoram', name: '⛰️ Mizoram Ridge (Silchar-Aizawl)', center: [24.2, 92.8], zoom: 9 },
  { id: 'tripura', name: '🌾 Tripura Lifeline (Agartala)', center: [23.9, 91.5], zoom: 9 },
  { id: 'sikkim', name: '❄️ Sikkim Himalayan Lifeline (Gangtok)', center: [27.3, 88.6], zoom: 9 },
];

export const GISMapPage = () => {
  // Layer Data States
  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routePlan, setRoutePlan] = useState(null);

  // Granular Layer Statuses (loading, status, statusCode, isLive, isFallback, errorMessage)
  const [layerStatuses, setLayerStatuses] = useState({
    roads: { loading: true, status: 'LOADING', statusCode: 0, isLive: false, isFallback: false, errorMessage: null },
    incidents: { loading: true, status: 'LOADING', statusCode: 0, isLive: false, isFallback: false, errorMessage: null },
    hazards: { loading: true, status: 'LOADING', statusCode: 0, isLive: false, isFallback: false, errorMessage: null },
    hubs: { loading: true, status: 'LOADING', statusCode: 0, isLive: false, isFallback: false, errorMessage: null },
    vehicles: { loading: true, status: 'LOADING', statusCode: 0, isLive: false, isFallback: false, errorMessage: null },
    routes: { loading: true, status: 'LOADING', statusCode: 0, isLive: false, isFallback: false, errorMessage: null },
  });

  // Map View State — Centered on Northeast India
  const [activeCenter, setActiveCenter] = useState([26.15, 93.0]);
  const [activeZoom, setActiveZoom] = useState(7.2);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Selected Entity Inspector State
  const [selectedEntity, setSelectedEntity] = useState(null);

  // NH-06 Demo Mode Preview State (explicitly labeled per Issue 1)
  const [isScenarioActive, setIsScenarioActive] = useState(false);
  const [scenarioBanner, setScenarioBanner] = useState(null);

  // Independent Layer Fetcher
  const loadAllLayers = useCallback(async () => {
    // 1. Fetch Roads GeoJSON via GET /api/v1/roads
    api.getRoadsGeoJSON().then((res) => {
      setRoadsGeoJSON(res.data);
      setLayerStatuses((prev) => ({
        ...prev,
        roads: {
          loading: false,
          status: res.status,
          statusCode: res.statusCode,
          isLive: res.isLive,
          isFallback: res.isFallback,
          errorMessage: res.errorMessage,
        },
      }));
    });

    // 2. Fetch Incidents via GET /api/v1/incidents
    api.getIncidents().then((res) => {
      setIncidents(Array.isArray(res.data) ? res.data : []);
      setLayerStatuses((prev) => ({
        ...prev,
        incidents: {
          loading: false,
          status: res.status,
          statusCode: res.statusCode,
          isLive: res.isLive,
          isFallback: res.isFallback,
          errorMessage: res.errorMessage,
        },
      }));
    });

    // 3. Fetch Hazards via GET /api/v1/hazards
    api.getHazards().then((res) => {
      setHazards(Array.isArray(res.data) ? res.data : []);
      setLayerStatuses((prev) => ({
        ...prev,
        hazards: {
          loading: false,
          status: res.status,
          statusCode: res.statusCode,
          isLive: res.isLive,
          isFallback: res.isFallback,
          errorMessage: res.errorMessage,
        },
      }));
    });

    // 4. Fetch Hubs via GET /api/v1/hubs
    api.getHubs().then((res) => {
      setHubs(Array.isArray(res.data) ? res.data : []);
      setLayerStatuses((prev) => ({
        ...prev,
        hubs: {
          loading: false,
          status: res.status,
          statusCode: res.statusCode,
          isLive: res.isLive,
          isFallback: res.isFallback,
          errorMessage: res.errorMessage,
        },
      }));
    });

    // 5. Fetch Vehicles via GET /api/v1/vehicles
    api.getVehicles().then((res) => {
      setVehicles(Array.isArray(res.data) ? res.data : []);
      setLayerStatuses((prev) => ({
        ...prev,
        vehicles: {
          loading: false,
          status: res.status,
          statusCode: res.statusCode,
          isLive: res.isLive,
          isFallback: res.isFallback,
          errorMessage: res.errorMessage,
        },
      }));
    });

    // 6. Fetch Routes via POST /api/v1/routes/plan
    api.planRoute({
      origin: { lat: 26.1445, lng: 91.7362 },
      destination: { lat: 24.8333, lng: 92.7930 },
      cargo_priority: 'HIGH',
      avoid_blocked: true,
      max_alternatives: 2,
    }).then((res) => {
      setRoutePlan(res.data);
      setLayerStatuses((prev) => ({
        ...prev,
        routes: {
          loading: false,
          status: res.status,
          statusCode: res.statusCode,
          isLive: res.isLive,
          isFallback: res.isFallback,
          errorMessage: res.errorMessage,
        },
      }));
    });
  }, []);

  useEffect(() => {
    loadAllLayers();
  }, [loadAllLayers]);

  // Handle Region Change
  const handleRegionSelect = (preset) => {
    setSelectedRegion(preset.id);
    setActiveCenter(preset.center);
    setActiveZoom(preset.zoom);
  };

  // NH-06 Demo Mode Preview Trigger (Fix for Issue 1)
  const handleTriggerScenario = async () => {
    if (isScenarioActive) {
      setIsScenarioActive(false);
      setScenarioBanner(null);
      loadAllLayers();
      return;
    }

    // Call real POST /api/v1/incidents API client
    const incidentPayload = {
      title: 'Major Landslide at Sonapur Tunnel (NH-06)',
      category: 'LANDSLIDE',
      severity: 'CRITICAL',
      latitude: 25.7520,
      longitude: 91.8950,
      road_segment_id: 2,
      blocked_lanes: 2,
      passable_by_heavy_vehicles: false,
      estimated_clearance_hours: 14.5,
      description: 'Massive rockfall blocking both lanes. Emergency convoy diverted to bypass.',
    };

    const apiResult = await api.reportIncident(incidentPayload);

    setIsScenarioActive(true);
    setScenarioBanner({
      title: '⚠️ DEMO MODE PREVIEW: Sonapur Landslide on NH-06',
      message:
        apiResult.isLive
          ? 'Live API response received from backend. Segment status updated server-side.'
          : 'Preview only — not connected to live backend (simulated UI state). Segment NH-06-MEGH-02 displayed as BLOCKED (Red Dashed line). AI Route Intelligence displays the Umrangso Strategic Bypass (SAFEST).',
      isLive: apiResult.isLive,
    });

    // 1. Pan to NH-06
    setActiveCenter([25.6, 92.1]);
    setActiveZoom(9);
    setSelectedRegion('nh06');

    // 2. Client-side preview update for the blocked segment (explicitly stated in banner)
    if (roadsGeoJSON && roadsGeoJSON.features) {
      const updatedFeatures = roadsGeoJSON.features.map((f) => {
        if (f.properties?.segment_code === 'NH-06-MEGH-02') {
          return {
            ...f,
            properties: {
              ...f.properties,
              current_status: 'BLOCKED',
              risk_score: 0.98,
            },
          };
        }
        return f;
      });
      setRoadsGeoJSON({ ...roadsGeoJSON, features: updatedFeatures });
    }

    // 3. Inspect the blocked segment
    setSelectedEntity({
      type: 'road',
      data: {
        segment_code: 'NH-06-MEGH-02',
        name: 'Jorabat - Shillong / Sonapur Lifeline Segment',
        highway_number: 'NH-06',
        current_status: 'BLOCKED',
        length_km: 68.2,
        risk_score: 0.98,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    });
  };

  const isLiveBackendActive = Object.values(layerStatuses).some((s) => s.isLive);
  const permissionDeniedLayers = Object.entries(layerStatuses).filter(([_, s]) => s.status === 'PERMISSION_DENIED');
  const errorLayers = Object.entries(layerStatuses).filter(([_, s]) => s.status === 'NOT_FOUND' || s.status === 'SERVER_ERROR' || s.status === 'NETWORK_ERROR');

  return (
    <div className="gis-workspace">
      {/* 1. Leaflet Map Component */}
      <MapComponent
        roadsGeoJSON={roadsGeoJSON}
        incidents={incidents}
        hazards={hazards}
        hubs={hubs}
        vehicles={vehicles}
        routePlan={routePlan}
        activeCenter={activeCenter}
        activeZoom={activeZoom}
        onSelectEntity={setSelectedEntity}
      />

      {/* 2. Top-Center Regional Fast Pan Toolbar */}
      <div className="floating-panel region-bar">
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', paddingRight: '4px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
          <Compass size={14} /> NER CORRIDORS:
        </div>
        {REGION_PRESETS.map((p) => (
          <button
            key={p.id}
            className={`region-btn ${selectedRegion === p.id ? 'active' : ''}`}
            onClick={() => handleRegionSelect(p)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 3. Top-Left Scenario Panel — Explicitly Labeled as Demo Mode Preview */}
      <div className="floating-panel scenario-bar">
        <div className="scenario-title" style={{ color: '#fbbf24' }}>
          <Zap size={14} /> Demo Mode Preview
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '2px' }}>
          Preview only — not connected to live backend
        </div>
        <button
          className={`scenario-btn ${isScenarioActive ? 'active' : ''}`}
          onClick={handleTriggerScenario}
          style={{
            borderColor: isScenarioActive ? '#ef4444' : 'rgba(245, 158, 11, 0.5)',
            background: isScenarioActive ? '#ef4444' : 'rgba(245, 158, 11, 0.15)',
            color: isScenarioActive ? '#fff' : '#fbbf24',
          }}
        >
          <AlertTriangle size={15} />
          {isScenarioActive ? 'Reset Preview State' : 'Preview NH-06 Landslide'}
        </button>
        <div className="scenario-desc">
          Renders Sonapur landslide, draws NH-06 segment as <strong>RED DASHED</strong>, and renders the recommended bypass corridor.
        </div>
      </div>

      {/* 4. Live Scenario Alert Banner (when triggered) */}
      {scenarioBanner && (
        <div
          className="floating-panel"
          style={{
            top: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: scenarioBanner.isLive ? 'rgba(6, 78, 59, 0.95)' : 'rgba(69, 10, 10, 0.94)',
            border: `1px solid ${scenarioBanner.isLive ? '#10b981' : '#ef4444'}`,
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '680px',
            zIndex: 600,
          }}
        >
          <AlertCircle size={22} color={scenarioBanner.isLive ? '#34d399' : '#fca5a5'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
              {scenarioBanner.title}
            </div>
            <div style={{ fontSize: '11px', color: '#fecaca', marginTop: '2px', lineHeight: 1.4 }}>
              {scenarioBanner.message}
            </div>
          </div>
          <button
            className="close-btn"
            onClick={() => setScenarioBanner(null)}
            style={{ color: '#fca5a5' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Permission Denied Notice (Gap 1: When 403 received) */}
      {permissionDeniedLayers.length > 0 && (
        <div
          className="floating-panel"
          style={{
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(59, 7, 100, 0.92)',
            border: '1px solid #a855f7',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '560px',
            zIndex: 600,
          }}
        >
          <Lock size={18} color="#c084fc" />
          <div style={{ fontSize: '12px', color: '#f3e8ff' }}>
            <strong>Permission Restricted (HTTP 403 Forbidden):</strong> You do not have authorization to view{' '}
            {permissionDeniedLayers.map(([name]) => name).join(', ')}. Other layers remain active.
          </div>
        </div>
      )}

      {/* Layer Error Notice (Gap 2: When an unmounted endpoint fails without mock fallback) */}
      {errorLayers.length > 0 && (
        <div
          className="floating-panel"
          style={{
            top: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(69, 10, 10, 0.92)',
            border: '1px solid #ef4444',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '560px',
            zIndex: 600,
          }}
        >
          <AlertTriangle size={18} color="#fca5a5" />
          <div style={{ fontSize: '12px', color: '#fee2e2' }}>
            <strong>Layer Unavailable:</strong> {errorLayers.map(([name, s]) => `${name} (${s.errorMessage})`).join(', ')}
          </div>
        </div>
      )}

      {/* 5. Bottom-Left Design System Legend & Layer Status */}
      <div className="floating-panel legend-panel">
        <div className="legend-header">
          <span>Map Legend</span>
          <button
            onClick={loadAllLayers}
            title="Refresh Layers"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Northeast India Focus Banner */}
        <div style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '6px', padding: '6px 8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🇮🇳 Northeast India (NER) Focus
          </div>
          <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '2px' }}>
            8 States • 12 Lifelines • 6 Hazard Hotspots • 9 Hubs
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
            {['Assam', 'Meghalaya', 'Arunachal', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'].map((st) => (
              <span key={st} style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '3px', padding: '1px 4px', fontSize: '8px', color: '#94a3b8' }}>
                {st}
              </span>
            ))}
          </div>
        </div>

        {/* Live / Demo Mode Notification */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '8px',
            background: isLiveBackendActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isLiveBackendActive ? '#34d399' : '#fbbf24',
            border: `1px solid ${isLiveBackendActive ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLiveBackendActive ? '#10b981' : '#f59e0b' }} />
          {isLiveBackendActive ? 'Live Backend Connected' : 'Data: Canonical Demo / Mock'}
        </div>

        {/* Road Status Legend */}
        <div className="legend-section">
          <div className="legend-section-title">Road Network Status</div>
          <div className="legend-item">
            <span className="legend-line open" />
            <span>OPEN (Solid Green)</span>
          </div>
          <div className="legend-item">
            <span className="legend-line risky" />
            <span>RISKY (Solid Amber)</span>
          </div>
          <div className="legend-item">
            <span className="legend-line blocked" />
            <span style={{ color: '#f87171', fontWeight: 600 }}>BLOCKED (Red Dashed)</span>
          </div>
          <div className="legend-item">
            <span className="legend-line unknown" />
            <span>UNKNOWN (Grey)</span>
          </div>
        </div>

        {/* Operational Entities Legend */}
        <div className="legend-section">
          <div className="legend-section-title">Entities & Routes</div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ef4444' }} />
            <span>Active Incidents ({incidents.length})</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f97316', border: '1px dashed #fff' }} />
            <span>Hazard Zones {hazards.length > 0 ? `(${hazards.length})` : '(Empty)'}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#a855f7' }} />
            <span>Logistics Hubs {hubs.length > 0 ? `(${hubs.length})` : '(Empty)'}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#38bdf8' }} />
            <span>Fleet Vehicles ({vehicles.length})</span>
          </div>
          <div className="legend-item">
            <span className="legend-line route-safest" />
            <span>SAFEST Alternate Bypass</span>
          </div>
        </div>

        {/* Independent Layer Statuses Indicator with Granular State Badges */}
        <div style={{ borderTop: '1px solid rgba(51,65,85,0.4)', paddingTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
          <div>
            Roads (/api/v1/roads):{' '}
            <span style={{ color: layerStatuses.roads.isLive ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
              {layerStatuses.roads.isLive ? 'Live 200' : 'Mock Fallback'}
            </span>
          </div>
          <div>
            Incidents (/api/v1/incidents):{' '}
            <span style={{ color: layerStatuses.incidents.isLive ? '#34d399' : layerStatuses.incidents.status === 'NOT_FOUND' ? '#ef4444' : '#fbbf24', fontWeight: 600 }}>
              {layerStatuses.incidents.isLive ? 'Live 200' : layerStatuses.incidents.status === 'NOT_FOUND' ? 'Unavailable (404)' : `${incidents.length} loaded`}
            </span>
          </div>
          <div>
            Hazard Zones (/api/v1/hazards):{' '}
            <span style={{ color: hazards.length > 0 ? '#fbbf24' : '#94a3b8' }}>
              {hazards.length > 0 ? `${hazards.length} hotspots` : 'Empty (0 records)'}
            </span>
          </div>
          <div>
            Hubs (/api/v1/hubs):{' '}
            <span style={{ color: hubs.length > 0 ? '#fbbf24' : '#94a3b8' }}>
              {hubs.length > 0 ? `${hubs.length} depots` : 'Empty (0 records)'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Right Side Entity Inspector Drawer */}
      {selectedEntity && (
        <div className="floating-panel inspector-drawer">
          <div className="inspector-header">
            <div className="inspector-title">
              {selectedEntity.type === 'road' && <Navigation size={18} color="#06b6d4" />}
              {selectedEntity.type === 'incident' && <AlertTriangle size={18} color="#ef4444" />}
              {selectedEntity.type === 'vehicle' && <Truck size={18} color="#38bdf8" />}
              {selectedEntity.type === 'hub' && <Building2 size={18} color="#c084fc" />}
              {selectedEntity.type === 'hazard' && <Zap size={18} color="#f97316" />}
              {selectedEntity.type === 'route' && <ShieldCheck size={18} color="#10b981" />}
              <span>
                {selectedEntity.type.toUpperCase()} DETAILS
              </span>
            </div>
            <button className="close-btn" onClick={() => setSelectedEntity(null)}>
              <X size={16} />
            </button>
          </div>

          {/* ROAD SEGMENT PROPERTIES */}
          {selectedEntity.type === 'road' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                {selectedEntity.data.name}
              </div>
              <table className="prop-table">
                <tbody>
                  <tr>
                    <td className="prop-label">Segment Code</td>
                    <td className="prop-value">{selectedEntity.data.segment_code}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Highway</td>
                    <td className="prop-value">{selectedEntity.data.highway_number}</td>
                  </tr>
                  {selectedEntity.data.state && (
                    <tr>
                      <td className="prop-label">State / Region</td>
                      <td className="prop-value" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {selectedEntity.data.state}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="prop-label">Status</td>
                    <td className="prop-value">
                      <span className={`badge badge-${(selectedEntity.data.current_status || 'unknown').toLowerCase()}`}>
                        {selectedEntity.data.current_status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="prop-label">Segment Length</td>
                    <td className="prop-value">{selectedEntity.data.length_km} km</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Risk Score</td>
                    <td className="prop-value">{selectedEntity.data.risk_score}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Lifeline Corridor</td>
                    <td className="prop-value">{selectedEntity.data.is_critical_lifeline ? 'YES (Critical)' : 'No'}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Speed Limit</td>
                    <td className="prop-value">{selectedEntity.data.speed_limit_kmh} km/h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* INCIDENT PROPERTIES */}
          {selectedEntity.type === 'incident' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px' }}>
                {selectedEntity.data.title}
              </div>
              <table className="prop-table">
                <tbody>
                  <tr>
                    <td className="prop-label">Category</td>
                    <td className="prop-value">{selectedEntity.data.category}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Severity</td>
                    <td className="prop-value" style={{ color: '#ef4444', fontWeight: 700 }}>
                      {selectedEntity.data.severity}
                    </td>
                  </tr>
                  <tr>
                    <td className="prop-label">Status</td>
                    <td className="prop-value">{selectedEntity.data.status}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Blocked Lanes</td>
                    <td className="prop-value">{selectedEntity.data.blocked_lanes}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Heavy Vehicle Access</td>
                    <td className="prop-value">{selectedEntity.data.passable_by_heavy_vehicles ? 'Passable' : 'BLOCKED'}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Est Clearance</td>
                    <td className="prop-value">{selectedEntity.data.estimated_clearance_hours} hours</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Reported At</td>
                    <td className="prop-value">
                      {selectedEntity.data.reported_at ? new Date(selectedEntity.data.reported_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
              {selectedEntity.data.description && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {selectedEntity.data.description}
                </div>
              )}
            </div>
          )}

          {/* VEHICLE PROPERTIES */}
          {selectedEntity.type === 'vehicle' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#7dd3fc', marginBottom: '8px' }}>
                {selectedEntity.data.registration_number}
              </div>
              <table className="prop-table">
                <tbody>
                  <tr>
                    <td className="prop-label">Vehicle Type</td>
                    <td className="prop-value">{selectedEntity.data.vehicle_type}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Telemetry Status</td>
                    <td className="prop-value" style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {selectedEntity.data.status}
                    </td>
                  </tr>
                  <tr>
                    <td className="prop-label">Current Speed</td>
                    <td className="prop-value">{selectedEntity.data.speed_kmh} km/h</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Heading Angle</td>
                    <td className="prop-value">{selectedEntity.data.heading_deg}°</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Fuel Level</td>
                    <td className="prop-value">{selectedEntity.data.fuel_level_percent}%</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Assigned Driver</td>
                    <td className="prop-value">{selectedEntity.data.driver_name}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Driver Phone</td>
                    <td className="prop-value">{selectedEntity.data.driver_phone}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Coordinates</td>
                    <td className="prop-value">
                      {selectedEntity.data.current_lat}, {selectedEntity.data.current_lng}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ROUTE PROPERTIES */}
          {selectedEntity.type === 'route' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                {selectedEntity.data.title}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                {selectedEntity.data.summary}
              </div>
              <table className="prop-table">
                <tbody>
                  <tr>
                    <td className="prop-label">Criterion</td>
                    <td className="prop-value" style={{ color: '#10b981', fontWeight: 700 }}>
                      {selectedEntity.data.criterion}
                    </td>
                  </tr>
                  <tr>
                    <td className="prop-label">Total Distance</td>
                    <td className="prop-value">{selectedEntity.data.distance_km} km</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Estimated Time</td>
                    <td className="prop-value">{selectedEntity.data.estimated_duration_hours} hrs</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Safety Score</td>
                    <td className="prop-value">{selectedEntity.data.safety_score * 100}%</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Expected Delay</td>
                    <td className="prop-value">+{selectedEntity.data.estimated_delay_hours} hrs</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Blocked Segments</td>
                    <td className="prop-value">{selectedEntity.data.blocked_segments_count}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* HUB PROPERTIES */}
          {selectedEntity.type === 'hub' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e9d5ff', marginBottom: '8px' }}>
                {selectedEntity.data.name}
              </div>
              <table className="prop-table">
                <tbody>
                  <tr>
                    <td className="prop-label">Hub Classification</td>
                    <td className="prop-value">{selectedEntity.data.hub_type}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">State</td>
                    <td className="prop-value">{selectedEntity.data.state}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Capacity</td>
                    <td className="prop-value">{selectedEntity.data.capacity_tonnes} tonnes</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Emergency Depot</td>
                    <td className="prop-value">{selectedEntity.data.is_emergency_depot ? 'YES' : 'No'}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Contact</td>
                    <td className="prop-value">{selectedEntity.data.contact_phone}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* HAZARD PROPERTIES */}
          {selectedEntity.type === 'hazard' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fdba74', marginBottom: '8px' }}>
                {selectedEntity.data.name}
              </div>
              <table className="prop-table">
                <tbody>
                  <tr>
                    <td className="prop-label">Hazard Type</td>
                    <td className="prop-value">{selectedEntity.data.hazard_type}</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Severity Rating</td>
                    <td className="prop-value" style={{ color: '#f97316', fontWeight: 700 }}>
                      {selectedEntity.data.severity}
                    </td>
                  </tr>
                  <tr>
                    <td className="prop-label">Zone Radius</td>
                    <td className="prop-value">{selectedEntity.data.radius_km} km</td>
                  </tr>
                  <tr>
                    <td className="prop-label">Status</td>
                    <td className="prop-value">{selectedEntity.data.is_active ? 'ACTIVE RISK' : 'Dormant'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GISMapPage;
