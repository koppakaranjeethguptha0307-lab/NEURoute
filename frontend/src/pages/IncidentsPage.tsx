import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Navigation,
  X,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Incident, IncidentSeverity, IncidentType, IncidentStatus } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

const NER_STATES = [
  'All States',
  'Assam',
  'Meghalaya',
  'Arunachal Pradesh',
  'Nagaland',
  'Manipur',
  'Mizoram',
  'Tripura',
  'Sikkim',
];

const INCIDENT_TYPES: { label: string; value: string }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Landslide / Rockfall', value: 'landslide' },
  { label: 'Flash Flood Overflow', value: 'flood' },
  { label: 'Bridge Structural Damage', value: 'bridge_damage' },
  { label: 'Monsoon Erosion', value: 'monsoon_erosion' },
  { label: 'Roadblock / Vehicle Stall', value: 'roadblock' },
];

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // New Incident Form Data
  const [newIncident, setNewIncident] = useState({
    title: '',
    type: 'landslide' as IncidentType,
    severity: 'critical' as IncidentSeverity,
    state: 'Assam',
    highway: 'NH-27',
    locationName: '',
    lat: 25.6321,
    lng: 94.1124,
    description: '',
  });

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Incident[]>('/incidents');
      const list = Array.isArray(data) ? data : [];
      setIncidents(list);
      if (list.length > 0 && !selectedIncident) {
        setSelectedIncident(list[0]);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedIncident]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Filter logic
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.highway.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState =
      selectedState === 'All States' || item.state.toLowerCase() === selectedState.toLowerCase();

    const matchesType = selectedType === 'all' || item.type === selectedType;

    const matchesSeverity = selectedSeverity === 'all' || item.severity === selectedSeverity;

    return matchesSearch && matchesState && matchesType && matchesSeverity;
  });

  // Handle new incident modal submit
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newIncident.title.trim()) errors.title = 'Incident title is required';
    if (!newIncident.locationName.trim()) errors.locationName = 'Specific location / sector is required';
    if (!newIncident.highway.trim()) errors.highway = 'National Highway number is required';
    if (!newIncident.description.trim()) errors.description = 'Operational description is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const created = await apiClient.post<Incident>('/incidents', newIncident);
      setIncidents((prev) => [created, ...prev]);
      setSelectedIncident(created);
      setIsModalOpen(false);
      // Reset form
      setNewIncident({
        title: '',
        type: 'landslide',
        severity: 'critical',
        state: 'Assam',
        highway: 'NH-27',
        locationName: '',
        lat: 25.6321,
        lng: 94.1124,
        description: '',
      });
    } catch (err) {
      console.error('Failed to report incident:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lifecycle status update
  const handleUpdateStatus = (status: IncidentStatus) => {
    if (!selectedIncident) return;
    const updated = { ...selectedIncident, status };
    setSelectedIncident(updated);
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Active Hazard Intelligence & Clearance
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Incident & Blockage Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log real-time road obstructions, review automated AI clearance predictions, and coordinate detours.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Report New Hazard</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search highway, title, sector..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* State Filter */}
        <div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {NER_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (Blockage)</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium</option>
            <option value="low">Low (Passing Permitted)</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout: Incidents List & AI Classification Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Incidents (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : filteredIncidents.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Incidents Match Filters"
              description="No active road hazards found matching the selected state, severity, or search query."
              actionText="Reset Filters"
              onAction={() => {
                setSearchTerm('');
                setSelectedState('All States');
                setSelectedType('all');
                setSelectedSeverity('all');
              }}
            />
          ) : (
            filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-white shadow-md ring-2 ring-brand-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {incident.id}
                        </span>
                        <StatusBadge status={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {incident.title}
                      </h4>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {incident.highway} • {incident.state}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(incident.reportedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {incident.description}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: AI Hazard Classification & Detour Card (5 cols) */}
        <div className="lg:col-span-5">
          {selectedIncident ? (
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {selectedIncident.id}
                  </span>
                  <StatusBadge status={selectedIncident.severity} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedIncident.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  {selectedIncident.locationName} ({selectedIncident.highway})
                </p>
              </div>

              {/* Status Update Lifecycle */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Operational Hazard Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'clearing', 'resolved'] as IncidentStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`rounded-lg py-2 px-1 text-xs font-semibold capitalize border transition-all ${
                        selectedIncident.status === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Classification Feature Card */}
              {selectedIncident.aiClassification ? (
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 p-5 text-white shadow-lg border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-300 border border-brand-500/30">
                      <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                      <span>AI Hazard Assessment</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Confidence: {(selectedIncident.aiClassification.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Predicted Clearance
                      </span>
                      <strong className="text-lg font-mono text-amber-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-4 w-4" />
                        {selectedIncident.aiClassification.predictedClearanceHours}h
                      </strong>
                      <span className="text-[10px] text-slate-400">Based on terrain models</span>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Hazard Category
                      </span>
                      <strong className="text-sm font-semibold capitalize text-white mt-1 block">
                        {selectedIncident.type?.replace('_', ' ')}
                      </strong>
                      <span className="text-[10px] text-slate-400">Rainfall triggered</span>
                    </div>
                  </div>

                  {selectedIncident.aiClassification.suggestedDetourName && (
                    <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Recommended Alternate Corridor</span>
                      </div>
                      <p className="text-xs text-slate-200">
                        {selectedIncident.aiClassification.suggestedDetourName}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 border border-slate-200">
                  AI Classification queued for telemetry review.
                </div>
              )}

              {/* Description & Impact summary */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Field Observer Log
                </span>
                <p className="text-xs text-slate-600 leading-relaxed rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  {selectedIncident.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
              Select an incident from the list to inspect AI classification and clearance predictions.
            </div>
          )}
        </div>
      </div>

      {/* Incident Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Report Road Hazard / Incident</h3>
                  <p className="text-xs text-slate-500">Log blockages for AI routing & fleet alerts</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
              {/* Incident Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Incident Title *</label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="e.g. Major Landslide near Maram Spur"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {formErrors.title && <p className="mt-1 text-rose-500">{formErrors.title}</p>}
              </div>

              {/* Type & Severity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hazard Type</label>
                  <select
                    value={newIncident.type}
                    onChange={(e) =>
                      setNewIncident({ ...newIncident, type: e.target.value as IncidentType })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="landslide">Landslide</option>
                    <option value="flood">Flash Flood</option>
                    <option value="bridge_damage">Bridge Structural Damage</option>
                    <option value="monsoon_erosion">Monsoon Erosion</option>
                    <option value="roadblock">Roadblock / Vehicle Stall</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) =>
                      setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="critical">Critical (Total Blockage)</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low (Passable)</option>
                  </select>
                </div>
              </div>

              {/* State & Highway */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NER State</label>
                  <select
                    value={newIncident.state}
                    onChange={(e) => setNewIncident({ ...newIncident, state: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {NER_STATES.filter((s) => s !== 'All States').map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">National Highway *</label>
                  <input
                    type="text"
                    value={newIncident.highway}
                    onChange={(e) => setNewIncident({ ...newIncident, highway: e.target.value })}
                    placeholder="e.g. NH-29, NH-27"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {formErrors.highway && <p className="mt-1 text-rose-500">{formErrors.highway}</p>}
                </div>
              </div>

              {/* Location Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specific Sector / Landmark *</label>
                <input
                  type="text"
                  value={newIncident.locationName}
                  onChange={(e) => setNewIncident({ ...newIncident, locationName: e.target.value })}
                  placeholder="e.g. Near Phesama Village 12km milestone"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {formErrors.locationName && <p className="mt-1 text-rose-500">{formErrors.locationName}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Field Notes *</label>
                <textarea
                  rows={3}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Provide road condition details, estimated debris volume, weather conditions..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {formErrors.description && <p className="mt-1 text-rose-500">{formErrors.description}</p>}
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
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Logging Incident...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Hazard Report</span>
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

export default IncidentsPage;
