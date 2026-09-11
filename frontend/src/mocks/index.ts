import { registerMockEndpoint, MockRequestContext } from '@/services/apiClient';
import { mockRoadSegmentsGeoJSON, mockHazards, mockHubs } from '@/services/mockData';
import { MOCK_SHIPMENTS } from './shipments';
import { MOCK_VEHICLES } from './vehicles';
import { MOCK_INCIDENTS } from './incidents';
import { MOCK_ALERTS } from './alerts';
import { MOCK_ROUTES, getCalculatedRoutes, RoutePlanParams } from './routes';
import { MOCK_DASHBOARD_KPIS, MOCK_DISTRICT_ANALYTICS, MOCK_MONTHLY_TRENDS } from './analytics';
import { Incident, OperationalAlert, Shipment } from '@/types';

// In-memory mutable states for interactive demo actions (e.g. create incident, mark alert as read)
let incidentsStore: Incident[] = [...MOCK_INCIDENTS];
let alertsStore: OperationalAlert[] = [...MOCK_ALERTS];
let shipmentsStore: Shipment[] = [...MOCK_SHIPMENTS];

/**
 * Initialize all mock API routes into the centralized apiClient mock registry.
 */
export function initMockFixtures() {
  // Dashboard endpoints
  registerMockEndpoint('GET', '/dashboard/kpis', () => MOCK_DASHBOARD_KPIS);

  // Shipments endpoints
  registerMockEndpoint('GET', '/shipments', (context: MockRequestContext) => {
    let list = [...shipmentsStore];
    const query = context.query;
    if (query?.status) {
      list = list.filter((s) => s.status === query.status);
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(search) ||
          s.origin.toLowerCase().includes(search) ||
          s.destination.toLowerCase().includes(search) ||
          s.cargoType.toLowerCase().includes(search)
      );
    }
    return list;
  });

  registerMockEndpoint('POST', '/shipments', (context: MockRequestContext) => {
    const body = context.body as Partial<Shipment> | undefined;
    const newShipment: Shipment = {
      id: `SHP-NER-${Math.floor(Math.random() * 900 + 100)}`,
      trackingNumber: `TRK-NER-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      origin: body?.origin || 'Guwahati Hub',
      destination: body?.destination || 'NER Regional Depot',
      carrier: body?.carrier || 'NER Express Freight',
      vehicleId: body?.vehicleId || 'VEH-AS-01-4421',
      cargoType: body?.cargoType || 'General Freight',
      weightKg: body?.weightKg || 3000,
      status: 'pending', // TODO: confirm with backend
      priority: body?.priority || 'standard', // TODO: confirm with backend
      estimatedArrival: body?.estimatedArrival || new Date(Date.now() + 86400000).toISOString(),
      departedAt: new Date().toISOString(),
      currentLocationName: 'Staging Hub Yard',
      riskScore: 15,
    };
    shipmentsStore.unshift(newShipment);
    return newShipment;
  });

  // Vehicles endpoints
  registerMockEndpoint('GET', '/vehicles', (context: MockRequestContext) => {
    let list = [...MOCK_VEHICLES];
    const query = context.query;
    if (query?.status) {
      list = list.filter((v) => v.status === query.status);
    }
    return list;
  });

  // Incidents endpoints
  registerMockEndpoint('GET', '/incidents', (context: MockRequestContext) => {
    let list = [...incidentsStore];
    const query = context.query;
    if (query?.severity) {
      list = list.filter((i) => i.severity === query.severity);
    }
    if (query?.state) {
      list = list.filter((i) => i.state.toLowerCase() === query.state?.toLowerCase());
    }
    if (query?.type) {
      list = list.filter((i) => i.type === query.type);
    }
    return list;
  });

  registerMockEndpoint('POST', '/incidents', (context: MockRequestContext) => {
    const payload = (context.body as Partial<Incident>) || {};
    const newIncident: Incident = {
      id: `INC-2026-${Math.floor(Math.random() * 900 + 100)}`,
      title: payload.title || 'New Field Incident',
      type: payload.type || 'landslide', // TODO: confirm with backend
      severity: payload.severity || 'medium', // TODO: confirm with backend
      status: 'active', // TODO: confirm with backend
      locationName: payload.locationName || 'NER Highway Sector',
      state: payload.state || 'Assam',
      highway: payload.highway || 'NH-27',
      lat: payload.lat || 26.1445,
      lng: payload.lng || 91.7362,
      reportedAt: new Date().toISOString(),
      description: payload.description || '',
      aiClassification: {
        confidence: 0.92, // TODO: confirm with backend
        predictedClearanceHours: 4.0, // TODO: confirm with backend
        suggestedDetourName: 'Regional Bypass Corridor',
      },
    };
    incidentsStore.unshift(newIncident);
    return newIncident;
  });

  // Alerts endpoints
  registerMockEndpoint('GET', '/alerts', () => alertsStore);

  registerMockEndpoint('PATCH', '/alerts/mark-all-read', () => {
    alertsStore = alertsStore.map((a) => ({ ...a, read: true }));
    return { success: true, count: alertsStore.length };
  });

  registerMockEndpoint('PATCH', '/alerts/read', (context: MockRequestContext) => {
    const body = context.body as { id: string } | undefined;
    const id = body?.id;
    if (id) {
      alertsStore = alertsStore.map((a) => (a.id === id ? { ...a, read: true } : a));
    }
    return { success: true, id };
  });

  // Route Intelligence endpoints
  registerMockEndpoint('GET', '/routes', (context: MockRequestContext) => {
    return getCalculatedRoutes(context.query as Partial<RoutePlanParams>);
  });

  registerMockEndpoint('POST', '/routes/plan', (context: MockRequestContext) => {
    const body = (context.body as Partial<RoutePlanParams>) || {};
    const routes = getCalculatedRoutes(body);
    return {
      query: body,
      routes,
    };
  });

  // Analytics endpoints
  registerMockEndpoint('GET', '/analytics/districts', () => MOCK_DISTRICT_ANALYTICS);
  registerMockEndpoint('GET', '/analytics/trends', () => MOCK_MONTHLY_TRENDS);

  // GIS & Map Endpoints
  registerMockEndpoint('GET', '/gis/roads', () => mockRoadSegmentsGeoJSON);
  registerMockEndpoint('GET', '/roads', () => mockRoadSegmentsGeoJSON);
  registerMockEndpoint('GET', '/hazards', () => mockHazards);
  registerMockEndpoint('GET', '/hubs', () => mockHubs);

  // Simulation Control Center endpoints
  registerMockEndpoint('GET', '/simulation/status', () => ({
    emergency_mode: false,
    target_road: { code: 'seg-nh06-03', name: 'Sonapur Passage', status: 'OPEN', risk_score: 0.15 },
    vehicle_telemetry: {
      vehicle_id: 1,
      registration_number: 'AS-01-EC-3312',
      latitude: 25.1120,
      longitude: 92.3680,
      speed_kmh: 42.5,
      route_progress_pct: 35.0,
      current_road_name: 'NH-06 Sonapur Corridor',
      estimated_eta_minutes: 180,
      source: 'SIMULATED',
    },
    cold_chain_telemetry: {
      shipment_id: 1,
      temperature_c: 4.8,
      status: 'NORMAL',
      source: 'SIMULATED TELEMETRY',
    },
    weather: {
      location_name: 'Sonapur Gorge',
      rainfall_mm: 12.0,
      condition: 'MODERATE_RAIN',
      source: 'LIVE — Open-Meteo',
    },
    active_incidents_count: 1,
    data_sources: {
      gps: 'SIMULATED — NEURoute Simulator',
      weather: 'LIVE — Open-Meteo',
      cold_chain: 'SIMULATED TELEMETRY',
      government: 'NOT CONFIGURED',
    },
    timestamp: new Date().toISOString(),
  }));

  registerMockEndpoint('POST', '/simulation/rainfall', () => ({ status: 'SUCCESS', message: 'Heavy rainfall simulated' }));
  registerMockEndpoint('POST', '/simulation/landslide', () => ({ status: 'BLOCKED', message: 'Sonapur landslide simulated' }));
  registerMockEndpoint('POST', '/simulation/gps-step', () => ({ status: 'SUCCESS', message: 'GPS position advanced' }));
  registerMockEndpoint('POST', '/simulation/cold-chain', () => ({ status: 'SUCCESS', message: 'Cold-chain temperature advanced' }));
  registerMockEndpoint('POST', '/simulation/emergency-mode', () => ({ emergency_mode: true, message: 'Emergency mode toggled' }));
  registerMockEndpoint('POST', '/simulation/reset', () => ({ status: 'SUCCESS', message: 'Simulation reset to baseline' }));
}

// Auto-initialize mock registry for demo operation & 404 endpoint fallbacks
initMockFixtures();

export * from './shipments';
export * from './vehicles';
export * from './incidents';
export * from './alerts';
export * from './routes';
export * from './analytics';
