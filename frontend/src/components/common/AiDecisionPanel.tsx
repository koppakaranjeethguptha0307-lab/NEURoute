import React from 'react';
import { Cpu, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ArrowRight, Zap, Scale } from 'lucide-react';

export const AiDecisionPanel: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
            <Cpu className="h-4 w-4 text-brand-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
              WHY DID NEUROUTE MAKE THIS DECISION?
            </h3>
            <p className="text-[11px] text-slate-500">Explainable Multi-Factor AI Risk & Corridor Selection Engine</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
          <ShieldCheck className="h-3 w-3" />
          EXPLAINABLE AI ACTIVE
        </span>
      </div>

      {/* Pipeline Input -> Output Diagram */}
      <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-medium font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div className="bg-white p-1.5 rounded border shadow-2xs">INPUT<br/><span className="text-slate-400 font-sans text-[9px]">Sensors & GIS</span></div>
        <div className="flex items-center justify-center text-slate-400">→</div>
        <div className="bg-white p-1.5 rounded border shadow-2xs text-brand-700 font-bold">RISK & DELAY<br/><span className="text-brand-500 font-sans text-[9px]">Predictor Engine</span></div>
        <div className="flex items-center justify-center text-slate-400">→</div>
        <div className="bg-white p-1.5 rounded border shadow-2xs text-emerald-700 font-bold">RECOMMEND<br/><span className="text-emerald-500 font-sans text-[9px]">Route Optimizer</span></div>
      </div>

      {/* Multi-Factor Risk Contributors */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-between">
          <span>Multi-Factor Risk Breakdown (Sonapur Corridor)</span>
          <span className="font-mono text-rose-600 font-bold">COMPOSITE RISK: 0.97 (CRITICAL)</span>
        </span>

        <div className="space-y-1.5 text-xs font-medium text-slate-700">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Torrential Rainfall (95 mm/h)</span>
              <span className="font-mono text-slate-900 font-bold">+0.24</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '24%' }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Landslide Hazard Proximity</span>
              <span className="font-mono text-slate-900 font-bold">+0.26</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '26%' }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Sonapur Road Blockage & Debris</span>
              <span className="font-mono text-slate-900 font-bold">+0.31</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '31%' }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Historical Monsoon Vulnerability</span>
              <span className="font-mono text-slate-900 font-bold">+0.10</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Cold-Chain Thermal Excursion Risk</span>
              <span className="font-mono text-slate-900 font-bold">+0.06</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-rose-600 rounded-full" style={{ width: '6%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Route Comparison */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Candidate Route Decision Comparison Matrix
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Route A - REJECTED */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <XCircle className="h-4 w-4 text-rose-500" />
                Route A: NH-06 Primary
              </span>
              <span className="text-[9px] font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                REJECTED
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
              <div>Distance: 330.0 km</div>
              <div>Est Delay: <strong className="text-rose-700 font-bold">+70.9 hours</strong></div>
              <div>Disaster Risk: <strong className="text-rose-700">0.95 (CRITICAL)</strong></div>
              <div>Cold-Chain Suitability: <strong className="text-rose-700">POOR</strong></div>
            </div>
          </div>

          {/* Route B - SELECTED */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Route B: Umrangso Bypass
              </span>
              <span className="text-[9px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                SELECTED
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
              <div>Distance: 375.0 km</div>
              <div>Est Delay: <strong className="text-emerald-700 font-bold">7.3 hours (-69.6h)</strong></div>
              <div>Disaster Risk: <strong className="text-emerald-700">0.22 (LOW)</strong></div>
              <div>Cold-Chain Suitability: <strong className="text-emerald-700">EXCELLENT</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Summary */}
      <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-brand-400 font-bold flex items-center gap-1">
          <Zap className="h-3 w-3 text-brand-400" />
          AI Operational Decision Rationale
        </div>
        <p className="text-xs text-slate-300">
          "Route B (Umrangso Relief Lifeline) was selected because Route A (NH-06) is completely severed by a landslide at Sonapur Tunnel and presents high disaster risk and severe cold-chain degradation."
        </p>
      </div>
    </div>
  );
};
