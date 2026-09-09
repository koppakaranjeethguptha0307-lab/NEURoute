# NEURoute — Canonical Database Schema & Architecture Specification

**Project:** NEURoute — AI-Based Smart Logistics & Accessibility Intelligence Platform for North Eastern Region (NER)  
**SIH Problem Statement:** SIH26002  
**Team:** Nexara  
**Role:** Database Developer  
**Status:** Validated & Production-Ready  
**Supported Engines:** PostgreSQL 15+ with PostGIS Extension (Production) | SQLite 3.35+ (Zero-Config Demo Mode)

---

## 1. Executive Summary & Golden Rules

This specification defines the complete, canonical data tier for **NEURoute**. The schema is engineered to handle multimodal logistics routing, real-time road hazard intelligence, offline field reporting sync, fleet telemetry tracking, and explainable AI risk predictions across the 8 states of the North Eastern Region.

### Golden Rules
1. **Zero Data Duplication:** Every domain concept has exactly one canonical database table. Never create redundant variants (e.g. do not create `RoadIncident` alongside `Incident`).
2. **Dual-Database Parity:** Schema models and relational structures are identical between PostgreSQL/PostGIS (production) and SQLite (zero-config local demo mode).
3. **Transparent ML Predictability:** Tables storing AI predictions (`predictions`) record model confidence, calculation methods, and feature snapshots transparently without claiming unverified accuracy.
4. **Resilient Data States:** All tables explicitly support loading, empty, and error states through structured nullability, defaults, and SQL `CHECK` constraints.
5. **Cascading Safety:** Relational deletions use `ON DELETE CASCADE` only for tightly-coupled child components (such as route segments belonging to a route). Independent domain records (such as shipments, incidents, and audit logs) use `ON DELETE SET NULL` to preserve historical integrity.

---

## 2. Table Count & Canonical Inventory (16 vs. 17 Discrepancy Resolution)

> [!IMPORTANT]
> **Resolution of 16-vs-17 Table Count Discrepancy:**  
> The project `implementation_plan.md` mentions *"all 16 tables"* in its summary text, but explicitly enumerates **17 canonical tables** in its specification list. To ensure zero loss of domain functionality, **all 17 canonical tables are preserved and fully implemented**:
> 1. `roles`
> 2. `users`
> 3. `districts`
> 4. `road_segments`
> 5. `field_reports`
> 6. `incidents`
> 7. `vehicles`
> 8. `trips`
> 9. `shipments`
> 10. `routes`
> 11. `route_segment_mappings`
> 12. `predictions`
> 13. `weather_observations`
> 14. `hazards`
> 15. `alerts`
> 16. `logistics_hubs`
> 17. `audit_logs`

---

## 3. Geospatial Standards & Coordinate Reference System

To ensure seamless interoperability between PostGIS, SQLite, the FastAPI backend, and the Leaflet/OpenStreetMap frontend:

### 3.1. Coordinate Reference System & SRID
- **Canonical CRS:** **EPSG:4326 (WGS84)**
- **PostGIS Native Type:** `geometry(GeometryType, 4326)`
- **Display Projection:** Web Mercator (EPSG:3857) rendered dynamically by Leaflet with OpenStreetMap humanitarian and topographic tiles.
- **NER Bounding Box:**
  - Latitude: `21.5° N` to `29.5° N`
  - Longitude: `89.5° E` to `97.5° E`

### 3.2. Coordinate Ordering Convention
Different layers of the stack require specific coordinate ordering. The database standardizes this as follows:

| Layer / Component | Format / Convention | Example | Notes |
|---|---|---|---|
| **PostGIS Functions** | `ST_MakePoint(lon, lat)` | `ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326)` | OGC standard: X = Longitude, Y = Latitude |
| **GeoJSON Columns** | `[longitude, latitude]` | `[[91.7362, 26.1445], [91.8500, 26.1100]]` | RFC 7946 GeoJSON specification |
| **Relational Columns** | `latitude`, `longitude` | `lat = 26.1445, lon = 91.7362` | Explicit Float columns for non-spatial queries |
| **Leaflet Map (Frontend)** | `[latitude, longitude]` | `L.latLng(26.1445, 91.7362)` | Leaflet expects `[lat, lon]` when using Array coordinates |

