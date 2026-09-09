# Handoff Contract: Database & Persistence Layer

**Target Audience:** Database Teammate (PostgreSQL, PostGIS, Alembic Migrations, Seed Data, Canonical SQLAlchemy Models)  
**Author:** Backend Application Core Engineer  
**Status:** PROPOSED — Pending Database Teammate Sign-off  

---

## 1. Context & Scope

The Backend Application Core interacts with the database solely through the repository layer (`backend/app/repositories/`) and the declarative model interfaces (`backend/app/models/`).

> [!IMPORTANT]
> **Source of Truth Status:**  
> The repository currently contains placeholder files (`database/schema.sql`, `database/migrations/.gitkeep`, `database/seed/.gitkeep`) without a pre-existing ERD or data dictionary. The 17 model definitions below represent the proposed entity contracts derived from the SIH26002 problem statement. Please review, adjust, or replace them with your canonical PostgreSQL + PostGIS schema.

---

## 2. Proposed 17 Entity Model Contracts

| # | Entity Name | Table Name | Key Fields & Types | Relationships / Foreign Keys | Verification Status |
|---|---|---|---|---|---|
| 1 | `Role` | `roles` | `id: Integer (PK)`, `name: String(50, unique)`, `description: String(255)` | `users: relationship("User")` | Proposed — Unverifiable (No prior repo ERD) |
| 2 | `User` | `users` | `id: Integer (PK)`, `username: String(50, unique)`, `email: String(100, unique)`, `hashed_password: String(255)`, `full_name: String(100)`, `role_id: Integer (FK)`, `is_active: Boolean`, `phone_number: String(20)`, `department: String(100)`, `created_at: DateTime`, `updated_at: DateTime` | `role: relationship("Role")`, `role_id -> roles.id` | Proposed — Unverifiable |
| 3 | `District` | `districts` | `id: Integer (PK)`, `name: String(100)`, `state: String(50)`, `headquarters: String(100)`, `accessibility_score: Float`, `total_road_km: Float`, `blocked_road_km: Float`, `active_incidents_count: Integer`, `created_at: DateTime` | `road_segments`, `hubs` | Proposed — Unverifiable |
| 4 | `RoadSegment` | `road_segments` | `id: Integer (PK)`, `segment_code: String(50, unique)`, `name: String(200)`, `highway_number: String(50)`, `district_id: Integer (FK)`, `start_lat: Float`, `start_lng: Float`, `end_lat: Float`, `end_lng: Float`, `length_km: Float`, `elevation_gain_m: Float`, `is_critical_lifeline: Boolean`, `current_status: String(20)`, `risk_score: Float`, `speed_limit_kmh: Float`, `coordinates_raw: Text (JSON)` | `district_id -> districts.id`, `incidents`, `predictions` | Proposed — Unverifiable |
| 5 | `Incident` | `incidents` | `id: Integer (PK)`, `title: String(200)`, `category: String(50)`, `severity: String(20)`, `status: String(20)`, `description: Text`, `latitude: Float`, `longitude: Float`, `road_segment_id: Integer (FK)`, `district_id: Integer (FK)`, `blocked_lanes: Integer`, `passable_by_heavy_vehicles: Boolean`, `estimated_clearance_hours: Float`, `reported_by_user_id: Integer (FK)`, `resolution_notes: Text`, `reported_at: DateTime`, `resolved_at: DateTime`, `updated_at: DateTime` | `road_segment_id -> road_segments.id`, `district_id -> districts.id`, `reported_by_user_id -> users.id` | Proposed — Unverifiable |
| 6 | `FieldReport` | `field_reports` | `id: Integer (PK)`, `client_report_uuid: String(100, unique)`, `title: String(200)`, `category: String(50)`, `severity: String(20)`, `description: Text`, `latitude: Float`, `longitude: Float`, `captured_at: DateTime`, `synced_at: DateTime`, `photos_raw: Text (JSON)`, `status: String(20)` | Offline mobile sync record | Proposed — Unverifiable |
| 7 | `LogisticsHub` | `logistics_hubs` | `id: Integer (PK)`, `name: String(150)`, `hub_type: String(50)`, `state: String(50)`, `district_id: Integer (FK)`, `latitude: Float`, `longitude: Float`, `capacity_tonnes: Float`, `is_emergency_depot: Boolean`, `contact_phone: String(20)`, `created_at: DateTime` | `district_id -> districts.id`, `vehicles` | Proposed — Unverifiable |
| 8 | `Vehicle` | `vehicles` | `id: Integer (PK)`, `registration_number: String(50, unique)`, `vehicle_type: String(50)`, `capacity_kg: Float`, `driver_name: String(100)`, `driver_phone: String(20)`, `status: String(20)`, `assigned_hub_id: Integer (FK)`, `current_lat: Float`, `current_lng: Float`, `speed_kmh: Float`, `heading_deg: Float`, `fuel_level_percent: Float`, `last_telemetry_at: DateTime`, `created_at: DateTime`, `updated_at: DateTime` | `assigned_hub_id -> logistics_hubs.id`, `shipments`, `trips` | Proposed — Unverifiable |
| 9 | `Trip` | `trips` | `id: Integer (PK)`, `trip_code: String(50, unique)`, `vehicle_id: Integer (FK)`, `driver_name: String(100)`, `status: String(20)`, `origin_lat: Float`, `origin_lng: Float`, `dest_lat: Float`, `dest_lng: Float`, `distance_km: Float`, `duration_hours: Float`, `start_time: DateTime`, `end_time: DateTime`, `created_at: DateTime` | `vehicle_id -> vehicles.id` | Proposed — Unverifiable |
| 10 | `Shipment` | `shipments` | `id: Integer (PK)`, `tracking_number: String(50, unique)`, `title: String(200)`, `cargo_type: String(100)`, `cargo_priority: String(20)`, `weight_kg: Float`, `origin_hub_id: Integer (FK)`, `origin_address: String(255)`, `origin_lat: Float`, `origin_lng: Float`, `destination_hub_id: Integer (FK)`, `destination_address: String(255)`, `destination_lat: Float`, `destination_lng: Float`, `assigned_vehicle_id: Integer (FK)`, `status: String(20)`, `dispatched_at: DateTime`, `delivered_at: DateTime`, `estimated_delivery: DateTime`, `current_lat: Float`, `current_lng: Float`, `notes: Text`, `created_at: DateTime`, `updated_at: DateTime` | `origin_hub_id -> logistics_hubs.id`, `destination_hub_id -> logistics_hubs.id`, `assigned_vehicle_id -> vehicles.id` | Proposed — Unverifiable |
| 11 | `Route` | `routes` | `id: Integer (PK)`, `origin_lat: Float`, `origin_lng: Float`, `destination_lat: Float`, `destination_lng: Float`, `distance_km: Float`, `estimated_duration_hours: Float`, `criterion: String(50)`, `safety_score: Float`, `geometry_raw: Text (JSON)`, `created_at: DateTime` | Route entity | Proposed — Unverifiable |
| 12 | `RouteSegmentMapping` | `route_segment_mappings` | `id: Integer (PK)`, `route_id: Integer (FK)`, `segment_id: Integer (FK)`, `sequence_order: Integer` | `route_id -> routes.id`, `segment_id -> road_segments.id` | Proposed — Unverifiable |
| 13 | `Prediction` | `predictions` | `id: Integer (PK)`, `segment_id: Integer (FK)`, `risk_score: Float`, `risk_level: String(20)`, `rainfall_factor: Float`, `incident_factor: Float`, `terrain_factor: Float`, `recommendations_raw: Text (JSON)`, `created_at: DateTime` | `segment_id -> road_segments.id` | Proposed — Unverifiable |
| 14 | `WeatherObservation` | `weather_observations` | `id: Integer (PK)`, `location_name: String(100)`, `state: String(50)`, `latitude: Float`, `longitude: Float`, `temperature_c: Float`, `rainfall_mm: Float`, `wind_speed_kmh: Float`, `visibility_km: Float`, `condition: String(50)`, `observed_at: DateTime` | Regional telemetry record | Proposed — Unverifiable |
| 15 | `Hazard` | `hazards` | `id: Integer (PK)`, `name: String(150)`, `hazard_type: String(50)`, `severity: String(20)`, `state: String(50)`, `district_id: Integer (FK)`, `latitude: Float`, `longitude: Float`, `radius_km: Float`, `is_active: Boolean`, `created_at: DateTime` | `district_id -> districts.id` | Proposed — Unverifiable |
| 16 | `Alert` | `alerts` | `id: Integer (PK)`, `title: String(200)`, `message: Text`, `severity: String(20)`, `category: String(50)`, `entity_type: String(50)`, `entity_id: Integer`, `is_read: Boolean`, `is_acknowledged: Boolean`, `acknowledged_by_user_id: Integer (FK)`, `acknowledged_at: DateTime`, `metadata_raw: Text (JSON)`, `created_at: DateTime` | `acknowledged_by_user_id -> users.id` | Proposed — Unverifiable |
| 17 | `AuditLog` | `audit_logs` | `id: Integer (PK)`, `user_id: Integer (FK)`, `username: String(50)`, `action: String(100)`, `entity_type: String(50)`, `entity_id: String(50)`, `ip_address: String(50)`, `details_raw: Text (JSON)`, `timestamp: DateTime` | `user_id -> users.id` | Proposed — Unverifiable |

