import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Compass,
  AlertTriangle,
  Mountain,
  TrendingDown,
  ArrowRight,
  Zap,
  MapPin,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { RouteOption } from '@/types';
import { Skeleton } from '@/components/common/LoadingSkeleton';

const NER_ORIGIN_HUBS = [
  'Guwahati Logistics Hub (Assam)',
  'Silchar Distribution Center (Assam)',
  'Jorhat Freight Terminal (Assam)',
  'Shillong Agro Hub (Meghalaya)',
  'Dimapur Transshipment Point (Nagaland)',
  'Tezpur Supply Depot (Assam)',
];

const NER_DESTINATIONS = [
  'Imphal Civil Supply Depot (Manipur)',
  'Aizawl North Food Depot (Mizoram)',
  'Itanagar Cold Storage (Arunachal Pradesh)',
  'Agartala Central Market (Tripura)',
  'Gangtok Himalayan Warehouse (Sikkim)',
  'Tawang Frontier Logistics Hub (Arunachal)',
  'Mokokchung Supply Center (Nagaland)',
];

export const RouteIntelligencePage: React.FC = () => {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Form Inputs
  const [origin, setOrigin] = useState<string>(NER_ORIGIN_HUBS[0]);
  const [destination, setDestination] = useState<string>(NER_DESTINATIONS[0]);
  const [cargoType, setCargoType] = useState<string>('Emergency Pharmaceuticals');
  const [vehicleType, setVehicleType] = useState<string>('heavy_truck');
  const [avoidActiveHazards, setAvoidActiveHazards] = useState<boolean>(true);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<RouteOption[]>('/routes');
      const list = Array.isArray(data) ? data : [];
      setRoutes(list);
      if (list.length > 0) {
        // Default to recommended route
        const recommended = list.find((r) => r.recommended) || list[0];
        setSelectedRoute(recommended);
      }
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handlePlanRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    try {
      const result = await apiClient.post<{ routes: RouteOption[] }>('/routes/plan', {
        origin,
        destination,
        cargoType,
        vehicleType,
        avoidActiveHazards,
      });

      const list = result?.routes || routes;
      setRoutes(list);
      const recommended = list.find((r) => r.recommended) || list[0];
      setSelectedRoute(recommended);
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-200 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            AI Terrain & Dynamic Monsoon Risk Optimization
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Route Intelligence & Resilient Corridor Planning
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate real-time elevation gradients, landslide choke points, bridge limits, and predicted transit delays.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Planning Form (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Compass className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Dispatch Routing Parameters</h3>
            </div>

            <form onSubmit={handlePlanRoute} className="space-y-4 text-xs">
              {/* Origin Hub */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Origin Node</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {NER_ORIGIN_HUBS.map((hub) => (
                    <option key={hub} value={hub}>
                      {hub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Hub */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Target</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {NER_DESTINATIONS.map((dest) => (
                    <option key={dest} value={dest}>
                      {dest}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cargo Classification */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo Priority & Type</label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Emergency Pharmaceuticals">Emergency Pharmaceuticals & Medical Supplies</option>
                  <option value="Food Provisions">Food Grains & Public Distribution Supply</option>
                  <option value="Solar & Tech Hardware">Solar Inverters & Communication Hardware</option>
                  <option value="Heavy Infrastructure Gear">Heavy Construction & Road Maintenance</option>
                </select>
              </div>

              {/* Vehicle Specs */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Classification</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="heavy_truck">Heavy Commercial Multi-Axle (12-Wheeler)</option>
                  <option value="medium_carrier">Medium Freight Carrier (6-Wheeler)</option>
                  <option value="all_terrain_4x4">All-Terrain 4x4 Mountain Carrier</option>
                  <option value="refrigerated_van">Temperature-Controlled Reefer Van</option>
                </select>
              </div>

              {/* Toggle: Avoid Landslides / Active Hazards */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-800 block">Auto-Reroute Around Hazards</span>
                    <span className="text-[11px] text-slate-500 block">Bypass active landslides & flood zones</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={avoidActiveHazards}
                    onChange={(e) => setAvoidActiveHazards(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isCalculating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 active:scale-98 transition-all disabled:opacity-60"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calculating Terrain Corridors...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Generate Optimized Corridors</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Elevation & Terrain Guideline Box */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs">
              <Mountain className="h-4 w-4" />
              <span>North East Terrain Advisory</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              High-altitude passes above 1,200m (e.g., Sela, Kohima Ridge) experience severe monsoon mudslides. Southern Barak corridors (NH-6 / NH-37) provide higher resilience during heavy rainfall alerts.
            </p>
          </div>
        </div>

        {/* Right Column: Corridors Comparison & Detailed Profile (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Corridors Comparison Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Calculated Corridors ({routes.length})
              </h3>
              <span className="text-xs text-slate-500">Click a corridor to view elevation & waypoints</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {routes.map((route) => {
                  const isSelected = selectedRoute?.id === route.id;
                  const isHighRisk = route.riskScore > 60;

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`cursor-pointer rounded-2xl border p-4.5 transition-all relative ${
                        isSelected
                          ? 'border-brand-500 bg-white shadow-md ring-2 ring-brand-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {route.recommended && (
                        <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          AI Recommended
                        </span>
                      )}

                      <div className="pr-20 mb-2">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{route.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{route.corridor}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 my-3 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Distance</span>
                          <strong className="text-xs text-slate-800 font-mono">{route.distanceKm} km</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Est. Time</span>
                          <strong className="text-xs text-slate-800 font-mono">{route.estimatedDurationHours}h</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delay Pred.</span>
                          <strong
                            className={`text-xs font-mono ${
                              route.predictedDelayMinutes > 60 ? 'text-rose-600 font-bold' : 'text-emerald-600'
                            }`}
                          >
                            +{route.predictedDelayMinutes}m
                          </strong>
                        </div>
                      </div>

                      {/* Risk Score Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Route Risk Score</span>
                          <span
                            className={`font-mono font-bold ${
                              isHighRisk ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {route.riskScore}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${route.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Corridor Profile & Waypoint Details */}
          {selectedRoute && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-400">{selectedRoute.id}</span>
                    {selectedRoute.recommended && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Recommended Corridor
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{selectedRoute.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRoute.corridor}</p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Transit Time</span>
                  <span className="text-xl font-extrabold font-mono text-slate-900">
                    {(selectedRoute.estimatedDurationHours + selectedRoute.predictedDelayMinutes / 60).toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {/* Elevation & Gradient Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                    <Mountain className="h-4 w-4 text-brand-600" />
                    <span>Peak Elevation</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {selectedRoute.elevationProfile?.maxElevationMeters} m
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">High altitude pass sector</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                    <span>Gradient Slope Risk</span>
                  </div>
                  <span className="text-sm font-bold capitalize text-slate-800">
                    {selectedRoute.elevationProfile?.gradientRisk} Risk
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hairpin & descent index</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <span>Active Hazard Zones</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {selectedRoute.activeIncidentsCount} Blockages
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Along corridor path</p>
                </div>
              </div>

              {/* Waypoints Sequence List */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  <span>Corridor Waypoint Coordinates</span>
                </h5>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedRoute.waypoints.map((wp, idx) => (
                    <React.Fragment key={idx}>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-800 block">Node #{idx + 1}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                        </span>
                      </div>
                      {idx < selectedRoute.waypoints.length - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteIntelligencePage;