### 3.3. SQLite vs. PostgreSQL Spatial Storage
- **PostgreSQL + PostGIS:** Uses native spatial geometry columns (`geometry`, `location`, `boundary`, `path_geometry`) accelerated by **GiST (Generalized Search Tree)** spatial indexes.
- **SQLite Demo Mode:** Stores geometries in text columns formatted as GeoJSON (`coordinates_geojson`, `boundary_geojson`) alongside explicit float `latitude` and `longitude` columns. This enables zero-config deployment without requiring external compiled binaries (like `mod_spatialite`), while allowing Python and the frontend to directly parse standard GeoJSON.

---

## 4. Canonical Enumerations & Status Domains

The database enforces data integrity through explicit SQL `CHECK` constraints:

| Enum Name | Allowed Values | Target Columns |
|---|---|---|
| `RoleEnum` | `ADMIN`, `LOGISTICS_OPERATOR`, `GOVERNMENT_AUTHORITY`, `EMERGENCY_RESPONSE`, `GENERAL_VIEWER`, `GIS_OFFICER`, `FIELD_OFFICER` | `users.role` |
| `RoadStatusEnum` | `OPEN`, `RISKY`, `BLOCKED`, `UNKNOWN` | `road_segments.current_status` |
| `SeverityEnum` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `field_reports.severity`, `incidents.severity`, `hazards.severity` |
| `IncidentCategoryEnum` | `LANDSLIDE`, `FLOOD`, `ROAD_DAMAGE`, `BRIDGE_ISSUE`, `HEAVY_RAINFALL`, `TRAFFIC_CONGESTION`, `ROAD_BLOCKAGE`, `OTHER` | `field_reports.category`, `incidents.category` |
| `IncidentStatusEnum` | `REPORTED`, `INVESTIGATING`, `VERIFIED`, `ACTIVE`, `RESOLVING`, `RESOLVED`, `REJECTED` | `incidents.status` |
| `SyncStatusEnum` | `PENDING_SYNC`, `SYNCED`, `FAILED` | `field_reports.sync_status` |
| `VehicleTypeEnum` | `LIGHT_TRUCK`, `HEAVY_TRUCK`, `FOUR_BY_FOUR`, `TANKER`, `REFRIGERATED_VAN` | `vehicles.vehicle_type` |
| `VehicleStatusEnum` | `AVAILABLE`, `IN_TRANSIT`, `MAINTENANCE`, `OFFLINE`, `DELAYED` | `vehicles.status` |
| `CargoPriorityEnum` | `STANDARD`, `HIGH`, `CRITICAL` | `shipments.cargo_priority`, `trips.cargo_priority` |
| `ShipmentStatusEnum` | `CREATED`, `ASSIGNED`, `IN_TRANSIT`, `DELAYED`, `REROUTED`, `DELIVERED`, `COMPLETED`, `CANCELLED` | `shipments.status` |
| `TripStatusEnum` | `SCHEDULED`, `EN_ROUTE`, `IN_TRANSIT`, `DELAYED`, `REROUTED`, `COMPLETED`, `CANCELLED` | `trips.status` |
| `RouteTypeEnum` | `RECOMMENDED_SAFEST`, `FASTEST`, `PRIORITY_LIFELINE`, `ALTERNATE` | `routes.route_type` |
| `HubTypeEnum` | `CENTRAL_DEPOT`, `DISTRIBUTION_CENTER`, `EMERGENCY_SUPPLY`, `TRANSPORT_HUB`, `RAILHEAD`, `FORWARD_BASE` | `logistics_hubs.hub_type` |
| `AlertSeverityEnum` | `INFO`, `WARNING`, `DANGER`, `CRITICAL` | `alerts.severity` |
| `PredictionTypeEnum` | `RISK_SCORE`, `DELAY_MINUTES`, `INCIDENT_CLASSIFICATION`, `ACCESSIBILITY_INDEX`, `CLEARANCE_TIME` | `predictions.prediction_type` |
| `HazardTypeEnum` | `LANDSLIDE_PRONE_ZONE`, `FLOOD_BASIN`, `EROSION`, `SEISMIC_FAULT`, `AVALANCHE_ZONE`, `MONSOON_VULNERABILITY` | `hazards.hazard_type` |

