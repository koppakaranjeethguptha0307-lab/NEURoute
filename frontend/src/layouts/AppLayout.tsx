import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { AlertBanner } from '@/components/common/AlertBanner';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar - responsive overlay on mobile, fixed on desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AlertBanner />
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          role="main"
          className="flex-1 p-3 sm:p-5 md:p-6 max-w-[1600px] w-full mx-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