---

## 3. Repository Method Expectations

The Backend Core repositories (`backend/app/repositories/`) expect the following query patterns against the database session:

### `BaseRepository[T]` (Generic CRUD)
- `get_by_id(id: Any) -> Optional[T]`
- `get_all(skip: int = 0, limit: int = 100) -> List[T]`
- `count() -> int`
- `create(obj: T) -> T`
- `update(obj: T) -> T`
- `delete(obj: T) -> None`

### Domain Repositories
- **`UserRepository`**: `get_by_username(str)`, `get_by_email(str)`, `get_by_username_or_email(str)`, `get_role_by_name(str)`, `get_all_roles()`
- **`ShipmentRepository`**: `get_by_tracking_number(str)`, `get_by_status(str)`, `get_by_vehicle(int)`, `get_active_shipments()`
- **`VehicleRepository`**: `get_by_registration(str)`, `get_by_status(str)`, `get_available_vehicles(min_capacity_kg: float)`, `get_by_hub(int)`
- **`IncidentRepository`**: `get_active_incidents()`, `get_by_road_segment(int, active_only=True)`, `get_by_category(str)`, `get_by_district(int)`
- **`RoadRepository`**: `get_by_segment_code(str)`, `get_by_highway(str)`, `get_by_status(str)`, `get_by_district(int)`, `get_critical_lifelines()`
- **`RouteRepository`**: `get_segments_for_route(route_id: int)`, `add_segment_mapping(route_id, segment_id, sequence_order)`
- **`AlertRepository`**: `get_unread_alerts(limit=50)`, `get_by_severity(str, limit=50)`, `acknowledge_alert(alert_id, user_id)`
- **`AuditRepository`**: `get_recent_logs(limit=100)`, `get_by_action(str, limit=50)`, `get_by_entity(entity_type, entity_id)`
- **`DistrictRepository`**: `get_by_name(str)`, `get_by_state(str)`

---

## 4. Pending Database Teammate Deliverables (Blockers)

1. `database/schema.sql` (PostgreSQL + PostGIS DDL with spatial geometry columns for road lines and hazard buffers).
2. `database/migrations/` (Initial Alembic migration script creating the 17 tables).
3. `database/seed/` (Seed data covering NER highway corridors NH-06, NH-27, NH-102, 8 NER states, logistics hubs, and initial RBAC credentials).
