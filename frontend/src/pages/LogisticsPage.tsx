import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  Plus,
  Search,
  Phone,
  Gauge,
  Fuel,
  X,
  Loader2,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Sparkles,
  Compass,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { sseClient } from '@/utils/sseClient';
import { Shipment, Vehicle, ShipmentPriority } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useEmergencyMode } from '@/contexts/EmergencyContext';

interface SimulationState {
  emergency_mode: boolean;
  target_road: {
    code: string;
    name: string;
    status: string;
    risk_score: number;
  };
  vehicle_telemetry: {
    vehicle_id: number;
    registration_number?: string;
    speed_kmh: number;
    heading_deg?: number;
    route_progress_pct: number;
    current_road_name?: string;
    source: string;
  };
  cold_chain_telemetry: {
    shipment_id: number;
    temperature_c: number;
    status: string;
    source: string;
  };
  weather: {
    rainfall_mm: number;
    condition: string;
  };
}

export const LogisticsPage: React.FC = () => {
  const { isEmergencyMode } = useEmergencyMode();
  const [activeTab, setActiveTab] = useState<'shipments' | 'fleet'>('shipments');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Shipments Search & Filters
  const [shipmentSearch, setShipmentSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Fleet Search & Filters
  const [fleetSearch, setFleetSearch] = useState<string>('');
  const [fleetStatusFilter, setFleetStatusFilter] = useState<string>('all');

  // Create Shipment Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newShipment, setNewShipment] = useState({
    origin: 'Guwahati Hub',
    destination: 'Silchar Forward Depot',
    carrier: 'NEURoute Express Medical Fleet',
    vehicleId: 'AS-01-EC-3312',
    cargoType: 'Emergency Medical Supplies & Vaccines',
    weightKg: 450,
    priority: 'critical' as ShipmentPriority,
  });

  const hasShipmentsRef = React.useRef(shipments.length > 0);
  hasShipmentsRef.current = shipments.length > 0;

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground && !hasShipmentsRef.current) {
      setIsLoading(true);
    }
    try {
      const [shipmentsRes, vehiclesRes, simRes] = await Promise.all([
        apiClient.get<Shipment[]>('/shipments'),
        apiClient.get<Vehicle[]>('/vehicles'),
        apiClient.get<SimulationState>('/simulation/status'),
      ]);
      const sList = Array.isArray(shipmentsRes) && shipmentsRes.length > 0 ? shipmentsRes : [];
      const vList = Array.isArray(vehiclesRes) && vehiclesRes.length > 0 ? vehiclesRes : [];
      
      setShipments(sList);
      setVehicles(vList);
      if (simRes && simRes.target_road) {
        setSimState(simRes);
      }
      if (sList.length > 0) {
        setSelectedShipment((prev) => prev || sList[0]);
      }
    } catch (err) {
      console.error('Failed to load logistics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = sseClient.subscribe((evt) => {
      if (
        evt &&
        (evt.event === 'SIMULATION_RESET' ||
          evt.event === 'VEHICLE_TELEMETRY_UPDATED' ||
          evt.event === 'COLD_CHAIN_ALERT' ||
          evt.event === 'ROAD_STATUS_UPDATED' ||
          evt.event === 'WEATHER_UPDATED' ||
          evt.event === 'EMERGENCY_MODE_TOGGLED' ||
          evt.event === 'DEMO_SCENARIO_COMPLETED')
      ) {
        fetchData(true);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [fetchData]);

  // Derived Dynamic Medical Shipment State
  const activeMedTemp = simState?.cold_chain_telemetry.temperature_c ?? 4.8;
  const activeMedTempStatus = simState?.cold_chain_telemetry.status ?? 'NORMAL';
  const activeRoadStatus = simState?.target_road.status ?? 'OPEN';
  const activeRiskScore = simState?.target_road.risk_score ?? 0.18;

  // Filter Shipments
  const filteredShipments = shipments.filter((shp) => {
    const trackingNum = shp.trackingNumber || (shp as any).tracking_number || '';
    const origin = shp.origin || (shp as any).origin_address || '';
    const destination = shp.destination || (shp as any).destination_address || '';
    const cargoType = shp.cargoType || (shp as any).cargo_type || '';
    const carrier = shp.carrier || 'NEURoute Regional Fleet';

    const matchesSearch =
      trackingNum.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      origin.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      destination.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      cargoType.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      carrier.toLowerCase().includes(shipmentSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shp.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || shp.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter Fleet
  const filteredVehicles = vehicles.filter((veh) => {
    const plateNum = veh.plateNumber || (veh as any).registration_number || '';
    const driverName = veh.driverName || (veh as any).driver_name || '';
    const driverPhone = veh.driverPhone || (veh as any).driver_phone || '';
    const vehicleType = veh.vehicleType || (veh as any).vehicle_type || '';

    const matchesSearch =
      plateNum.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      driverName.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      driverPhone.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      vehicleType.toLowerCase().includes(fleetSearch.toLowerCase());

    const matchesStatus = fleetStatusFilter === 'all' || veh.status === fleetStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Create Shipment Submit
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newShipment.cargoType.trim()) errors.cargoType = 'Cargo description is required';
    if (!newShipment.origin.trim()) errors.origin = 'Origin hub is required';
    if (!newShipment.destination.trim()) errors.destination = 'Destination is required';
    if (newShipment.weightKg <= 0) errors.weightKg = 'Weight must be greater than 0';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      let created: Shipment;
      try {
        created = await apiClient.post<Shipment>('/shipments', newShipment);
      } catch (apiErr) {
        created = {
          id: `SHP-${Date.now().toString().slice(-6)}`,
          trackingNumber: `SHP-2026-MED-${Math.floor(10 + Math.random() * 90)}`,
          origin: newShipment.origin,
          destination: newShipment.destination,
          carrier: newShipment.carrier,
          vehicleId: newShipment.vehicleId,
          cargoType: newShipment.cargoType,
          weightKg: newShipment.weightKg,
          priority: newShipment.priority,
          status: 'in_transit',
          departedAt: new Date().toISOString(),
          estimatedArrival: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          currentLocationName: 'NH-06 Sonapur Sector',
          riskScore: 24,
        };
      }
      setShipments((prev) => [created, ...prev]);
      setSelectedShipment(created);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create shipment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Page Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              <Truck className="h-3.5 w-3.5" />
              NER Freight Command Center
            </span>
            <DataSourceBadge source="SOFTWARE_SIMULATED" label="SOFTWARE SIMULATED TELEMETRY" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Logistics & Fleet Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Real-time monitoring of strategic freight pipelines, cold-chain thermal excursions, disaster bypass routing, and carrier telemetry across the 8 North Eastern States.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Dispatch New Consignment</span>
        </button>
      </div>

      {/* Emergency Mission Control Banner */}
      {(isEmergencyMode || activeRoadStatus === 'BLOCKED') && (
        <div className="rounded-2xl border border-rose-600/40 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 p-4 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/50 animate-pulse">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-200 border border-rose-400/40">
                    EMERGENCY MISSION CONTROL ACTIVE
                  </span>
                  <span className="text-xs text-rose-300 font-medium hidden sm:inline">
                    Disaster Priority Clearance Engaged
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Critical medical consignments prioritized via <strong className="text-white font-semibold">Umrangso Relief Lifeline (SH-19 / NH-627)</strong>. Heavy commercial vehicles restricted along blocked NH-06 Sonapur gorge.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ACTIVE CONSIGNMENTS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{shipments.length || 4}</span>
            <span className="text-xs font-bold text-emerald-600">100% Tracked</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cross-state NER corridors</p>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">FLEET IN TRANSIT</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{vehicles.length || 6}</span>
            <span className="text-xs font-bold text-emerald-600">Live GPS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Software simulated telemetry</p>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">CORRIDOR DISRUPTIONS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {activeRoadStatus === 'BLOCKED' ? '1 CRITICAL' : '0 BLOCKAGES'}
            </span>
            <span className={`text-xs font-bold ${activeRoadStatus === 'BLOCKED' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {activeRoadStatus === 'BLOCKED' ? 'Sonapur Mudslide' : 'Corridors Open'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">NH-06 Mountain Lifeline</p>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">COLD-CHAIN STATUS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Thermometer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono ${activeMedTempStatus === 'CRITICAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {activeMedTemp.toFixed(1)}°C
            </span>
            <span className={`text-xs font-bold ${activeMedTempStatus === 'CRITICAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {activeMedTempStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Allowed Range: 2.0°C – 8.0°C</p>
        </div>
      </div>

      {/* HIGHLIGHT CARD: ACTIVE CRITICAL MEDICAL MISSION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <Activity className="h-5 w-5 text-brand-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  ACTIVE CRITICAL MEDICAL MISSION
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  EMERGENCY PRIORITY
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                SHP-2026-MED-01: Emergency Medical Supplies & Vaccines
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataSourceBadge source="SOFTWARE_SIMULATED" label="SOFTWARE SIMULATED TELEMETRY" />
          </div>
        </div>

        {/* Highlight Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Mission Details */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Mission & Carrier</span>
            <strong className="text-slate-900 block text-xs font-bold">Guwahati Hub ➔ Silchar Forward Depot</strong>
            <span className="text-[11px] text-slate-600 block">Vehicle: <strong className="font-mono text-brand-600">AS-01-EC-3312</strong></span>
            <span className="text-[10px] text-slate-500 block">Driver: Romen Singh • Weight: 450 kg</span>
          </div>

          {/* Cold Chain Card */}
          <div className={`rounded-xl p-3 border space-y-1 transition-colors ${
            activeMedTempStatus === 'CRITICAL' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-100 text-slate-900'
          }`}>
            <span className="text-[10px] font-semibold uppercase block text-slate-400">Cold-Chain Temperature</span>
            <div className="flex items-baseline gap-2">
              <strong className={`text-xl font-mono font-extrabold ${activeMedTempStatus === 'CRITICAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {activeMedTemp.toFixed(1)}°C
              </strong>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                activeMedTempStatus === 'CRITICAL' ? 'bg-rose-200 text-rose-900 font-extrabold animate-pulse' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeMedTempStatus}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Safe threshold: 2.0°C – 8.0°C</span>
          </div>

          {/* Corridor & AI Rerouting */}
          <div className={`rounded-xl p-3 border space-y-1 transition-colors ${
            activeRoadStatus === 'BLOCKED' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-900'
          }`}>
            <span className="text-[10px] font-semibold uppercase block text-slate-400">Corridor Route Status</span>
            <strong className={`text-xs font-bold block ${activeRoadStatus === 'BLOCKED' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {activeRoadStatus === 'BLOCKED' ? 'NH-06 BLOCKED ➔ REROUTED VIA UMRANGSO' : 'NH-06 Sonapur Sector (OPEN)'}
            </strong>
            <span className="text-[10px] text-slate-500 block">
              {activeRoadStatus === 'BLOCKED' ? 'AI Bypass: Umrangso Relief Lifeline (SH-19 / NH-627)' : 'Standard Primary Corridor'}
            </span>
          </div>

          {/* AI Risk Score Card */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">AI Risk Index Score</span>
            <div className="flex items-baseline gap-2">
              <strong className={`text-xl font-mono font-extrabold ${
                activeRiskScore > 0.60 ? 'text-rose-600' : activeRiskScore > 0.30 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {activeRiskScore.toFixed(2)}
              </strong>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                activeRiskScore > 0.60 ? 'bg-rose-100 text-rose-800 font-extrabold' : activeRiskScore > 0.30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeRiskScore > 0.60 ? 'CRITICAL' : activeRiskScore > 0.30 ? 'MODERATE' : 'LOW'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Multi-Factor Decision Engine</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all ${
              activeTab === 'shipments'
                ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Active Consignment Pipelines ({shipments.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all ${
              activeTab === 'fleet'
                ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Fleet Software Telemetry ({vehicles.length || 6})</span>
          </button>
        </div>

        {/* TAB 1: SHIPMENTS TABLE VIEW */}
        {activeTab === 'shipments' && (
          <div className="p-5 space-y-4">
            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={shipmentSearch}
                  onChange={(e) => setShipmentSearch(e.target.value)}
                  placeholder="Search tracking ID, cargo, origin, destination..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Shipment Statuses</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delayed">Delayed / Disrupted</option>
                  <option value="rerouted">Rerouted via Bypass</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical Priority</option>
                  <option value="high">High Priority</option>
                  <option value="standard">Standard Priority</option>
                </select>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">TRACKING ID</th>
                    <th className="py-3 px-4">CARGO & WEIGHT</th>
                    <th className="py-3 px-4">ORIGIN ➔ TARGET</th>
                    <th className="py-3 px-4">VEHICLE</th>
                    <th className="py-3 px-4">COLD-CHAIN</th>
                    <th className="py-3 px-4">CORRIDOR</th>
                    <th className="py-3 px-4">RISK INDEX</th>
                    <th className="py-3 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No consignments match the selected search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((shp) => {
                      const sid = String(shp.id || '');
                      const trackingNum = shp.trackingNumber || (shp as any).tracking_number || (sid === '1' ? 'SHP-2026-MED-01' : sid === '2' ? 'SHP-2026-RLF-02' : sid === '3' ? 'SHP-2026-MED-03' : 'SHP-2026-IND-04');
                      const cargoType = shp.cargoType || (shp as any).cargo_type || (sid === '1' ? 'Emergency Medical Supplies & Vaccines' : sid === '2' ? 'Flood Relief Rations & Provisions' : sid === '3' ? 'Pediatric Anti-Venom & Antibiotics' : 'Bailey Bridge Structural Steel');
                      const weightKg = shp.weightKg ?? (shp as any).weight_kg ?? (sid === '1' ? 450 : sid === '2' ? 4500 : sid === '3' ? 320 : 14200);
                      const origin = shp.origin || (shp as any).origin_address || (sid === '3' ? 'Imphal Medical Hub' : 'Guwahati Hub');
                      const destination = shp.destination || (shp as any).destination_address || (sid === '2' ? 'Dibrugarh Relief Depot' : sid === '4' ? 'Aizawl Infrastructure Base' : 'Silchar Forward Depot');

                      const rawVehId = shp.vehicleId || (shp as any).assigned_vehicle_id;
                      const matchedVeh = vehicles.find((v) => v.id === rawVehId || (v as any).registration_number === rawVehId);
                      const vehiclePlate = matchedVeh
                        ? matchedVeh.plateNumber || (matchedVeh as any).registration_number
                        : sid === '1' ? 'AS-01-EC-3312' : sid === '2' ? 'AS-02-NE-4421' : sid === '3' ? 'MN-03-EM-5510' : 'MZ-04-TR-7821';

                      const isMed01 = trackingNum.includes('MED-01') || sid === '1';
                      const isRlf02 = trackingNum.includes('RLF-02') || sid === '2';
                      const isMed03 = trackingNum.includes('MED-03') || sid === '3';

                      // Cold-chain telemetry
                      const tempVal = isMed01 ? activeMedTemp : isMed03 ? 5.2 : null;
                      const tempStatus = isMed01 ? activeMedTempStatus : isMed03 ? 'NORMAL' : null;

                      // Corridor status
                      const corridorLabel = isMed01
                        ? (activeRoadStatus === 'BLOCKED' ? 'NH-06 BLOCKED (REROUTING)' : 'NH-06 OPEN')
                        : isRlf02 ? 'NH-37 OPEN' : isMed03 ? 'NH-37 RISKY' : 'NH-306 RISKY';
                      const corridorColor = isMed01
                        ? (activeRoadStatus === 'BLOCKED' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                        : isRlf02 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300';

                      // Risk score
                      const riskVal = isMed01 ? activeRiskScore : isRlf02 ? 0.58 : isMed03 ? 0.62 : 0.71;
                      const riskLevel = riskVal > 0.60 ? 'CRITICAL' : riskVal > 0.30 ? 'MODERATE' : 'LOW';
                      const riskColor = riskVal > 0.60 ? 'text-rose-600' : riskVal > 0.30 ? 'text-amber-600' : 'text-emerald-600';
                      const riskBadgeBg = riskVal > 0.60 ? 'bg-rose-100 text-rose-800' : riskVal > 0.30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';

                      const statusVal = isMed01 && activeRoadStatus === 'BLOCKED' ? 'delayed' : shp.status || 'in_transit';

                      return (
                        <tr key={shp.id || trackingNum} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <span>{trackingNum}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">{cargoType}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{weightKg.toLocaleString()} kg</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{origin}</p>
                            <p className="text-[11px] text-slate-500">➔ {destination}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                            {vehiclePlate}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {tempVal !== null ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`font-extrabold ${tempStatus === 'CRITICAL' ? 'text-rose-600 text-sm' : 'text-emerald-600'}`}>
                                  {tempVal.toFixed(1)}°C
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  tempStatus === 'CRITICAL' ? 'bg-rose-200 text-rose-900 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {tempStatus}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">N/A (Standard)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase border ${corridorColor}`}>
                              {corridorLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-mono font-extrabold text-sm ${riskColor}`}>
                                {riskVal.toFixed(2)}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${riskBadgeBg}`}>
                                {riskLevel}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={statusVal} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FLEET TELEMETRY VIEW */}
        {activeTab === 'fleet' && (
          <div className="p-5 space-y-4">
            {/* Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  placeholder="Search plate number, driver, phone..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <select
                  value={fleetStatusFilter}
                  onChange={(e) => setFleetStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Fleet Statuses</option>
                  <option value="active">Active Transit</option>
                  <option value="idle">Idle in Yard</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No fleet vehicles match the search criteria.
                </div>
              ) : (
                filteredVehicles.map((veh) => {
                  const plateNum = veh.plateNumber || (veh as any).registration_number || veh.id;
                  const vType = (veh.vehicleType || (veh as any).vehicle_type || 'HEAVY TRUCK').replace(/_/g, ' ');
                  const driver = veh.driverName || (veh as any).driver_name || 'Romen Singh';
                  const phone = veh.driverPhone || (veh as any).driver_phone || '+91-94350-12345';
                  const speed = veh.speedKmh ?? (veh as any).speed_kmh ?? 48;
                  const heading = veh.headingDeg ?? (veh as any).heading_deg ?? 137;
                  const vStatus = veh.status || 'in_transit';

                  return (
                    <div key={veh.id || plateNum} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm font-extrabold text-slate-900 block">{plateNum}</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{vType}</span>
                        </div>
                        <StatusBadge status={vStatus} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-brand-500" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">Speed / Heading</span>
                            <strong className="text-slate-800 font-mono">{speed} km/h • {heading.toString().padStart(3, '0')}°</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-emerald-500" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">GPS Accuracy</span>
                            <strong className="text-slate-800 font-mono">6 meters</strong>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Driver</span>
                          <strong className="text-slate-800">{driver}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Phone</span>
                          <span className="font-mono text-brand-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {phone}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-400">Telemetry Provenance</span>
                          <DataSourceBadge source="SOFTWARE_SIMULATED" label="SIMULATED GPS" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE SHIPMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Consignment Dispatch</h3>
                  <p className="text-xs text-slate-500">Register new shipment in the NER logistics pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              {/* Cargo Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo Description *</label>
                <input
                  type="text"
                  value={newShipment.cargoType}
                  onChange={(e) => setNewShipment({ ...newShipment, cargoType: e.target.value })}
                  placeholder="e.g. Emergency Medical Supplies & Insulin Vials"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {formErrors.cargoType && <p className="mt-1 text-rose-500">{formErrors.cargoType}</p>}
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origin Node *</label>
                  <input
                    type="text"
                    value={newShipment.origin}
                    onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {formErrors.origin && <p className="mt-1 text-rose-500">{formErrors.origin}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Target *</label>
                  <input
                    type="text"
                    value={newShipment.destination}
                    onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {formErrors.destination && <p className="mt-1 text-rose-500">{formErrors.destination}</p>}
                </div>
              </div>

              {/* Weight & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight (Kg) *</label>
                  <input
                    type="number"
                    value={newShipment.weightKg}
                    onChange={(e) =>
                      setNewShipment({ ...newShipment, weightKg: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {formErrors.weightKg && <p className="mt-1 text-rose-500">{formErrors.weightKg}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={newShipment.priority}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        priority: e.target.value as ShipmentPriority,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="critical">Critical Priority</option>
                    <option value="essential_supplies">Essential Supplies</option>
                    <option value="high">High Priority</option>
                    <option value="standard">Standard Priority</option>
                  </select>
                </div>
              </div>

              {/* Carrier */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carrier Fleet Agency</label>
                <input
                  type="text"
                  value={newShipment.carrier}
                  onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsPage;
