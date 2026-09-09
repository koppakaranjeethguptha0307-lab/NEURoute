/**
 * Canonical GIS & Map Data for NEURote (North Eastern Region Lifeline Corridors)
 * Comprehensive coverage for all 8 Northeast Indian States:
 * Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Sikkim.
 * Field names, enums, and structures strictly mirror:
 * - backend/app/schemas/enums.py
 * - backend/app/schemas/road.py
 * - backend/app/schemas/incident.py
 * - backend/app/schemas/vehicle.py
 * - backend/app/schemas/route.py
 * - backend/app/models/hub.py & hazard.py
 */

// 1. Northeast India (NER) 8 Individual State Boundaries (GeoJSON FeatureCollection)
export const mockNer8StatesGeoJSON = {
  type: "FeatureCollection",
  features: [
    // 1. SIKKIM
    {
      type: "Feature",
      id: "STATE-SK",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.05, 27.80], [88.20, 28.12], [88.75, 28.10], [88.88, 27.85],
            [88.70, 27.15], [88.52, 27.08], [88.20, 27.10], [88.05, 27.80],
          ],
        ],
      },
      properties: {
        state_code: "SK",
        state_name: "Sikkim",
        capital: "Gangtok",
        area_sqkm: 7096,
        color: "#38bdf8", // Sky blue
        fill_color: "rgba(56, 189, 248, 0.12)",
        primary_lifelines: ["NH-10 (Siliguri - Gangtok)", "NH-717A (Alternate)"],
        strategic_role: "Himalayan Mountain Corridor & Chicken's Neck Gateway",
        active_hotspots: "29th Mile Teesta Sinking Corridor",
      },
    },
    // 2. ARUNACHAL PRADESH
    {
      type: "Feature",
      id: "STATE-AR",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.65, 26.85], [92.05, 27.85], [91.80, 28.35], [92.50, 28.50],
            [93.50, 28.80], [94.50, 29.10], [96.00, 29.45], [97.35, 28.30],
            [97.05, 27.60], [96.20, 27.20], [95.70, 26.90], [95.20, 27.10],
            [94.20, 27.50], [93.70, 27.10], [93.10, 27.00], [92.30, 26.90],
            [91.65, 26.85],
          ],
        ],
      },
      properties: {
        state_code: "AR",
        state_name: "Arunachal Pradesh",
        capital: "Itanagar",
        area_sqkm: 83743,
        color: "#c084fc", // Purple
        fill_color: "rgba(192, 132, 252, 0.10)",
        primary_lifelines: ["NH-415 (Capital Link)", "NH-13 (Trans-Arunachal)", "NH-15"],
        strategic_role: "Northern Frontier & Trans-Himalayan Border Lifelines",
        active_hotspots: "Sessa Mountain Rockfall Corridor, Bhalukpong Pass",
      },
    },
    // 3. ASSAM
    {
      type: "Feature",
      id: "STATE-AS",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.70, 26.35], [90.20, 26.70], [91.60, 26.85], [92.30, 26.90],
            [93.10, 27.00], [93.70, 27.10], [94.20, 27.50], [95.20, 27.10],
            [95.70, 27.55], [96.00, 27.85], [95.80, 27.15], [94.90, 26.80],
            [94.20, 26.35], [93.65, 25.80], [93.20, 25.75], [93.10, 24.85],
            [92.80, 24.50], [92.25, 24.40], [92.15, 25.08], [92.70, 25.10],
            [92.80, 25.35], [92.40, 25.85], [91.85, 26.05], [90.80, 25.95],
            [89.85, 25.65], [89.70, 26.35],
          ],
        ],
      },
      properties: {
        state_code: "AS",
        state_name: "Assam",
        capital: "Guwahati / Dispur",
        area_sqkm: 78438,
        color: "#34d399", // Emerald Green
        fill_color: "rgba(52, 211, 153, 0.10)",
        primary_lifelines: ["NH-27 (East-West Corridor)", "NH-37 (Brahmaputra Trunk)", "NH-06 Gateway"],
        strategic_role: "Central Logistical Artery & Gateway to all 7 Sister States",
        active_hotspots: "Barak Basin Inundation Plain, Dima Hasao Sinking Zone",
      },
    },
    // 4. MEGHALAYA
    {
      type: "Feature",
      id: "STATE-ML",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.85, 25.65], [90.80, 25.95], [91.85, 26.05], [92.40, 25.85],
            [92.80, 25.35], [92.70, 25.10], [92.15, 25.08], [91.20, 25.15],
            [90.40, 25.18], [89.85, 25.65],
          ],
        ],
      },
      properties: {
        state_code: "ML",
        state_name: "Meghalaya",
        capital: "Shillong",
        area_sqkm: 22429,
        color: "#fbbf24", // Amber
        fill_color: "rgba(251, 191, 36, 0.12)",
        primary_lifelines: ["NH-06 (Shillong-Silchar)", "NH-106", "NH-206"],
        strategic_role: "High-Altitude Central Plateau & Monsoon Vulnerability Chokepoints",
        active_hotspots: "Sonapur Tunnel Landslide Slope, Jowai Runoff",
      },
    },
    // 5. NAGALAND
    {
      type: "Feature",
      id: "STATE-NL",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [93.65, 25.80], [94.20, 26.35], [94.85, 26.90], [95.25, 27.05],
            [95.20, 26.40], [94.80, 25.70], [94.45, 25.50], [93.85, 25.55],
            [93.65, 25.80],
          ],
        ],
      },
      properties: {
        state_code: "NL",
        state_name: "Nagaland",
        capital: "Kohima",
        area_sqkm: 16579,
        color: "#f472b6", // Rose Pink
        fill_color: "rgba(244, 114, 182, 0.10)",
        primary_lifelines: ["NH-29 (Dimapur-Kohima)", "NH-02", "NH-129A"],
        strategic_role: "Central Mountain Pass & Railhead Freight Transit",
        active_hotspots: "Paglapahar Sinking & Slide Zone, Zubza Pass",
      },
    },
    // 6. MANIPUR
    {
      type: "Feature",
      id: "STATE-MN",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [93.15, 25.15], [93.90, 25.60], [94.45, 25.50], [94.60, 24.85],
            [94.30, 24.10], [93.80, 23.85], [93.10, 24.25], [93.15, 25.15],
          ],
        ],
      },
      properties: {
        state_code: "MN",
        state_name: "Manipur",
        capital: "Imphal",
        area_sqkm: 22327,
        color: "#22d3ee", // Cyan
        fill_color: "rgba(34, 211, 238, 0.10)",
        primary_lifelines: ["NH-02 (Imphal-Kohima)", "NH-37 (Imphal-Jiribam)", "Asian Highway 1"],
        strategic_role: "Eastern Border Valley & International Transit Gateway",
        active_hotspots: "Mao Gate Mountain Slope Failures, Senapati Washouts",
      },
    },
    // 7. MIZORAM
    {
      type: "Feature",
      id: "STATE-MZ",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [92.50, 24.45], [93.10, 24.25], [93.30, 23.80], [93.25, 22.75],
            [93.00, 22.00], [92.65, 22.25], [92.35, 23.00], [92.20, 23.65],
            [92.50, 24.45],
          ],
        ],
      },
      properties: {
        state_code: "MZ",
        state_name: "Mizoram",
        capital: "Aizawl",
        area_sqkm: 21081,
        color: "#a78bfa", // Violet
        fill_color: "rgba(167, 139, 250, 0.10)",
        primary_lifelines: ["NH-306 (Silchar-Aizawl)", "NH-06 South", "NH-102B"],
        strategic_role: "Southern Ridge Artery & Kaladan Multi-Modal Corridor",
        active_hotspots: "Kolasib Mudflow Hazard Belt, Hunthar Sinking Zone",
      },
    },
    // 8. TRIPURA
    {
      type: "Feature",
      id: "STATE-TR",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.20, 24.45], [91.80, 24.50], [92.25, 24.40], [92.35, 23.80],
            [91.95, 23.30], [91.45, 22.95], [91.20, 23.50], [91.15, 24.15],
            [91.20, 24.45],
          ],
        ],
      },
      properties: {
        state_code: "TR",
        state_name: "Tripura",
        capital: "Agartala",
        area_sqkm: 10486,
        color: "#2dd4bf", // Teal
        fill_color: "rgba(45, 212, 191, 0.11)",
        primary_lifelines: ["NH-08 (Assam-Agartala)", "NH-108", "NH-208"],
        strategic_role: "Southwest Plain Gateway & Trans-Border Trade Hub",
        active_hotspots: "Churaibari Border Inundations, Atharamura Hills",
      },
    },
  ],
};

