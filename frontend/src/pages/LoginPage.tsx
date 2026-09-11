import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Navigation2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  Mail,
  Map,
  Truck,
  HardHat,
  Shield,
  CheckCircle,
  Building,
  User as UserIcon,
  Phone,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

type RoleCardInfo = {
  id: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
};

const ROLES: RoleCardInfo[] = [
  {
    id: 'ADMIN',
    title: 'ADMIN',
    subtitle: 'Government / Control Room',
    description: 'Manage users, incidents, routes, alerts and system operations.',
    icon: Shield,
  },
  {
    id: 'FIELD_OFFICER',
    title: 'FIELD OFFICER',
    subtitle: 'Field Operations',
    description: 'Submit field reports, road conditions, hazards and incident evidence.',
    icon: HardHat,
  },
  {
    id: 'DRIVER',
    title: 'DRIVER',
    subtitle: 'Transport Operator',
    description: 'View assigned missions, routes, alerts and route changes.',
    icon: Truck,
  },
  {
    id: 'LOGISTICS_PLANNER',
    title: 'LOGISTICS PLANNER',
    subtitle: 'AI Route Intelligence',
    description: 'Plan shipments, compare routes, view risks and optimize logistics.',
    icon: Map,
  },
];

const getRoleDestination = (role?: string) => {
  switch (role) {
    case 'FIELD_OFFICER':
      return '/field-dashboard';
    case 'DRIVER':
      return '/driver-dashboard';
    case 'LOGISTICS_PLANNER':
      return '/logistics';
    case 'ADMIN':
    default:
      return '/dashboard';
  }
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request Access Modal state
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [reqFullName, setReqFullName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqOrg, setReqOrg] = useState('');
  const [reqRole, setReqRole] = useState<'FIELD_OFFICER' | 'DRIVER' | 'LOGISTICS_PLANNER'>('FIELD_OFFICER');
  const [reqPhone, setReqPhone] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  // Auto demo fill based on selected role
  useEffect(() => {
    switch (selectedRole) {
      case 'ADMIN':
        setEmail('admin@neuroute.in');
        break;
      case 'FIELD_OFFICER':
        setEmail('field@neuroute.in');
        break;
      case 'DRIVER':
        setEmail('driver@neuroute.in');
        break;
      case 'LOGISTICS_PLANNER':
        setEmail('planner@neuroute.in');
        break;
    }
    setPassword('password123'); // Demo password
  }, [selectedRole]);

  // If redirected from a protected route, capture return destination
  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = fromLocation || getRoleDestination(user.role);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, fromLocation]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const loggedUser = await login({
        email: email.trim(),
        password,
        role: selectedRole,
        rememberMe,
      });
      const destination = fromLocation || getRoleDestination(loggedUser.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName || !reqEmail || !reqOrg) return;

    setReqSubmitting(true);
    setReqError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${baseUrl}/auth/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: reqFullName,
          email: reqEmail,
          organization: reqOrg,
          requested_role: reqRole,
          phone_number: reqPhone,
          reason: reqReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit access request');
      }

      setReqSuccess(true);
    } catch (err: any) {
      setReqError(err.message || 'Error submitting access request');
    } finally {
      setReqSubmitting(false);
    }
  };

  return (
    <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
      {/* Left side: Role Selection and Information */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-slate-800 bg-slate-950/50 p-10 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
              <Navigation2 className="h-5 w-5 transform rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">NEURoute</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">Logistics AI</p>
            </div>
          </div>

          <h2 className="mt-8 text-3xl font-light leading-tight text-white">
            North Eastern Region<br />
            <span className="font-semibold text-brand-400">
              Smart Logistics &<br />
              Route Intelligence
            </span>
          </h2>

          <p className="mt-4 text-sm text-slate-400 max-w-md leading-relaxed">
            A secure command platform for managing infrastructure, optimizing transport routes, and tracking critical
            logistics across the NER territory.
          </p>
        </div>

        <div className="mt-12">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Select Operational Role
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`group flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                    selectedRole === role.id
                      ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/5'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 mb-3 ${
                      selectedRole === role.id ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold tracking-wider ${
                      selectedRole === role.id ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {role.title}
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-slate-400">{role.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2">
        <div className="lg:hidden mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
            <Navigation2 className="h-6 w-6 transform rotate-45" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-white">NEURoute LOGISTICS AI</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Sign in to Command Center</h2>
          <p className="mt-2 text-sm text-slate-400">{ROLES.find((r) => r.id === selectedRole)?.description}</p>
        </div>

        {errors.general && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Mobile Role Selection */}
          <div className="lg:hidden">
            <label className="block text-xs font-semibold text-slate-300 mb-2">Operational Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} - {role.subtitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Operational Email</label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@neuroute.in"
                className={`w-full rounded-lg border bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.email
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full rounded-lg border bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.password
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-1 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Remember session</span>
            </label>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              Secured
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as {ROLES.find((r) => r.id === selectedRole)?.title}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-400">
            Don't have an operational account?{' '}
            <button
              type="button"
              onClick={() => {
                setShowRequestAccess(true);
                setReqSuccess(false);
                setReqError(null);
              }}
              className="font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-2"
            >
              Request Access
            </button>
          </p>
        </div>

        {/* Real Backend Request Access Modal */}
        {showRequestAccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-white relative">
              <button
                onClick={() => setShowRequestAccess(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold mb-2">Request Platform Access</h3>
              <p className="text-xs text-slate-400 mb-6">
                Operational role applications are stored in database and reviewed by system administrators.
              </p>

              {reqSuccess ? (
                <div className="space-y-4 text-center py-6">
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
                  <h4 className="text-lg font-bold text-emerald-400">Access request submitted successfully.</h4>
                  <p className="text-xs text-slate-300">
                    Your application status is currently <span className="font-bold text-amber-400">PENDING</span>.
                    An administrator will review your credentials shortly.
                  </p>
                  <button
                    onClick={() => setShowRequestAccess(false)}
                    className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-500"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestAccessSubmit} className="space-y-4">
                  {reqError && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{reqError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={reqFullName}
                      onChange={(e) => setReqFullName(e.target.value)}
                      required
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      required
                      placeholder="officer@agency.ner.gov.in"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Organization / Department</label>
                    <input
                      type="text"
                      value={reqOrg}
                      onChange={(e) => setReqOrg(e.target.value)}
                      required
                      placeholder="e.g. Assam Disaster Mgmt Authority"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Requested Operational Role</label>
                    <select
                      value={reqRole}
                      onChange={(e) => setReqRole(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                    >
                      <option value="FIELD_OFFICER">FIELD OFFICER</option>
                      <option value="DRIVER">DRIVER</option>
                      <option value="LOGISTICS_PLANNER">LOGISTICS PLANNER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={reqPhone}
                      onChange={(e) => setReqPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Department Justification</label>
                    <textarea
                      rows={2}
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      placeholder="Briefly state why access is required for your operations..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRequestAccess(false)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reqSubmitting}
                      className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                    >
                      {reqSubmitting ? 'Submitting...' : 'Submit Access Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
