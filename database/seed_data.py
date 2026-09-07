"""
NEURoute — Deterministic Database Seeder for North Eastern Region (NER)
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Canonical Tables: 17
Populates realistic seed fixtures for:
- Roles & Demo Users across all 5 portal roles (ADMIN, LOGISTICS_OPERATOR, GOVERNMENT_AUTHORITY, EMERGENCY_RESPONSE, GENERAL_VIEWER)
- 30 Districts across all 8 North Eastern states
- 12 Strategic Highway Lifelines (NH-06, NH-27, NH-102, NH-29, Shillong Bypass)
- 6 Logistics Hubs across NER
- 6 Vehicles with live telemetry coordinates
- Active Trips & Shipments (Medicines/Vaccines, Ration, Diesel, General Supplies)
- Alternate Routes & Segment Mappings
- Field Reports & Active Incidents (Sonapur Landslide, Kaziranga Flood)
- Regional Hazards, Weather Observations, AI Predictions, Alerts, and Audit Logs
"""

import os
import sys
import json
import sqlite3
from datetime import datetime, timezone, timedelta

# ============================================================================
# SEED FIXTURES DATA DEFINITIONS
# ============================================================================

ROLES_DATA = [
    {"id": 1, "name": "ADMIN", "description": "System Administrator & Regional Command Authority"},
    {"id": 2, "name": "LOGISTICS_OPERATOR", "description": "Fleet and Supply Chain Dispatch Operator"},
    {"id": 3, "name": "GOVERNMENT_AUTHORITY", "description": "State Transport, Civil Supplies & Disaster Authority"},
    {"id": 4, "name": "EMERGENCY_RESPONSE", "description": "SDRF / NDRF First Responder & Disaster Relief Coordinator"},
    {"id": 5, "name": "GENERAL_VIEWER", "description": "Public Logistics Observer & Citizen Monitor"}
]

# Standard demo password: 'Demo1234!' (bcrypt hash)
DEMO_BCRYPT_HASH = "$2b$12$xlwGvA8RNUfWLSgP3Em4TukjtFNnFUtVLXjqbfoQP4GqFiM/5S9lS"

DEMO_USERS = [
    {
        "id": "usr-adm-01",
        "email": "admin@neuroute.gov.in",
        "hashed_password": DEMO_BCRYPT_HASH,
        "full_name": "Dr. Anirban Sharma (Regional Director)",
        "badge_number": "NER-ADM-01",
        "phone_number": "+91-94350-11001",
        "role_id": 1,
        "role": "ADMIN",
        "is_active": True
    },
    {
        "id": "usr-ops-02",
        "email": "operator@neuroute.gov.in",
        "hashed_password": DEMO_BCRYPT_HASH,
        "full_name": "Tenzing Lhadon (Fleet Commander)",
        "badge_number": "NER-OPS-42",
        "phone_number": "+91-94350-22002",
        "role_id": 2,
        "role": "LOGISTICS_OPERATOR",
        "is_active": True
    },
    {
        "id": "usr-gov-03",
        "email": "officer@neuroute.gov.in",
        "hashed_password": DEMO_BCRYPT_HASH,
        "full_name": "Nongthombam Meitei (District Transport Officer)",
        "badge_number": "NER-GOV-18",
        "phone_number": "+91-94350-33003",
        "role_id": 3,
        "role": "GOVERNMENT_AUTHORITY",
        "is_active": True
    },
    {
        "id": "usr-emr-04",
        "email": "emergency@neuroute.gov.in",
        "hashed_password": DEMO_BCRYPT_HASH,
        "full_name": "Bikash Borah (SDRF Quick Response Commander)",
        "badge_number": "NER-EMR-09",
        "phone_number": "+91-94350-44004",
        "role_id": 4,
        "role": "EMERGENCY_RESPONSE",
        "is_active": True
    },
    {
        "id": "usr-pub-05",
        "email": "viewer@neuroute.gov.in",
        "hashed_password": DEMO_BCRYPT_HASH,
        "full_name": "Pratima Deka (Public Logistics Observer)",
        "badge_number": "NER-PUB-99",
        "phone_number": "+91-94350-55005",
        "role_id": 5,
        "role": "GENERAL_VIEWER",
        "is_active": True
    }
]

DISTRICTS_DATA = [
    # Assam (7)
    {"id": 1, "name": "Kamrup Metropolitan", "state": "Assam", "accessibility_score": 94.5},
    {"id": 2, "name": "Cachar", "state": "Assam", "accessibility_score": 62.0},
    {"id": 3, "name": "Nagaon", "state": "Assam", "accessibility_score": 88.0},
    {"id": 4, "name": "Dibrugarh", "state": "Assam", "accessibility_score": 85.5},
    {"id": 5, "name": "Jorhat", "state": "Assam", "accessibility_score": 89.0},
    {"id": 6, "name": "Golaghat", "state": "Assam", "accessibility_score": 76.5},
    {"id": 7, "name": "Sonitpur", "state": "Assam", "accessibility_score": 82.0},
    # Meghalaya (5)
    {"id": 8, "name": "East Khasi Hills", "state": "Meghalaya", "accessibility_score": 78.2},
    {"id": 9, "name": "West Khasi Hills", "state": "Meghalaya", "accessibility_score": 65.0},
    {"id": 10, "name": "Ri-Bhoi", "state": "Meghalaya", "accessibility_score": 84.0},
    {"id": 11, "name": "West Jaintia Hills", "state": "Meghalaya", "accessibility_score": 70.5},
    {"id": 12, "name": "East Jaintia Hills", "state": "Meghalaya", "accessibility_score": 58.0},
    # Nagaland (3)
    {"id": 13, "name": "Kohima", "state": "Nagaland", "accessibility_score": 71.5},
    {"id": 14, "name": "Dimapur", "state": "Nagaland", "accessibility_score": 90.2},
    {"id": 15, "name": "Mokokchung", "state": "Nagaland", "accessibility_score": 67.4},
    # Manipur (4)
    {"id": 16, "name": "Imphal West", "state": "Manipur", "accessibility_score": 68.0},
    {"id": 17, "name": "Imphal East", "state": "Manipur", "accessibility_score": 66.5},
    {"id": 18, "name": "Thoubal", "state": "Manipur", "accessibility_score": 72.0},
    {"id": 19, "name": "Churachandpur", "state": "Manipur", "accessibility_score": 54.5},
    # Arunachal Pradesh (3)
    {"id": 20, "name": "Papum Pare", "state": "Arunachal Pradesh", "accessibility_score": 64.8},
    {"id": 21, "name": "Changlang", "state": "Arunachal Pradesh", "accessibility_score": 51.2},
    {"id": 22, "name": "West Kameng", "state": "Arunachal Pradesh", "accessibility_score": 59.0},
    # Mizoram (3)
    {"id": 23, "name": "Aizawl", "state": "Mizoram", "accessibility_score": 69.4},
    {"id": 24, "name": "Lunglei", "state": "Mizoram", "accessibility_score": 55.6},
    {"id": 25, "name": "Kolasib", "state": "Mizoram", "accessibility_score": 73.1},
    # Tripura (3)
    {"id": 26, "name": "West Tripura", "state": "Tripura", "accessibility_score": 86.1},
    {"id": 27, "name": "Gomati", "state": "Tripura", "accessibility_score": 79.0},
    {"id": 28, "name": "North Tripura", "state": "Tripura", "accessibility_score": 74.2},
    # Sikkim (2)
    {"id": 29, "name": "East Sikkim", "state": "Sikkim", "accessibility_score": 74.0},
    {"id": 30, "name": "West Sikkim", "state": "Sikkim", "accessibility_score": 61.5}
]

