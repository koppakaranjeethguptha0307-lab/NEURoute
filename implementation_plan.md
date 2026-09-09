# Implementation Plan — NER Smart Logistics & Accessibility Intelligence Platform (NEURoute)

**Project:** NEURoute — AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)  
**SIH Problem Statement:** SIH26002  
**Team:** Nexara  

---

## Overview

Build the complete, production-grade, and demo-ready **NER Smart Logistics & Accessibility Intelligence Platform** on top of the established repository skeleton. The platform integrates:
1. **Interactive GIS / Geospatial Intelligence:** Fullscreen Leaflet/OpenStreetMap visualizer for NER road segments, real-time status (`OPEN`, `RISKY`, `BLOCKED`, `UNKNOWN`), high-risk hazard zones, logistics hubs, and live shipment telemetry.
2. **Logistics & Fleet Operations:** End-to-end shipment management, vehicle tracking, driver allocation, and logistics hubs (warehouses, emergency supply depots).
3. **AI Intelligence Layer:** Dedicated service interfaces for Incident Classification, Segment & Corridor Risk Prediction, Travel Delay Estimation, and Multi-Criteria Alternate Route Optimization with adaptive cargo priority weighting.
4. **Incident Reporting & Management:** Full incident lifecycle (`Reported`, `Investigating`, `Confirmed`, `Active`, `Resolved`) across 9 regional categories, with offline sync capabilities.
5. **Alerts & Notification Center:** Real-time operational warnings for route disruptions, extreme weather, vehicle delays, and emergency rerouting.
6. **Executive & Regional Analytics:** Performance KPIs, route efficiency metrics, incident frequency trends, and comparative NER district accessibility scores.
7. **Role-Based Authentication & Portal Navigation:** Secure JWT authentication supporting `ADMIN`, `LOGISTICS_OPERATOR`, `GOVERNMENT_AUTHORITY`, `EMERGENCY_RESPONSE`, and `GENERAL_VIEWER` roles.
8. **Deterministic Demo Mode & NER Data Fixtures:** Rich seed data covering the 8 NER states, major highway lifelines (NH-06, NH-27, NH-102), realistic landslides/floods, logistics hubs, and active shipments.

---

## User Review Required

> [!IMPORTANT]
> **Dual Database Strategy (SQLite for immediate zero-config demo / PostgreSQL+PostGIS for production):**  
> To guarantee immediate local operability without requiring an active external PostgreSQL/PostGIS server running during testing, the backend will use a database abstraction that defaults to SQLite (with Spatialite/pure-Python spatial fallbacks) when `DATABASE_URL` is unset or points to SQLite, while fully supporting PostgreSQL + PostGIS via the identical SQLAlchemy models and Alembic migrations.

> [!TIP]
> **Vite + React SPA Architecture:**  
> The frontend will be initialized with Vite and React in `frontend/`, using a modular, shared design system with TailwindCSS / Vanilla CSS tokens, Leaflet mapping (`leaflet`, `react-leaflet`), Lucide icons, and Recharts for dashboard analytics.

---

## Proposed Changes

### Component 1: Database & Data Fixtures (`database/` & `data/`)

#### [MODIFY] [database/schema.sql](file:///d:/NEURote/database/schema.sql)
- Implement the full canonical DDL with all 16 tables: `roles`, `users`, `districts`, `road_segments`, `field_reports`, `incidents`, `vehicles`, `trips`, `shipments`, `routes`, `route_segment_mappings`, `predictions`, `weather_observations`, `hazards`, `alerts`, `logistics_hubs`, and `audit_logs`.
- Include spatial indexes and standard foreign key constraints.

