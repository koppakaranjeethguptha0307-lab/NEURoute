import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessRestrictedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-400">
          You do not have the required operational clearance to access this module. Please contact your Command Center administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessRestrictedPage;
