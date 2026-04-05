import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LogOut, BrainCircuit, LayoutDashboard, MessageSquare, BarChart2, BookOpen, Clock, Target, Settings, Layers, Menu, X } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'chat' | 'analytics' | 'journal' | 'goals' | 'pomodoro' | 'settings' | 'flashcards';
  setActiveTab: (tab: 'dashboard' | 'chat' | 'analytics' | 'journal' | 'goals' | 'pomodoro' | 'settings' | 'flashcards') => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
  const { user, logout } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'chat', label: 'Aegis Chat', icon: MessageSquare },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'pomodoro', label: 'Timer', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Aegis</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-zinc-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Aegis</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                activeTab === tab.id ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 rounded-lg">
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-zinc-200 truncate">{user?.displayName || 'Student'}</span>
              <span className="text-xs text-zinc-500 truncate">{user?.email}</span>
            </div>
            <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-md hover:bg-zinc-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
};
