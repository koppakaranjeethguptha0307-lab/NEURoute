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
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Shipment, Vehicle, ShipmentPriority } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export const LogisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shipments' | 'fleet'>('shipments');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
    origin: 'Guwahati Logistics Hub (Assam)',
    destination: 'Imphal Civil Supply Depot (Manipur)',
    carrier: 'NER Express Freight',
    vehicleId: 'VEH-AS-01-4421',
    cargoType: '',
    weightKg: 3500,
    priority: 'standard' as ShipmentPriority,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shipmentsRes, vehiclesRes] = await Promise.all([
        apiClient.get<Shipment[]>('/shipments'),
        apiClient.get<Vehicle[]>('/vehicles'),
      ]);
      const sList = Array.isArray(shipmentsRes) ? shipmentsRes : [];
      const vList = Array.isArray(vehiclesRes) ? vehiclesRes : [];
      setShipments(sList);
      setVehicles(vList);
      if (sList.length > 0 && !selectedShipment) {
        setSelectedShipment(sList[0]);
      }
    } catch (err) {
      console.error('Failed to load logistics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedShipment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter Shipments
  const filteredShipments = shipments.filter((shp) => {
    const matchesSearch =
      shp.trackingNumber.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shp.origin.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shp.destination.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shp.cargoType.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shp.carrier.toLowerCase().includes(shipmentSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shp.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || shp.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter Fleet
  const filteredVehicles = vehicles.filter((veh) => {
    const matchesSearch =
      veh.plateNumber.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      veh.driverName.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      veh.driverPhone.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      veh.vehicleType.toLowerCase().includes(fleetSearch.toLowerCase());

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
      const created = await apiClient.post<Shipment>('/shipments', newShipment);
      setShipments((prev) => [created, ...prev]);
      setSelectedShipment(created);
      setIsModalOpen(false);
      setNewShipment({
        origin: 'Guwahati Logistics Hub (Assam)',
        destination: 'Imphal Civil Supply Depot (Manipur)',
        carrier: 'NER Express Freight',
        vehicleId: 'VEH-AS-01-4421',
        cargoType: '',
        weightKg: 3500,
        priority: 'standard',
      });
    } catch (err) {
      console.error('Failed to create shipment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 mb-1">
            <Truck className="h-3.5 w-3.5" />
            North East Freight Operations
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Logistics & Fleet Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor consignment pipelines, track carrier dispatch assignments, and view telemetry metrics.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Shipment</span>
        </button>
      </div>

      {/* Primary Navigation Tabs */}
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
            <span>Active Shipments ({shipments.length})</span>
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
            <span>Fleet Telemetry ({vehicles.length})</span>
          </button>
        </div>

        {/* TAB 1: SHIPMENTS VIEW */}
        {activeTab === 'shipments' && (
          <div className="p-6 space-y-5">
            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={shipmentSearch}
                  onChange={(e) => setShipmentSearch(e.target.value)}
                  placeholder="Search tracking ID, cargo, origin, destination..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Shipment Statuses</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delayed">Delayed</option>
                  <option value="rerouted">Rerouted</option>
                  <option value="delivered">Delivered</option>
                  <option value="pending">Pending Dispatch</option>
                </select>
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="essential_supplies">Essential Supplies</option>
                  <option value="high">High Priority</option>
                  <option value="standard">Standard Freight</option>
                </select>
              </div>
            </div>

            {/* Shipments Table */}
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No Shipments Found"
                description="No active shipments match the selected filter criteria."
                actionText="Reset Search"
                onAction={() => {
                  setShipmentSearch('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tracking Number</th>
                      <th className="py-3 px-4">Cargo & Weight</th>
                      <th className="py-3 px-4">Origin ➔ Destination</th>
                      <th className="py-3 px-4">Carrier & Vehicle</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Risk Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredShipments.map((shp) => (
                      <tr
                        key={shp.id}
                        onClick={() => setSelectedShipment(shp)}
                        className={`cursor-pointer transition-colors ${
                          selectedShipment?.id === shp.id
                            ? 'bg-brand-50/70 hover:bg-brand-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">
                            {shp.trackingNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{shp.id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-800 line-clamp-1">{shp.cargoType}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {shp.weightKg.toLocaleString()} kg
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-800 line-clamp-1">{shp.origin}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">→ {shp.destination}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">{shp.carrier}</span>
                          <span className="font-mono text-[10px] text-brand-600">
                            {shp.vehicleId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={shp.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono font-bold ${
                              shp.riskScore > 60
                                ? 'text-rose-600'
                                : shp.riskScore > 30
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {shp.riskScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FLEET TRACKING VIEW */}
        {activeTab === 'fleet' && (
          <div className="p-6 space-y-5">
            {/* Fleet Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  placeholder="Search plate number, driver, phone..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <select
                  value={fleetStatusFilter}
                  onChange={(e) => setFleetStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Fleet Statuses</option>
                  <option value="active">Active Transit</option>
                  <option value="delayed">Delayed</option>
                  <option value="idle">Idle in Yard</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Fleet Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-44 w-full rounded-2xl" />
              </div>
            ) : filteredVehicles.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No Vehicles Found"
                description="No fleet vehicles match the search query."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVehicles.map((veh) => (
                  <div
                    key={veh.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-extrabold text-slate-900 block">
                          {veh.plateNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {veh.vehicleType?.replace('_', ' ')}
                        </span>
                      </div>
                      <StatusBadge status={veh.status} />
                    </div>

                    {/* Telemetry Speeds & Fuel */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-brand-500" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">Live Speed</span>
                          <strong className="text-slate-800 font-mono">{veh.speedKmh} km/h</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-amber-500" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">Fuel Tank</span>
                          <strong className="text-slate-800 font-mono">{veh.fuelLevelPct}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Driver & Assignment Info */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Driver</span>
                        <strong className="text-slate-800">{veh.driverName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone</span>
                        <span className="font-mono text-brand-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {veh.driverPhone}
                        </span>
                      </div>
                      {veh.assignedShipmentId && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-400">Shipment</span>
                          <span className="font-mono font-bold text-slate-900">
                            {veh.assignedShipmentId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  placeholder="e.g. Life-Saving Vaccines & Insulin Vials"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {formErrors.origin && <p className="mt-1 text-rose-500">{formErrors.origin}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Target *</label>
                  <input
                    type="text"
                    value={newShipment.destination}
                    onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="essential_supplies">Essential Supplies</option>
                    <option value="high">High Priority</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* Carrier */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carrier Agency</label>
                <input
                  type="text"
                  value={newShipment.carrier}
                  onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-500 disabled:opacity-50"
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
