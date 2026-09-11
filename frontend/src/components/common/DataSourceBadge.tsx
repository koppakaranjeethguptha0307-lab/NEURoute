import React from 'react';

export type DataSourceType = 'LIVE_API' | 'LIVE' | 'SIMULATED' | 'SIMULATED_TELEMETRY' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'DATABASE';

interface DataSourceBadgeProps {
  source: DataSourceType | string;
  label?: string;
  lastUpdated?: string;
  className?: string;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  label,
  lastUpdated,
  className = '',
}) => {
  const norm = (source || '').toUpperCase();

  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let displayText = source;

  if (norm.includes('LIVE')) {
    badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-sm shadow-emerald-950/50';
    dotColor = 'bg-emerald-400 animate-pulse';
    displayText = 'LIVE API';
  } else if (norm.includes('SIMULAT')) {
    badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-sm shadow-amber-950/50';
    dotColor = 'bg-amber-400';
    displayText = 'SIMULATED';
  } else if (norm.includes('NOT_CONFIGURED')) {
    badgeColor = 'bg-slate-900 text-slate-400 border-slate-800';
    dotColor = 'bg-slate-500';
    displayText = 'NOT CONFIGURED';
  } else if (norm.includes('UNAVAIL')) {
    badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    dotColor = 'bg-rose-400';
    displayText = 'UNAVAILABLE';
  } else if (norm.includes('DATABASE')) {
    badgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
    dotColor = 'bg-cyan-400';
    displayText = 'DB VERIFIED';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border backdrop-blur-sm ${badgeColor} ${className}`}
      title={lastUpdated ? `Source: ${displayText} • Last synced: ${lastUpdated}` : `Data source: ${displayText}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
      <span>{label ? `${label}: ` : ''}{displayText}</span>
      {lastUpdated && (
        <span className="text-[9px] opacity-70 font-normal border-l border-white/10 pl-1.5 ml-0.5">
          {lastUpdated}
        </span>
      )}
    </span>
  );
};
