import { Shipment } from '@/types';

export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-NER-701',
    trackingNumber: 'TRK-NER-2026-9081',
    origin: 'Guwahati Logistics Hub (Assam)',
    destination: 'Imphal Civil Supply Depot (Manipur)',
    carrier: 'NER Express Freight',
    vehicleId: 'VEH-AS-01-4421',
    cargoType: 'Emergency Pharmaceuticals & Medical Supplies',
    weightKg: 4200,
    status: 'in_transit', // TODO: confirm with backend
    priority: 'critical', // TODO: confirm with backend
    estimatedArrival: '2026-09-08T04:30:00.000Z',
    departedAt: '2026-09-07T12:00:00.000Z',
    currentLocationName: 'Near Kohima Bypass, NH-29',
    riskScore: 68, // TODO: confirm with backend (High terrain risk due to landslide warning)
  },
  {
    id: 'SHP-NER-702',
    trackingNumber: 'TRK-NER-2026-8812',
    origin: 'Silchar Distribution Center (Assam)',
    destination: 'Aizawl North Food Depot (Mizoram)',
    carrier: 'Eastern Hill Haulers',
    vehicleId: 'VEH-MZ-01-1092',
    cargoType: 'Food Grains & Packaged Ration',
    weightKg: 8500,
    status: 'delayed', // TODO: confirm with backend
    priority: 'high', // TODO: confirm with backend
    estimatedArrival: '2026-09-08T09:00:00.000Z',
    departedAt: '2026-09-07T08:30:00.000Z',
    currentLocationName: 'Kolasib Hill Sector, NH-306',
    riskScore: 42, // TODO: confirm with backend
  },
  {
    id: 'SHP-NER-703',
    trackingNumber: 'TRK-NER-2026-5541',
    origin: 'Jorhat Regional Hub (Assam)',
    destination: 'Itanagar Cold Storage (Arunachal Pradesh)',
    carrier: 'Brahmaputra Cargo Logistics',
    vehicleId: 'VEH-AR-02-8821',
    cargoType: 'Temperature-Controlled Vaccines & Dairy',
    weightKg: 2800,
    status: 'in_transit', // TODO: confirm with backend
    priority: 'essential_supplies', // TODO: confirm with backend
    estimatedArrival: '2026-09-07T23:15:00.000Z',
    departedAt: '2026-09-07T14:00:00.000Z',
    currentLocationName: 'Bandardewa Checkpost, NH-415',
    riskScore: 18, // TODO: confirm with backend (Low risk corridor)
  },
  {
    id: 'SHP-NER-704',
    trackingNumber: 'TRK-NER-2026-6673',
    origin: 'Shillong Agro Hub (Meghalaya)',
    destination: 'Agartala Central Market (Tripura)',
    carrier: 'Meghalaya Hill Express',
    vehicleId: 'VEH-TR-01-3145',
    cargoType: 'High-Value Horticultural Produce',
    weightKg: 5100,
    status: 'rerouted', // TODO: confirm with backend
    priority: 'standard', // TODO: confirm with backend
    estimatedArrival: '2026-09-08T14:00:00.000Z',
    departedAt: '2026-09-07T06:00:00.000Z',
    currentLocationName: 'Karimganj Detour, NH-8',
    riskScore: 55, // TODO: confirm with backend
  },
  {
    id: 'SHP-NER-705',
    trackingNumber: 'TRK-NER-2026-4410',
    origin: 'Guwahati Air Cargo Terminal (Assam)',
    destination: 'Gangtok Himalayan Warehouse (Sikkim)',
    carrier: 'Himalayan Ridge Logistics',
    vehicleId: 'VEH-SK-01-9011',
    cargoType: 'Solar Power Inverters & Battery Modules',
    weightKg: 6400,
    status: 'in_transit', // TODO: confirm with backend
    priority: 'high', // TODO: confirm with backend
    estimatedArrival: '2026-09-08T18:00:00.000Z',
    departedAt: '2026-09-07T10:00:00.000Z',
    currentLocationName: 'Sevoke Bridge Approach, NH-10',
    riskScore: 34, // TODO: confirm with backend
  },
  {
    id: 'SHP-NER-706',
    trackingNumber: 'TRK-NER-2026-2199',
    origin: 'Dimapur Transshipment Point (Nagaland)',
    destination: 'Mokokchung Supply Center (Nagaland)',
    carrier: 'Naga Hill Freights',
    vehicleId: 'VEH-NL-07-5502',
    cargoType: 'Construction & Road Repair Cement',
    weightKg: 12000,
    status: 'pending', // TODO: confirm with backend
    priority: 'standard', // TODO: confirm with backend
    estimatedArrival: '2026-09-09T08:00:00.000Z',
    departedAt: '2026-09-07T18:00:00.000Z',
    currentLocationName: 'Dimapur Staging Yard',
    riskScore: 12, // TODO: confirm with backend
  },
  {
    id: 'SHP-NER-707',
    trackingNumber: 'TRK-NER-2026-1184',
    origin: 'Tezpur Supply Depot (Assam)',
    destination: 'Tawang Frontier Logistics Hub (Arunachal)',
    carrier: 'Arunachal Mountain Fleet',
    vehicleId: 'VEH-AR-01-7761',
    cargoType: 'Heavy Winter Gear & Telecom Equipment',
    weightKg: 3900,
    status: 'in_transit', // TODO: confirm with backend
    priority: 'critical', // TODO: confirm with backend
    estimatedArrival: '2026-09-08T22:00:00.000Z',
    departedAt: '2026-09-07T05:30:00.000Z',
    currentLocationName: 'Sela Tunnel North Portal, NH-13',
    riskScore: 72, // TODO: confirm with backend (High altitude weather alert)
  },
];