LOGISTICS_HUBS_DATA = [
    {
        "id": "hub-ghy-01",
        "name": "Guwahati Central Strategic Logistics Terminal",
        "hub_type": "CENTRAL_DEPOT",
        "district_id": 1,
        "latitude": 26.1445,
        "longitude": 91.7362,
        "capacity_tons": 5000.0,
        "contact_phone": "+91-361-2800100",
        "is_active": True
    },
    {
        "id": "hub-shl-02",
        "name": "Shillong Mountain Lifeline Distribution Center",
        "hub_type": "EMERGENCY_SUPPLY",
        "district_id": 8,
        "latitude": 25.5788,
        "longitude": 91.8933,
        "capacity_tons": 1200.0,
        "contact_phone": "+91-364-2224500",
        "is_active": True
    },
    {
        "id": "hub-slc-03",
        "name": "Silchar Southern Valley Forward Depot",
        "hub_type": "DISTRIBUTION_CENTER",
        "district_id": 2,
        "latitude": 24.8333,
        "longitude": 92.7789,
        "capacity_tons": 2500.0,
        "contact_phone": "+91-3842-230111",
        "is_active": True
    },
    {
        "id": "hub-dmp-04",
        "name": "Dimapur Railhead Intermodal Hub",
        "hub_type": "RAILHEAD",
        "district_id": 14,
        "latitude": 25.9060,
        "longitude": 93.7270,
        "capacity_tons": 3500.0,
        "contact_phone": "+91-3862-248900",
        "is_active": True
    },
    {
        "id": "hub-imp-05",
        "name": "Imphal Valley Essential Cargo Center",
        "hub_type": "DISTRIBUTION_CENTER",
        "district_id": 16,
        "latitude": 24.8170,
        "longitude": 93.9368,
        "capacity_tons": 1800.0,
        "contact_phone": "+91-385-2451000",
        "is_active": True
    },
    {
        "id": "hub-tzp-06",
        "name": "Tezpur Northern Brahmaputra Forward Base",
        "hub_type": "FORWARD_BASE",
        "district_id": 7,
        "latitude": 26.6338,
        "longitude": 92.7926,
        "capacity_tons": 2200.0,
        "contact_phone": "+91-3712-230400",
        "is_active": True
    }
]

ROAD_SEGMENTS_DATA = [
    # NH-06 Corridors
    {
        "id": "seg-nh06-01",
        "osm_id": 100101,
        "name": "NH-06 (Guwahati to Jorabat Expressway)",
        "district_id": 1,
        "coordinates": [[91.7362, 26.1445], [91.8500, 26.1100], [91.8700, 26.0600]],
        "length_km": 24.5,
        "base_speed_kmh": 65.0,
        "current_status": "OPEN",
        "current_risk_score": 0.12,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh06-02",
        "osm_id": 100102,
        "name": "NH-06 (Jorabat to Umiam Lake Slope)",
        "district_id": 10,
        "coordinates": [[91.8700, 26.0600], [91.9000, 25.8000], [91.8900, 25.6600]],
        "length_km": 52.0,
        "base_speed_kmh": 40.0,
        "current_status": "RISKY",
        "current_risk_score": 0.58,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh06-03",
        "osm_id": 100103,
        "name": "NH-06 (Sonapur Tunnel & Malidor Canyon)",
        "district_id": 12,
        "coordinates": [[92.3500, 25.1000], [92.3820, 25.0712], [92.4200, 25.0200]],
        "length_km": 38.0,
        "base_speed_kmh": 30.0,
        "current_status": "BLOCKED",
        "current_risk_score": 0.94,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh06-04",
        "osm_id": 100104,
        "name": "NH-06 (Malidor to Silchar Valley)",
        "district_id": 2,
        "coordinates": [[92.4200, 25.0200], [92.6000, 24.9000], [92.7789, 24.8333]],
        "length_km": 45.0,
        "base_speed_kmh": 50.0,
        "current_status": "OPEN",
        "current_risk_score": 0.25,
        "is_critical_lifeline": True
    },
    # Shillong Bypass Lifeline (NH-106)
    {
        "id": "seg-shl-byp",
        "osm_id": 100105,
        "name": "Shillong Strategic Eastern Bypass (NH-106)",
        "district_id": 8,
        "coordinates": [[91.8900, 25.6600], [92.0500, 25.5500], [92.2000, 25.4000]],
        "length_km": 48.0,
        "base_speed_kmh": 50.0,
        "current_status": "OPEN",
        "current_risk_score": 0.22,
        "is_critical_lifeline": True
    },
    # NH-27 East-West Corridors
    {
        "id": "seg-nh27-01",
        "osm_id": 200201,
        "name": "NH-27 (Guwahati to Nagaon Four-Lane)",
        "district_id": 3,
        "coordinates": [[91.7362, 26.1445], [92.2000, 26.2500], [92.6840, 26.3460]],
        "length_km": 120.0,
        "base_speed_kmh": 75.0,
        "current_status": "OPEN",
        "current_risk_score": 0.15,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh27-02",
        "osm_id": 200202,
        "name": "NH-27 (Nagaon to Kaziranga National Park Stretch)",
        "district_id": 6,
        "coordinates": [[92.6840, 26.3460], [93.1500, 26.5800], [93.4200, 26.6000]],
        "length_km": 78.0,
        "base_speed_kmh": 35.0,
        "current_status": "RISKY",
        "current_risk_score": 0.72,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh27-03",
        "osm_id": 200203,
        "name": "NH-27 (Kaziranga to Jorhat Industrial Corridor)",
        "district_id": 5,
        "coordinates": [[93.4200, 26.6000], [93.8000, 26.7000], [94.2200, 26.7500]],
        "length_km": 85.0,
        "base_speed_kmh": 60.0,
        "current_status": "OPEN",
        "current_risk_score": 0.20,
        "is_critical_lifeline": True
    },
    # NH-102 Manipur Lifeline
    {
        "id": "seg-nh102-01",
        "osm_id": 300301,
        "name": "NH-102 (Imphal to Thoubal Corridor)",
        "district_id": 16,
        "coordinates": [[93.9368, 24.8170], [93.9900, 24.6300], [94.0200, 24.4800]],
        "length_km": 42.0,
        "base_speed_kmh": 45.0,
        "current_status": "OPEN",
        "current_risk_score": 0.28,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh102-02",
        "osm_id": 300302,
        "name": "NH-102 (Thoubal to Moreh Border Trade Gate)",
        "district_id": 18,
        "coordinates": [[94.0200, 24.4800], [94.1500, 24.3000], [94.3000, 24.2400]],
        "length_km": 68.0,
        "base_speed_kmh": 40.0,
        "current_status": "OPEN",
        "current_risk_score": 0.32,
        "is_critical_lifeline": True
    },
    # NH-29 Nagaland Lifeline
    {
        "id": "seg-nh29-01",
        "osm_id": 400401,
        "name": "NH-29 (Dabaka to Dimapur Rail Corridor)",
        "district_id": 14,
        "coordinates": [[93.1000, 26.0000], [93.4000, 25.9500], [93.7270, 25.9060]],
        "length_km": 74.0,
        "base_speed_kmh": 55.0,
        "current_status": "OPEN",
        "current_risk_score": 0.25,
        "is_critical_lifeline": True
    },
    {
        "id": "seg-nh29-02",
        "osm_id": 400402,
        "name": "NH-29 (Dimapur to Kohima Mountain Pass)",
        "district_id": 13,
        "coordinates": [[93.7270, 25.9060], [93.9500, 25.7800], [94.1100, 25.6740]],
        "length_km": 68.0,
        "base_speed_kmh": 35.0,
        "current_status": "RISKY",
        "current_risk_score": 0.60,
        "is_critical_lifeline": True
    }
]