// 2. The 8 State Capitals & Strategic Gateways of Northeast India
export const mockNerStateCapitals = [
  {
    id: "AS-DISPUR",
    name: "Guwahati / Dispur",
    state: "Assam",
    tag: "Gateway to Northeast India",
    coordinates: [26.1445, 91.7362],
    is_main_gateway: true,
    description: "Primary logistical and transport artery connecting all 7 sister states to mainland India.",
  },
  {
    id: "ML-SHILLONG",
    name: "Shillong",
    state: "Meghalaya",
    tag: "High-Altitude Central Plateau",
    coordinates: [25.5788, 91.8833],
    is_main_gateway: false,
    description: "Vital transit point on NH-06 leading to Barak Valley, Tripura, and Mizoram.",
  },
  {
    id: "AR-ITANAGAR",
    name: "Itanagar",
    state: "Arunachal Pradesh",
    tag: "Northern Frontier Capital",
    coordinates: [27.0844, 93.6053],
    is_main_gateway: false,
    description: "Capital of India's easternmost frontier state, serviced via NH-415 and Trans-Arunachal Highway.",
  },
  {
    id: "NL-KOHIMA",
    name: "Kohima",
    state: "Nagaland",
    tag: "Central Mountain Pass Hub",
    coordinates: [25.6751, 94.1086],
    is_main_gateway: false,
    description: "Mountain pass on NH-29 linking Dimapur railhead with Manipur.",
  },
  {
    id: "MN-IMPHAL",
    name: "Imphal",
    state: "Manipur",
    tag: "Eastern Valley Artery",
    coordinates: [24.8170, 93.9368],
    is_main_gateway: false,
    description: "Manipur valley hub and critical terminal for the Asian Highway 1 corridor.",
  },
  {
    id: "MZ-AIZAWL",
    name: "Aizawl",
    state: "Mizoram",
    tag: "Southern Hill Ridge Hub",
    coordinates: [23.7271, 92.7176],
    is_main_gateway: false,
    description: "Hill capital reliant on single lifeline highway NH-306 from Silchar.",
  },
  {
    id: "TR-AGARTALA",
    name: "Agartala",
    state: "Tripura",
    tag: "Southwest Plain Gateway",
    coordinates: [23.8315, 91.2868],
    is_main_gateway: false,
    description: "State capital on Indo-Bangladesh border, fed by NH-08 lifeline.",
  },
  {
    id: "SK-GANGTOK",
    name: "Gangtok",
    state: "Sikkim",
    tag: "Himalayan Corridor Capital",
    coordinates: [27.3389, 88.6065],
    is_main_gateway: false,
    description: "Himalayan capital fed exclusively by landslide-prone NH-10 from Siliguri.",
  },
];

