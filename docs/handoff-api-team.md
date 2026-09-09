# Handoff Contract: API & REST Endpoint Layer

**Target Audience:** API Teammate (FastAPI Routers, `/api/v1/*` Endpoints, Request/Response Formatting)  
**Author:** Backend Application Core Engineer  
**Status:** READY FOR ROUTER MOUNTING  

---

## 1. Overview & Architectural Boundaries

Backend Application Core business services in `backend/app/services/` are 100% decoupled from HTTP. They do not import `APIRouter`, `Request`, `Response`, or `HTTPException`.

API routers in `backend/app/api/routes/` should mount endpoints under `/api/v1/*`, inject services using `backend/app/dependencies.py`, and let the domain exceptions propagate to `RequestContextMiddleware` for automatic standardized JSON error response translation.

---

## 2. Public Service Method Signatures

### `AuthService` (`backend/app/services/auth_service.py`)
- `authenticate_user(username_or_email: str, plain_password: str) -> User`  
  *Raises:* `AuthenticationError`
- `create_user_token(user: User) -> TokenResponse`
- `get_current_user_from_token(token: str) -> UserContext`  
  *Raises:* `AuthenticationError`
- `register_user(user_in: UserCreate) -> User`  
  *Raises:* `ConflictError`
- `verify_role_permission(current_user_role: UserRole, allowed_roles: List[UserRole]) -> None`  
  *Raises:* `AuthorizationError`

### `ShipmentService` (`backend/app/services/shipment_service.py`)
- `get_shipment(shipment_id: int) -> Shipment`  
  *Raises:* `ResourceNotFoundError`
- `get_shipment_by_tracking(tracking_number: str) -> Shipment`  
  *Raises:* `ResourceNotFoundError`
- `list_shipments(status: Optional[ShipmentStatus] = None, skip: int = 0, limit: int = 100) -> List[Shipment]`
- `create_shipment(data: ShipmentCreate) -> Shipment`  
  *Raises:* `ConflictError`, `ValidationError`, `BusinessRuleError`, `ResourceNotFoundError`
- `transition_status(shipment_id: int, transition: ShipmentStatusTransition) -> Shipment`  
  *Raises:* `ResourceNotFoundError`, `BusinessRuleError`, `ValidationError`
- `assign_vehicle(shipment_id: int, vehicle_id: int) -> Shipment`  
  *Raises:* `ResourceNotFoundError`, `BusinessRuleError`
- `check_rerouting_eligibility(shipment: Shipment) -> bool`

### `VehicleService` (`backend/app/services/vehicle_service.py`)
- `get_vehicle(vehicle_id: int) -> Vehicle`  
  *Raises:* `ResourceNotFoundError`
- `get_vehicle_by_reg(registration_number: str) -> Vehicle`  
  *Raises:* `ResourceNotFoundError`
- `list_vehicles(status: Optional[VehicleStatus] = None, hub_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Vehicle]`
- `create_vehicle(data: VehicleCreate) -> Vehicle`  
  *Raises:* `ConflictError`, `ValidationError`
- `update_telemetry(vehicle_id: int, telemetry: VehicleLocationUpdate) -> Vehicle`  
  *Raises:* `ResourceNotFoundError`, `ValidationError`
- `update_status(vehicle_id: int, status: VehicleStatus) -> Vehicle`  
  *Raises:* `ResourceNotFoundError`

### `IncidentService` (`backend/app/services/incident_service.py`)
- `get_incident(incident_id: int) -> Incident`  
  *Raises:* `ResourceNotFoundError`
- `list_incidents(active_only: bool = False, category: Optional[IncidentCategory] = None, skip: int = 0, limit: int = 100) -> List[Incident]`
- `report_incident(data: IncidentCreate) -> Incident`  
  *Raises:* `ValidationError`
- `transition_status(incident_id: int, transition: IncidentStatusTransition) -> Incident`  
  *Raises:* `ResourceNotFoundError`, `BusinessRuleError`

### `GISService` (`backend/app/services/gis_service.py`)
- `validate_ner_bounds(lat: float, lng: float) -> bool`  
  *Raises:* `ValidationError`
