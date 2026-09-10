import { DashboardKPIs, DistrictAnalytics, MonthlyTrend } from '@/types';

export const MOCK_DASHBOARD_KPIS: DashboardKPIs = {
  activeShipments: 142,
  shipmentsOnTimeRate: 88.4,
  liveFleetCount: 89,
  fleetActivePct: 92.1,
  activeIncidentsCount: 6,
  criticalIncidentsCount: 2,
  averageRiskIndex: 24.2,
};

export const MOCK_DISTRICT_ANALYTICS: DistrictAnalytics[] = [
  { district: 'Kamrup Metro', state: 'Assam', incidentCount: 2, averageDelayMins: 18, riskRating: 15 },
  { district: 'East Khasi Hills', state: 'Meghalaya', incidentCount: 4, averageDelayMins: 35, riskRating: 28 },
  { district: 'Kohima', state: 'Nagaland', incidentCount: 9, averageDelayMins: 145, riskRating: 82 },
  { district: 'Imphal West', state: 'Manipur', incidentCount: 5, averageDelayMins: 65, riskRating: 54 },
  { district: 'Papum Pare', state: 'Arunachal Pradesh', incidentCount: 3, averageDelayMins: 25, riskRating: 22 },
  { district: 'Aizawl', state: 'Mizoram', incidentCount: 6, averageDelayMins: 72, riskRating: 46 },
  { district: 'West Tripura', state: 'Tripura', incidentCount: 2, averageDelayMins: 20, riskRating: 19 },
  { district: 'East Sikkim', state: 'Sikkim', incidentCount: 7, averageDelayMins: 90, riskRating: 64 },
  { district: 'Dima Hasao', state: 'Assam', incidentCount: 8, averageDelayMins: 110, riskRating: 75 },
  { district: 'West Kameng', state: 'Arunachal Pradesh', incidentCount: 5, averageDelayMins: 85, riskRating: 60 },
];

export const MOCK_MONTHLY_TRENDS: MonthlyTrend[] = [
  { month: 'Apr', incidents: 8, avgDelayHours: 2.1, shipmentVolume: 1120 },
  { month: 'May', incidents: 14, avgDelayHours: 3.4, shipmentVolume: 1250 },
  { month: 'Jun (Monsoon)', incidents: 38, avgDelayHours: 6.8, shipmentVolume: 980 },
  { month: 'Jul (Monsoon)', incidents: 44, avgDelayHours: 7.9, shipmentVolume: 890 },
  { month: 'Aug (Monsoon)', incidents: 32, avgDelayHours: 5.5, shipmentVolume: 1040 },
  { month: 'Sep (Current)', incidents: 18, avgDelayHours: 3.2, shipmentVolume: 1310 },
];