// 3. Canonical Road Segments GeoJSON across all 8 NER States
export const mockRoadSegmentsGeoJSON = {
  type: "FeatureCollection",
  features: [
    // 1. NH-06: Guwahati to Jorabat (Assam)
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
        state: "Assam",
        length_km: 18.5,
        current_status: "OPEN",
        risk_score: 0.12,
        is_critical_lifeline: true,
        speed_limit_kmh: 60.0,
      },
    },
    // 2. NH-06: Jorabat - Nongpoh - Shillong (Meghalaya, Sonapur Landslide Sector)
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
        state: "Meghalaya",
        length_km: 68.2,
        current_status: "BLOCKED", // DEMO SCENARIO: Sonapur Landslide
        risk_score: 0.94,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
    // 3. NH-06: Shillong - Jowai (Meghalaya)
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
        state: "Meghalaya",
        length_km: 64.0,
        current_status: "RISKY",
        risk_score: 0.65,
        is_critical_lifeline: true,
        speed_limit_kmh: 45.0,
      },
    },
    // 4. NH-06: Jowai - Silchar (Meghalaya / Assam Barak Valley)
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
        state: "Meghalaya / Assam",
        length_km: 135.0,
        current_status: "OPEN",
        risk_score: 0.28,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
    // 5. NH-27 Strategic Bypass Corridor (Assam: Guwahati - Nagaon - Umrangso - Silchar)
    {
      type: "Feature",
      id: 5,
      geometry: {
        type: "LineString",
        coordinates: [
          [91.7362, 26.1445], // Guwahati
          [92.6840, 26.3450], // Nagaon
          [93.1700, 25.7500], // Umrangso / Dima Hasao
          [92.7930, 24.8333], // Silchar
        ],
      },
      properties: {
        segment_id: 5,
        segment_code: "NH-27-BYPASS-01",
        name: "NH-27 East-West Strategic Bypass Corridor",
        highway_number: "NH-27",
        state: "Assam",
        length_km: 320.0,
        current_status: "OPEN",
        risk_score: 0.18,
        is_critical_lifeline: true,
        speed_limit_kmh: 65.0,
      },
    },
    // 6. NH-37 Brahmaputra Valley Trunk (Assam: Nagaon - Jorhat - Dibrugarh)
    {
      type: "Feature",
      id: 6,
      geometry: {
        type: "LineString",
        coordinates: [
          [92.6840, 26.3450], // Nagaon
          [93.1800, 26.5800], // Kaziranga
          [94.2100, 26.7500], // Jorhat
          [94.9100, 27.4700], // Dibrugarh
        ],
      },
      properties: {
        segment_id: 6,
        segment_code: "NH-37-AS-02",
        name: "Brahmaputra Valley Trunk Highway",
        highway_number: "NH-37",
        state: "Assam",
        length_km: 260.0,
        current_status: "OPEN",
        risk_score: 0.15,
        is_critical_lifeline: true,
        speed_limit_kmh: 70.0,
      },
    },
    // 7. NH-29 Nagaland Mountain Highway (Dimapur - Kohima)
    {
      type: "Feature",
      id: 7,
      geometry: {
        type: "LineString",
        coordinates: [
          [93.7270, 25.9060], // Dimapur
          [93.9200, 25.7800], // Paglapahar
          [94.1086, 25.6751], // Kohima
        ],
      },
      properties: {
        segment_id: 7,
        segment_code: "NH-29-NL-01",
        name: "Dimapur - Kohima Mountain Lifeline",
        highway_number: "NH-29",
        state: "Nagaland",
        length_km: 74.0,
        current_status: "RISKY",
        risk_score: 0.58,
        is_critical_lifeline: true,
        speed_limit_kmh: 35.0,
      },
    },
    // 8. NH-02 Manipur Valley Lifeline (Kohima - Mao Gate - Senapati - Imphal)
    {
      type: "Feature",
      id: 8,
      geometry: {
        type: "LineString",
        coordinates: [
          [94.1086, 25.6751], // Kohima
          [94.1300, 25.5100], // Mao Gate
          [94.0200, 25.2600], // Senapati
          [93.9368, 24.8170], // Imphal
        ],
      },
      properties: {
        segment_id: 8,
        segment_code: "NH-02-MN-01",
        name: "Kohima - Imphal Valley Artery",
        highway_number: "NH-02",
        state: "Nagaland / Manipur",
        length_km: 138.0,
        current_status: "OPEN",
        risk_score: 0.32,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
    // 9. NH-306 Mizoram Hill Corridor (Silchar - Kolasib - Aizawl)
    {
      type: "Feature",
      id: 9,
      geometry: {
        type: "LineString",
        coordinates: [
          [92.7930, 24.8333], // Silchar
          [92.7000, 24.5000], // Vairengte (Mizoram Gate)
          [92.6800, 24.2200], // Kolasib
          [92.7176, 23.7271], // Aizawl
        ],
      },
      properties: {
        segment_id: 9,
        segment_code: "NH-306-MZ-01",
        name: "Silchar - Aizawl Mountain Lifeline",
        highway_number: "NH-306",
        state: "Assam / Mizoram",
        length_km: 175.0,
        current_status: "RISKY",
        risk_score: 0.62,
        is_critical_lifeline: true,
        speed_limit_kmh: 35.0,
      },
    },
    // 10. NH-08 Tripura Lifeline (Silchar/Churaibari - Dharmanagar - Agartala)
    {
      type: "Feature",
      id: 10,
      geometry: {
        type: "LineString",
        coordinates: [
          [92.7930, 24.8333], // Silchar
          [92.2400, 24.4500], // Churaibari Gate
          [92.1600, 24.3700], // Dharmanagar
          [91.6000, 23.9800], // Teliamura
          [91.2868, 23.8315], // Agartala
        ],
      },
      properties: {
        segment_id: 10,
        segment_code: "NH-08-TR-01",
        name: "Assam - Tripura Strategic Lifeline",
        highway_number: "NH-08",
        state: "Assam / Tripura",
        length_km: 245.0,
        current_status: "OPEN",
        risk_score: 0.22,
        is_critical_lifeline: true,
        speed_limit_kmh: 55.0,
      },
    },
    // 11. NH-415 Arunachal Capital Link (Banderdewa - Naharlagun - Itanagar)
    {
      type: "Feature",
      id: 11,
      geometry: {
        type: "LineString",
        coordinates: [
          [93.8200, 27.0200], // Banderdewa (Assam border)
          [93.7000, 27.0600], // Naharlagun
          [93.6053, 27.0844], // Itanagar
        ],
      },
      properties: {
        segment_id: 11,
        segment_code: "NH-415-AR-01",
        name: "Itanagar Capital Expressway Corridor",
        highway_number: "NH-415",
        state: "Arunachal Pradesh",
        length_km: 42.0,
        current_status: "OPEN",
        risk_score: 0.25,
        is_critical_lifeline: true,
        speed_limit_kmh: 50.0,
      },
    },
    // 12. NH-10 Sikkim Himalayan Lifeline (Siliguri - Sevoke - Rangpo - Gangtok)
    {
      type: "Feature",
      id: 12,
      geometry: {
        type: "LineString",
        coordinates: [
          [88.4300, 26.7200], // Siliguri Gateway
          [88.4700, 26.8800], // Sevoke (Coronation Bridge)
          [88.5100, 27.1700], // Rangpo (Sikkim border)
          [88.6065, 27.3389], // Gangtok
        ],
      },
      properties: {
        segment_id: 12,
        segment_code: "NH-10-SK-01",
        name: "Siliguri - Rangpo - Gangtok Lifeline",
        highway_number: "NH-10",
        state: "West Bengal / Sikkim",
        length_km: 114.0,
        current_status: "RISKY",
        risk_score: 0.68,
        is_critical_lifeline: true,
        speed_limit_kmh: 40.0,
      },
    },
  ],
};

