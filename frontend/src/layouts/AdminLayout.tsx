import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { FeeAssistantDrawer } from '../components/ai/FeeAssistantDrawer';
import { Sparkles } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white relative">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto print:block">
        <div className="print:hidden">
          <Header onOpenAiAssistant={() => setIsAiDrawerOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 print:p-0 print:overflow-visible print:h-auto print:block">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 print:hidden cursor-pointer"
        title="Open AI Fee Assistant"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-xs font-bold tracking-wide">AI Fee Assistant</span>
      </button>

      {/* Slide-out AI Fee Assistant Drawer */}
      <FeeAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
};