VEHICLES_DATA = [
    {
        "id": "veh-ner-01",
        "registration_number": "AS-01-EC-9042",
        "vehicle_type": "REFRIGERATED_VAN",
        "capacity_tons": 5.0,
        "driver_name": "Tapan Hazarika",
        "driver_phone": "+91-98640-54321",
        "status": "IN_TRANSIT",
        "current_latitude": 25.8200,
        "current_longitude": 91.9000,
        "is_active": True
    },
    {
        "id": "veh-ner-02",
        "registration_number": "ML-05-AB-1204",
        "vehicle_type": "FOUR_BY_FOUR",
        "capacity_tons": 3.5,
        "driver_name": "Kmenlang Marbaniang",
        "driver_phone": "+91-98630-12345",
        "status": "IN_TRANSIT",
        "current_latitude": 25.5600,
        "current_longitude": 92.0100,
        "is_active": True
    },
    {
        "id": "veh-ner-03",
        "registration_number": "MN-01-TK-5521",
        "vehicle_type": "HEAVY_TRUCK",
        "capacity_tons": 18.0,
        "driver_name": "Romen Singh",
        "driver_phone": "+91-98620-67890",
        "status": "AVAILABLE",
        "current_latitude": 24.8170,
        "current_longitude": 93.9368,
        "is_active": True
    },
    {
        "id": "veh-ner-04",
        "registration_number": "AS-25-DC-3319",
        "vehicle_type": "TANKER",
        "capacity_tons": 12.0,
        "driver_name": "Pranab Saikia",
        "driver_phone": "+91-98642-99887",
        "status": "IN_TRANSIT",
        "current_latitude": 26.2500,
        "current_longitude": 92.2000,
        "is_active": True
    },
    {
        "id": "veh-ner-05",
        "registration_number": "NL-07-A-8832",
        "vehicle_type": "LIGHT_TRUCK",
        "capacity_tons": 4.0,
        "driver_name": "Temjen Ao",
        "driver_phone": "+91-98625-11223",
        "status": "IN_TRANSIT",
        "current_latitude": 25.8500,
        "current_longitude": 93.8000,
        "is_active": True
    },
    {
        "id": "veh-ner-06",
        "registration_number": "TR-01-T-4401",
        "vehicle_type": "HEAVY_TRUCK",
        "capacity_tons": 16.0,
        "driver_name": "Biplab Debbarma",
        "driver_phone": "+91-98633-44556",
        "status": "AVAILABLE",
        "current_latitude": 23.8315,
        "current_longitude": 91.2868,
        "is_active": True
    }
]