// 4. Active Incidents across Northeast India
export const mockIncidents = [
  {
    incident_id: 101,
    title: "Major Landslide at Sonapur Tunnel (NH-06)",
    category: "LANDSLIDE",
    severity: "CRITICAL",
    status: "ACTIVE",
    state: "Meghalaya",
    description: "Massive rockfall and slope collapse blocking both lanes on NH-06 lifeline. Emergency convoy diverted to Umrangso bypass.",
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
    state: "Nagaland",
    description: "Active mud runoff across highway shoulder. Heavy convoys moving at 15 km/h under police pilot.",
    latitude: 25.7800,
    longitude: 93.9200,
    road_segment_id: 7,
    blocked_lanes: 1,
    passable_by_heavy_vehicles: true,
    estimated_clearance_hours: 6.0,
    reported_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolution_notes: "Convoy moving under pilot",
  },
  {
    incident_id: 103,
    title: "Waterlogging & Runoff near Jowai Outskirts",
    category: "FLOOD",
    severity: "MEDIUM",
    status: "INVESTIGATING",
    state: "Meghalaya",
    description: "Monsoon runoff overflowing highway drainage. Passable for heavy trucks, hazardous for light delivery vans.",
    latitude: 25.4600,
    longitude: 92.2300,
    road_segment_id: 3,
    blocked_lanes: 0,
    passable_by_heavy_vehicles: true,
    estimated_clearance_hours: 3.5,
    reported_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    resolution_notes: null,
  },
  {
    incident_id: 104,
    title: "Active Sinking Zone at 29th Mile (NH-10)",
    category: "LANDSLIDE",
    severity: "HIGH",
    status: "ACTIVE",
    state: "Sikkim",
    description: "Teesta river bank erosion causing recurring pavement subsidence. Essential freight restricted to night window.",
    latitude: 27.0500,
    longitude: 88.5000,
    road_segment_id: 12,
    blocked_lanes: 1,
    passable_by_heavy_vehicles: true,
    estimated_clearance_hours: 8.0,
    reported_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    resolution_notes: "Single file traffic",
  },
];

