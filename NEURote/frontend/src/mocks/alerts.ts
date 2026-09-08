import { OperationalAlert } from '@/types';

export const MOCK_ALERTS: OperationalAlert[] = [
  {
    id: 'ALT-2026-901',
    title: 'CRITICAL: Landslide Active on Kohima-Imphal (NH-29)',
    message: 'Active mudslide at Phesama has completely halted heavy freight traffic. Re-route via Chumukedima suggested.',
    severity: 'critical', // TODO: confirm with backend
    category: 'hazard', // TODO: confirm with backend
    relatedEntityId: 'INC-2026-081',
    timestamp: '2026-09-07T15:20:00.000Z',
    read: false,
    actionUrl: '/incidents',
  },
  {
    id: 'ALT-2026-902',
    title: 'Delay Alert: Vehicle AS-01-GB-4421 in Hazard Zone',
    message: 'Shipment SHP-NER-701 carrying critical medical supplies has slowed to 8 km/h approaching Kohima landslide perimeter.',
    severity: 'critical', // TODO: confirm with backend
    category: 'delay', // TODO: confirm with backend
    relatedEntityId: 'SHP-NER-701',
    timestamp: '2026-09-07T15:14:00.000Z',
    read: false,
    actionUrl: '/logistics',
  },
  {
    id: 'ALT-2026-903',
    title: 'Severe Weather Warning: Dima Hasao & Cachar',
    message: 'IMD issues Red Warning for high intensity rainfall (>180mm) over next 18 hours across Barail hill range.',
    severity: 'warning', // TODO: confirm with backend
    category: 'weather', // TODO: confirm with backend
    timestamp: '2026-09-07T14:40:00.000Z',
    read: false,
    actionUrl: '/gis-map',
  },
  {
    id: 'ALT-2026-904',
    title: 'Bridge Load Restriction: Jatinga Bailey Bridge',
    message: 'Maximum axle limit reduced to 5T following structural joint shift. Heavy 12-wheelers diverted.',
    severity: 'warning', // TODO: confirm with backend
    category: 'hazard', // TODO: confirm with backend
    relatedEntityId: 'INC-2026-083',
    timestamp: '2026-09-07T12:30:00.000Z',
    read: true,
    actionUrl: '/incidents',
  },
  {
    id: 'ALT-2026-905',
    title: 'Fleet Advisory: Sela Tunnel Speed Restriction',
    message: 'West Kameng police implementing single-file convoy movement due to stalled timber truck at North Portal.',
    severity: 'info', // TODO: confirm with backend
    category: 'fleet', // TODO: confirm with backend
    relatedEntityId: 'VEH-AR-01-7761',
    timestamp: '2026-09-07T11:00:00.000Z',
    read: true,
    actionUrl: '/routes',
  },
];
