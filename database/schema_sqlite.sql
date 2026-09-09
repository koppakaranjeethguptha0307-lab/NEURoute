-- ============================================================================
-- NEURoute — SQLite Demo Mode Database Schema
-- Problem Statement: SIH26002 — AI-Based Smart Logistics and Accessibility Intelligence Platform for NER
-- Team: Nexara
-- Coordinate System: WGS84 (EPSG:4326) via lat/lon columns and GeoJSON text fields
-- Canonical Tables: 17
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. ACCESS & GOVERNANCE LAYER
-- ----------------------------------------------------------------------------

-- Table 1: roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table 2: users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    badge_number VARCHAR(50),
    phone_number VARCHAR(20),
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    role VARCHAR(50) NOT NULL DEFAULT 'GENERAL_VIEWER'
        CHECK (role IN ('ADMIN', 'LOGISTICS_OPERATOR', 'GOVERNMENT_AUTHORITY', 'EMERGENCY_RESPONSE', 'GENERAL_VIEWER', 'GIS_OFFICER', 'FIELD_OFFICER')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. GEOSPATIAL INFRASTRUCTURE LAYER
-- ----------------------------------------------------------------------------

-- Table 3: districts
CREATE TABLE IF NOT EXISTS districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    boundary_geojson TEXT,
    accessibility_score FLOAT NOT NULL DEFAULT 100.0
        CHECK (accessibility_score >= 0.0 AND accessibility_score <= 100.0),
    score_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: road_segments
CREATE TABLE IF NOT EXISTS road_segments (
    id VARCHAR(36) PRIMARY KEY,
    osm_id BIGINT,
    name VARCHAR(150) NOT NULL,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    coordinates_geojson TEXT NOT NULL,
    length_km FLOAT NOT NULL DEFAULT 10.0
        CHECK (length_km >= 0.0),
    base_speed_kmh FLOAT NOT NULL DEFAULT 40.0
        CHECK (base_speed_kmh >= 0.0),
    current_status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (current_status IN ('OPEN', 'RISKY', 'BLOCKED', 'UNKNOWN')),
    current_risk_score FLOAT NOT NULL DEFAULT 0.0
        CHECK (current_risk_score >= 0.0 AND current_risk_score <= 1.0),
    is_critical_lifeline BOOLEAN NOT NULL DEFAULT 0,
    last_assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 16: logistics_hubs
CREATE TABLE IF NOT EXISTS logistics_hubs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    hub_type VARCHAR(50) NOT NULL
        CHECK (hub_type IN ('CENTRAL_DEPOT', 'DISTRIBUTION_CENTER', 'EMERGENCY_SUPPLY', 'TRANSPORT_HUB', 'RAILHEAD', 'FORWARD_BASE')),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    latitude FLOAT NOT NULL
        CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude FLOAT NOT NULL
        CHECK (longitude >= -180.0 AND longitude <= 180.0),
    capacity_tons FLOAT NOT NULL DEFAULT 500.0
        CHECK (capacity_tons >= 0.0),
    contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. FIELD REPORTING & INCIDENT MANAGEMENT LAYER
-- ----------------------------------------------------------------------------

-- Table 5: field_reports
CREATE TABLE IF NOT EXISTS field_reports (
    id VARCHAR(36) PRIMARY KEY,
    client_uuid VARCHAR(36) UNIQUE NOT NULL,
    reporter_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('LANDSLIDE', 'FLOOD', 'ROAD_DAMAGE', 'BRIDGE_ISSUE', 'HEAVY_RAINFALL', 'TRAFFIC_CONGESTION', 'ROAD_BLOCKAGE', 'OTHER')),
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    latitude FLOAT NOT NULL
        CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude FLOAT NOT NULL
        CHECK (longitude >= -180.0 AND longitude <= 180.0),
    photo_url TEXT,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED'
        CHECK (sync_status IN ('PENDING_SYNC', 'SYNCED', 'FAILED')),
    client_reported_at TIMESTAMP NOT NULL,
    server_received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: incidents
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(36) PRIMARY KEY,
    field_report_id VARCHAR(36) REFERENCES field_reports(id) ON DELETE SET NULL,
    road_segment_id VARCHAR(36) REFERENCES road_segments(id) ON DELETE SET NULL,
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('LANDSLIDE', 'FLOOD', 'ROAD_DAMAGE', 'BRIDGE_ISSUE', 'HEAVY_RAINFALL', 'TRAFFIC_CONGESTION', 'ROAD_BLOCKAGE', 'OTHER')),
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED'
        CHECK (status IN ('REPORTED', 'INVESTIGATING', 'VERIFIED', 'ACTIVE', 'RESOLVING', 'RESOLVED', 'REJECTED')),
    latitude FLOAT NOT NULL
        CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude FLOAT NOT NULL
        CHECK (longitude >= -180.0 AND longitude <= 180.0),
    description TEXT NOT NULL,
    photo_url TEXT,
    confidence FLOAT NOT NULL DEFAULT 1.0
        CHECK (confidence >= 0.0 AND confidence <= 1.0),
    verified_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. FLEET TELEMETRY & LOGISTICS OPERATIONS LAYER
-- ----------------------------------------------------------------------------

-- Table 7: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY,
    registration_number VARCHAR(30) UNIQUE NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL
        CHECK (vehicle_type IN ('LIGHT_TRUCK', 'HEAVY_TRUCK', 'FOUR_BY_FOUR', 'TANKER', 'REFRIGERATED_VAN')),
    capacity_tons FLOAT NOT NULL
        CHECK (capacity_tons >= 0.0),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OFFLINE', 'DELAYED')),
    current_latitude FLOAT
        CHECK (current_latitude IS NULL OR (current_latitude >= -90.0 AND current_latitude <= 90.0)),
    current_longitude FLOAT
        CHECK (current_longitude IS NULL OR (current_longitude >= -180.0 AND current_longitude <= 180.0)),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    last_telemetry_at TIMESTAMP
);