#### [NEW] [database/seed_data.py](file:///d:/NEURote/database/seed_data.py)
- Python database seeder populating:
  - 8 NER States and 25+ key districts (East Khasi Hills, Kamrup Metropolitan, Cachar, Kohima, Imphal West, Papum Pare, etc.)
  - Highway lifelines (NH-06 Guwahati-Shillong-Silchar, NH-27, NH-102 Imphal-Moreh) with realistic coordinates
  - 6 Logistics hubs (Guwahati Central Depot, Shillong Lifeline Hub, Silchar Forward Depot, Dimapur Railhead, etc.)
  - Sample vehicles, active shipments with cargo types (Medicines/Vaccines, Ration, Diesel, General Supplies)
  - Active incidents (Sonapur landslide on NH-06, Kaziranga flood stretch)
  - Demo user credentials across all 5 roles (passwords hashed with bcrypt)

---

### Component 2: Backend Microservices & REST APIs (`backend/`)

#### [MODIFY] [backend/requirements.txt](file:///d:/NEURote/backend/requirements.txt)
- Populate Python dependencies: `fastapi`, `uvicorn[standard]`, `pydantic>=2.0`, `pydantic-settings`, `sqlalchemy>=2.0`, `alembic`, `passlib[bcrypt]`, `python-jose[cryptography]`, `python-multipart`, `scikit-learn`, `numpy`, `geopy`, `pytest`, `httpx`.

#### [NEW] [backend/app/core/config.py](file:///d:/NEURote/backend/app/core/config.py)
- Pydantic Settings loading environment variables (`DATABASE_URL`, `JWT_SECRET`, `MOCK_DATA_MODE`, `ENVIRONMENT`, `CORS_ORIGINS`).

#### [NEW] [backend/app/core/security.py](file:///d:/NEURote/backend/app/core/security.py)
- Password hashing (bcrypt) and JWT access token creation/verification.

#### [NEW] [backend/app/database/session.py](file:///d:/NEURote/backend/app/database/session.py)
- Database engine creation, sessionmaker, and `get_db` FastAPI dependency with automatic schema initialization.

#### [NEW] [backend/app/models/](file:///d:/NEURote/backend/app/models/)
- Canonical SQLAlchemy ORM models:
  - `user.py` & `role.py`: Identity and RBAC
  - `district.py` & `road.py`: Spatial boundaries, road segments, accessibility scores
  - `incident.py` & `field_report.py`: Incidents, offline field reports
  - `shipment.py`, `vehicle.py`, `hub.py`: Logistics shipments, fleet telemetry, distribution hubs
  - `route.py` & `prediction.py`: Routes, segment mappings, explainable AI prediction records
  - `alert.py` & `audit.py`: Operational notifications and audit trail

#### [NEW] [backend/app/schemas/](file:///d:/NEURote/backend/app/schemas/)
- Pydantic v2 validation models for Auth, Shipments, Vehicles, Routes, Incidents, AI inputs/outputs, Alerts, and Analytics.

#### [NEW] [backend/app/services/](file:///d:/NEURote/backend/app/services/)
- Business logic service classes:
  - `auth_service.py`: Authentication, user management, role verification
  - `shipment_service.py`: Shipment lifecycle, status transitions, vehicle assignment
  - `incident_service.py`: Incident creation, spatial road binding, road status updates (`OPEN`, `RISKY`, `BLOCKED`)
  - `gis_service.py`: GeoJSON vector feeds, district accessibility score computation
  - `route_service.py`: Multi-criteria route generation, what-if rerouting
  - `alert_service.py`: Alert dispatch, trip disruption notifications
  - `analytics_service.py`: Dashboard KPIs, delivery success rates, risk trends

