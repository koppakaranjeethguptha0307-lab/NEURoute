import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
        <Compass className="h-8 w-8 animate-spin-slow" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-brand-600">404 Error</span>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Route Not Found</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        The requested logistics intelligence route or resource does not exist in the system coordinates.
      </p>
      <div className="mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
