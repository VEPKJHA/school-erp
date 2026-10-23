import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 print:p-0 print:overflow-visible print:h-auto print:block">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