---

## 5. Detailed Table Specifications

### 5.1. Access & Governance Layer

#### 1. `roles`
Stores access control roles for the five portal user groups.
- `id` (INTEGER / SERIAL, PK): Unique role ID
- `name` (VARCHAR(50), UNIQUE, NOT NULL): Role name (`ADMIN`, `LOGISTICS_OPERATOR`, `GOVERNMENT_AUTHORITY`, `EMERGENCY_RESPONSE`, `GENERAL_VIEWER`)
- `description` (TEXT): Role operational remit

#### 2. `users`
Stores authenticated user accounts for officers, dispatchers, and responders.
- `id` (VARCHAR(36), PK): UUID
- `email` (VARCHAR(255), UNIQUE, NOT NULL): Login email address
- `hashed_password` (VARCHAR(255), NOT NULL): Bcrypt password hash
- `full_name` (VARCHAR(100), NOT NULL): Officer / Operator full name
- `badge_number` (VARCHAR(50)): Government / Department ID
- `phone_number` (VARCHAR(20)): Emergency contact number
- `role_id` (INT, FK -> `roles.id`, ON DELETE RESTRICT): Normalized role reference
- `role` (VARCHAR(50), NOT NULL): Role enum string for backward compatibility
- `is_active` (BOOLEAN, NOT NULL DEFAULT TRUE): Account active status
- `created_at` / `updated_at` (TIMESTAMPTZ): Timestamps

---

### 5.2. Geospatial Infrastructure Layer

#### 3. `districts`
Stores the 30+ regional administrative districts across all 8 North Eastern states.
- `id` (INTEGER / SERIAL, PK): District ID
- `name` (VARCHAR(100), NOT NULL): District name (e.g. Kamrup Metropolitan, East Khasi Hills)
- `state` (VARCHAR(50), NOT NULL): NER State (Assam, Meghalaya, Nagaland, Manipur, Arunachal Pradesh, Mizoram, Tripura, Sikkim)
- `boundary_geojson` (TEXT): GeoJSON polygon boundary
- `boundary` (GEOMETRY(MultiPolygon, 4326), PostGIS only): Native spatial polygon
- `accessibility_score` (FLOAT, NOT NULL DEFAULT 100.0, CHECK 0.0-100.0): Dynamic accessibility index
- `score_updated_at` (TIMESTAMPTZ): Score calculation timestamp

#### 4. `road_segments`
Stores discretized segments of major highway lifelines (NH-06, NH-27, NH-102, NH-29, Shillong Bypass).
- `id` (VARCHAR(36), PK): Segment ID (e.g. `seg-nh06-03`)
- `osm_id` (BIGINT): OpenStreetMap reference way ID
- `name` (VARCHAR(150), NOT NULL): Highway name and corridor description
- `district_id` (INT, FK -> `districts.id`, ON DELETE CASCADE, NOT NULL): Parent district
- `coordinates_geojson` (TEXT, NOT NULL): GeoJSON coordinate array `[[lon, lat], ...]`
- `geometry` (GEOMETRY(LineString, 4326), PostGIS only): Native spatial polyline
- `length_km` (FLOAT, NOT NULL DEFAULT 10.0, CHECK >= 0.0): Segment length in kilometers
- `base_speed_kmh` (FLOAT, NOT NULL DEFAULT 40.0, CHECK >= 0.0): Baseline speed limit
- `current_status` (VARCHAR(20), NOT NULL DEFAULT 'OPEN', CHECK enum): Operational status (`OPEN`, `RISKY`, `BLOCKED`, `UNKNOWN`)
- `current_risk_score` (FLOAT, NOT NULL DEFAULT 0.0, CHECK 0.0-1.0): Dynamic composite risk score
- `is_critical_lifeline` (BOOLEAN, NOT NULL DEFAULT FALSE): Priority corridor flag
- `last_assessed_at` (TIMESTAMPTZ): Status calculation timestamp

