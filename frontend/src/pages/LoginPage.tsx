import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation2, ArrowRight, ShieldCheck, AlertCircle, Loader2, KeyRound, Mail, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('dispatcher@neuroute.ner');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If redirected from a protected route, capture return destination
  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const destination = fromLocation || '/dashboard';

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      await login({
        email: email.trim(),
        password,
        rememberMe,
      });
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMockProfile = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
    setErrors({});
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-400 text-white shadow-xl shadow-brand-500/25">
          <Navigation2 className="h-7 w-7 transform rotate-45" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">NEURoute</h1>
        <p className="mt-1 text-xs text-slate-400">
          North Eastern Region Smart Logistics & Route Intelligence
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">Sign In to Command Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your credentials or choose a quick demo role profile below.
          </p>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Operational Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@neuroute.ner"
                className={`w-full rounded-lg border bg-slate-950/70 pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <span className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer">
                Forgot access key?
              </span>
            </div>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full rounded-lg border bg-slate-950/70 pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                  errors.password
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-slate-400">Remember session</span>
            </label>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              256-Bit SSL Secured
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating Hub Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Quick Presets */}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Demo Mode Quick Switch
            </span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              Mock Fixtures
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectMockProfile('dispatcher@neuroute.ner')}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                email === 'dispatcher@neuroute.ner'
                  ? 'border-brand-500/50 bg-brand-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <UserCheck className="h-4 w-4 text-brand-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold">Dispatcher</p>
                <p className="truncate text-[10px] text-slate-500">Guwahati Hub</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMockProfile('admin@neuroute.ner')}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                email === 'admin@neuroute.ner'
                  ? 'border-brand-500/50 bg-brand-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold">Admin</p>
                <p className="truncate text-[10px] text-slate-500">Shillong HQ</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