// 5. Regional Hazard Hotspots across Northeast India
export const mockHazards = [
  {
    id: 1,
    name: "Sonapur Tunnel High-Risk Slope",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "CRITICAL",
    state: "Meghalaya",
    latitude: 25.7520,
    longitude: 91.8950,
    radius_km: 7.5,
    is_active: true,
    notes: "Historically highest blockage frequency in Northeast India during SW monsoons.",
  },
  {
    id: 2,
    name: "Barak Basin Inundation Plain",
    hazard_type: "FLOOD_PRONE",
    severity: "HIGH",
    state: "Assam",
    latitude: 24.8100,
    longitude: 92.7800,
    radius_km: 14.0,
    is_active: true,
    notes: "Annual monsoonal flooding affecting Cachar, Karimganj, and Hailakandi lifelines.",
  },
  {
    id: 3,
    name: "Paglapahar Sinking & Slide Zone",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "HIGH",
    state: "Nagaland",
    latitude: 25.7800,
    longitude: 93.9200,
    radius_km: 5.5,
    is_active: true,
    notes: "Unstable rock stratification on NH-29 mountain descent.",
  },
  {
    id: 4,
    name: "29th Mile Teesta Sinking Corridor",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "CRITICAL",
    state: "Sikkim",
    latitude: 27.0500,
    longitude: 88.5000,
    radius_km: 8.0,
    is_active: true,
    notes: "NH-10 critical lifeline chokepoint connecting Sikkim to Siliguri.",
  },
  {
    id: 5,
    name: "Kolasib Mudflow Hazard Belt",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "HIGH",
    state: "Mizoram",
    latitude: 24.2200,
    longitude: 92.6800,
    radius_km: 6.0,
    is_active: true,
    notes: "High rainfall induces steep ridge slides on NH-306.",
  },
  {
    id: 6,
    name: "Dima Hasao Hill Sinking Hotspot",
    hazard_type: "LANDSLIDE_ZONE",
    severity: "HIGH",
    state: "Assam",
    latitude: 25.7500,
    longitude: 93.1700,
    radius_km: 10.0,
    is_active: true,
    notes: "Strategic Umrangso bypass mountain sector subject to torrential washouts.",
  },
];