FIELD_REPORTS_DATA = [
    {
        "id": "rpt-snp-01",
        "client_uuid": "e8d0e78c-02a8-48bc-b472-83b6c2d1b712",
        "reporter_id": "usr-emr-04",
        "category": "LANDSLIDE",
        "severity": "HIGH",
        "description": "Massive hill slope collapse at NH-06 Sonapur section; over 200m road buried under boulders and mud debris.",
        "latitude": 25.0712,
        "longitude": 92.3820,
        "photo_url": "https://neuroute.gov.in/media/evidence/sonapur_landslide_01.jpg",
        "sync_status": "SYNCED",
        "client_reported_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
    },
    {
        "id": "rpt-kzr-02",
        "client_uuid": "f9e1f89d-13b9-49cd-c583-94c7d3e2c823",
        "reporter_id": "usr-gov-03",
        "category": "FLOOD",
        "severity": "HIGH",
        "description": "Brahmaputra overflow causing severe water runoff across 1.5km of NH-27 near Bagori animal corridor.",
        "latitude": 26.5800,
        "longitude": 93.1500,
        "photo_url": "https://neuroute.gov.in/media/evidence/kaziranga_flood_01.jpg",
        "sync_status": "SYNCED",
        "client_reported_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    }
]

INCIDENTS_DATA = [
    {
        "id": "inc-snp-01",
        "field_report_id": "rpt-snp-01",
        "road_segment_id": "seg-nh06-03",
        "district_id": 12,
        "category": "LANDSLIDE",
        "severity": "HIGH",
        "status": "ACTIVE",
        "latitude": 25.0712,
        "longitude": 92.3820,
        "description": "Massive hill slope collapse at NH-06 Sonapur section; over 200m road buried under boulders and mud debris.",
        "photo_url": "https://neuroute.gov.in/media/evidence/sonapur_landslide_01.jpg",
        "confidence": 0.95,
        "verified_by": "usr-adm-01"
    },
    {
        "id": "inc-kzr-04",
        "field_report_id": "rpt-kzr-02",
        "road_segment_id": "seg-nh27-02",
        "district_id": 6,
        "category": "FLOOD",
        "severity": "HIGH",
        "status": "ACTIVE",
        "latitude": 26.5800,
        "longitude": 93.1500,
        "description": "Brahmaputra overflow causing waterlogging across 1.5km of NH-27 near Bagori range; restricted to slow single-file convoy.",
        "photo_url": "https://neuroute.gov.in/media/evidence/kaziranga_flood_01.jpg",
        "confidence": 0.92,
        "verified_by": "usr-gov-03"
    },
    {
        "id": "inc-umi-02",
        "field_report_id": None,
        "road_segment_id": "seg-nh06-02",
        "district_id": 10,
        "category": "HEAVY_RAINFALL",
        "severity": "MEDIUM",
        "status": "INVESTIGATING",
        "latitude": 25.6700,
        "longitude": 91.8950,
        "description": "Dense fog and standing water runoff along Umiam mountain curves; visibility under 30 meters.",
        "photo_url": None,
        "confidence": 0.88,
        "verified_by": None
    },
    {
        "id": "inc-thb-03",
        "field_report_id": None,
        "road_segment_id": "seg-nh102-01",
        "district_id": 18,
        "category": "ROAD_DAMAGE",
        "severity": "LOW",
        "status": "REPORTED",
        "latitude": 24.6310,
        "longitude": 93.9920,
        "description": "Sub-base asphalt scouring on outer shoulder near Thoubal bridge; traffic moving on single lane.",
        "photo_url": None,
        "confidence": 0.82,
        "verified_by": None
    }
]

SHIPMENTS_DATA = [
    {
        "id": "shp-ner-01",
        "shipment_number": "SHP-2026-MED-01",
        "goods_type": "Medicines/Vaccines",
        "cargo_priority": "CRITICAL",
        "source_name": "Guwahati Central Strategic Logistics Terminal",
        "source_lat": 26.1445,
        "source_lon": 91.7362,
        "dest_name": "Silchar Southern Valley Forward Depot",
        "dest_lat": 24.8333,
        "dest_lon": 92.7789,
        "vehicle_id": "veh-ner-01",
        "trip_id": "trip-ner-01",
        "status": "DELAYED",
        "estimated_arrival": (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat(),
        "delay_minutes": 140,
        "risk_score": 0.88
    },
    {
        "id": "shp-ner-02",
        "shipment_number": "SHP-2026-REL-02",
        "goods_type": "Ration",
        "cargo_priority": "HIGH",
        "source_name": "Shillong Mountain Lifeline Distribution Center",
        "source_lat": 25.5788,
        "source_lon": 91.8933,
        "dest_name": "Jowai Border Supply Station",
        "dest_lat": 25.4500,
        "dest_lon": 92.2100,
        "vehicle_id": "veh-ner-02",
        "trip_id": "trip-ner-02",
        "status": "IN_TRANSIT",
        "estimated_arrival": (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat(),
        "delay_minutes": 20,
        "risk_score": 0.35
    },
    {
        "id": "shp-ner-03",
        "shipment_number": "SHP-2026-GEN-03",
        "goods_type": "General Supplies",
        "cargo_priority": "STANDARD",
        "source_name": "Dimapur Railhead Intermodal Hub",
        "source_lat": 25.9060,
        "source_lon": 93.7270,
        "dest_name": "Kohima Infrastructure Base",
        "dest_lat": 25.6740,
        "dest_lon": 94.1100,
        "vehicle_id": "veh-ner-05",
        "trip_id": "trip-ner-03",
        "status": "CREATED",
        "estimated_arrival": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        "delay_minutes": 0,
        "risk_score": 0.18
    },
    {
        "id": "shp-ner-04",
        "shipment_number": "SHP-2026-POL-04",
        "goods_type": "Diesel",
        "cargo_priority": "CRITICAL",
        "source_name": "Guwahati Central Strategic Logistics Terminal",
        "source_lat": 26.1445,
        "source_lon": 91.7362,
        "dest_name": "Tezpur Northern Brahmaputra Forward Base",
        "dest_lat": 26.6338,
        "dest_lon": 92.7926,
        "vehicle_id": "veh-ner-04",
        "trip_id": "trip-ner-04",
        "status": "IN_TRANSIT",
        "estimated_arrival": (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat(),
        "delay_minutes": 15,
        "risk_score": 0.22
    }
]

TRIPS_DATA = [
    {
        "id": "trip-ner-01",
        "vehicle_id": "veh-ner-01",
        "operator_id": "usr-ops-02",
        "shipment_id": "shp-ner-01",
        "origin_name": "Guwahati Central Strategic Logistics Terminal",
        "origin_lat": 26.1445,
        "origin_lon": 91.7362,
        "dest_name": "Silchar Southern Valley Forward Depot",
        "dest_lat": 24.8333,
        "dest_lon": 92.7789,
        "cargo_type": "Medicines/Vaccines",
        "cargo_priority": "CRITICAL",
        "status": "DELAYED",
        "active_route_id": "route-ner-01",
        "baseline_eta": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        "current_eta": (datetime.now(timezone.utc) + timedelta(hours=8, minutes=20)).isoformat(),
        "delay_minutes": 140,
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    },
    {
        "id": "trip-ner-02",
        "vehicle_id": "veh-ner-02",
        "operator_id": "usr-ops-02",
        "shipment_id": "shp-ner-02",
        "origin_name": "Shillong Mountain Lifeline Distribution Center",
        "origin_lat": 25.5788,
        "origin_lon": 91.8933,
        "dest_name": "Jowai Border Supply Station",
        "dest_lat": 25.4500,
        "dest_lon": 92.2100,
        "cargo_type": "Ration",
        "cargo_priority": "HIGH",
        "status": "IN_TRANSIT",
        "active_route_id": "route-ner-03",
        "baseline_eta": (datetime.now(timezone.utc) + timedelta(hours=2, minutes=40)).isoformat(),
        "current_eta": (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat(),
        "delay_minutes": 20,
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    },
    {
        "id": "trip-ner-03",
        "vehicle_id": "veh-ner-05",
        "operator_id": "usr-ops-02",
        "shipment_id": "shp-ner-03",
        "origin_name": "Dimapur Railhead Intermodal Hub",
        "origin_lat": 25.9060,
        "origin_lon": 93.7270,
        "dest_name": "Kohima Infrastructure Base",
        "dest_lat": 25.6740,
        "dest_lon": 94.1100,
        "cargo_type": "General Supplies",
        "cargo_priority": "STANDARD",
        "status": "SCHEDULED",
        "active_route_id": None,
        "baseline_eta": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        "current_eta": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        "delay_minutes": 0,
        "started_at": None
    },
    {
        "id": "trip-ner-04",
        "vehicle_id": "veh-ner-04",
        "operator_id": "usr-ops-02",
        "shipment_id": "shp-ner-04",
        "origin_name": "Guwahati Central Strategic Logistics Terminal",
        "origin_lat": 26.1445,
        "origin_lon": 91.7362,
        "dest_name": "Tezpur Northern Brahmaputra Forward Base",
        "dest_lat": 26.6338,
        "dest_lon": 92.7926,
        "cargo_type": "Diesel",
        "cargo_priority": "CRITICAL",
        "status": "IN_TRANSIT",
        "active_route_id": "route-ner-04",
        "baseline_eta": (datetime.now(timezone.utc) + timedelta(hours=3, minutes=45)).isoformat(),
        "current_eta": (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat(),
        "delay_minutes": 15,
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=1, minutes=30)).isoformat()
    }
]

ROUTES_DATA = [
    {
        "id": "route-ner-01",
        "shipment_id": "shp-ner-01",
        "trip_id": "trip-ner-01",
        "route_type": "RECOMMENDED_SAFEST",
        "total_distance_km": 310.5,
        "estimated_time_min": 390,
        "composite_risk_score": 0.22,
        "route_score": 38.4,
        "coordinates": [[91.7362, 26.1445], [91.8900, 25.6600], [92.2000, 25.4000], [92.6000, 24.9000], [92.7789, 24.8333]],
        "recommendation_reasons": json.dumps([
            "Bypasses Sonapur landslide blockage (NH-06 km 42) via Shillong Strategic Bypass NH-106",
            "Maintains cold-chain safety for CRITICAL medical supplies with 99.2% probability of no halt"
        ])
    },
    {
        "id": "route-ner-02",
        "shipment_id": "shp-ner-01",
        "trip_id": "trip-ner-01",
        "route_type": "FASTEST",
        "total_distance_km": 285.0,
        "estimated_time_min": 530,
        "composite_risk_score": 0.94,
        "route_score": 88.5,
        "coordinates": [[91.7362, 26.1445], [91.9000, 25.8000], [92.3820, 25.0712], [92.7789, 24.8333]],
        "recommendation_reasons": json.dumps([
            "Direct route via standard NH-06 corridor",
            "WARNING: Passes through active Sonapur landslide zone with expected delay of 140+ minutes"
        ])
    },
    {
        "id": "route-ner-03",
        "shipment_id": "shp-ner-02",
        "trip_id": "trip-ner-02",
        "route_type": "PRIORITY_LIFELINE",
        "total_distance_km": 65.0,
        "estimated_time_min": 110,
        "composite_risk_score": 0.35,
        "route_score": 28.0,
        "coordinates": [[91.8933, 25.5788], [92.0500, 25.5500], [92.2100, 25.4500]],
        "recommendation_reasons": json.dumps([
            "Direct mountain relief corridor with SDRF patrol escort"
        ])
    },
    {
        "id": "route-ner-04",
        "shipment_id": "shp-ner-04",
        "trip_id": "trip-ner-04",
        "route_type": "FASTEST",
        "total_distance_km": 178.0,
        "estimated_time_min": 215,
        "composite_risk_score": 0.22,
        "route_score": 32.1,
        "coordinates": [[91.7362, 26.1445], [92.2000, 26.2500], [92.7926, 26.6338]],
        "recommendation_reasons": json.dumps([
            "Four-lane NH-27 arterial to Brahmaputra north bank"
        ])
    }
]

ROUTE_SEGMENT_MAPPINGS_DATA = [
    # route-ner-01 (Safest via Shillong Bypass)
    {"route_id": "route-ner-01", "road_segment_id": "seg-nh06-01", "sequence_order": 1},
    {"route_id": "route-ner-01", "road_segment_id": "seg-shl-byp", "sequence_order": 2},
    {"route_id": "route-ner-01", "road_segment_id": "seg-nh06-04", "sequence_order": 3},
    # route-ner-02 (Fastest via direct NH-06 with landslide)
    {"route_id": "route-ner-02", "road_segment_id": "seg-nh06-01", "sequence_order": 1},
    {"route_id": "route-ner-02", "road_segment_id": "seg-nh06-02", "sequence_order": 2},
    {"route_id": "route-ner-02", "road_segment_id": "seg-nh06-03", "sequence_order": 3},
    {"route_id": "route-ner-02", "road_segment_id": "seg-nh06-04", "sequence_order": 4},
    # route-ner-03 (Shillong to Jowai)
    {"route_id": "route-ner-03", "road_segment_id": "seg-shl-byp", "sequence_order": 1},
    # route-ner-04 (Guwahati to Tezpur)
    {"route_id": "route-ner-04", "road_segment_id": "seg-nh27-01", "sequence_order": 1}
]

HAZARDS_DATA = [
    {
        "id": "haz-snp-01",
        "district_id": 12,
        "road_segment_id": "seg-nh06-03",
        "hazard_type": "LANDSLIDE_PRONE_ZONE",
        "severity": "HIGH",
        "latitude": 25.0712,
        "longitude": 92.3820,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[[92.36, 25.06], [92.40, 25.06], [92.40, 25.09], [92.36, 25.09], [92.36, 25.06]]]
        }),
        "active": True,
        "description": "Sonapur Active Debris Chute & Malidor Canyon unstable slope"
    },
    {
        "id": "haz-kzr-02",
        "district_id": 6,
        "road_segment_id": "seg-nh27-02",
        "hazard_type": "FLOOD_BASIN",
        "severity": "HIGH",
        "latitude": 26.5800,
        "longitude": 93.1500,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[[93.10, 26.55], [93.25, 26.55], [93.25, 26.62], [93.10, 26.62], [93.10, 26.55]]]
        }),
        "active": True,
        "description": "Kaziranga Brahmaputra flood inundation low-lying riverine basin"
    },
    {
        "id": "haz-brl-03",
        "district_id": 2,
        "road_segment_id": "seg-nh06-04",
        "hazard_type": "EROSION",
        "severity": "MEDIUM",
        "latitude": 24.9500,
        "longitude": 92.5500,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[[92.50, 24.90], [92.60, 24.90], [92.60, 25.00], [92.50, 25.00], [92.50, 24.90]]]
        }),
        "active": True,
        "description": "Barail Range road shoulder scouring and subgrade erosion risk"
    }
]