#### 16. `logistics_hubs`
Stores strategic warehouses, distribution centers, and emergency supply forward depots.
- `id` (VARCHAR(36), PK): Hub ID (e.g. `hub-ghy-01`)
- `name` (VARCHAR(150), NOT NULL): Hub name
- `hub_type` (VARCHAR(50), NOT NULL, CHECK enum): Type (`CENTRAL_DEPOT`, `DISTRIBUTION_CENTER`, `EMERGENCY_SUPPLY`, etc.)
- `district_id` (INT, FK -> `districts.id`, ON DELETE SET NULL): Location district
- `latitude` / `longitude` (FLOAT, NOT NULL, CHECK ranges): GPS coordinates
- `location` (GEOMETRY(Point, 4326), PostGIS only): Native spatial point
- `capacity_tons` (FLOAT, NOT NULL DEFAULT 500.0, CHECK >= 0.0): Storage payload capacity
- `contact_phone` (VARCHAR(20)): Terminal contact phone
- `is_active` (BOOLEAN, NOT NULL DEFAULT TRUE): Operational status
- `created_at` (TIMESTAMPTZ): Registration timestamp

---

### 5.3. Field Reporting & Incident Management Layer

#### 5. `field_reports`
Stores crowdsourced and patrol reports collected via mobile devices, supporting offline-first sync.
- `id` (VARCHAR(36), PK): Server report ID
- `client_uuid` (VARCHAR(36), UNIQUE, NOT NULL): Device-generated idempotency key
- `reporter_id` (VARCHAR(36), FK -> `users.id`, ON DELETE SET NULL): Submitting officer
- `category` (VARCHAR(50), NOT NULL, CHECK enum): Incident category
- `severity` (VARCHAR(20), NOT NULL, CHECK enum): Observed severity
- `description` (TEXT, NOT NULL): Report notes
- `latitude` / `longitude` (FLOAT, NOT NULL, CHECK ranges): Incident GPS coordinates
- `location` (GEOMETRY(Point, 4326), PostGIS only): Native spatial point
- `photo_url` (TEXT): Attached evidence photo URL
- `sync_status` (VARCHAR(20), NOT NULL DEFAULT 'SYNCED', CHECK enum): Offline sync state
- `client_reported_at` (TIMESTAMPTZ, NOT NULL): Timestamp recorded on device
- `server_received_at` (TIMESTAMPTZ): Timestamp accepted by server

#### 6. `incidents`
Stores verified road network disruptions impacting route safety and travel delays.
- `id` (VARCHAR(36), PK): Incident ID (e.g. `inc-snp-01`)
- `field_report_id` (VARCHAR(36), FK -> `field_reports.id`, ON DELETE SET NULL): Originating report
- `road_segment_id` (VARCHAR(36), FK -> `road_segments.id`, ON DELETE SET NULL): Impacted road segment
- `district_id` (INT, FK -> `districts.id`, ON DELETE SET NULL): Incident district
- `category` (VARCHAR(50), NOT NULL, CHECK enum): Incident category
- `severity` (VARCHAR(20), NOT NULL, CHECK enum): Severity rating
- `status` (VARCHAR(20), NOT NULL DEFAULT 'REPORTED', CHECK enum): Lifecycle status (`REPORTED`, `INVESTIGATING`, `VERIFIED`, `ACTIVE`, `RESOLVING`, `RESOLVED`, `REJECTED`)
- `latitude` / `longitude` (FLOAT, NOT NULL, CHECK ranges): Incident coordinates
- `location` (GEOMETRY(Point, 4326), PostGIS only): Native spatial point
- `description` (TEXT, NOT NULL): Operational description
- `photo_url` (TEXT): Verified evidence image URL
- `confidence` (FLOAT, NOT NULL DEFAULT 1.0, CHECK 0.0-1.0): Verification confidence
- `verified_by` (VARCHAR(36), FK -> `users.id`, ON DELETE SET NULL): Verifying officer
- `verified_at` / `resolved_at` (TIMESTAMPTZ): Lifecycle timestamps
- `created_at` (TIMESTAMPTZ): Record creation timestamp