-- Table 8: trips
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) REFERENCES vehicles(id) ON DELETE SET NULL,
    operator_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    shipment_id VARCHAR(36),
    origin_name VARCHAR(150) NOT NULL,
    origin_lat FLOAT NOT NULL
        CHECK (origin_lat >= -90.0 AND origin_lat <= 90.0),
    origin_lon FLOAT NOT NULL
        CHECK (origin_lon >= -180.0 AND origin_lon <= 180.0),
    dest_name VARCHAR(150) NOT NULL,
    dest_lat FLOAT NOT NULL
        CHECK (dest_lat >= -90.0 AND dest_lat <= 90.0),
    dest_lon FLOAT NOT NULL
        CHECK (dest_lon >= -180.0 AND dest_lon <= 180.0),
    cargo_type VARCHAR(100) NOT NULL,
    cargo_priority VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
        CHECK (cargo_priority IN ('STANDARD', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'EN_ROUTE', 'IN_TRANSIT', 'DELAYED', 'REROUTED', 'COMPLETED', 'CANCELLED')),
    active_route_id VARCHAR(36),
    baseline_eta TIMESTAMP,
    current_eta TIMESTAMP,
    delay_minutes INT NOT NULL DEFAULT 0
        CHECK (delay_minutes >= 0),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
    FOREIGN KEY (active_route_id) REFERENCES routes(id) ON DELETE SET NULL
);

