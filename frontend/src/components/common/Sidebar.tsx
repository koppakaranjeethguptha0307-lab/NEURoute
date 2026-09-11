import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Navigation2,
  Truck,
  Bell,
  BarChart3,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles?: string[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Field Console', path: '/field-dashboard', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'FIELD_OFFICER'] },
  { title: 'Driver Console', path: '/driver-dashboard', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'DRIVER'] },
  { title: 'User Management', path: '/user-management', icon: ShieldCheck, allowedRoles: ['ADMIN'] },
  { title: 'GIS Map', path: '/gis-map', icon: MapPin },
  { title: 'Incidents', path: '/incidents', icon: AlertTriangle, badge: '3', allowedRoles: ['ADMIN', 'FIELD_OFFICER', 'LOGISTICS_PLANNER'] },
  { title: 'Route Intelligence', path: '/routes', icon: Navigation2, allowedRoles: ['ADMIN', 'LOGISTICS_PLANNER', 'DRIVER'] },
  { title: 'Logistics', path: '/logistics', icon: Truck, allowedRoles: ['ADMIN', 'LOGISTICS_PLANNER', 'DRIVER'] },
  { title: 'Alerts', path: '/alerts', icon: Bell, badge: '5' },
  { title: 'Analytics', path: '/analytics', icon: BarChart3, allowedRoles: ['ADMIN', 'LOGISTICS_PLANNER'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Main Navigation"
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 text-white shadow-lg shadow-blue-500/20">
                <Navigation2 className="h-5 w-5 transform rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-white">NEURoute</span>
                  <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-400">
                    NER
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Logistics AI
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 px-3 py-4" aria-label="Sidebar Links">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Operations & Planning
            </div>
            {navItems
              .filter((item) => !item.allowedRoles || (user?.role && item.allowedRoles.includes(user.role)))
              .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }: { isActive: boolean }) =>
                    cn(
                      'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      aria-label={`${item.badge} notifications`}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        item.title === 'Incidents'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Session area */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {user?.name || 'Officer'}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user?.hubLocation || 'NER Operations'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out of system"
              title="Sign Out"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