---

### 5.4. Fleet Telemetry & Logistics Operations Layer

#### 7. `vehicles`
Stores transport vehicles, telemetry coordinates, and driver allocations.
- `id` (VARCHAR(36), PK): Vehicle ID (e.g. `veh-ner-01`)
- `registration_number` (VARCHAR(30), UNIQUE, NOT NULL): Official license plate
- `vehicle_type` (VARCHAR(30), NOT NULL, CHECK enum): Vehicle class (`REFRIGERATED_VAN`, `FOUR_BY_FOUR`, `TANKER`, `HEAVY_TRUCK`, etc.)
- `capacity_tons` (FLOAT, NOT NULL, CHECK >= 0.0): Maximum payload capacity
- `driver_name` / `driver_phone` (VARCHAR): Assigned driver details
- `status` (VARCHAR(20), NOT NULL DEFAULT 'AVAILABLE', CHECK enum): Fleet status
- `current_latitude` / `current_longitude` (FLOAT, CHECK ranges): Latest GPS fix
- `last_known_location` (GEOMETRY(Point, 4326), PostGIS only): Native spatial point
- `is_active` (BOOLEAN, NOT NULL DEFAULT TRUE): Active fleet flag
- `last_telemetry_at` (TIMESTAMPTZ): Telemetry timestamp

#### 8. `trips`
Stores active transport manifests executing freight movement.
- `id` (VARCHAR(36), PK): Trip ID (e.g. `trip-ner-01`)
- `vehicle_id` (VARCHAR(36), FK -> `vehicles.id`, ON DELETE SET NULL): Assigned vehicle
- `operator_id` (VARCHAR(36), FK -> `users.id`, ON DELETE SET NULL): Dispatch operator
- `shipment_id` (VARCHAR(36), FK -> `shipments.id`, ON DELETE SET NULL): Associated shipment
- `origin_name` / `dest_name` (VARCHAR(150), NOT NULL): Origin and destination terminals
- `origin_lat`, `origin_lon`, `dest_lat`, `dest_lon` (FLOAT, NOT NULL): Coordinate endpoints
- `origin_coords`, `dest_coords` (GEOMETRY(Point, 4326), PostGIS only): Native spatial points
- `cargo_type` (VARCHAR(100), NOT NULL): Cargo description
- `cargo_priority` (VARCHAR(20), NOT NULL DEFAULT 'STANDARD', CHECK enum): Priority rating
- `status` (VARCHAR(20), NOT NULL DEFAULT 'SCHEDULED', CHECK enum): Trip state
- `active_route_id` (VARCHAR(36), FK -> `routes.id`, ON DELETE SET NULL): Currently followed route
- `baseline_eta` / `current_eta` (TIMESTAMPTZ): Dynamic ETA projections
- `delay_minutes` (INT, NOT NULL DEFAULT 0, CHECK >= 0): Cumulative delay
- `started_at` / `completed_at` (TIMESTAMPTZ): Trip milestones
- `created_at` (TIMESTAMPTZ): Creation timestamp