#### [NEW] [backend/app/api/routes/](file:///d:/NEURote/backend/app/api/routes/)
- REST API modular routers adhering strictly to `/api/v1/*`:
  - `auth.py`: `/api/v1/auth/login`, `/api/v1/auth/me`
  - `shipments.py`: `/api/v1/shipments` (CRUD, status, telemetry)
  - `vehicles.py`: `/api/v1/vehicles`, `/api/v1/vehicles/{id}/location`
  - `incidents.py`: `/api/v1/incidents`, `/api/v1/incidents/{id}`, `/api/v1/field-reports/sync`
  - `roads.py` & `districts.py`: `/api/v1/roads`, `/api/v1/districts`
  - `routes.py`: `/api/v1/routes/plan`, `/api/v1/routes/alternate`, `/api/v1/routes/{id}`
  - `ai.py`: `/api/v1/ai/risk`, `/api/v1/ai/delay`, `/api/v1/ai/classify-incident`
  - `alerts.py`: `/api/v1/alerts`, `/api/v1/alerts/{id}/read`
  - `analytics.py`: `/api/v1/reports/summary`, `/api/v1/reports/district`, `/api/v1/analytics/logistics`

#### [MODIFY] [backend/app/main.py](file:///d:/NEURote/backend/app/main.py)
- Connect FastAPI app with CORS middleware, lifespan events (database setup & auto-seeding), router inclusion, and health check.

---

### Component 3: AI Intelligence Engine (`ai/`)

#### [NEW] [ai/services/classifier.py](file:///d:/NEURote/ai/services/classifier.py)
- NLP and keyword-based incident classification engine with confidence scoring, predicting incident category and suggested severity from incident text.

#### [NEW] [ai/services/risk_predictor.py](file:///d:/NEURote/ai/services/risk_predictor.py)
- Multi-factor segment risk scoring engine implementing:
  $$R_{seg} = \min\left(1.0, w_1 W_{norm} + w_2 H_{prox} + w_3 I_{active} + w_4 F_{hist} + w_5 T_{slope}\right)$$
- Generates risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and explainable reasons list.

#### [NEW] [ai/services/delay_estimator.py](file:///d:/NEURote/ai/services/delay_estimator.py)
- Travel delay estimation engine calculating normal vs. impaired speed travel time and clearance bottleneck buffers.

#### [NEW] [ai/services/route_optimizer.py](file:///d:/NEURote/ai/services/route_optimizer.py)
- Multi-criteria route optimization comparing:
  - **Safest Route** (Lowest composite risk score)
  - **Fastest Route** (Shortest travel time under normal conditions)
  - **Priority Route** (Dynamically weights safety to 0.50 for `CRITICAL` relief/medical shipments)

---

### Component 4: Modern Frontend Dashboard & Portals (`frontend/`)

#### [MODIFY] [frontend/package.json](file:///d:/NEURote/frontend/package.json)
- Setup dependencies: `react`, `react-dom`, `lucide-react`, `leaflet`, `react-leaflet`, `recharts`, `vite`, `@vitejs/plugin-react`.

#### [NEW] [frontend/vite.config.js](file:///d:/NEURote/frontend/vite.config.js) & [frontend/index.html](file:///d:/NEURote/frontend/index.html)
- Vite configuration with API proxy to backend (`http://localhost:8000`).

#### [NEW] [frontend/src/index.css](file:///d:/NEURote/frontend/src/index.css)
- Comprehensive design system: responsive layout, deep navy header/sidebar, government tech styling, status color tokens (`#10B981`, `#F59E0B`, `#EF4444`, `#6B7280`), clean cards, badges, modal backdrops, and tables.

#### [NEW] [frontend/src/services/api.js](file:///d:/NEURote/frontend/src/services/api.js) & [frontend/src/services/mockData.js](file:///d:/NEURote/frontend/src/services/mockData.js)
- Unified API client with automatic JWT token attachment, request interceptors, graceful error handling, and demo-mode fallback when backend is disconnected.