-- Table 9: shipments
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(36) PRIMARY KEY,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    goods_type VARCHAR(100) NOT NULL,
    cargo_priority VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
        CHECK (cargo_priority IN ('STANDARD', 'HIGH', 'CRITICAL')),
    source_name VARCHAR(150) NOT NULL,
    source_lat FLOAT NOT NULL
        CHECK (source_lat >= -90.0 AND source_lat <= 90.0),
    source_lon FLOAT NOT NULL
        CHECK (source_lon >= -180.0 AND source_lon <= 180.0),
    dest_name VARCHAR(150) NOT NULL,
    dest_lat FLOAT NOT NULL
        CHECK (dest_lat >= -90.0 AND dest_lat <= 90.0),
    dest_lon FLOAT NOT NULL
        CHECK (dest_lon >= -180.0 AND dest_lon <= 180.0),
    vehicle_id VARCHAR(36) REFERENCES vehicles(id) ON DELETE SET NULL,
    trip_id VARCHAR(36) REFERENCES trips(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
        CHECK (status IN ('CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED', 'REROUTED', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
    estimated_arrival TIMESTAMP,
    delay_minutes INT NOT NULL DEFAULT 0
        CHECK (delay_minutes >= 0),
    risk_score FLOAT NOT NULL DEFAULT 0.0
        CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 10: routes
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(36) PRIMARY KEY,
    shipment_id VARCHAR(36) REFERENCES shipments(id) ON DELETE CASCADE,
    trip_id VARCHAR(36) REFERENCES trips(id) ON DELETE SET NULL,
    route_type VARCHAR(30) NOT NULL
        CHECK (route_type IN ('RECOMMENDED_SAFEST', 'FASTEST', 'PRIORITY_LIFELINE', 'ALTERNATE')),
    total_distance_km FLOAT NOT NULL
        CHECK (total_distance_km >= 0.0),
    estimated_time_min INT NOT NULL
        CHECK (estimated_time_min >= 0),
    composite_risk_score FLOAT NOT NULL DEFAULT 0.0
        CHECK (composite_risk_score >= 0.0 AND composite_risk_score <= 1.0),
    route_score FLOAT NOT NULL DEFAULT 0.0,
    coordinates_geojson TEXT NOT NULL,
    recommendation_reasons TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 11: route_segment_mappings
CREATE TABLE IF NOT EXISTS route_segment_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id VARCHAR(36) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    road_segment_id VARCHAR(36) NOT NULL REFERENCES road_segments(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL CHECK (sequence_order >= 0),
    UNIQUE (route_id, sequence_order)
);

-- ----------------------------------------------------------------------------
-- 5. AI PREDICTIONS, HAZARDS, OBSERVATIONS & AUDITING LAYER
-- ----------------------------------------------------------------------------

-- Table 12: predictions
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(36) PRIMARY KEY,
    prediction_type VARCHAR(50) NOT NULL
        CHECK (prediction_type IN ('RISK_SCORE', 'DELAY_MINUTES', 'INCIDENT_CLASSIFICATION', 'ACCESSIBILITY_INDEX', 'CLEARANCE_TIME')),
    target_entity_type VARCHAR(50) NOT NULL
        CHECK (target_entity_type IN ('ROUTE', 'ROAD_SEGMENT', 'INCIDENT', 'TRIP', 'DISTRICT', 'SHIPMENT')),
    target_entity_id VARCHAR(36) NOT NULL,
    predicted_value TEXT NOT NULL,
    confidence FLOAT NOT NULL
        CHECK (confidence >= 0.0 AND confidence <= 1.0),
    model_version VARCHAR(50) NOT NULL,
    input_features TEXT,
    method VARCHAR(100) DEFAULT 'RULE_HEURISTIC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 13: weather_observations
CREATE TABLE IF NOT EXISTS weather_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    road_segment_id VARCHAR(36) REFERENCES road_segments(id) ON DELETE SET NULL,
    rainfall_mm FLOAT NOT NULL DEFAULT 0.0 CHECK (rainfall_mm >= 0.0),
    wind_speed_kmh FLOAT NOT NULL DEFAULT 0.0 CHECK (wind_speed_kmh >= 0.0),
    visibility_meters FLOAT NOT NULL DEFAULT 10000.0 CHECK (visibility_meters >= 0.0),
    temperature_c FLOAT NOT NULL DEFAULT 20.0,
    hazard_advisory VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 14: hazards
CREATE TABLE IF NOT EXISTS hazards (
    id VARCHAR(36) PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    road_segment_id VARCHAR(36) REFERENCES road_segments(id) ON DELETE SET NULL,
    hazard_type VARCHAR(50) NOT NULL
        CHECK (hazard_type IN ('LANDSLIDE_PRONE_ZONE', 'FLOOD_BASIN', 'EROSION', 'SEISMIC_FAULT', 'AVALANCHE_ZONE', 'MONSOON_VULNERABILITY')),
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    latitude FLOAT
        CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)),
    longitude FLOAT
        CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)),
    boundary_geojson TEXT,
    active BOOLEAN NOT NULL DEFAULT 1,
    description TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 15: alerts
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('INFO', 'WARNING', 'DANGER', 'CRITICAL')),
    incident_id VARCHAR(36) REFERENCES incidents(id) ON DELETE SET NULL,
    trip_id VARCHAR(36) REFERENCES trips(id) ON DELETE SET NULL,
    shipment_id VARCHAR(36) REFERENCES shipments(id) ON DELETE SET NULL,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    location_name VARCHAR(150),
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 17: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. INDEXES FOR PERFORMANCE & RELATIONAL QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_road_segments_status ON road_segments(current_status);
CREATE INDEX IF NOT EXISTS idx_road_segments_district ON road_segments(district_id);
CREATE INDEX IF NOT EXISTS idx_road_segments_lifeline ON road_segments(is_critical_lifeline);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_road_segment ON incidents(road_segment_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_priority ON shipments(cargo_priority);
CREATE INDEX IF NOT EXISTS idx_routes_shipment ON routes(shipment_id);
CREATE INDEX IF NOT EXISTS idx_route_seg_map_route ON route_segment_mappings(route_id);
CREATE INDEX IF NOT EXISTS idx_route_seg_map_seg ON route_segment_mappings(road_segment_id);
CREATE INDEX IF NOT EXISTS idx_predictions_target ON predictions(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_weather_district ON weather_observations(district_id);
CREATE INDEX IF NOT EXISTS idx_hazards_active ON hazards(active);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
