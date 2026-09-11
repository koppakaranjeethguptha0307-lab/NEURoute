"""Migration 001: Add cold-chain and software GPS source columns."""

import sqlite3
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATHS = [
    os.path.join(ROOT_DIR, "neuroute.db"),
    os.path.join(ROOT_DIR, "backend", "neuroute.db")
]

def migrate():
    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            continue
        print(f"Connecting to database at {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Columns to add to shipments
        shipment_cols = [
            ("is_cold_chain", "BOOLEAN DEFAULT 0"),
            ("temp_min_c", "FLOAT DEFAULT 2.0"),
            ("temp_max_c", "FLOAT DEFAULT 8.0"),
            ("current_temp_c", "FLOAT"),
            ("temp_status", "VARCHAR(20) DEFAULT 'NORMAL'")
        ]
        existing_shipment_cols = [c[1] for c in cursor.execute("PRAGMA table_info(shipments)").fetchall()]
        for col_name, col_type in shipment_cols:
            if col_name not in existing_shipment_cols:
                print(f"Adding column {col_name} to shipments table in {os.path.basename(db_path)}...")
                cursor.execute(f"ALTER TABLE shipments ADD COLUMN {col_name} {col_type};")

        # Columns to add to vehicles
        vehicle_cols = [
            ("gps_source", "VARCHAR(20) DEFAULT 'SIMULATED'")
        ]
        existing_vehicle_cols = [c[1] for c in cursor.execute("PRAGMA table_info(vehicles)").fetchall()]
        for col_name, col_type in vehicle_cols:
            if col_name not in existing_vehicle_cols:
                print(f"Adding column {col_name} to vehicles table in {os.path.basename(db_path)}...")
                cursor.execute(f"ALTER TABLE vehicles ADD COLUMN {col_name} {col_type};")

        # Create cold_chain_telemetry table if not exists
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cold_chain_telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipment_id VARCHAR(50) NOT NULL,
            vehicle_id VARCHAR(50),
            temperature_c FLOAT NOT NULL,
            humidity_percent FLOAT DEFAULT 65.0,
            status VARCHAR(20) DEFAULT 'NORMAL',
            source VARCHAR(30) DEFAULT 'SIMULATED_TELEMETRY',
            ambient_temp_c FLOAT DEFAULT 28.0,
            location_lat FLOAT,
            location_lng FLOAT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        conn.commit()
        conn.close()
        print(f"Migration completed successfully for {db_path}.")

if __name__ == "__main__":
    migrate()