#### 9. `shipments`
Stores essential freight consignments tracked across the platform.
- `id` (VARCHAR(36), PK): Shipment ID (e.g. `shp-ner-01`)
- `shipment_number` (VARCHAR(50), UNIQUE, NOT NULL): Tracking code (e.g. `SHP-2026-MED-01`)
- `goods_type` (VARCHAR(100), NOT NULL): Essential cargo class (Medicines/Vaccines, Ration, Diesel, General Supplies)
- `cargo_priority` (VARCHAR(20), NOT NULL DEFAULT 'STANDARD', CHECK enum): Priority rating
- `source_name` / `dest_name` (VARCHAR(150), NOT NULL): Terminals
- `source_lat`, `source_lon`, `dest_lat`, `dest_lon` (FLOAT, NOT NULL): Coordinates
- `vehicle_id` (VARCHAR(36), FK -> `vehicles.id`, ON DELETE SET NULL): Assigned vehicle
- `trip_id` (VARCHAR(36), FK -> `trips.id`, ON DELETE SET NULL): Assigned trip
- `status` (VARCHAR(30), NOT NULL DEFAULT 'CREATED', CHECK enum): Consignment status
- `estimated_arrival` (TIMESTAMPTZ): Projected arrival
- `delay_minutes` (INT, NOT NULL DEFAULT 0, CHECK >= 0): Disruption delay
- `risk_score` (FLOAT, NOT NULL DEFAULT 0.0, CHECK 0.0-1.0): Current route risk
- `created_at` (TIMESTAMPTZ): Creation timestamp

#### 10. `routes`
Stores AI-generated and alternate route paths comparing safest vs. fastest alternatives.
- `id` (VARCHAR(36), PK): Route ID (e.g. `route-ner-01`)
- `shipment_id` (VARCHAR(36), FK -> `shipments.id`, ON DELETE CASCADE): Linked shipment
- `trip_id` (VARCHAR(36), FK -> `trips.id`, ON DELETE SET NULL): Linked trip
- `route_type` (VARCHAR(30), NOT NULL, CHECK enum): Route category (`RECOMMENDED_SAFEST`, `FASTEST`, `PRIORITY_LIFELINE`, `ALTERNATE`)
- `total_distance_km` (FLOAT, NOT NULL, CHECK >= 0.0): Distance in km
- `estimated_time_min` (INT, NOT NULL, CHECK >= 0): Travel time in minutes
- `composite_risk_score` (FLOAT, NOT NULL DEFAULT 0.0, CHECK 0.0-1.0): Aggregate corridor risk
- `route_score` (FLOAT, NOT NULL DEFAULT 0.0): Multi-criteria optimization score
- `coordinates_geojson` (TEXT, NOT NULL): Full polyline GeoJSON array
- `path_geometry` (GEOMETRY(LineString, 4326), PostGIS only): Native spatial polyline
- `recommendation_reasons` (TEXT): JSON array of explainable AI decision factors
- `created_at` (TIMESTAMPTZ): Generation timestamp

#### 11. `route_segment_mappings`
Stores the exact sequence of road segments that comprise a route.
- `id` (INTEGER / BIGSERIAL, PK): Mapping ID
- `route_id` (VARCHAR(36), NOT NULL, FK -> `routes.id`, ON DELETE CASCADE): Parent route
- `road_segment_id` (VARCHAR(36), NOT NULL, FK -> `road_segments.id`, ON DELETE CASCADE): Traversed segment
- `sequence_order` (INT, NOT NULL, CHECK >= 0): Traversal order (1, 2, 3...)
- Constraint: `UNIQUE (route_id, sequence_order)`

---

### 5.5. AI Predictions, Environmental Observations & Alerts Layer

#### 12. `predictions`
Stores explainable AI model predictions with transparent methods and confidence values.
- `id` (VARCHAR(36), PK): Prediction ID
- `prediction_type` (VARCHAR(50), NOT NULL, CHECK enum): Prediction class (`RISK_SCORE`, `DELAY_MINUTES`, `INCIDENT_CLASSIFICATION`, etc.)
- `target_entity_type` (VARCHAR(50), NOT NULL, CHECK enum): Target type (`ROUTE`, `ROAD_SEGMENT`, `INCIDENT`, `TRIP`, `DISTRICT`, `SHIPMENT`)
- `target_entity_id` (VARCHAR(36), NOT NULL): Target entity primary key
- `predicted_value` (TEXT, NOT NULL): JSON formatted prediction output
- `confidence` (FLOAT, NOT NULL, CHECK 0.0-1.0): Model confidence score
- `model_version` (VARCHAR(50), NOT NULL): Model registry identifier
- `input_features` (TEXT): Feature vector snapshot
- `method` (VARCHAR(100), DEFAULT 'RULE_HEURISTIC'): Transparent methodology
- `created_at` (TIMESTAMPTZ): Timestamp