WEATHER_OBSERVATIONS_DATA = [
    {
        "district_id": 12,
        "road_segment_id": "seg-nh06-03",
        "rainfall_mm": 88.5,
        "wind_speed_kmh": 34.0,
        "visibility_meters": 120.0,
        "temperature_c": 18.2,
        "hazard_advisory": "Torrential monsoon downpour; severe mudslide alert in effect."
    },
    {
        "district_id": 6,
        "road_segment_id": "seg-nh27-02",
        "rainfall_mm": 62.0,
        "wind_speed_kmh": 22.0,
        "visibility_meters": 400.0,
        "temperature_c": 24.5,
        "hazard_advisory": "High river swell warning; low-lying highway sections submerged."
    },
    {
        "district_id": 10,
        "road_segment_id": "seg-nh06-02",
        "rainfall_mm": 45.0,
        "wind_speed_kmh": 18.0,
        "visibility_meters": 80.0,
        "temperature_c": 17.0,
        "hazard_advisory": "Dense fog and standing runoff along mountain curves."
    },
    {
        "district_id": 1,
        "road_segment_id": "seg-nh06-01",
        "rainfall_mm": 12.0,
        "wind_speed_kmh": 10.0,
        "visibility_meters": 2500.0,
        "temperature_c": 28.0,
        "hazard_advisory": "Normal monsoon conditions; wet road surface advisory."
    }
]