// 6. Strategic Logistics Depots in all 8 Northeast States
export const mockHubs = [
  {
    id: 1,
    name: "Guwahati Central Gateway Logistics Park",
    hub_type: "CENTRAL_DEPOT",
    state: "Assam",
    latitude: 26.1445,
    longitude: 91.7362,
    capacity_tonnes: 850.0,
    is_emergency_depot: true,
    contact_phone: "+91-361-2890100",
  },
  {
    id: 2,
    name: "Shillong Emergency Forward Depot",
    hub_type: "EMERGENCY_SUPPLY_DEPOT",
    state: "Meghalaya",
    latitude: 25.5788,
    longitude: 91.8833,
    capacity_tonnes: 220.0,
    is_emergency_depot: true,
    contact_phone: "+91-364-2223400",
  },
  {
    id: 3,
    name: "Silchar Transit Relief Hub",
    hub_type: "FORWARD_DEPOT",
    state: "Assam (Barak Valley)",
    latitude: 24.8333,
    longitude: 92.7930,
    capacity_tonnes: 350.0,
    is_emergency_depot: true,
    contact_phone: "+91-384-2234500",
  },
  {
    id: 4,
    name: "Dimapur Central Railhead Logistics Hub",
    hub_type: "FORWARD_DEPOT",
    state: "Nagaland",
    latitude: 25.9060,
    longitude: 93.7270,
    capacity_tonnes: 400.0,
    is_emergency_depot: false,
    contact_phone: "+91-386-2245600",
  },
  {
    id: 5,
    name: "Imphal Forward Relief Depot",
    hub_type: "FORWARD_DEPOT",
    state: "Manipur",
    latitude: 24.8170,
    longitude: 93.9368,
    capacity_tonnes: 280.0,
    is_emergency_depot: true,
    contact_phone: "+91-385-2441200",
  },
  {
    id: 6,
    name: "Aizawl Hill Logistics Depot",
    hub_type: "FORWARD_DEPOT",
    state: "Mizoram",
    latitude: 23.7271,
    longitude: 92.7176,
    capacity_tonnes: 200.0,
    is_emergency_depot: true,
    contact_phone: "+91-389-2321100",
  },
  {
    id: 7,
    name: "Agartala Multi-Modal Transit Depot",
    hub_type: "FORWARD_DEPOT",
    state: "Tripura",
    latitude: 23.8315,
    longitude: 91.2868,
    capacity_tonnes: 320.0,
    is_emergency_depot: false,
    contact_phone: "+91-381-2356700",
  },
  {
    id: 8,
    name: "Naharlagun / Itanagar Staging Hub",
    hub_type: "FORWARD_DEPOT",
    state: "Arunachal Pradesh",
    latitude: 27.0600,
    longitude: 93.7000,
    capacity_tonnes: 180.0,
    is_emergency_depot: true,
    contact_phone: "+91-360-2212900",
  },
  {
    id: 9,
    name: "Gangtok Cold-Chain Depot",
    hub_type: "FORWARD_DEPOT",
    state: "Sikkim",
    latitude: 27.3389,
    longitude: 88.6065,
    capacity_tonnes: 160.0,
    is_emergency_depot: true,
    contact_phone: "+91-359-2202300",
  },
];

