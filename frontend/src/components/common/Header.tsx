import React from 'react';
import { Bell, Search, User as UserIcon, LogOut, Menu, ShieldAlert } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmergencyMode } from '@/contexts/EmergencyContext';
import { OfflineSyncIndicator } from '@/components/common/OfflineSyncIndicator';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/dashboard': 'Dashboard Overview',
  '/gis-map': 'GIS Spatial & Terrain Map',
  '/incidents': 'Incident & Blockage Management',
  '/routes': 'Route Intelligence & Optimization',
  '/logistics': 'Logistics & Fleet Management',
  '/alerts': 'Real-Time Operational Alerts',
  '/analytics': 'Performance & District Analytics',
};

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isEmergencyMode, toggleEmergencyMode } = useEmergencyMode();
  const currentTitle = pageTitles[location.pathname] || 'NEURoute Platform';
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md"
    >
      {/* Left: Mobile Menu Trigger, Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              North-East Region Hub
            </span>
            <span
              className="hidden md:inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded cursor-help"
              title="NEURoute complements national infrastructure-planning platforms by adding operational, disruption-aware logistics intelligence for the North Eastern Region."
            >
              Complements PM Gati Shakti
            </span>
          </div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-none">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right: Search, Demo Mode Pill, Alerts & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Offline Queue Sync Indicator */}
        <OfflineSyncIndicator />

        {/* Emergency Mode Protocol Toggle */}
        <button
          onClick={toggleEmergencyMode}
          title={isEmergencyMode ? 'Deactivate Emergency Logistics Protocol' : 'Activate Emergency Logistics Protocol'}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            isEmergencyMode
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse border border-rose-500'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
        >
          <ShieldAlert className={`h-3.5 w-3.5 ${isEmergencyMode ? 'text-white' : 'text-rose-600'}`} />
          <span>{isEmergencyMode ? 'EMERGENCY MODE' : 'Emergency Mode'}</span>
        </button>

        {/* Demo Mode Badge / Quick Page Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 tracking-wider hidden lg:inline">
            Demo Pages:
          </span>
          <Link
            to="/dashboard"
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              location.pathname === '/dashboard'
                ? 'bg-brand-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Admin Command Dashboard"
          >
            <span>🛡️</span>
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <Link
            to="/field-dashboard"
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              location.pathname === '/field-dashboard'
                ? 'bg-brand-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Field Officer Operations Console"
          >
            <span>👷</span>
            <span className="hidden sm:inline">Field</span>
          </Link>
          <Link
            to="/driver-dashboard"
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              location.pathname === '/driver-dashboard'
                ? 'bg-brand-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Driver Transport Operator Console"
          >
            <span>🚛</span>
            <span className="hidden sm:inline">Driver</span>
          </Link>
          <Link
            to="/logistics"
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              location.pathname === '/logistics'
                ? 'bg-brand-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Logistics & AI Route Intelligence"
          >
            <span>🗺️</span>
            <span className="hidden sm:inline">Logistics</span>
          </Link>
        </div>

        {/* Global Search stub */}
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            aria-label="Search route, shipment, or vehicle"
            placeholder="Search route, shipment, vehicle..."
            className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Alerts shortcut */}
        <Link
          to="/alerts"
          aria-label="View Operational Alerts"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </Link>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2.5 sm:pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs border border-brand-200 overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || 'Dispatcher'}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">
              {user?.role || 'Operations'} • {user?.hubLocation?.split(' ')[0] || 'NER'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Sign Out"
            title="Sign Out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors ml-0.5"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
