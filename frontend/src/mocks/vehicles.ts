import { Vehicle } from '@/types';

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'VEH-AS-01-4421',
    plateNumber: 'AS-01-GB-4421',
    driverName: 'Biren Gogoi',
    driverPhone: '+91 94350 11234',
    vehicleType: 'heavy_truck', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    speedKmh: 42,
    fuelLevelPct: 78,
    lat: 25.6751, // Kohima corridor
    lng: 94.1086,
    assignedShipmentId: 'SHP-NER-701',
    lastUpdated: '2026-09-07T15:10:00.000Z',
    headingDeg: 145,
  },
  {
    id: 'VEH-MZ-01-1092',
    plateNumber: 'MZ-01-C-1092',
    driverName: 'Lalthan Sanga',
    driverPhone: '+91 98620 22341',
    vehicleType: 'medium_carrier', // TODO: confirm with backend
    status: 'delayed', // TODO: confirm with backend
    speedKmh: 14,
    fuelLevelPct: 45,
    lat: 24.2212, // Kolasib hill road
    lng: 92.6789,
    assignedShipmentId: 'SHP-NER-702',
    lastUpdated: '2026-09-07T15:08:00.000Z',
    headingDeg: 180,
  },
  {
    id: 'VEH-AR-02-8821',
    plateNumber: 'AR-02-A-8821',
    driverName: 'Tage Nido',
    driverPhone: '+91 94020 33452',
    vehicleType: 'refrigerated_van', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    speedKmh: 58,
    fuelLevelPct: 82,
    lat: 27.0982, // Itanagar approach
    lng: 93.6166,
    assignedShipmentId: 'SHP-NER-703',
    lastUpdated: '2026-09-07T15:12:00.000Z',
    headingDeg: 45,
  },
  {
    id: 'VEH-TR-01-3145',
    plateNumber: 'TR-01-X-3145',
    driverName: 'Subhasish Debbarma',
    driverPhone: '+91 94361 44563',
    vehicleType: 'heavy_truck', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    speedKmh: 36,
    fuelLevelPct: 60,
    lat: 24.8654, // Karimganj border
    lng: 92.3589,
    assignedShipmentId: 'SHP-NER-704',
    lastUpdated: '2026-09-07T15:05:00.000Z',
    headingDeg: 210,
  },
  {
    id: 'VEH-SK-01-9011',
    plateNumber: 'SK-01-P-9011',
    driverName: 'Dorjee Lepcha',
    driverPhone: '+91 94340 55674',
    vehicleType: 'heavy_truck', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    speedKmh: 28,
    fuelLevelPct: 69,
    lat: 27.1852, // Sevoke to Gangtok NH-10
    lng: 88.5122,
    assignedShipmentId: 'SHP-NER-705',
    lastUpdated: '2026-09-07T15:11:00.000Z',
    headingDeg: 15,
  },
  {
    id: 'VEH-AR-01-7761',
    plateNumber: 'AR-01-TR-7761',
    driverName: 'Jampa Norbu',
    driverPhone: '+91 94360 66785',
    vehicleType: 'all_terrain_4x4', // TODO: confirm with backend
    status: 'active', // TODO: confirm with backend
    speedKmh: 22,
    fuelLevelPct: 88,
    lat: 27.5023, // Sela Pass high altitude
    lng: 92.1034,
    assignedShipmentId: 'SHP-NER-707',
    lastUpdated: '2026-09-07T15:09:00.000Z',
    headingDeg: 330,
  },
  {
    id: 'VEH-AS-01-9988',
    plateNumber: 'AS-01-KL-9988',
    driverName: 'Pranjal Saikia',
    driverPhone: '+91 94351 77896',
    vehicleType: 'all_terrain_4x4', // TODO: confirm with backend
    status: 'idle', // TODO: confirm with backend
    speedKmh: 0,
    fuelLevelPct: 95,
    lat: 26.1445, // Guwahati Hub Yard
    lng: 91.7362,
    lastUpdated: '2026-09-07T14:45:00.000Z',
  },
  {
    id: 'VEH-ML-05-3312',
    plateNumber: 'ML-05-D-3312',
    driverName: 'Ksanborlang Marbaniang',
    driverPhone: '+91 98630 88907',
    vehicleType: 'medium_carrier', // TODO: confirm with backend
    status: 'maintenance', // TODO: confirm with backend
    speedKmh: 0,
    fuelLevelPct: 30,
    lat: 25.5788, // Shillong Depot
    lng: 91.8933,
    lastUpdated: '2026-09-07T13:20:00.000Z',
  },
];