// 7. Fleet Telemetry Convoys active across Northeast India
export const mockVehicles = [
  {
    id: 1,
    registration_number: "AS-01-GC-4421",
    vehicle_type: "4x4 Mountain Relief Truck",
    status: "IN_TRANSIT",
    current_lat: 25.9680,
    current_lng: 91.9020,
    speed_kmh: 42.5,
    heading_deg: 165.0,
    fuel_level_percent: 78.0,
    driver_name: "Biren Gogoi",
    driver_phone: "+91-94350-12345",
    route_assigned: "Guwahati -> Shillong (NH-06)",
  },
  {
    id: 2,
    registration_number: "AS-03-BC-9012",
    vehicle_type: "Heavy Multi-Axle Relief Convoy",
    status: "IN_TRANSIT",
    current_lat: 26.3450,
    current_lng: 92.6840,
    speed_kmh: 58.0,
    heading_deg: 85.0,
    fuel_level_percent: 85.0,
    driver_name: "Pranab Saikia",
    driver_phone: "+91-98640-54321",
    route_assigned: "Guwahati -> Dibrugarh (NH-37)",
  },
  {
    id: 3,
    registration_number: "ML-05-TK-1188",
    vehicle_type: "Emergency Medical Mobile Van",
    status: "IN_TRANSIT",
    current_lat: 25.7500,
    current_lng: 93.1700,
    speed_kmh: 36.0,
    heading_deg: 140.0,
    fuel_level_percent: 92.0,
    driver_name: "Kyrshan Marbaniang",
    driver_phone: "+91-97740-99881",
    route_assigned: "Umrangso Bypass Corridor (Diverted)",
  },
  {
    id: 4,
    registration_number: "NL-07-FT-3320",
    vehicle_type: "Essential Food Grain Hauler",
    status: "IN_TRANSIT",
    current_lat: 25.7800,
    current_lng: 93.9200,
    speed_kmh: 18.0,
    heading_deg: 130.0,
    fuel_level_percent: 64.0,
    driver_name: "Kevichusa Angami",
    driver_phone: "+91-94360-77665",
    route_assigned: "Dimapur -> Kohima Pass (NH-29)",
  },
  {
    id: 5,
    registration_number: "MZ-01-AR-5510",
    vehicle_type: "Petroleum & Fuel Carrier",
    status: "IN_TRANSIT",
    current_lat: 24.5000,
    current_lng: 92.7000,
    speed_kmh: 30.0,
    heading_deg: 190.0,
    fuel_level_percent: 72.0,
    driver_name: "Lalmuanpuia Sailo",
    driver_phone: "+91-98623-11223",
    route_assigned: "Silchar -> Aizawl Ascent (NH-306)",
  },
];

