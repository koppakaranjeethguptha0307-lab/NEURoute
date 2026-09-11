# Implementation Plan — NEURote Final Production Deployment Audit & Fix

This plan outlines the complete production audit and automated code fixes required to make NEURote 100% deployment-ready for cloud hosts (Render, Vercel, Railway, Supabase/Managed PostgreSQL). All hardcoded endpoints, silent mock fallbacks on API errors, SQLite runtime fallbacks, and missing deployment files will be fixed and verified against real PostgreSQL + PostGIS connections and automated test suites.

## User Review Required

> [!IMPORTANT]
> **Strict PostgreSQL Requirement:**
> Runtime code will be updated to enforce PostgreSQL + PostGIS connections. SQLite fallback during server execution will be disabled, ensuring production environment errors (such as missing `DATABASE_URL` or database disconnects) fail fast with clear diagnostic messages.

> [!IMPORTANT]
> **No Silent Mock Fallbacks on API Errors:**
> The frontend API clients (`apiClient.ts` and `api.js`) will be updated so that live backend API failures (500 internal errors, 404 missing endpoints, network timeouts) raise true `ApiError` exceptions instead of silently returning mock data.

## Open Questions

None. All deployment parameters and code fixes have been audited and identified.

## Proposed Changes

### Component 1: Database & Engine Hardening (`backend/app/database/session.py` & `backend/app/core/config.py`)

#### [MODIFY] [backend/app/core/config.py](file:///d:/NEURote/backend/app/core/config.py)
- Require `DATABASE_URL` to be explicitly provided or default to PostgreSQL DSN.
- Add validator to ensure `DATABASE_URL` uses PostgreSQL dialect (`postgresql+psycopg2://` or `postgresql://`).

#### [MODIFY] [backend/app/database/session.py](file:///d:/NEURote/backend/app/database/session.py)
- Remove SQLite connection args.
- Add engine pool pre-ping, pool size (10), and max overflow (20).
- Ensure `init_db()` executes `CREATE EXTENSION IF NOT EXISTS postgis;`.

---

### Component 2: Backend FastAPI Server & Environment Validation (`backend/app/main.py`, `backend/app/services/health_service.py`, `backend/requirements.txt`)

#### [MODIFY] [backend/app/main.py](file:///d:/NEURote/backend/app/main.py)
- Update entry point to read `PORT` environment variable and bind to `0.0.0.0`.
- Mount both `/health` and `/api/v1/health` endpoints.

#### [MODIFY] [backend/app/services/health_service.py](file:///d:/NEURote/backend/app/services/health_service.py)
- Update health service to inspect PostgreSQL connection and PostGIS extension status.

#### [MODIFY] [backend/requirements.txt](file:///d:/NEURote/backend/requirements.txt)
- Add `psycopg2-binary>=2.9.9`, `GeoAlchemy2>=0.14.0`, `python-multipart>=0.0.9`.

---

### Component 3: Frontend Production API & Routing (`frontend/src/services/`, `frontend/src/utils/`, `frontend/vite.config.ts`)

#### [MODIFY] [frontend/src/services/apiClient.ts](file:///d:/NEURote/frontend/src/services/apiClient.ts)
- Read `import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1'`.
- Disable automatic fallback to mock handlers when live backend returns HTTP 4xx/5xx or network errors.

#### [MODIFY] [frontend/src/services/api.js](file:///d:/NEURote/frontend/src/services/api.js)
- Respect `VITE_API_BASE_URL` and disable `allowMockFallback` when executing live API calls.

#### [MODIFY] [frontend/src/utils/sseClient.ts](file:///d:/NEURote/frontend/src/utils/sseClient.ts)
- Use dynamic backend API base URL for `/events/stream` SSE endpoint.

#### [NEW] [frontend/public/_redirects](file:///d:/NEURote/frontend/public/_redirects) & [frontend/vercel.json](file:///d:/NEURote/frontend/vercel.json)
- Add SPA rewrite rules for Netlify (`/* /index.html 200`) and Vercel.

---

### Component 4: Secrets, Security & Deployment Configuration (`.env.example`, `Procfile`, `render.yaml`)

#### [MODIFY] [.env.example](file:///d:/NEURote/.env.example)
- Provide comprehensive environment template with `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `ENVIRONMENT`, `ROUTING_PROVIDER_URL`, `WEATHER_PROVIDER_URL`.

#### [NEW] [Procfile](file:///d:/NEURote/Procfile)
- Add backend startup command: `web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`.

#### [NEW] [render.yaml](file:///d:/NEURote/render.yaml)
- Complete Render Blueprint definition for PostgreSQL database, FastAPI backend web service, and React static frontend site.

---

## Verification Plan

### Automated Tests & Builds
1. Backend test suite execution:
   ```bash
   $env:PYTHONPATH="d:\NEURote\backend"; pytest backend/tests -v
   ```
2. Frontend production build:
   ```bash
   cd frontend && npx vite build
   ```

### Live Production Verification
1. Start production PostgreSQL server on port `5432`.
2. Start FastAPI backend with production command (`uvicorn app.main:app --host 0.0.0.0 --port 8000`).
3. Verify `/health`, `/api/v1/health`, PostgreSQL connection, PostGIS query.
4. Verify 4-role login auth (`ADMIN`, `FIELD_OFFICER`, `DRIVER`, `LOGISTICS_PLANNER`).
5. Verify Frontend production bundle integration with Backend and PostgreSQL.