#### [NEW] [frontend/src/components/](file:///d:/NEURote/frontend/src/components/)
- Reusable UI component library:
  - `Navbar.jsx` & `Sidebar.jsx`: Navigation, active portal indicator, role badge, user profile, demo mode toggle
  - `StatCard.jsx`: Metric display cards with trend indicators
  - `StatusBadge.jsx`: Standardized badges (`OPEN`, `RISKY`, `BLOCKED`, `CRITICAL`, `IN_TRANSIT`, etc.)
  - `DataTable.jsx`: Responsive data table with search, status filters, and pagination
  - `Modal.jsx`: Accessible modal dialogs for incident creation, shipment dispatch, and route inspector
  - `MapComponent.jsx`: Leaflet map with layer toggles (Roads, Incidents, Hubs, Vehicles, Routes), custom markers, and popups
  - `AlertBanner.jsx`: Persistent operational warning notifications

#### [NEW] [frontend/src/pages/](file:///d:/NEURote/frontend/src/pages/)
- The 5 core integrated portal views + supporting pages:
  - `DashboardPage.jsx`: Executive overview ("What is happening right now?") with KPI cards, mini-map, active incidents table, and fleet status
  - `GISMapPage.jsx`: Fullscreen interactive GIS monitoring portal with layer controls, route overlays, hazard zones, and location details
  - `RouteIntelligencePage.jsx`: Route planner with source/destination picker, cargo priority selector, and Safest vs. Fastest route comparison cards with explainable AI breakdown
  - `IncidentManagementPage.jsx`: Incident list, filter by status/severity, "Report Incident" modal with geo-tagging and category selector, and status workflow transitions
  - `LogisticsManagementPage.jsx`: Shipment tracking, vehicle fleet status, driver details, and distribution hubs
  - `AlertsPage.jsx`: Centralized alert center with severity filters (`Informational`, `Warning`, `Critical`) and acknowledge triggers
  - `AnalyticsPage.jsx`: Regional accessibility comparison across NER states/districts, delivery performance charts, and incident trends
  - `LoginPage.jsx`: Role-based login selector (Administrator, Logistics Operator, Government Authority, Emergency Response, General Viewer) with quick demo credentials

#### [NEW] [frontend/src/App.jsx](file:///d:/NEURote/frontend/src/App.jsx)
- Top-level routing, authentication state management, notification toast system, and portal switching.

---

### Component 5: Tests & Verification (`tests/` & `backend/tests/`)

#### [NEW] [backend/tests/test_auth.py](file:///d:/NEURote/backend/tests/test_auth.py)
- Unit tests for user registration, login, and JWT verification.

#### [NEW] [backend/tests/test_ai.py](file:///d:/NEURote/backend/tests/test_ai.py)
- Tests for incident classification, risk formula calculation, delay estimation, and route cost optimization.

#### [NEW] [backend/tests/test_shipments_and_incidents.py](file:///d:/NEURote/backend/tests/test_shipments_and_incidents.py)
- Tests for shipment lifecycle, incident creation, road status update, and alert generation.

---

## Verification Plan

### Automated Tests
1. Run backend test suite via `pytest`:
   ```bash
   pytest backend/tests -v
   ```
2. Validate frontend build:
   ```bash
   cd frontend && npm run build
   ```

### Manual Verification
1. **Interactive Demo Verification:**
   - Launch backend (`uvicorn app.main:app --port 8000`) and frontend (`npm run dev`).
   - Log in with demo accounts (e.g. `admin@neuroute.gov.in`, `operator@neuroute.gov.in`).
   - Test **SIH Acceptance Scenario**:
     1. Open Incident Management &rarr; Report a Landslide on NH-06 with High severity.
     2. Open GIS Map &rarr; Verify road segment status turns to `BLOCKED` (red dashed line) with warning marker.
     3. Open Route Intelligence &rarr; Plan trip from Guwahati to Silchar for `CRITICAL` medicine cargo &rarr; Verify algorithm recommends Safest Route bypassing the blocked segment.
     4. Open Logistics Management &rarr; Verify en-route shipment to Silchar displays a delay alert and reroute recommendation.
     5. Open Alerts Center &rarr; Confirm critical rerouting notification is logged.
