import { RouteOption } from '@/types';

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: 'RTE-GHY-IMP-01',
    name: 'Primary Brahmaputra - Naga Hills Express',
    corridor: 'Guwahati → Nagaon → Dimapur → Kohima → Imphal (NH-27 / NH-29)',
    distanceKm: 485,
    estimatedDurationHours: 13.5,
    predictedDelayMinutes: 240, // TODO: confirm with backend (high delay due to Phesama landslide)
    riskScore: 78, // TODO: confirm with backend (Scale 0-100)
    elevationProfile: {
      maxElevationMeters: 1444, // Kohima Ridge
      gradientRisk: 'high', // TODO: confirm with backend
    },
    activeIncidentsCount: 2,
    recommended: false,
    waypoints: [
      { lat: 26.1445, lng: 91.7362 }, // Guwahati
      { lat: 26.3478, lng: 92.6841 }, // Nagaon
      { lat: 25.9065, lng: 93.7275 }, // Dimapur
      { lat: 25.6751, lng: 94.1086 }, // Kohima
      { lat: 25.6321, lng: 94.1124 }, // Phesama (Landslide spot)
      { lat: 25.3214, lng: 94.0201 }, // Maram
      { lat: 24.8170, lng: 93.9368 }, // Imphal
    ],
  },
  {
    id: 'RTE-GHY-IMP-02',
    name: 'Southern Barak Valley Resilience Corridor',
    corridor: 'Guwahati → Shillong → Silchar → Jiribam → Imphal (NH-6 / NH-37)',
    distanceKm: 560,
    estimatedDurationHours: 15.0,
    predictedDelayMinutes: 30, // TODO: confirm with backend
    riskScore: 28, // TODO: confirm with backend
    elevationProfile: {
      maxElevationMeters: 980,
      gradientRisk: 'moderate', // TODO: confirm with backend
    },
    activeIncidentsCount: 0,
    recommended: true,
    waypoints: [
      { lat: 26.1445, lng: 91.7362 }, // Guwahati
      { lat: 25.5788, lng: 91.8933 }, // Shillong
      { lat: 24.8333, lng: 92.7789 }, // Silchar
      { lat: 24.8010, lng: 93.1234 }, // Jiribam
      { lat: 24.8170, lng: 93.9368 }, // Imphal
    ],
  },
  {
    id: 'RTE-GHY-ITA-01',
    name: 'North Bank Foothills Corridor',
    corridor: 'Guwahati → Mangaldoi → Tezpur → Bandardewa → Itanagar (NH-15 / NH-415)',
    distanceKm: 330,
    estimatedDurationHours: 7.2,
    predictedDelayMinutes: 15, // TODO: confirm with backend
    riskScore: 18, // TODO: confirm with backend
    elevationProfile: {
      maxElevationMeters: 320,
      gradientRisk: 'low', // TODO: confirm with backend
    },
    activeIncidentsCount: 0,
    recommended: true,
    waypoints: [
      { lat: 26.1445, lng: 91.7362 }, // Guwahati
      { lat: 26.4350, lng: 92.0350 }, // Mangaldoi
      { lat: 26.6528, lng: 92.7926 }, // Tezpur
      { lat: 27.0982, lng: 93.6166 }, // Bandardewa
      { lat: 27.0844, lng: 93.6053 }, // Itanagar
    ],
  },
];
