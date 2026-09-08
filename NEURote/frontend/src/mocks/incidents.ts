import { Incident } from '@/types';

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-081',
    title: 'Severe Landslide Blockage at Phesama',
    type: 'landslide', // TODO: confirm with backend
    severity: 'critical', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    locationName: 'Phesama Sector, NH-29 (Kohima-Imphal corridor)',
    state: 'Nagaland',
    highway: 'NH-29',
    lat: 25.6321,
    lng: 94.1124,
    reportedAt: '2026-09-07T09:40:00.000Z',
    description: 'Heavy debris and rockfall triggered by torrential monsoon rain. Both lanes currently impassable for heavy commercial vehicles.',
    aiClassification: {
      confidence: 0.94, // TODO: confirm with backend
      predictedClearanceHours: 7.5, // TODO: confirm with backend
      suggestedDetourName: 'Chumukedima-Peren-Maram Mountain Cutoff',
    },
  },
  {
    id: 'INC-2026-082',
    title: 'Flash Flood Overflow across Subansiri Lowland',
    type: 'flood', // TODO: confirm with backend
    severity: 'high', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    locationName: 'Lakhimpur-Dhemaji stretch, NH-15',
    state: 'Assam',
    highway: 'NH-15',
    lat: 27.2345,
    lng: 94.1032,
    reportedAt: '2026-09-07T11:15:00.000Z',
    description: 'Water levels reaching 0.8m over culvert bridge. High ground clearance 4x4 vehicles permitted with caution; heavy freight suspended.',
    aiClassification: {
      confidence: 0.88, // TODO: confirm with backend
      predictedClearanceHours: 12.0, // TODO: confirm with backend
      suggestedDetourName: 'Brahmaputra South Bank via Bogibeel Bridge',
    },
  },
  {
    id: 'INC-2026-083',
    title: 'Bridge Expansion Joint Fracture',
    type: 'bridge_damage', // TODO: confirm with backend
    severity: 'critical', // TODO: confirm with backend
    status: 'under_investigation', // TODO: confirm with backend
    locationName: 'Jatinga River Bailey Bridge, Dima Hasao',
    state: 'Assam',
    highway: 'NH-27',
    lat: 25.1209,
    lng: 92.9812,
    reportedAt: '2026-09-07T07:20:00.000Z',
    description: 'Structural inspection underway by BRO engineers. Maximum vehicle weight restriction set to under 5 tonnes.',
    aiClassification: {
      confidence: 0.91, // TODO: confirm with backend
      predictedClearanceHours: 18.0, // TODO: confirm with backend
      suggestedDetourName: 'Silchar-Shillong Western Spur via NH-6',
    },
  },
  {
    id: 'INC-2026-084',
    title: 'Rockfall on 29th Mile NH-10 Corridor',
    type: 'monsoon_erosion', // TODO: confirm with backend
    severity: 'medium', // TODO: confirm with backend
    status: 'clearing', // TODO: confirm with backend
    locationName: 'Teesta Bazaar Gorge, NH-10',
    state: 'Sikkim',
    highway: 'NH-10',
    lat: 27.0811,
    lng: 88.4231,
    reportedAt: '2026-09-07T13:00:00.000Z',
    description: 'Single lane opened under active excavator escort. Slow moving convoy traffic with 45-min delay.',
    aiClassification: {
      confidence: 0.85, // TODO: confirm with backend
      predictedClearanceHours: 3.5, // TODO: confirm with backend
      suggestedDetourName: 'Lava-Algarah-Damdim Ridge Route',
    },
  },
  {
    id: 'INC-2026-085',
    title: 'Timber Truck Breakdown at Sela Tunnel Entry',
    type: 'roadblock', // TODO: confirm with backend
    severity: 'medium', // TODO: confirm with backend
    status: 'clearing', // TODO: confirm with backend
    locationName: 'West Kameng Pass approach, NH-13',
    state: 'Arunachal Pradesh',
    highway: 'NH-13',
    lat: 27.5102,
    lng: 92.1154,
    reportedAt: '2026-09-07T14:10:00.000Z',
    description: 'Axle failure blocking northbound traffic. Heavy recovery crane dispatched from Dirang base.',
    aiClassification: {
      confidence: 0.97, // TODO: confirm with backend
      predictedClearanceHours: 1.5, // TODO: confirm with backend
    },
  },
  {
    id: 'INC-2026-086',
    title: 'Mudslide Slump on Sonapur Tunnel Bypass',
    type: 'landslide', // TODO: confirm with backend
    severity: 'low', // TODO: confirm with backend
    status: 'resolved', // TODO: confirm with backend
    locationName: 'East Jaintia Hills, NH-6',
    state: 'Meghalaya',
    highway: 'NH-6',
    lat: 25.1091,
    lng: 92.3619,
    reportedAt: '2026-09-06T18:00:00.000Z',
    description: 'Debris completely cleared by NHAI rapid action team. Full two-way movement restored.',
    aiClassification: {
      confidence: 0.99, // TODO: confirm with backend
      predictedClearanceHours: 0, // TODO: confirm with backend
    },
  },
];