- `get_road_segments_geojson() -> GeoJSONFeatureCollection`
- `get_incidents_geojson() -> GeoJSONFeatureCollection`
- `calculate_district_accessibility_index(district_id: int) -> DistrictAccessibilityScore`  
  *Raises:* `ValidationError`

### `RouteOrchestrator` (`backend/app/services/route_orchestrator.py`)
- `async plan_route(request: RoutePlanRequest) -> RoutePlanResponse`  
  *Raises:* `ValidationError`, `ProviderError`, `ExternalServiceError`

### `AlertService` (`backend/app/services/alert_service.py`)
- `get_alert(alert_id: int) -> Alert`  
  *Raises:* `ResourceNotFoundError`
- `list_alerts(severity: Optional[AlertSeverity] = None, unread_only: bool = False, limit: int = 50) -> List[Alert]`
- `create_alert(title: str, message: str, severity: AlertSeverity, category: str, entity_type: Optional[str], entity_id: Optional[int], metadata: Optional[Dict]) -> Alert`
- `acknowledge_alert(alert_id: int, user_id: int) -> Alert`  
  *Raises:* `ResourceNotFoundError`

### `AuditService` (`backend/app/services/audit_service.py`)
- `log_action(action: str, entity_type: str, entity_id: Optional[Any], user_id: Optional[int], username: Optional[str], ip_address: Optional[str], details: Optional[Dict]) -> AuditLog`
- `list_logs(limit: int = 100) -> List[AuditLog]`

### `HealthService` (`backend/app/services/health_service.py`)
- `check_health() -> HealthCheckResponse`

---

## 3. Domain Exception Hierarchy & HTTP Status Mapping

All domain exceptions inherit from `NEURouteError` in `backend/app/core/exceptions.py`. `RequestContextMiddleware` catches them automatically and renders a standardized JSON envelope with `X-Request-ID` and `X-Process-Time` headers:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Origin coordinates out of valid range: lat=120.0, lng=91.0",
    "details": {},
    "request_id": "9732c3f3-3a08-426f-9b3b-326e0316cc41"
  }
}
```

| Exception Class | Default Error Code | Default HTTP Status | Description |
|---|---|---|---|
| `ValidationError` | `VALIDATION_ERROR` | `422 Unprocessable Entity` | Domain validation or coordinate boundary error |
| `AuthenticationError` | `AUTHENTICATION_FAILED` | `401 Unauthorized` | Invalid password, missing token, or expired JWT |
| `AuthorizationError` | `FORBIDDEN` | `403 Forbidden` | Insufficient role/permissions |
| `ResourceNotFoundError` | `RESOURCE_NOT_FOUND` | `404 Not Found` | Entity with ID not found in database |
| `ConflictError` | `RESOURCE_CONFLICT` | `409 Conflict` | Duplicate username, email, tracking number, or registration |
| `BusinessRuleError` | `BUSINESS_RULE_VIOLATION` | `400 Bad Request` | Illegal state transition or vehicle capacity violation |
| `ProviderError` | `PROVIDER_ERROR` | `502 Bad Gateway` | Upstream routing or weather provider error |
| `ExternalServiceError`| `EXTERNAL_SERVICE_UNAVAILABLE`| `503 Service Unavailable` | Network timeout or unreachable external service |
| `DatabaseError` | `DATABASE_ERROR` | `500 Internal Server Error` | Database execution failure |

---

## 4. Available FastAPI Dependencies (`backend/app/dependencies.py`)

You can directly inject any of the following into your FastAPI route functions:

- **Auth & RBAC**:
  - `get_current_user -> UserContext`
  - `get_current_active_user -> UserContext`
  - `require_role(role: UserRole) -> Callable`
  - `require_any_role(roles: List[UserRole]) -> Callable`
- **Services**:
  - `get_auth_service -> AuthService`
  - `get_shipment_service -> ShipmentService`
  - `get_vehicle_service -> VehicleService`
  - `get_incident_service -> IncidentService`
  - `get_gis_service -> GISService`
  - `get_route_orchestrator -> RouteOrchestrator`
  - `get_alert_service -> AlertService`
  - `get_audit_service -> AuditService`
  - `get_health_service -> HealthService`
- **Database Session**:
  - `get_db -> Session`