PREDICTIONS_DATA = [
    {
        "id": "pred-ner-01",
        "prediction_type": "RISK_SCORE",
        "target_entity_type": "ROAD_SEGMENT",
        "target_entity_id": "seg-nh06-03",
        "predicted_value": json.dumps({
            "risk_score": 0.94,
            "risk_level": "CRITICAL",
            "factors": [
                "Active verified landslide within 200m buffer",
                "Monsoon rainfall exceeds 80mm threshold",
                "Slope gradient vulnerability index > 0.85"
            ]
        }),
        "confidence": 0.95,
        "model_version": "ner-risk-baseline-v1.0",
        "input_features": json.dumps({"rainfall_mm": 88.5, "slope_deg": 42.0, "active_incidents": 1}),
        "method": "MULTI_FACTOR_WEIGHTED_HEURISTIC"
    },
    {
        "id": "pred-ner-02",
        "prediction_type": "DELAY_MINUTES",
        "target_entity_type": "SHIPMENT",
        "target_entity_id": "shp-ner-01",
        "predicted_value": json.dumps({
            "delay_minutes": 140,
            "baseline_eta_min": 360,
            "predicted_eta_min": 500,
            "bottleneck": "Sonapur single-lane rock clearing operations"
        }),
        "confidence": 0.88,
        "model_version": "ner-delay-estimator-v1.2",
        "input_features": json.dumps({"segment_speed_kmh": 10.0, "queue_km": 4.5}),
        "method": "CLEARANCE_BOTTLENECK_BUFFER"
    },
    {
        "id": "pred-ner-03",
        "prediction_type": "INCIDENT_CLASSIFICATION",
        "target_entity_type": "INCIDENT",
        "target_entity_id": "inc-snp-01",
        "predicted_value": json.dumps({
            "predicted_category": "LANDSLIDE",
            "suggested_severity": "HIGH",
            "keywords_detected": ["hill collapse", "boulders", "mud debris", "buried road"]
        }),
        "confidence": 0.96,
        "model_version": "ner-classifier-v1.0",
        "input_features": json.dumps({"text_length": 112, "source": "FIELD_REPORT"}),
        "method": "TFIDF_KEYWORD_ENSEMBLE"
    }
]

ALERTS_DATA = [
    {
        "id": "alt-ner-01",
        "title": "Severe Corridor Disruption: Sonapur Landslide",
        "message": "NH-06 completely severed at Sonapur. Medical shipment SHP-2026-MED-01 en-route requires immediate reroute via Shillong Bypass.",
        "severity": "CRITICAL",
        "incident_id": "inc-snp-01",
        "trip_id": "trip-ner-01",
        "shipment_id": "shp-ner-01",
        "user_id": "usr-ops-02",
        "location_name": "NH-06 km 42, Sonapur Tunnel",
        "is_read": False
    },
    {
        "id": "alt-ner-02",
        "title": "Precipitation Warning: Umiam Ridge",
        "message": "Heavy monsoon shower causing hydroplaning risk and reduced visibility along Umiam Ghat section.",
        "severity": "WARNING",
        "incident_id": "inc-umi-02",
        "trip_id": None,
        "shipment_id": None,
        "user_id": None,
        "location_name": "East Khasi Hills / Ri-Bhoi, Meghalaya",
        "is_read": False
    },
    {
        "id": "alt-ner-03",
        "title": "Road Capacity Advisory: Thoubal Single Lane",
        "message": "Minor shoulder scouring on NH-102. Convoys over 15 tons advised to slow down to 25 km/h.",
        "severity": "INFO",
        "incident_id": "inc-thb-03",
        "trip_id": None,
        "shipment_id": None,
        "user_id": None,
        "location_name": "Thoubal, Manipur",
        "is_read": True
    },
    {
        "id": "alt-ner-04",
        "title": "Flood Inundation Warning: Kaziranga Stretch",
        "message": "Brahmaputra waters reaching NH-27 shoulder. Speed restricted to 30 km/h with high wildlife collision hazard.",
        "severity": "WARNING",
        "incident_id": "inc-kzr-04",
        "trip_id": "trip-ner-04",
        "shipment_id": "shp-ner-04",
        "user_id": "usr-gov-03",
        "location_name": "NH-27, Kaziranga National Park Stretch",
        "is_read": False
    }
]

AUDIT_LOGS_DATA = [
    {
        "user_id": "usr-gov-03",
        "action": "OVERRIDE_ROAD_STATUS",
        "entity_type": "road_segments",
        "entity_id": "seg-nh06-03",
        "details": json.dumps({"previous_status": "RISKY", "new_status": "BLOCKED", "reason": "Confirmed Sonapur slope failure"}),
        "ip_address": "10.0.4.12"
    },
    {
        "user_id": "usr-ops-02",
        "action": "DISPATCH_EMERGENCY_REROUTE",
        "entity_type": "shipments",
        "entity_id": "shp-ner-01",
        "details": json.dumps({"recommended_route": "route-ner-01", "bypass": "Shillong Strategic Eastern Bypass NH-106"}),
        "ip_address": "10.0.2.45"
    },
    {
        "user_id": "usr-adm-01",
        "action": "BROADCAST_OPERATIONAL_ALERT",
        "entity_type": "alerts",
        "entity_id": "alt-ner-01",
        "details": json.dumps({"severity": "CRITICAL", "recipients": ["ALL_OPERATORS", "SDRF_COMMAND"]}),
        "ip_address": "10.0.1.1"
    }
]

# ============================================================================
# IDEMPOTENT SEEDING FUNCTIONS
# ============================================================================

def execute_insert(cursor, sql, params):
    """Execute parameterized SQL across standard sqlite3 cursor or psycopg2 cursor."""
    cursor.execute(sql, params)

