import { RouteOption } from '@/types';

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: 'RTE-GHY-IMP-01',
    name: 'Primary Brahmaputra - Naga Hills Express',
    corridor: 'Guwahati → Nagaon → Dimapur → Kohima → Imphal (NH-27 / NH-29)',
    distanceKm: 485,
    estimatedDurationHours: 13.5,
    predictedDelayMinutes: 240,
    riskScore: 78,
    elevationProfile: {
      maxElevationMeters: 1444,
      gradientRisk: 'high',
    },
    activeIncidentsCount: 2,
    recommended: false,
    waypoints: [
      { lat: 26.1445, lng: 91.7362 },
      { lat: 26.3478, lng: 92.6841 },
      { lat: 25.9065, lng: 93.7275 },
      { lat: 25.6751, lng: 94.1086 },
      { lat: 25.6321, lng: 94.1124 },
      { lat: 25.3214, lng: 94.0201 },
      { lat: 24.8170, lng: 93.9368 },
    ],
  },
  {
    id: 'RTE-GHY-IMP-02',
    name: 'Southern Barak Valley Resilience Corridor',
    corridor: 'Guwahati → Shillong → Silchar → Jiribam → Imphal (NH-6 / NH-37)',
    distanceKm: 560,
    estimatedDurationHours: 15.0,
    predictedDelayMinutes: 30,
    riskScore: 28,
    elevationProfile: {
      maxElevationMeters: 980,
      gradientRisk: 'moderate',
    },
    activeIncidentsCount: 0,
    recommended: true,
    waypoints: [
      { lat: 26.1445, lng: 91.7362 },
      { lat: 25.5788, lng: 91.8933 },
      { lat: 24.8333, lng: 92.7789 },
      { lat: 24.8010, lng: 93.1234 },
      { lat: 24.8170, lng: 93.9368 },
    ],
  },
  {
    id: 'RTE-GHY-ITA-01',
    name: 'North Bank Foothills Corridor',
    corridor: 'Guwahati → Mangaldoi → Tezpur → Bandardewa → Itanagar (NH-15 / NH-415)',
    distanceKm: 330,
    estimatedDurationHours: 7.2,
    predictedDelayMinutes: 15,
    riskScore: 18,
    elevationProfile: {
      maxElevationMeters: 320,
      gradientRisk: 'low',
    },
    activeIncidentsCount: 0,
    recommended: true,
    waypoints: [
      { lat: 26.1445, lng: 91.7362 },
      { lat: 26.4350, lng: 92.0350 },
      { lat: 26.6528, lng: 92.7926 },
      { lat: 27.0982, lng: 93.6166 },
      { lat: 27.0844, lng: 93.6053 },
    ],
  },
];

export interface RoutePlanParams {
  origin?: string;
  destination?: string;
  cargoType?: string;
  vehicleType?: string;
  avoidActiveHazards?: boolean;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  guwahati: { lat: 26.1445, lng: 91.7362, name: 'Guwahati' },
  silchar: { lat: 24.8333, lng: 92.7789, name: 'Silchar' },
  jorhat: { lat: 26.7509, lng: 94.2037, name: 'Jorhat' },
  shillong: { lat: 25.5788, lng: 91.8933, name: 'Shillong' },
  dimapur: { lat: 25.9060, lng: 93.7271, name: 'Dimapur' },
  tezpur: { lat: 26.6528, lng: 92.7926, name: 'Tezpur' },
  imphal: { lat: 24.8170, lng: 93.9368, name: 'Imphal' },
  aizawl: { lat: 23.7271, lng: 92.7176, name: 'Aizawl' },
  itanagar: { lat: 27.0844, lng: 93.6053, name: 'Itanagar' },
  agartala: { lat: 23.8315, lng: 91.2868, name: 'Agartala' },
  gangtok: { lat: 27.3389, lng: 88.6065, name: 'Gangtok' },
  tawang: { lat: 27.5861, lng: 91.8594, name: 'Tawang' },
  mokokchung: { lat: 26.3243, lng: 94.5152, name: 'Mokokchung' },
};

