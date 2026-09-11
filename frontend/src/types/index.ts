// TypeScript interfaces and domain contract stubs for NEURoute

export type UserRole = 'ADMIN' | 'FIELD_OFFICER' | 'DRIVER' | 'LOGISTICS_PLANNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hubLocation?: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn?: number; // TODO: confirm with backend
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
  rememberMe?: boolean;
}

// -------------------------------------------------------------
// SHIPMENT TYPES
// -------------------------------------------------------------
export type ShipmentStatus = 'in_transit' | 'delivered' | 'delayed' | 'pending' | 'rerouted'; // TODO: confirm with backend
export type ShipmentPriority = 'standard' | 'high' | 'critical' | 'essential_supplies'; // TODO: confirm with backend

export interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  vehicleId: string;
  cargoType: string;
  weightKg: number;
  status: ShipmentStatus; // TODO: confirm with backend
  priority: ShipmentPriority; // TODO: confirm with backend
  estimatedArrival: string;
  departedAt: string;
  currentLocationName: string;
  riskScore: number; // 0 - 100 scale // TODO: confirm with backend
}

// -------------------------------------------------------------
// VEHICLE / FLEET TYPES
// -------------------------------------------------------------
export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'delayed' | 'stopped'; // TODO: confirm with backend
export type VehicleType = 'heavy_truck' | 'medium_carrier' | 'all_terrain_4x4' | 'refrigerated_van'; // TODO: confirm with backend

export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleType: VehicleType; // TODO: confirm with backend
  status: VehicleStatus; // TODO: confirm with backend
  speedKmh: number;
  fuelLevelPct: number;
  lat: number;
  lng: number;
  assignedShipmentId?: string;
  lastUpdated: string;
  headingDeg?: number;
}

// -------------------------------------------------------------
// INCIDENT / HAZARD TYPES
// -------------------------------------------------------------
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'; // TODO: confirm with backend
export type IncidentType = 'landslide' | 'flood' | 'roadblock' | 'bridge_damage' | 'monsoon_erosion' | 'security'; // TODO: confirm with backend
export type IncidentStatus = 'active' | 'under_investigation' | 'clearing' | 'resolved'; // TODO: confirm with backend

export interface Incident {
  id: string;
  title: string;
  type: IncidentType; // TODO: confirm with backend
  severity: IncidentSeverity; // TODO: confirm with backend
  status: IncidentStatus; // TODO: confirm with backend
  locationName: string;
  state: string; // e.g., 'Assam', 'Meghalaya', 'Arunachal Pradesh'
  highway: string; // e.g., 'NH-27', 'NH-29', 'NH-102'
  lat: number;
  lng: number;
  reportedAt: string;
  description: string;
  aiClassification?: {
    confidence: number; // 0.0 - 1.0 // TODO: confirm with backend
    predictedClearanceHours: number; // TODO: confirm with backend
    suggestedDetourName?: string;
  };
}

// -------------------------------------------------------------
// ROUTE INTELLIGENCE TYPES
// -------------------------------------------------------------
export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteOption {
  id: string;
  name: string;
  corridor: string;
  distanceKm: number;
  estimatedDurationHours: number;
  predictedDelayMinutes: number; // TODO: confirm with backend
  riskScore: number; // 0 - 100 // TODO: confirm with backend
  elevationProfile: {
    maxElevationMeters: number;
    gradientRisk: 'low' | 'moderate' | 'high'; // TODO: confirm with backend
  };
  activeIncidentsCount: number;
  waypoints: RouteCoordinate[];
  recommended: boolean;
}

// -------------------------------------------------------------
// ALERT TYPES
// -------------------------------------------------------------
export type AlertSeverity = 'info' | 'warning' | 'critical'; // TODO: confirm with backend
export type AlertCategory = 'weather' | 'hazard' | 'fleet' | 'security' | 'delay'; // TODO: confirm with backend

export interface OperationalAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity; // TODO: confirm with backend
  category: AlertCategory; // TODO: confirm with backend
  relatedEntityId?: string; // vehicleId, shipmentId, or incidentId
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// -------------------------------------------------------------
// DASHBOARD & ANALYTICS TYPES
// -------------------------------------------------------------
export interface DashboardKPIs {
  activeShipments: number;
  shipmentsOnTimeRate: number; // percentage
  liveFleetCount: number;
  fleetActivePct: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  averageRiskIndex: number; // percentage
}

export interface DistrictAnalytics {
  district: string;
  state: string;
  incidentCount: number;
  averageDelayMins: number;
  riskRating: number; // 1-100 // TODO: confirm with backend
}

export interface MonthlyTrend {
  month: string;
  incidents: number;
  avgDelayHours: number;
  shipmentVolume: number;
}