def seed_roles(cursor):
    """Seed access & governance roles idempotently."""
    print("Seeding Table 1/17: roles...")
    for r in ROLES_DATA:
        cursor.execute("SELECT 1 FROM roles WHERE id = ? OR name = ?", (r["id"], r["name"]))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
                (r["id"], r["name"], r["description"])
            )

def seed_users(cursor):
    """Seed demo users idempotently."""
    print("Seeding Table 2/17: users...")
    for u in DEMO_USERS:
        cursor.execute("SELECT 1 FROM users WHERE id = ? OR email = ?", (u["id"], u["email"]))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO users (id, email, hashed_password, full_name, badge_number, phone_number, role_id, role, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (u["id"], u["email"], u["hashed_password"], u["full_name"], u["badge_number"], u["phone_number"], u["role_id"], u["role"], 1 if u["is_active"] else 0)
            )

def seed_districts(cursor):
    """Seed 30 NER districts idempotently."""
    print("Seeding Table 3/17: districts...")
    for d in DISTRICTS_DATA:
        cursor.execute("SELECT 1 FROM districts WHERE id = ? OR (name = ? AND state = ?)", (d["id"], d["name"], d["state"]))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO districts (id, name, state, accessibility_score) VALUES (?, ?, ?, ?)",
                (d["id"], d["name"], d["state"], d["accessibility_score"])
            )

