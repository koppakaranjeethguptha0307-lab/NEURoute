# NEURoute Database Documentation

Please refer to the comprehensive [Canonical Database Schema Specification](../DATABASE_SCHEMA.md) for full details on:
- All 17 Canonical Tables, Columns, and Constraints
- PostgreSQL + PostGIS Production Setup (`database/schema.sql`)
- SQLite Zero-Config Demo Setup (`database/schema_sqlite.sql`)
- Geospatial Coordinate Conventions (SRID 4326, WGS84, `[lon, lat]` GeoJSON vs `[lat, lon]` Leaflet)
- Realistic Seed Data Fixtures (`database/seed_data.py`)
- Automated Database Test Suite (`tests/test_database.py`)
