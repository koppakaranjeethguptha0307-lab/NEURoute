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
  Copy,
  Check,
  Sparkles,
  UserPlus,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getApiBaseUrl } from '@/utils/apiConfig';

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

type DemoCredential = {
  role: UserRole;
  title: string;
  email: string;
  password: string;
};

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'ADMIN',
    title: 'ADMIN',
    email: 'admin@neuroute.in',
    password: 'password123',
  },
  {
    role: 'FIELD_OFFICER',
    title: 'FIELD OFFICER',
    email: 'field@neuroute.in',
    password: 'password123',
  },
  {
    role: 'DRIVER',
    title: 'DRIVER',
    email: 'driver@neuroute.in',
    password: 'password123',
  },
  {
    role: 'LOGISTICS_PLANNER',
    title: 'LOGISTICS PLANNER',
    email: 'planner@neuroute.in',
    password: 'password123',
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

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('FIELD_OFFICER');
  const [regAdminSecretKey, setRegAdminSecretKey] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Copy helper state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQuickFill = (demo: DemoCredential) => {
    setSelectedRole(demo.role);
    setEmail(demo.email);
    setPassword(demo.password);
  };

  const handleDirectAdminLogin = async () => {
    setAuthMode('login');
    setSelectedRole('ADMIN');
    const adminEmail = 'admin@neuroute.in';
    const adminPass = 'password123';
    setEmail(adminEmail);
    setPassword(adminPass);
    setIsSubmitting(true);
    setErrors({});

    try {
      const loggedUser = await login({
        email: adminEmail,
        password: adminPass,
        role: 'ADMIN',
        rememberMe: true,
      });
      const destination = fromLocation || getRoleDestination(loggedUser.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto demo fill based on selected role when in login mode
  useEffect(() => {
    if (authMode === 'login' && !regSuccessMsg) {
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
      setPassword('password123');
    }
  }, [selectedRole, authMode, regSuccessMsg]);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regFullName.trim()) {
      setRegError('Full Name is required');
      return;
    }
    if (!regEmail.trim() || !emailRegex.test(regEmail.trim())) {
      setRegError('Valid official email address is required');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }
    if (regRole === 'ADMIN' && !regAdminSecretKey.trim()) {
      setRegError('Administrator Secret Key is required for ADMIN account creation');
      return;
    }

    setRegSubmitting(true);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          confirm_password: regConfirmPassword,
          organization: regOrg.trim() || undefined,
          phone_number: regPhone.trim() || undefined,
          role: regRole,
          admin_secret_key: regRole === 'ADMIN' ? regAdminSecretKey.trim() : undefined,
        }),
      });

      if (!response.ok) {
        let errMessage = 'Registration failed';
        try {
          const data = await response.json();
          errMessage = data.detail || errMessage;
        } catch {
          // Fallback message
        }
        throw new Error(errMessage);
      }

      // Successful registration
      setRegSuccessMsg('Account created successfully! You can now sign in with your email and password.');
      // Auto-fill login credentials
      setEmail(regEmail.trim());
      setPassword(regPassword);
      setSelectedRole(regRole);
      // Switch view back to Sign In
      setAuthMode('login');
    } catch (err: any) {
      setRegError(err.message || 'Error creating account');
    } finally {
      setRegSubmitting(false);
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
              const isSelected = authMode === 'login' ? selectedRole === role.id : regRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    if (authMode === 'login') {
                      setSelectedRole(role.id);
                    } else {
                      setRegRole(role.id);
                    }
                  }}
                  className={`group flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/5'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 mb-3 ${
                      isSelected ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold tracking-wider ${
                      isSelected ? 'text-white' : 'text-slate-300'
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

      {/* Right side: Login / Registration Container */}
      <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2">
        <div className="lg:hidden mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
            <Navigation2 className="h-6 w-6 transform rotate-45" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-white">NEURoute LOGISTICS AI</h1>
        </div>

        {/* Auth Mode Toggle Header */}
        <div className="mb-6 flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrors({});
            }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
              authMode === 'login'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setRegError(null);
            }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
              authMode === 'register'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create New Account
          </button>
        </div>

        {regSuccessMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{regSuccessMsg}</span>
          </div>
        )}

        {authMode === 'login' ? (
          /* ================= SIGN IN FORM ================= */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Sign in to Command Center</h2>
              <p className="mt-1 text-xs text-slate-400">{ROLES.find((r) => r.id === selectedRole)?.description}</p>
            </div>

            {errors.general && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-300">Remember session</span>
                </label>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Secured
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as {ROLES.find((r) => r.id === selectedRole)?.title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectAdminLogin}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-3.5 text-xs font-bold text-amber-300 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
                  title="Direct 1-Click Access to Admin Command Portal"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Admin Direct Login</span>
                </button>
              </div>
            </form>

            {/* Demo Credentials Section */}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Demo Credentials
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Pre-configured Accounts</span>
              </div>

              <div className="space-y-2">
                {DEMO_CREDENTIALS.map((demo) => (
                  <div
                    key={demo.role}
                    className={`rounded-lg border p-2 transition-colors ${
                      selectedRole === demo.role
                        ? 'border-brand-500/50 bg-brand-500/10'
                        : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-brand-300 tracking-wider">
                        {demo.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickFill(demo)}
                        className="text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                      >
                        Quick Fill
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between bg-slate-900/90 rounded px-2 py-1 border border-slate-800/60">
                        <span className="text-slate-400 select-all overflow-hidden text-ellipsis mr-1">
                          Email: <strong className="text-slate-200">{demo.email}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(demo.email, `${demo.role}-email`)}
                          className="text-slate-400 hover:text-brand-400 shrink-0 ml-1"
                          title="Copy Email"
                        >
                          {copiedKey === `${demo.role}-email` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/90 rounded px-2 py-1 border border-slate-800/60">
                        <span className="text-slate-400 select-all mr-1">
                          Password: <strong className="text-slate-200">{demo.password}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(demo.password, `${demo.role}-pass`)}
                          className="text-slate-400 hover:text-brand-400 shrink-0 ml-1"
                          title="Copy Password"
                        >
                          {copiedKey === `${demo.role}-pass` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 text-center border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400">
                Need a new operational account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setRegError(null);
                  }}
                  className="font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-2"
                >
                  Create New Account
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* ================= CREATE NEW ACCOUNT FORM ================= */
          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">Create Operational Account</h2>
              <p className="mt-1 text-xs text-slate-400">
                Register a new account in PostgreSQL for NEURoute Logistics platform.
              </p>
            </div>

            {regError && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="officer@agency.ner.gov.in"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Organization / Agency</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      placeholder="e.g. Assam PWD / SDRF"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Operational Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="FIELD_OFFICER">FIELD OFFICER — Ground Operations & Evidence</option>
                  <option value="DRIVER">DRIVER — Transport Operator & Mission Tracking</option>
                  <option value="LOGISTICS_PLANNER">LOGISTICS PLANNER — AI Route & Shipment Intelligence</option>
                  <option value="ADMIN">ADMIN — Government / Control Room (Authorization Key Required)</option>
                </select>
              </div>

              {regRole === 'ADMIN' && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    Administrator Secret Authorization Key
                  </label>
                  <input
                    type="password"
                    value={regAdminSecretKey}
                    onChange={(e) => setRegAdminSecretKey(e.target.value)}
                    required
                    placeholder="Enter system admin secret key..."
                    className="w-full rounded-lg border border-amber-500/40 bg-slate-950 p-2 text-xs text-amber-100 placeholder:text-amber-500/50 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-amber-400/80">
                    Public ADMIN self-registration requires Administrator Key (`neuroute-admin-secret-2026`).
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={regSubmitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
              >
                {regSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account in Database...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400">
                Already have an operational account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrors({});
                  }}
                  className="font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-2"
                >
                  Sign In to Command Center
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