// 8. Canonical AI Route Planning Response with Enhanced Waypoints & Multi-Route Intelligence
export const mockRoutePlanResponse = {
  plan_id: "ROUTE-PLAN-NER-2026-004",
  generated_at: new Date().toISOString(),
  origin: {
    name: "Guwahati Central Logistics Park (Assam)",
    coordinates: [91.7362, 26.1445],
    landmark: "Khanapara Major Freight Interchange",
  },
  destination: {
    name: "Silchar Forward Transit Relief Depot (Barak Valley)",
    coordinates: [92.7930, 24.8333],
    landmark: "ISBT Ramnagar Relief Center",
  },
  recommended_route: {
    route_id: "ROUTE-SAFEST-BYPASS-02",
    title: "NH-27 / Umrangso Strategic Bypass Corridor",
    summary: "Guwahati -> Nagaon (NH-27) -> Lanka -> Umrangso Bypass -> Haflong -> Silchar",
    criterion: "SAFEST",
    distance_km: 342.5,
    estimated_duration_hours: 8.5,
    composite_risk_score: 0.18,
    safety_score: 0.94,
    estimated_delay_hours: 0.5,
    is_recommended: true,
    ai_explanation: [
      "Bypasses Sonapur Tunnel landslide on NH-06 with 0 blocked bottlenecks.",
      "94% safety score over all-weather paved state highway via Umrangso & Haflong.",
      "Clear heavy vehicle & emergency convoy clearance verified by Assam & Meghalaya transport authorities.",
    ],
    blocked_segments_count: 0,
    risky_segments_count: 1,
    waypoints: [
      { name: "Guwahati Gateway Hub (Origin)", coordinates: [91.7362, 26.1445], type: "ORIGIN" },
      { name: "Nagaon East-West Junction", coordinates: [92.6840, 26.3450], type: "TRANSIT" },
      { name: "Lanka Supply Depot", coordinates: [92.9500, 25.9200], type: "TRANSIT" },
      { name: "Umrangso Mountain Strategic Pass", coordinates: [93.1700, 25.7500], type: "STRATEGIC_PASS" },
      { name: "Haflong Valley Corridor", coordinates: [93.0200, 25.1800], type: "TRANSIT" },
      { name: "Silchar Relief Depot (Destination)", coordinates: [92.7930, 24.8333], type: "DESTINATION" },
    ],
    geometry_coordinates: [
      [91.7362, 26.1445], // Guwahati
      [92.1500, 26.2200], // Jagiroad
      [92.6840, 26.3450], // Nagaon
      [92.9500, 25.9200], // Lanka
      [93.1700, 25.7500], // Umrangso
      [93.0200, 25.1800], // Haflong
      [92.7930, 24.8333], // Silchar
    ],
  },
  alternatives: [
    {
      route_id: "ROUTE-PRIMARY-NH06-DIRECT",
      title: "NH-06 Direct Lifeline (BLOCKED AT SONAPUR)",
      summary: "Guwahati -> Shillong -> Sonapur Tunnel (BLOCKED) -> Jowai -> Silchar",
      criterion: "FASTEST_THEORETICAL",
      distance_km: 285.7,
      estimated_duration_hours: 22.0,
      composite_risk_score: 0.92,
      safety_score: 0.15,
      estimated_delay_hours: 14.5,
      is_recommended: false,
      ai_explanation: [
        "CRITICAL: Sonapur Tunnel segment NH-06-MEGH-02 is 100% BLOCKED by rockfall & landslide.",
        "Estimated clearance delay: 14.5 hours. Strictly avoided by AI planner.",
      ],
      blocked_segments_count: 1,
      risky_segments_count: 1,
      waypoints: [
        { name: "Guwahati Gateway Hub (Origin)", coordinates: [91.7362, 26.1445], type: "ORIGIN" },
        { name: "Jorabat Gateway", coordinates: [91.8760, 26.1080], type: "TRANSIT" },
        { name: "Shillong Plateau", coordinates: [91.8833, 25.5788], type: "TRANSIT" },
        { name: "Sonapur Tunnel Landslide Blockage", coordinates: [91.8950, 25.7520], type: "BLOCKED_POINT" },
        { name: "Jowai Junction", coordinates: [92.2167, 25.4500], type: "TRANSIT" },
        { name: "Silchar Relief Depot (Destination)", coordinates: [92.7930, 24.8333], type: "DESTINATION" },
      ],
      geometry_coordinates: [
        [91.7362, 26.1445], // Guwahati
        [91.8760, 26.1080], // Jorabat
        [91.8833, 25.5788], // Shillong
        [91.8950, 25.7520], // Sonapur Blockage
        [92.2167, 25.4500], // Jowai
        [92.4833, 25.1333], // Lad Rymbai
        [92.7930, 24.8333], // Silchar
      ],
    },
  ],
};