#### 13. `weather_observations`
Stores environmental and meteorological telemetry affecting road surface safety.
- `id` (INTEGER / BIGSERIAL, PK): Observation ID
- `district_id` (INT, NOT NULL, FK -> `districts.id`, ON DELETE CASCADE): District
- `road_segment_id` (VARCHAR(36), FK -> `road_segments.id`, ON DELETE SET NULL): Specific road segment
- `rainfall_mm` (FLOAT, NOT NULL DEFAULT 0.0, CHECK >= 0.0): Precipitation
- `wind_speed_kmh` (FLOAT, NOT NULL DEFAULT 0.0, CHECK >= 0.0): Wind speed
- `visibility_meters` (FLOAT, NOT NULL DEFAULT 10000.0, CHECK >= 0.0): Visibility in meters
- `temperature_c` (FLOAT, NOT NULL DEFAULT 20.0): Temperature in Celsius
- `hazard_advisory` (VARCHAR(255)): Meteorological warning text
- `recorded_at` (TIMESTAMPTZ): Observation timestamp

#### 14. `hazards`
Stores geographic high-risk hazard zones (landslide chutes, flood plains, seismic fault zones).
- `id` (VARCHAR(36), PK): Hazard ID
- `district_id` (INT, FK -> `districts.id`, ON DELETE SET NULL): District
- `road_segment_id` (VARCHAR(36), FK -> `road_segments.id`, ON DELETE SET NULL): Adjacent road segment
- `hazard_type` (VARCHAR(50), NOT NULL, CHECK enum): Hazard class (`LANDSLIDE_PRONE_ZONE`, `FLOOD_BASIN`, `EROSION`, etc.)
- `severity` (VARCHAR(20), NOT NULL, CHECK enum): Risk severity
- `latitude` / `longitude` (FLOAT, CHECK ranges): Centroid coordinates
- `boundary_geojson` (TEXT): Spatial polygon GeoJSON
- `geometry` (GEOMETRY(Polygon, 4326), PostGIS only): Native spatial polygon
- `active` (BOOLEAN, NOT NULL DEFAULT TRUE): Active warning status
- `description` (TEXT): Hazard vulnerability details
- `reported_at` (TIMESTAMPTZ): Issuance timestamp

