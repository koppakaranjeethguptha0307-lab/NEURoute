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
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    badge_number VARCHAR(50),
    phone_number VARCHAR(20),
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    role VARCHAR(50) NOT NULL DEFAULT 'GENERAL_VIEWER',
    department VARCHAR(100),
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
    headquarters VARCHAR(100),
    boundary_geojson TEXT,
    accessibility_score FLOAT NOT NULL DEFAULT 1.0,
    total_road_km FLOAT NOT NULL DEFAULT 0.0,
    blocked_road_km FLOAT NOT NULL DEFAULT 0.0,
    active_incidents_count INTEGER NOT NULL DEFAULT 0,
    score_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: road_segments
CREATE TABLE IF NOT EXISTS road_segments (
    id VARCHAR(50) PRIMARY KEY,
    segment_code VARCHAR(50),
    osm_id BIGINT,
    name VARCHAR(200) NOT NULL,
    highway_number VARCHAR(50),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    start_lat FLOAT DEFAULT 0.0,
    start_lng FLOAT DEFAULT 0.0,
    end_lat FLOAT DEFAULT 0.0,
    end_lng FLOAT DEFAULT 0.0,
    coordinates_geojson TEXT,
    coordinates_raw TEXT,
    length_km FLOAT NOT NULL DEFAULT 0.0,
    elevation_gain_m FLOAT NOT NULL DEFAULT 0.0,
    base_speed_kmh FLOAT NOT NULL DEFAULT 40.0,
    speed_limit_kmh FLOAT NOT NULL DEFAULT 40.0,
    current_status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (current_status IN ('OPEN', 'RISKY', 'BLOCKED', 'UNKNOWN')),
    current_risk_score FLOAT NOT NULL DEFAULT 0.0,
    risk_score FLOAT NOT NULL DEFAULT 0.0,
    is_critical_lifeline BOOLEAN NOT NULL DEFAULT 1,
    last_assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: logistics_hubs
CREATE TABLE IF NOT EXISTS logistics_hubs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    hub_type VARCHAR(50) NOT NULL DEFAULT 'WAREHOUSE',
    state VARCHAR(50),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    capacity_tonnes FLOAT NOT NULL DEFAULT 100.0,
    capacity_tons FLOAT NOT NULL DEFAULT 500.0,
    is_emergency_depot BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. FIELD REPORTING & INCIDENT MANAGEMENT LAYER
-- ----------------------------------------------------------------------------

-- Table 6: field_reports
CREATE TABLE IF NOT EXISTS field_reports (
    id VARCHAR(50) PRIMARY KEY,
    client_uuid VARCHAR(100),
    client_report_uuid VARCHAR(100),
    reporter_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    photo_url TEXT,
    photos_raw TEXT,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
    status VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
    client_reported_at TIMESTAMP,
    captured_at TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    server_received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 7: incidents
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(50) PRIMARY KEY,
    field_report_id VARCHAR(50) REFERENCES field_reports(id) ON DELETE SET NULL,
    road_segment_id VARCHAR(50) REFERENCES road_segments(id) ON DELETE SET NULL,
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    title VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED',
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    description TEXT,
    photo_url TEXT,
    confidence FLOAT NOT NULL DEFAULT 1.0,
    blocked_lanes INTEGER NOT NULL DEFAULT 1,
    passable_by_heavy_vehicles BOOLEAN NOT NULL DEFAULT 1,
    estimated_clearance_hours FLOAT,
    verified_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    reported_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. FLEET TELEMETRY & LOGISTICS OPERATIONS LAYER
-- ----------------------------------------------------------------------------

-- Table 8: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Heavy Truck',
    capacity_tons FLOAT NOT NULL DEFAULT 5.0,
    capacity_kg FLOAT NOT NULL DEFAULT 5000.0,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    assigned_hub_id VARCHAR(50) REFERENCES logistics_hubs(id) ON DELETE SET NULL,
    current_latitude FLOAT,
    current_longitude FLOAT,
    current_lat FLOAT,
    current_lng FLOAT,
    speed_kmh FLOAT DEFAULT 0.0,
    heading_deg FLOAT DEFAULT 0.0,
    fuel_level_percent FLOAT NOT NULL DEFAULT 100.0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    gps_source VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    last_telemetry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 9: trips
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(50) PRIMARY KEY,
    trip_code VARCHAR(50),
    vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    operator_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    shipment_id VARCHAR(50),
    driver_name VARCHAR(100),
    origin_name VARCHAR(150),
    origin_lat FLOAT DEFAULT 0.0,
    origin_lng FLOAT DEFAULT 0.0,
    origin_lon FLOAT DEFAULT 0.0,
    dest_name VARCHAR(150),
    dest_lat FLOAT DEFAULT 0.0,
    dest_lng FLOAT DEFAULT 0.0,
    dest_lon FLOAT DEFAULT 0.0,
    cargo_type VARCHAR(100),
    cargo_priority VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    active_route_id VARCHAR(50),
    distance_km FLOAT NOT NULL DEFAULT 0.0,
    duration_hours FLOAT NOT NULL DEFAULT 0.0,
    delay_minutes INTEGER NOT NULL DEFAULT 0,
    baseline_eta TIMESTAMP,
    current_eta TIMESTAMP,
    start_time TIMESTAMP,
    started_at TIMESTAMP,
    end_time TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 10: shipments
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY,
    shipment_number VARCHAR(50),
    tracking_number VARCHAR(50),
    title VARCHAR(200),
    goods_type VARCHAR(100),
    cargo_type VARCHAR(100),
    cargo_priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    weight_kg FLOAT NOT NULL DEFAULT 0.0,
    origin_hub_id VARCHAR(50) REFERENCES logistics_hubs(id) ON DELETE SET NULL,
    origin_address VARCHAR(255),
    source_name VARCHAR(150),
    source_lat FLOAT DEFAULT 0.0,
    source_lon FLOAT DEFAULT 0.0,
    origin_lat FLOAT DEFAULT 0.0,
    origin_lng FLOAT DEFAULT 0.0,
    destination_hub_id VARCHAR(50) REFERENCES logistics_hubs(id) ON DELETE SET NULL,
    destination_address VARCHAR(255),
    dest_name VARCHAR(150),
    dest_lat FLOAT DEFAULT 0.0,
    dest_lon FLOAT DEFAULT 0.0,
    destination_lat FLOAT DEFAULT 0.0,
    destination_lng FLOAT DEFAULT 0.0,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    dispatched_at TIMESTAMP,
    delivered_at TIMESTAMP,
    estimated_arrival TIMESTAMP,
    estimated_delivery TIMESTAMP,
    delay_minutes INTEGER NOT NULL DEFAULT 0,
    risk_score FLOAT NOT NULL DEFAULT 0.0,
    current_lat FLOAT,
    current_lng FLOAT,
    notes TEXT,
    is_cold_chain BOOLEAN NOT NULL DEFAULT 0,
    temp_min_c FLOAT DEFAULT 2.0,
    temp_max_c FLOAT DEFAULT 8.0,
    current_temp_c FLOAT,
    temp_status VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 11: routes
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL,
    route_type VARCHAR(50),
    criterion VARCHAR(50) DEFAULT 'SAFEST',
    origin_lat FLOAT DEFAULT 0.0,
    origin_lng FLOAT DEFAULT 0.0,
    destination_lat FLOAT DEFAULT 0.0,
    destination_lng FLOAT DEFAULT 0.0,
    total_distance_km FLOAT DEFAULT 0.0,
    distance_km FLOAT DEFAULT 0.0,
    estimated_time_min INTEGER DEFAULT 0,
    estimated_duration_hours FLOAT DEFAULT 0.0,
    composite_risk_score FLOAT DEFAULT 0.0,
    safety_score FLOAT DEFAULT 1.0,
    route_score FLOAT DEFAULT 0.0,
    coordinates_geojson TEXT,
    geometry_raw TEXT,
    recommendation_reasons TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 12: route_segment_mappings
CREATE TABLE IF NOT EXISTS route_segment_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id VARCHAR(50) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    road_segment_id VARCHAR(50) NOT NULL REFERENCES road_segments(id) ON DELETE CASCADE,
    segment_id VARCHAR(50),
    sequence_order INTEGER NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 5. AI PREDICTIONS, HAZARDS, OBSERVATIONS & AUDITING LAYER
-- ----------------------------------------------------------------------------

-- Table 13: predictions
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(50) PRIMARY KEY,
    segment_id VARCHAR(50),
    prediction_type VARCHAR(50) DEFAULT 'RISK_SCORE',
    target_entity_type VARCHAR(50) DEFAULT 'ROAD_SEGMENT',
    target_entity_id VARCHAR(50),
    predicted_value TEXT,
    confidence FLOAT DEFAULT 1.0,
    model_version VARCHAR(50) DEFAULT 'v1.0.0',
    input_features TEXT,
    method VARCHAR(100) DEFAULT 'RULE_HEURISTIC',
    risk_score FLOAT DEFAULT 0.0,
    risk_level VARCHAR(20) DEFAULT 'LOW',
    rainfall_factor FLOAT DEFAULT 0.0,
    incident_factor FLOAT DEFAULT 0.0,
    terrain_factor FLOAT DEFAULT 0.0,
    recommendations_raw TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 14: weather_observations
CREATE TABLE IF NOT EXISTS weather_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    road_segment_id VARCHAR(50) REFERENCES road_segments(id) ON DELETE SET NULL,
    location_name VARCHAR(100),
    state VARCHAR(50),
    latitude FLOAT DEFAULT 0.0,
    longitude FLOAT DEFAULT 0.0,
    temperature_c FLOAT DEFAULT 20.0,
    rainfall_mm FLOAT DEFAULT 0.0,
    wind_speed_kmh FLOAT DEFAULT 0.0,
    visibility_meters FLOAT DEFAULT 10000.0,
    visibility_km FLOAT DEFAULT 10.0,
    hazard_advisory VARCHAR(255),
    condition VARCHAR(50) DEFAULT 'CLEAR',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 15: hazards
CREATE TABLE IF NOT EXISTS hazards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    road_segment_id VARCHAR(50) REFERENCES road_segments(id) ON DELETE SET NULL,
    hazard_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    state VARCHAR(50),
    latitude FLOAT DEFAULT 0.0,
    longitude FLOAT DEFAULT 0.0,
    radius_km FLOAT DEFAULT 5.0,
    boundary_geojson TEXT,
    active BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    description TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 16: alerts
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFORMATIONAL',
    category VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
    incident_id VARCHAR(50) REFERENCES incidents(id) ON DELETE SET NULL,
    trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE SET NULL,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    location_name VARCHAR(150),
    is_read BOOLEAN NOT NULL DEFAULT 0,
    is_acknowledged BOOLEAN NOT NULL DEFAULT 0,
    acknowledged_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP,
    metadata_raw TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 17: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    ip_address VARCHAR(50),
    details TEXT,
    details_raw TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 18: cold_chain_telemetry (Software Cold-Chain Monitoring)
CREATE TABLE IF NOT EXISTS cold_chain_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id VARCHAR(50) NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    temperature_c FLOAT NOT NULL,
    humidity_percent FLOAT NOT NULL DEFAULT 65.0,
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    source VARCHAR(30) NOT NULL DEFAULT 'SIMULATED_TELEMETRY',
    ambient_temp_c FLOAT NOT NULL DEFAULT 28.0,
    location_lat FLOAT,
    location_lng FLOAT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. INDEXES FOR PERFORMANCE & RELATIONAL QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_road_segments_status ON road_segments(current_status);
CREATE INDEX IF NOT EXISTS idx_road_segments_district ON road_segments(district_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