function extractCityKey(text: string | undefined, defaultKey: string): string {
  if (!text) return defaultKey;
  const lower = text.toLowerCase();
  for (const key of Object.keys(CITY_COORDINATES)) {
    if (lower.includes(key)) return key;
  }
  return defaultKey;
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getCalculatedRoutes(params?: RoutePlanParams): RouteOption[] {
  if (!params || (!params.origin && !params.destination)) {
    return MOCK_ROUTES;
  }

  const originKey = extractCityKey(params.origin, 'shillong');
  const destKey = extractCityKey(params.destination, 'aizawl');

  const originCity = CITY_COORDINATES[originKey] || CITY_COORDINATES['shillong'];
  const destCity = CITY_COORDINATES[destKey] || CITY_COORDINATES['aizawl'];

  const straightKm = calculateHaversineKm(
    originCity.lat,
    originCity.lng,
    destCity.lat,
    destCity.lng
  );
  const baseDistance = Math.max(110, Math.round(straightKm * 1.4));

  const avoid = params.avoidActiveHazards !== false;
  const isHeavy = params.vehicleType === 'heavy_truck';

  const midLat = (originCity.lat + destCity.lat) / 2;
  const midLng = (originCity.lng + destCity.lng) / 2;

  const route1Distance = baseDistance;
  const route1Duration = Number((route1Distance / (isHeavy ? 38 : 44)).toFixed(1));

  const route2Distance = Math.round(baseDistance * 0.94);
  const route2Duration = Number((route2Distance / (isHeavy ? 35 : 40)).toFixed(1));

  const route3Distance = Math.round(baseDistance * 1.12);
  const route3Duration = Number((route3Distance / (isHeavy ? 32 : 36)).toFixed(1));

  const origTag = originCity.name.substring(0, 3).toUpperCase();
  const destTag = destCity.name.substring(0, 3).toUpperCase();

  return [
    {
      id: `RTE-${origTag}-${destTag}-01`,
      name: `${originCity.name} → ${destCity.name} Primary Resilience Corridor`,
      corridor: `${originCity.name} → Central Hub Sector → ${destCity.name} (National Highway)`,
      distanceKm: route1Distance,
      estimatedDurationHours: route1Duration,
      predictedDelayMinutes: avoid ? 15 : 45,
      riskScore: avoid ? 18 : 34,
      elevationProfile: {
        maxElevationMeters: 1120,
        gradientRisk: 'low',
      },
      activeIncidentsCount: 0,
      recommended: true,
      waypoints: [
        { lat: originCity.lat, lng: originCity.lng },
        { lat: Number((midLat + 0.08).toFixed(4)), lng: Number((midLng - 0.05).toFixed(4)) },
        { lat: Number((midLat - 0.04).toFixed(4)), lng: Number((midLng + 0.06).toFixed(4)) },
        { lat: destCity.lat, lng: destCity.lng },
      ],
    },
    {
      id: `RTE-${origTag}-${destTag}-02`,
      name: `${originCity.name} → ${destCity.name} Direct Trunk Expressway`,
      corridor: `${originCity.name} → Direct Highway Link → ${destCity.name}`,
      distanceKm: route2Distance,
      estimatedDurationHours: route2Duration,
      predictedDelayMinutes: avoid ? 35 : 120,
      riskScore: avoid ? 38 : 68,
      elevationProfile: {
        maxElevationMeters: 1480,
        gradientRisk: 'moderate',
      },
      activeIncidentsCount: avoid ? 1 : 2,
      recommended: false,
      waypoints: [
        { lat: originCity.lat, lng: originCity.lng },
        { lat: Number(midLat.toFixed(4)), lng: Number(midLng.toFixed(4)) },
        { lat: destCity.lat, lng: destCity.lng },
      ],
    },
    {
      id: `RTE-${origTag}-${destTag}-03`,
      name: `${originCity.name} → ${destCity.name} High Ridge Bypass`,
      corridor: `${originCity.name} → Foothill Bypass → High Elevation Pass → ${destCity.name}`,
      distanceKm: route3Distance,
      estimatedDurationHours: route3Duration,
      predictedDelayMinutes: avoid ? 20 : 180,
      riskScore: avoid ? 28 : 78,
      elevationProfile: {
        maxElevationMeters: 1850,
        gradientRisk: 'high',
      },
      activeIncidentsCount: avoid ? 0 : 3,
      recommended: false,
      waypoints: [
        { lat: originCity.lat, lng: originCity.lng },
        { lat: Number((midLat - 0.12).toFixed(4)), lng: Number((midLng + 0.15).toFixed(4)) },
        { lat: Number((midLat + 0.1).toFixed(4)), lng: Number((midLng - 0.1).toFixed(4)) },
        { lat: destCity.lat, lng: destCity.lng },
      ],
    },
  ];
}