def seed_road_segments(cursor):
    """Seed strategic highway lifelines idempotently."""
    print("Seeding Table 4/17: road_segments...")
    for s in ROAD_SEGMENTS_DATA:
        cursor.execute("SELECT 1 FROM road_segments WHERE id = ?", (s["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO road_segments (id, osm_id, name, district_id, coordinates_geojson, length_km, base_speed_kmh, current_status, current_risk_score, is_critical_lifeline)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (s["id"], s["osm_id"], s["name"], s["district_id"], json.dumps(s["coordinates"]), s["length_km"], s["base_speed_kmh"], s["current_status"], s["current_risk_score"], 1 if s["is_critical_lifeline"] else 0)
            )

def seed_logistics_hubs(cursor):
    """Seed logistics depots & distribution centers idempotently."""
    print("Seeding Table 5/17: logistics_hubs...")
    for h in LOGISTICS_HUBS_DATA:
        cursor.execute("SELECT 1 FROM logistics_hubs WHERE id = ?", (h["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO logistics_hubs (id, name, hub_type, district_id, latitude, longitude, capacity_tons, contact_phone, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (h["id"], h["name"], h["hub_type"], h["district_id"], h["latitude"], h["longitude"], h["capacity_tons"], h["contact_phone"], 1 if h["is_active"] else 0)
            )

def seed_vehicles(cursor):
    """Seed vehicle fleet idempotently."""
    print("Seeding Table 6/17: vehicles...")
    for v in VEHICLES_DATA:
        cursor.execute("SELECT 1 FROM vehicles WHERE id = ? OR registration_number = ?", (v["id"], v["registration_number"]))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO vehicles (id, registration_number, vehicle_type, capacity_tons, driver_name, driver_phone, status, current_latitude, current_longitude, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (v["id"], v["registration_number"], v["vehicle_type"], v["capacity_tons"], v["driver_name"], v["driver_phone"], v["status"], v["current_latitude"], v["current_longitude"], 1 if v["is_active"] else 0)
            )

def seed_field_reports(cursor):
    """Seed field officer reports idempotently."""
    print("Seeding Table 7/17: field_reports...")
    for fr in FIELD_REPORTS_DATA:
        cursor.execute("SELECT 1 FROM field_reports WHERE id = ? OR client_uuid = ?", (fr["id"], fr["client_uuid"]))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO field_reports (id, client_uuid, reporter_id, category, severity, description, latitude, longitude, photo_url, sync_status, client_reported_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (fr["id"], fr["client_uuid"], fr["reporter_id"], fr["category"], fr["severity"], fr["description"], fr["latitude"], fr["longitude"], fr["photo_url"], fr["sync_status"], fr["client_reported_at"])
            )

def seed_incidents(cursor):
    """Seed verified road incidents idempotently."""
    print("Seeding Table 8/17: incidents...")
    for inc in INCIDENTS_DATA:
        cursor.execute("SELECT 1 FROM incidents WHERE id = ?", (inc["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO incidents (id, field_report_id, road_segment_id, district_id, category, severity, status, latitude, longitude, description, photo_url, confidence, verified_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (inc["id"], inc["field_report_id"], inc["road_segment_id"], inc["district_id"], inc["category"], inc["severity"], inc["status"], inc["latitude"], inc["longitude"], inc["description"], inc["photo_url"], inc["confidence"], inc["verified_by"])
            )

def seed_trips(cursor):
    """Seed active and planned fleet trips idempotently (initial insert without forward FKs)."""
    print("Seeding Table 9/17: trips...")
    for t in TRIPS_DATA:
        cursor.execute("SELECT 1 FROM trips WHERE id = ?", (t["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO trips (id, vehicle_id, operator_id, origin_name, origin_lat, origin_lon, dest_name, dest_lat, dest_lon, cargo_type, cargo_priority, status, baseline_eta, current_eta, delay_minutes, started_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (t["id"], t["vehicle_id"], t["operator_id"], t["origin_name"], t["origin_lat"], t["origin_lon"], t["dest_name"], t["dest_lat"], t["dest_lon"], t["cargo_type"], t["cargo_priority"], t["status"], t["baseline_eta"], t["current_eta"], t["delay_minutes"], t["started_at"])
            )

def seed_shipments(cursor):
    """Seed essential cargo shipments idempotently."""
    print("Seeding Table 10/17: shipments...")
    for s in SHIPMENTS_DATA:
        cursor.execute("SELECT 1 FROM shipments WHERE id = ? OR shipment_number = ?", (s["id"], s["shipment_number"]))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO shipments (id, shipment_number, goods_type, cargo_priority, source_name, source_lat, source_lon, dest_name, dest_lat, dest_lon, vehicle_id, trip_id, status, estimated_arrival, delay_minutes, risk_score)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (s["id"], s["shipment_number"], s["goods_type"], s["cargo_priority"], s["source_name"], s["source_lat"], s["source_lon"], s["dest_name"], s["dest_lat"], s["dest_lon"], s["vehicle_id"], s["trip_id"], s["status"], s["estimated_arrival"], s["delay_minutes"], s["risk_score"])
            )

def seed_routes(cursor):
    """Seed calculated and alternate routes idempotently."""
    print("Seeding Table 11/17: routes...")
    for r in ROUTES_DATA:
        cursor.execute("SELECT 1 FROM routes WHERE id = ?", (r["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO routes (id, shipment_id, trip_id, route_type, total_distance_km, estimated_time_min, composite_risk_score, route_score, coordinates_geojson, recommendation_reasons)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (r["id"], r["shipment_id"], r["trip_id"], r["route_type"], r["total_distance_km"], r["estimated_time_min"], r["composite_risk_score"], r["route_score"], json.dumps(r["coordinates"]), r["recommendation_reasons"])
            )

def link_trips_to_shipments_and_routes(cursor):
    """Update trips with circular shipment_id and active_route_id after both parent entities exist."""
    print("Linking trips to shipments and routes...")
    for t in TRIPS_DATA:
        cursor.execute(
            """UPDATE trips SET shipment_id = ?, active_route_id = ? WHERE id = ?""",
            (t["shipment_id"], t["active_route_id"], t["id"])
        )

def seed_route_segment_mappings(cursor):
    """Seed route segment traversal mappings idempotently."""
    print("Seeding Table 12/17: route_segment_mappings...")
    for m in ROUTE_SEGMENT_MAPPINGS_DATA:
        cursor.execute("SELECT 1 FROM route_segment_mappings WHERE route_id = ? AND sequence_order = ?", (m["route_id"], m["sequence_order"]))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO route_segment_mappings (route_id, road_segment_id, sequence_order) VALUES (?, ?, ?)",
                (m["route_id"], m["road_segment_id"], m["sequence_order"])
            )

def seed_predictions(cursor):
    """Seed explainable AI predictions idempotently."""
    print("Seeding Table 13/17: predictions...")
    for p in PREDICTIONS_DATA:
        cursor.execute("SELECT 1 FROM predictions WHERE id = ?", (p["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO predictions (id, prediction_type, target_entity_type, target_entity_id, predicted_value, confidence, model_version, input_features, method)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (p["id"], p["prediction_type"], p["target_entity_type"], p["target_entity_id"], p["predicted_value"], p["confidence"], p["model_version"], p["input_features"], p["method"])
            )

def seed_weather_observations(cursor):
    """Seed atmospheric weather telemetry idempotently."""
    print("Seeding Table 14/17: weather_observations...")
    for w in WEATHER_OBSERVATIONS_DATA:
        cursor.execute("SELECT 1 FROM weather_observations WHERE district_id = ? AND road_segment_id = ?", (w["district_id"], w["road_segment_id"]))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO weather_observations (district_id, road_segment_id, rainfall_mm, wind_speed_kmh, visibility_meters, temperature_c, hazard_advisory)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (w["district_id"], w["road_segment_id"], w["rainfall_mm"], w["wind_speed_kmh"], w["visibility_meters"], w["temperature_c"], w["hazard_advisory"])
            )

def seed_hazards(cursor):
    """Seed geographic hazard polygons idempotently."""
    print("Seeding Table 15/17: hazards...")
    for h in HAZARDS_DATA:
        cursor.execute("SELECT 1 FROM hazards WHERE id = ?", (h["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO hazards (id, district_id, road_segment_id, hazard_type, severity, latitude, longitude, boundary_geojson, active, description)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (h["id"], h["district_id"], h["road_segment_id"], h["hazard_type"], h["severity"], h["latitude"], h["longitude"], h["boundary_geojson"], 1 if h["active"] else 0, h["description"])
            )

def seed_alerts(cursor):
    """Seed operational notifications idempotently."""
    print("Seeding Table 16/17: alerts...")
    for a in ALERTS_DATA:
        cursor.execute("SELECT 1 FROM alerts WHERE id = ?", (a["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO alerts (id, title, message, severity, incident_id, trip_id, shipment_id, user_id, location_name, is_read)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (a["id"], a["title"], a["message"], a["severity"], a["incident_id"], a["trip_id"], a["shipment_id"], a["user_id"], a["location_name"], 1 if a["is_read"] else 0)
            )

def seed_audit_logs(cursor):
    """Seed security and event audit logs idempotently."""
    print("Seeding Table 17/17: audit_logs...")
    for log in AUDIT_LOGS_DATA:
        cursor.execute("SELECT 1 FROM audit_logs WHERE user_id = ? AND action = ? AND entity_id = ?", (log["user_id"], log["action"], log["entity_id"]))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (log["user_id"], log["action"], log["entity_type"], log["entity_id"], log["details"], log["ip_address"])
            )

# ============================================================================
# COMPREHENSIVE SEEDING & INITIALIZATION ENTRY POINTS
# ============================================================================

def seed_all(connection=None, db_url=None):
    """
    Seed all 17 canonical tables in strict relational dependency order.
    Can accept an open sqlite3.Connection or will open one using db_url/neuroute.db.
    """
    should_close = False
    if connection is None:
        if db_url and db_url.startswith("postgresql"):
            # Backend developer can pass PostgreSQL connection
            import psycopg2
            connection = psycopg2.connect(db_url)
            should_close = True
        else:
            db_path = "neuroute.db"
            connection = sqlite3.connect(db_path)
            connection.execute("PRAGMA foreign_keys = ON;")
            should_close = True

    cursor = connection.cursor()
    try:
        # Relational Dependency Order
        seed_roles(cursor)
        seed_users(cursor)
        seed_districts(cursor)
        seed_road_segments(cursor)
        seed_logistics_hubs(cursor)
        seed_vehicles(cursor)
        seed_field_reports(cursor)
        seed_incidents(cursor)
        seed_trips(cursor)
        seed_shipments(cursor)
        seed_routes(cursor)
        link_trips_to_shipments_and_routes(cursor)
        seed_route_segment_mappings(cursor)
        seed_predictions(cursor)
        seed_weather_observations(cursor)
        seed_hazards(cursor)
        seed_alerts(cursor)
        seed_audit_logs(cursor)

        connection.commit()
        print("\nAll 17 canonical tables seeded successfully!")
    finally:
        if should_close:
            connection.close()

def init_database(db_path="neuroute.db", schema_file=None, drop_existing=False):
    """
    Initialize a fresh database from schema and run seeder.
    Provides zero-config execution for backend test suites and dev server startup.
    """
    if schema_file is None:
        schema_file = os.path.join(os.path.dirname(__file__), "schema_sqlite.sql")

    if drop_existing and os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")

    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(schema_sql)
    print(f"Schema initialized from {schema_file} into {db_path}")

    seed_all(connection=conn)
    conn.close()

if __name__ == "__main__":
    db_target = os.environ.get("DATABASE_PATH", "neuroute.db")
    drop = "--reset" in sys.argv or "--drop" in sys.argv
    print(f"Starting NEURoute database initialization and seeding for target: {db_target}")
    init_database(db_path=db_target, drop_existing=drop)
