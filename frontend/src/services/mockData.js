/**
 * Canonical GIS & Map Data for NEURote (North Eastern Region Lifeline Corridors)
 * Field names, enums, and structures strictly mirror:
 * - backend/app/schemas/enums.py
 * - backend/app/schemas/road.py
 * - backend/app/schemas/incident.py
 * - backend/app/schemas/vehicle.py
 * - backend/app/schemas/route.py
 * - backend/app/models/hub.py & hazard.py
 */

// 1. Canonical Road Segments GeoJSON (FeatureCollection)
export const mockRoadSegmentsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: 1,
      geometry: {
        type: "LineString",
        coordinates: [
          [91.7362, 26.1445], // Guwahati
          [91.8760, 26.1080], // Jorabat
        ],
      },
      properties: {
        segment_id: 1,
        segment_code: "NH-06-AS-01",
        name: "Guwahati - Jorabat Gateway Corridor",
        highway_number: "NH-06",
        length_km: 18.5,
        current_status: "OPEN",
        risk_score: 0.12,
        is_critical_lifeline: true,
        speed_limit_kmh: 60.0,
      },
    },
    {
      type: "Feature",
      id: 2,
      geometry: {
        type: "LineString",
        coordinates: [
          [91.8760, 26.1080], // Jorabat
          [91.9020, 25.9680], // Nongpoh
          [91.8833, 25.5788], // Shillong / Sonapur
        ],
      },
      properties: {
        segment_id: 2,
        segment_code: "NH-06-MEGH-02",
        name: "Jorabat - Shillong / Sonapur Lifeline Segment",
        highway_number: "NH-06",
        length_km: 68.2,
        current_status: "BLOCKED", // DEMO SCENARIO: Sonapur Landslide
        risk_score: 0.94,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
    {
      type: "Feature",
      id: 3,
      geometry: {
        type: "LineString",
        coordinates: [
          [91.8833, 25.5788], // Shillong
          [92.2167, 25.4500], // Jowai
        ],
      },
      properties: {
        segment_id: 3,
        segment_code: "NH-06-MEGH-03",
        name: "Shillong - Jowai Ridge Corridor",
        highway_number: "NH-06",
        length_km: 64.0,
        current_status: "RISKY",
        risk_score: 0.65,
        is_critical_lifeline: true,
        speed_limit_kmh: 45.0,
      },
    },
    {
      type: "Feature",
      id: 4,
      geometry: {
        type: "LineString",
        coordinates: [
          [92.2167, 25.4500], // Jowai
          [92.4833, 25.1333], // Lad Rymbai
          [92.7930, 24.8333], // Silchar (Cachar Valley)
        ],
      },
      properties: {
        segment_id: 4,
        segment_code: "NH-06-MEGH-04",
        name: "Jowai - Silchar Lifeline Descent",
        highway_number: "NH-06",
        length_km: 135.0,
        current_status: "OPEN",
        risk_score: 0.28,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
    {
      type: "Feature",
      id: 5,
      geometry: {
        type: "LineString",
        coordinates: [
          [91.7362, 26.1445], // Guwahati
          [92.6840, 26.3450], // Nagaon (NH-27)
          [93.1700, 25.7500], // Lumding - Umrangso Bypass
          [92.7930, 24.8333], // Silchar Transit Route
        ],
      },
      properties: {
        segment_id: 5,
        segment_code: "NH-27-BYPASS-01",
        name: "NH-27 East-West Strategic Bypass Corridor",
        highway_number: "NH-27",
        length_km: 320.0,
        current_status: "OPEN",
        risk_score: 0.18,
        is_critical_lifeline: true,
        speed_limit_kmh: 65.0,
      },
    },
    {
      type: "Feature",
      id: 6,
      geometry: {
        type: "LineString",
        coordinates: [
          [93.7270, 25.9060], // Dimapur
          [94.1100, 25.6700], // Kohima
        ],
      },
      properties: {
        segment_id: 6,
        segment_code: "NH-29-NL-01",
        name: "Dimapur - Kohima Mountain Highway",
        highway_number: "NH-29",
        length_km: 74.0,
        current_status: "RISKY",
        risk_score: 0.58,
        is_critical_lifeline: true,
        speed_limit_kmh: 35.0,
      },
    },
    {
      type: "Feature",
      id: 7,
      geometry: {
        type: "LineString",
        coordinates: [
          [88.4300, 26.7200], // Siliguri Gateway
          [88.5100, 27.1700], // Rangpo
          [88.6138, 27.3314], // Gangtok
        ],
      },
      properties: {
        segment_id: 7,
        segment_code: "NH-10-SK-01",
        name: "Siliguri - Rangpo - Gangtok Lifeline",
        highway_number: "NH-10",
        length_km: 114.0,
        current_status: "UNKNOWN",
        risk_score: 0.42,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
  ],
};

// 2. Active Incidents (with real schema fields)
export const mockIncidents = [
  {
    incident_id: 101,
    title: "Major Landslide at Sonapur Tunnel (NH-06)",
    category: "LANDSLIDE",
    severity: "CRITICAL",
    status: "ACTIVE",
    description: "Massive debris flow and rockfall blocking both lanes. Heavy machinery deployed for clearance.",
    latitude: 25.7520,
    longitude: 91.8950,
    road_segment_id: 2,
    blocked_lanes: 2,
    passable_by_heavy_vehicles: false,
    estimated_clearance_hours: 14.5,
    reported_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    resolution_notes: null,
  },
  {
    incident_id: 102,
    title: "Flash Mudflow on NH-29 Paglapahar Pass",
    category: "ROAD_DAMAGE",
    severity: "HIGH",
    status: "CONFIRMED",
    description: "Single lane traffic movement under escort due to ongoing mud runoff.",
    latitude: 25.7800,
    longitude: 93.9200,
    road_segment_id: 6,
    blocked_lanes: 1,
    passable_by_heavy_vehicles: true,
    estimated_clearance_hours: 6.0,
    reported_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolution_notes: "Convoy moving at 15 km/h",
  },
  {
    incident_id: 103,
    title: "Culvert Waterlogging near Jowai Outskirts",
    category: "FLOOD",
    severity: "MEDIUM",
    status: "INVESTIGATING",
    description: "Monsoon runoff overflowing shoulder. Passable for heavy trucks, risky for light vehicles.",
    latitude: 25.4600,
    longitude: 92.2300,
    road_segment_id: 3,
    blocked_lanes: 0,
    passable_by_heavy_vehicles: true,
    estimated_clearance_hours: 3.5,
    reported_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    resolution_notes: null,
  },
];

// 3. Hazard Hotspots (models/hazard.py)
export const mockHazards = [
  {
    id: 1,
    name: "Sonapur High Vulnerability Slope",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "CRITICAL",
    state: "Meghalaya",
    latitude: 25.7520,
    longitude: 91.8950,
    radius_km: 6.5,
    is_active: true,
  },
  {
    id: 2,
    name: "Barak Basin Inundation Zone",
    hazard_type: "FLOOD_PRONE",
    severity: "HIGH",
    state: "Assam",
    latitude: 24.8100,
    longitude: 92.7800,
    radius_km: 12.0,
    is_active: true,
  },
  {
    id: 3,
    name: "Paglapahar Sinking Zone",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "HIGH",
    state: "Nagaland",
    latitude: 25.7800,
    longitude: 93.9200,
    radius_km: 4.5,
    is_active: true,
  },
];

// 4. Logistics Hubs (models/hub.py)
export const mockHubs = [
  {
    id: 1,
    name: "Guwahati Central Depot",
    hub_type: "CENTRAL_DEPOT",
    state: "Assam",
    latitude: 26.1445,
    longitude: 91.7362,
    capacity_tonnes: 500.0,
    is_emergency_depot: false,
    contact_phone: "+91-361-2890100",
  },
  {
    id: 2,
    name: "Shillong Emergency Forward Depot",
    hub_type: "EMERGENCY_SUPPLY_DEPOT",
    state: "Meghalaya",
    latitude: 25.5788,
    longitude: 91.8833,
    capacity_tonnes: 150.0,
    is_emergency_depot: true,
    contact_phone: "+91-364-2223400",
  },
  {
    id: 3,
    name: "Silchar Transit Relief Hub",
    hub_type: "FORWARD_DEPOT",
    state: "Assam",
    latitude: 24.8333,
    longitude: 92.7930,
    capacity_tonnes: 250.0,
    is_emergency_depot: true,
    contact_phone: "+91-384-2234500",
  },
  {
    id: 4,
    name: "Dimapur Logistics Park",
    hub_type: "FORWARD_DEPOT",
    state: "Nagaland",
    latitude: 25.9060,
    longitude: 93.7270,
    capacity_tonnes: 300.0,
    is_emergency_depot: false,
    contact_phone: "+91-386-2245600",
  },
];

// 5. Vehicles Telemetry (schemas/vehicle.py)
export const mockVehicles = [
  {
    id: 1,
    registration_number: "AS-01-GC-4421",
    vehicle_type: "4x4 Mountain Truck",
    capacity_kg: 7500.0,
    driver_name: "Tenzing Laskar",
    driver_phone: "+91-98640-12345",
    assigned_hub_id: 1,
    fuel_level_percent: 82.5,
    status: "IN_TRANSIT",
    current_lat: 26.1200,
    current_lng: 91.8200,
    speed_kmh: 42.0,
    heading_deg: 115.0,
    last_telemetry_at: new Date().toISOString(),
  },
  {
    id: 2,
    registration_number: "ML-05-TR-9012",
    vehicle_type: "Emergency Medical Tanker",
    capacity_kg: 5000.0,
    driver_name: "Bantei Marbaniang",
    driver_phone: "+91-94361-98765",
    assigned_hub_id: 2,
    fuel_level_percent: 94.0,
    status: "AVAILABLE",
    current_lat: 25.5800,
    current_lng: 91.8900,
    speed_kmh: 0.0,
    heading_deg: 0.0,
    last_telemetry_at: new Date().toISOString(),
  },
  {
    id: 3,
    registration_number: "AS-25-EC-1008",
    vehicle_type: "Heavy Cargo Transporter",
    capacity_kg: 16000.0,
    driver_name: "Pranab Gogoi",
    driver_phone: "+91-97060-55443",
    assigned_hub_id: 1,
    fuel_level_percent: 64.0,
    status: "IN_TRANSIT",
    current_lat: 26.2800,
    current_lng: 92.4500,
    speed_kmh: 52.0,
    heading_deg: 92.0,
    last_telemetry_at: new Date().toISOString(),
  },
  {
    id: 4,
    registration_number: "NL-07-MT-3301",
    vehicle_type: "4x4 Mountain Truck",
    capacity_kg: 6000.0,
    driver_name: "Keviletuo Angami",
    driver_phone: "+91-98560-22119",
    assigned_hub_id: 4,
    fuel_level_percent: 51.0,
    status: "IN_TRANSIT",
    current_lat: 25.8200,
    current_lng: 93.8400,
    speed_kmh: 28.0,
    heading_deg: 140.0,
    last_telemetry_at: new Date().toISOString(),
  },
];

// 6. Planned Routes from /api/v1/routes/plan
export const mockRoutePlanResponse = {
  request_id: "req-ner-nh06-demo-001",
  cargo_priority: "HIGH",
  origin: { lat: 26.1445, lng: 91.7362 }, // Guwahati
  destination: { lat: 24.8333, lng: 92.7930 }, // Silchar
  recommended_route: {
    criterion: "SAFEST",
    title: "Strategic Umrangso Bypass (Safest Route)",
    summary: "Bypasses Sonapur Tunnel landslide block on NH-06 via NH-27 Nagaon & Lumding.",
    distance_km: 348.5,
    estimated_duration_hours: 7.8,
    composite_risk_score: 0.16,
    safety_score: 0.84,
    estimated_delay_hours: 0.3,
    is_recommended: true,
    ai_explanation: [
      "Completely bypasses Sonapur Tunnel landslide on NH-06 (Segment NH-06-MEGH-02).",
      "Corridor evaluated at 96% passability for heavy trucks under current rainfall.",
      "Direct connection to Silchar Relief Hub maintained.",
    ],
    blocked_segments_count: 0,
    risky_segments_count: 1,
    geometry_coordinates: [
      [91.7362, 26.1445], // Guwahati
      [92.1500, 26.2200],
      [92.6840, 26.3450], // Nagaon
      [93.1700, 25.7500], // Lumding / Umrangso
      [92.9500, 25.2000],
      [92.7930, 24.8333], // Silchar
    ],
  },
  alternative_routes: [
    {
      criterion: "FASTEST",
      title: "Direct NH-06 Lifeline (Currently Blocked)",
      summary: "Shortest distance but impassable due to Sonapur landslide.",
      distance_km: 285.7,
      estimated_duration_hours: 15.4,
      composite_risk_score: 0.92,
      safety_score: 0.08,
      estimated_delay_hours: 14.5,
      is_recommended: false,
      ai_explanation: [
        "Segment NH-06-MEGH-02 currently BLOCKED by 200m debris flow.",
        "Total stoppage for heavy vehicles until clearance.",
      ],
      blocked_segments_count: 1,
      risky_segments_count: 1,
      geometry_coordinates: [
        [91.7362, 26.1445], // Guwahati
        [91.8760, 26.1080], // Jorabat
        [91.9020, 25.9680], // Nongpoh
        [91.8833, 25.5788], // Shillong
        [92.2167, 25.4500], // Jowai
        [92.7930, 24.8333], // Silchar
      ],
    },
    {
      criterion: "PRIORITY",
      title: "Armed Escort Convoy Route",
      summary: "Restricted priority corridor with tactical support.",
      distance_km: 350.0,
      estimated_duration_hours: 8.0,
      composite_risk_score: 0.22,
      safety_score: 0.78,
      estimated_delay_hours: 0.5,
      is_recommended: false,
      ai_explanation: [
        "Dedicated logistics escort through Assam Rifles checkpoint.",
      ],
      blocked_segments_count: 0,
      risky_segments_count: 1,
      geometry_coordinates: [
        [91.7362, 26.1445],
        [92.6840, 26.3450],
        [93.1700, 25.7500],
        [92.7930, 24.8333],
      ],
    },
  ],
};
