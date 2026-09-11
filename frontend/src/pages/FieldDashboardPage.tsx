import React, { useState } from 'react';
import {
  HardHat,
  AlertTriangle,
  Send,
  WifiOff,
  CheckCircle2,
  MapPin,
  Camera,
  RefreshCw,
  Clock,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const FieldDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [highway, setHighway] = useState('NH-06');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTitle('');
      setDescription('');
      setTimeout(() => setSubmittedSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <HardHat className="h-8 w-8 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-black/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-200">
                Field Operations Command
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-100">
                <WifiOff className="h-3.5 w-3.5 text-emerald-300" /> Sync Active
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name || 'Field Officer'}</h1>
            <p className="text-sm text-amber-100/90">
              Assigned Zone: Guwahati - Shillong Lifeline Corridor (NH-06)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30">
            <RefreshCw className="h-4 w-4" />
            Sync Offline Queue (0)
          </button>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Active Field Incidents</span>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">4</p>
          <p className="mt-1 text-xs text-rose-600 font-semibold">2 Landslides reported nearby</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Assigned Road Corridor</span>
            <MapPin className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">NH-06</p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">98.5 KM Lifeline Active</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Offline Sync Status</span>
            <WifiOff className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">ONLINE</p>
          <p className="mt-1 text-xs text-slate-500">Auto-sync enabled on network reconnect</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Reports Submitted Today</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">7</p>
          <p className="mt-1 text-xs text-slate-500">Last report 45m ago</p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Quick Field Report Submission Form */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submit Ground Inspection Report</h2>
              <p className="text-xs text-slate-500">Directly feed live road condition updates to Control Room AI</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Live Dispatch
            </span>
          </div>

          {submittedSuccess && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Inspection report successfully transmitted to NEURoute Command Center!</span>
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Incident / Condition Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mudslide near Jorabat curve"
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highway / Route Code</label>
                <select
                  value={highway}
                  onChange={(e) => setHighway(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="NH-06">NH-06 (Guwahati - Shillong)</option>
                  <option value="NH-27">NH-27 (Nagaon Corridor)</option>
                  <option value="NH-29">NH-29 (Dimapur - Kohima)</option>
                  <option value="NH-102">NH-102 (Imphal - Moreh)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Rating</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="low">Low (Minor debris / slowdown)</option>
                  <option value="medium">Medium (Single lane restricted)</option>
                  <option value="high">High (Major blockage / risk)</option>
                  <option value="critical">Critical (Total Highway Closure)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Photo Evidence</label>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  <Camera className="h-4 w-4 text-slate-500" /> Attach Geotagged Photo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field Description & Clearance Estimate</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail current obstruction width, local machinery presence, and estimated clearance time..."
                required
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Transmitting Report...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Transmit Field Inspection Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Recent Field Feeds */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Field Advisories</h3>
            <Shield className="h-4 w-4 text-amber-600" />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Landslide Alert (Km 42)</span>
                <span className="text-[10px] text-rose-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 12m ago
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-700">
                Single lane traffic active near Nongpoh due to rockfall. Excavator dispatched.
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Monsoon Heavy Rain Watch</span>
                <span className="text-[10px] text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 1h ago
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-700">
                Flash flood warning issued for East Khasi Hills low-lying highway stretches.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Routine Check Completed</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 2h ago
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Umiam Bridge structural sensors reporting normal vibration thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDashboardPage;