#### 15. `alerts`
Stores operational notifications and critical reroute warnings for operators and dispatchers.
- `id` (VARCHAR(36), PK): Alert ID
- `title` (VARCHAR(150), NOT NULL): Headline summary
- `message` (TEXT, NOT NULL): Full notification body
- `severity` (VARCHAR(20), NOT NULL, CHECK enum): Severity (`INFO`, `WARNING`, `DANGER`, `CRITICAL`)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`, ON DELETE SET NULL): Associated incident
- `trip_id` (VARCHAR(36), FK -> `trips.id`, ON DELETE SET NULL): Affected trip
- `shipment_id` (VARCHAR(36), FK -> `shipments.id`, ON DELETE SET NULL): Affected shipment
- `user_id` (VARCHAR(36), FK -> `users.id`, ON DELETE SET NULL): Targeted user
- `location_name` (VARCHAR(150)): Geographic landmark
- `is_read` (BOOLEAN, NOT NULL DEFAULT FALSE): Acknowledgment flag
- `created_at` (TIMESTAMPTZ): Notification timestamp

#### 17. `audit_logs`
Stores tamper-evident event logs tracking security, overrides, and dispatch operations.
- `id` (INTEGER / BIGSERIAL, PK): Log ID
- `user_id` (VARCHAR(36), FK -> `users.id`, ON DELETE SET NULL): Initiating user
- `action` (VARCHAR(100), NOT NULL): Operational action (e.g. `OVERRIDE_ROAD_STATUS`, `DISPATCH_EMERGENCY_REROUTE`)
- `entity_type` (VARCHAR(50), NOT NULL): Affected table
- `entity_id` (VARCHAR(100), NOT NULL): Affected primary key
- `details` (TEXT): JSON payload before/after state
- `ip_address` (VARCHAR(45)): Client IP
- `created_at` (TIMESTAMPTZ): Event timestamp

---

## 6. Seed Data Fixtures Inventory

The database seeder (`database/seed_data.py`) populates realistic North Eastern Region operational data across all 17 tables:

1. **Governance & Auth:**
   - 5 roles: `ADMIN`, `LOGISTICS_OPERATOR`, `GOVERNMENT_AUTHORITY`, `EMERGENCY_RESPONSE`, `GENERAL_VIEWER`.
   - 5 demo accounts with pre-hashed bcrypt credentials (`Demo1234!`) covering all 5 roles.
2. **Regional Coverage:**
   - 30 districts covering all 8 North Eastern states (Assam, Meghalaya, Nagaland, Manipur, Arunachal Pradesh, Mizoram, Tripura, Sikkim).
   - Key districts: East Khasi Hills, Kamrup Metropolitan, Cachar, Kohima, Imphal West, Papum Pare, Aizawl, West Tripura.
3. **Strategic Lifelines:**
   - 12 road segments representing NH-06 (Guwahati-Shillong-Silchar), Shillong Bypass (NH-106), NH-27 (Guwahati-Kaziranga-Jorhat), NH-102 (Imphal-Thoubal-Moreh), and NH-29 (Dimapur-Kohima).
4. **Logistics Hubs:**
   - 6 strategic depots: Guwahati Central Depot (5000t), Shillong Mountain Lifeline Center (1200t), Silchar Forward Depot (2500t), Dimapur Railhead Hub (3500t), Imphal Valley Cargo Center (1800t), Tezpur Forward Base (2200t).
5. **Fleet & Telemetry:**
   - 6 demo vehicles (Refrigerated Van, 4x4, Tanker, Light Truck, Heavy Trucks) with live coordinates and driver details.
6. **Active Shipments & Trips:**
   - 4 active consignments representing all core cargo types: `Medicines/Vaccines` (CRITICAL priority, Guwahati to Silchar, delayed by landslide), `Ration` (HIGH priority, Shillong to Jowai), `Diesel` (CRITICAL priority, Guwahati to Tezpur), and `General Supplies` (STANDARD priority, Dimapur to Kohima).
7. **Disruption Incidents:**
   - Sonapur Landslide (`inc-snp-01` on NH-06, blocked, confidence 0.95).
   - Kaziranga Brahmaputra Flood (`inc-kzr-04` on NH-27, risky, confidence 0.92).
   - Umiam Ridge Heavy Rainfall (`inc-umi-02`).
   - Thoubal Road Scouring (`inc-thb-03`).
8. **Explainable AI Predictions:**
   - Risk prediction on NH-06 Sonapur corridor (composite score 0.94, Critical risk level).
   - Travel delay prediction for medical shipment (140-minute bottleneck delay).
   - NLP category classification for Sonapur report (Landslide, 0.96 confidence).
9. **Alerts & Audit Logs:**
   - 4 operational alerts and 3 audit logs capturing status overrides and reroute dispatches.

---

## 7. Backend Developer Integration Guide

### How to Initialize & Seed the Database in Backend Code
The backend developer can import and invoke the initialization logic directly:

```python
# In backend startup (e.g. backend/app/main.py lifespan or session.py):
from database.seed_data import init_database, seed_all

# Zero-config SQLite initialization (creates tables & seeds automatically):
init_database(db_path="neuroute.db")

# Or programmatic seeding with an active connection:
# seed_all(connection=db_connection)
```

### CLI Commands for Database Management
```bash
# Initialize and seed default SQLite database (neuroute.db):
python database/seed_data.py

# Drop existing database and re-seed from clean state:
python database/seed_data.py --reset

# Run automated database test suite:
pytest tests/test_database.py -v
```
