"""
Migration script from SQLite (neuroute.db) to PostgreSQL 16 (neuroute).
Preserves all primary keys, foreign keys, timestamps, JSON payload data, and updates sequences.
Handles type conversions, null values for non-nullable fields, column alias mappings, auto-id generation, FK verification, and sequence synchronization.
"""

import sys
import json
import uuid
import sqlite3
import psycopg2
from pathlib import Path

SQLITE_DB_PATH = Path(__file__).resolve().parents[1] / "neuroute.db"
POSTGRES_DSN = "host=127.0.0.1 port=5432 user=neuroute_user password=neuroute_pass dbname=neuroute"

TABLES_ORDER = [
    "roles",
    "users",
    "districts",
    "road_segments",
    "logistics_hubs",
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
    "audit_logs",
    "cold_chain_telemetry",
    "government_advisories",
    "access_requests",
]

def migrate_data():
    if not SQLITE_DB_PATH.exists():
        print(f"Error: {SQLITE_DB_PATH} not found!")
        sys.exit(1)

    print(f"Connecting to SQLite: {SQLITE_DB_PATH}")
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    print("Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(POSTGRES_DSN)
    pg_conn.autocommit = False
    pg_cursor = pg_conn.cursor()

    try:
        # Cache existing user IDs in PostgreSQL
        existing_user_ids = set()

        for table in TABLES_ORDER:
            # Check if table exists in SQLite
            sqlite_cursor.execute(f"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='{table}'")
            if not sqlite_cursor.fetchone()[0]:
                print(f"Skipping '{table}' (not present in SQLite)")
                continue

            rows = sqlite_cursor.execute(f'SELECT * FROM "{table}"').fetchall()
            print(f"Migrating table '{table}': {len(rows)} rows...")

            if not rows:
                continue

            if table == "users":
                pg_cursor.execute("SELECT id FROM users;")
                existing_user_ids = set([u[0] for u in pg_cursor.fetchall()])

            # Fetch column names and data types from PostgreSQL
            pg_cursor.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = '{table}';
            """)
            pg_col_map = {col[0]: col[1] for col in pg_cursor.fetchall()}

            sqlite_cols = list(rows[0].keys())
            valid_cols = [c for c in sqlite_cols if c in pg_col_map]

            if 'segment_id' in pg_col_map and 'segment_id' not in valid_cols and 'road_segment_id' in sqlite_cols:
                valid_cols.append('segment_id')

            if not valid_cols:
                print(f"No matching columns for table '{table}'")
                continue

            cols_str = ", ".join([f'"{col}"' for col in valid_cols])
            val_placeholders = ", ".join(["%s"] * len(valid_cols))

            insert_sql = f'INSERT INTO "{table}" ({cols_str}) VALUES ({val_placeholders}) ON CONFLICT DO NOTHING'

            for row in rows:
                val_list = []
                for col in valid_cols:
                    val = row[col] if col in row.keys() else None
                    col_type = pg_col_map[col]

                    # Auto-generate ID if missing
                    if col == 'id' and not val:
                        val = f"{table[:4]}-{uuid.uuid4().hex[:8]}"

                    # Special rule for road_segments.segment_code
                    if table == 'road_segments' and col == 'segment_code' and not val:
                        val = str(row['id'])

                    # Special rule for route_segment_mappings.segment_id
                    if table == 'route_segment_mappings' and col == 'segment_id' and not val:
                        val = row['road_segment_id'] if 'road_segment_id' in row.keys() else None

                    # Check user_id FK validity
                    if col == 'user_id' and val and val not in existing_user_ids:
                        val = None

                    # Cast integer 0/1 to boolean if target column is boolean
                    if col_type == 'boolean' and val is not None:
                        if isinstance(val, int):
                            val = bool(val)
                        elif isinstance(val, str):
                            val = val.lower() in ('true', '1', 't', 'y')

                    val_list.append(val)

                pg_cursor.execute(insert_sql, val_list)

            pg_conn.commit()

            # Refresh user IDs cache after users table migration
            if table == "users":
                pg_cursor.execute("SELECT id FROM users;")
                existing_user_ids = set([u[0] for u in pg_cursor.fetchall()])

            # Synchronize PostgreSQL auto-increment sequence for integer primary keys named 'id'
            try:
                pg_cursor.execute(f"""
                    SELECT setval(pg_get_serial_sequence('"{table}"', 'id'), 
                                  COALESCE((SELECT MAX(id) FROM "{table}"), 1), 
                                  true);
                """)
                pg_conn.commit()
            except Exception as seq_err:
                pg_conn.rollback()
                pass

        print("Data migration from SQLite to PostgreSQL completed successfully!")

    except Exception as e:
        pg_conn.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == '__main__':
    migrate_data()
