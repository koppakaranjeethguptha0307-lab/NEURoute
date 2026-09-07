import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import sqlite3
import json
import pytest
import bcrypt
from database.seed_data import seed_all

CANONICAL_TABLES = [
    "roles",
    "users",
    "districts",
    "road_segments",
    "field_reports",
    "incidents",
    "vehicles",
    "trips",
    "shipments",
    "routes",
    "route_segment_mappings",
    "predictions",
    "weather_observations",
    "hazards",
    "alerts",
    "logistics_hubs",
    "audit_logs"
]

@pytest.fixture
def clean_seeded_db():
    """Create in-memory SQLite database initialized with schema and seeded."""
    with open("database/schema_sqlite.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(sql)
    seed_all(connection=conn)
    return conn

def test_sqlite_schema_creation():
    with open("database/schema_sqlite.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(sql)

    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    assert len(tables) == 17, f"Expected exactly 17 tables, got {len(tables)}: {tables}"
    for expected in CANONICAL_TABLES:
        assert expected in tables, f"Missing canonical table: {expected}"

def test_sqlite_check_constraints():
    with open("database/schema_sqlite.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(sql)

    # Road segment invalid status should fail CHECK constraint
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("""
            INSERT INTO districts (id, name, state, accessibility_score)
            VALUES (1, 'Test District', 'Assam', 80.0);
        """)
        conn.execute("""
            INSERT INTO road_segments (id, name, district_id, coordinates_geojson, current_status)
            VALUES ('seg-invalid', 'Invalid Segment', 1, '[]', 'INVALID_STATUS');
        """)

def test_sqlite_foreign_key_constraints():
    with open("database/schema_sqlite.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(sql)

    # Road segment referencing non-existent district should fail
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("""
            INSERT INTO road_segments (id, name, district_id, coordinates_geojson, current_status)
            VALUES ('seg-fk-fail', 'Bad District Segment', 9999, '[]', 'OPEN');
        """)

def test_seed_data_population(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    for table in CANONICAL_TABLES:
        cursor.execute(f"SELECT count(*) FROM {table}")
        count = cursor.fetchone()[0]
        assert count > 0, f"Table {table} has 0 seeded records!"

def test_seed_data_idempotency(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    # Capture row counts after first seed
    counts_before = {}
    for table in CANONICAL_TABLES:
        cursor.execute(f"SELECT count(*) FROM {table}")
        counts_before[table] = cursor.fetchone()[0]

    # Run seeder a second time
    seed_all(connection=conn)

    # Verify counts remain exactly the same
    for table in CANONICAL_TABLES:
        cursor.execute(f"SELECT count(*) FROM {table}")
        count_after = cursor.fetchone()[0]
        assert count_after == counts_before[table], f"Table {table} grew from {counts_before[table]} to {count_after} (not idempotent)!"

def test_districts_ner_coverage(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT state FROM districts")
    states = {row[0] for row in cursor.fetchall()}
    expected_ner_states = {
        "Assam", "Meghalaya", "Nagaland", "Manipur",
        "Arunachal Pradesh", "Mizoram", "Tripura", "Sikkim"
    }
    assert expected_ner_states.issubset(states), f"Missing states: {expected_ner_states - states}"

    cursor.execute("SELECT count(*) FROM districts")
    total_districts = cursor.fetchone()[0]
    assert total_districts >= 25, f"Expected 25+ districts, got {total_districts}"

    # Check key specific districts from prompt
    key_districts = ["East Khasi Hills", "Kamrup Metropolitan", "Cachar", "Kohima", "Imphal West", "Papum Pare"]
    for kd in key_districts:
        cursor.execute("SELECT 1 FROM districts WHERE name = ?", (kd,))
        assert cursor.fetchone() is not None, f"Required district {kd} not found in seed data"

def test_highway_lifelines_and_incidents(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    # Check highway lifelines
    cursor.execute("SELECT name, current_status FROM road_segments")
    roads = {row[0]: row[1] for row in cursor.fetchall()}

    assert any("NH-06" in name for name in roads), "Missing NH-06 lifeline"
    assert any("NH-27" in name for name in roads), "Missing NH-27 lifeline"
    assert any("NH-102" in name for name in roads), "Missing NH-102 lifeline"

    # Check Sonapur landslide on NH-06 is active and blocked
    cursor.execute("SELECT id, name, current_status FROM road_segments WHERE id = 'seg-nh06-03'")
    sonapur_seg = cursor.fetchone()
    assert sonapur_seg is not None
    assert sonapur_seg[2] == "BLOCKED"

    # Check Kaziranga flood stretch on NH-27 is active and risky
    cursor.execute("SELECT id, name, current_status FROM road_segments WHERE id = 'seg-nh27-02'")
    kaziranga_seg = cursor.fetchone()
    assert kaziranga_seg is not None
    assert kaziranga_seg[2] == "RISKY"

    # Check incidents linked to these segments
    cursor.execute("SELECT category, severity, status FROM incidents WHERE road_segment_id = 'seg-nh06-03'")
    sonapur_inc = cursor.fetchone()
    assert sonapur_inc is not None
    assert sonapur_inc[0] == "LANDSLIDE"
    assert sonapur_inc[2] == "ACTIVE"

def test_logistics_hubs(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM logistics_hubs")
    hub_names = [row[0] for row in cursor.fetchall()]
    assert len(hub_names) >= 6, f"Expected 6 hubs, got {len(hub_names)}"

    required_hubs = [
        "Guwahati Central Strategic Logistics Terminal",
        "Shillong Mountain Lifeline Distribution Center",
        "Silchar Southern Valley Forward Depot",
        "Dimapur Railhead Intermodal Hub"
    ]
    for rh in required_hubs:
        assert any(rh in name for name in hub_names), f"Missing hub {rh}"

def test_shipments_cargo_types(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    cursor.execute("SELECT goods_type, cargo_priority, status FROM shipments")
    shipments = cursor.fetchall()
    cargo_types = {s[0] for s in shipments}

    expected_cargo = {"Medicines/Vaccines", "Ration", "Diesel", "General Supplies"}
    assert expected_cargo.issubset(cargo_types), f"Missing cargo types: {expected_cargo - cargo_types}"

def test_demo_users_and_password_hashes(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    expected_roles = {"ADMIN", "LOGISTICS_OPERATOR", "GOVERNMENT_AUTHORITY", "EMERGENCY_RESPONSE", "GENERAL_VIEWER"}
    cursor.execute("SELECT role, email, hashed_password FROM users")
    users = cursor.fetchall()
    roles_present = {u[0] for u in users}

    assert expected_roles == roles_present, f"Missing user roles: {expected_roles - roles_present}"

    # Verify bcrypt hash for Demo1234!
    for u in users:
        h = u[2].encode('ascii')
        assert bcrypt.checkpw(b"Demo1234!", h), f"Password hash verification failed for user {u[1]}"

def test_deletion_and_referential_integrity(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    # 1. CASCADE: Deleting a road_segment cascades to route_segment_mappings
    cursor.execute("SELECT count(*) FROM route_segment_mappings WHERE road_segment_id = 'seg-nh06-03'")
    assert cursor.fetchone()[0] > 0

    # Delete segment
    cursor.execute("DELETE FROM road_segments WHERE id = 'seg-nh06-03'")
    cursor.execute("SELECT count(*) FROM route_segment_mappings WHERE road_segment_id = 'seg-nh06-03'")
    assert cursor.fetchone()[0] == 0

    # Incident linked to that segment had ON DELETE SET NULL, so incident still exists
    cursor.execute("SELECT id, road_segment_id FROM incidents WHERE id = 'inc-snp-01'")
    inc = cursor.fetchone()
    assert inc is not None
    assert inc[1] is None, "Incident road_segment_id should have been set to NULL on delete"

    # 2. SET NULL: Deleting a vehicle sets vehicle_id to NULL in shipments (does NOT destroy shipment!)
    cursor.execute("SELECT id, vehicle_id FROM shipments WHERE id = 'shp-ner-01'")
    shp = cursor.fetchone()
    assert shp[1] == "veh-ner-01"

    cursor.execute("DELETE FROM vehicles WHERE id = 'veh-ner-01'")
    cursor.execute("SELECT id, vehicle_id FROM shipments WHERE id = 'shp-ner-01'")
    shp_after = cursor.fetchone()
    assert shp_after is not None
    assert shp_after[1] is None, "Shipment vehicle_id should have been set to NULL, preserving the shipment"

def test_spatial_coordinates_and_geojson(clean_seeded_db):
    conn = clean_seeded_db
    cursor = conn.cursor()

    # Verify road segments have valid GeoJSON coordinates
    cursor.execute("SELECT id, coordinates_geojson FROM road_segments")
    for seg_id, coords_str in cursor.fetchall():
        coords = json.loads(coords_str)
        assert isinstance(coords, list)
        assert len(coords) >= 2
        for pt in coords:
            lon, lat = pt[0], pt[1]
            assert 89.0 <= lon <= 98.0, f"Longitude {lon} out of NER bounding box for {seg_id}"
            assert 21.0 <= lat <= 30.0, f"Latitude {lat} out of NER bounding box for {seg_id}"

    # Verify hazards have valid polygon GeoJSON
    cursor.execute("SELECT id, boundary_geojson FROM hazards WHERE boundary_geojson IS NOT NULL")
    for hid, b_str in cursor.fetchall():
        b = json.loads(b_str)
        assert b["type"] == "Polygon"
        assert len(b["coordinates"][0]) >= 4
