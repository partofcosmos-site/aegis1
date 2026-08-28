import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  LogOut, 
  BrainCircuit, 
  LayoutDashboard, 
  MessageSquare, 
  BarChart2, 
  BookOpen, 
  Clock, 
  Target, 
  Settings, 
  Layers, 
  Menu, 
  X,
  Sparkles,
  Network
} from 'lucide-react';
import clsx from 'clsx';

export type ActiveTabType = 
  | 'dashboard' 
  | 'chat' 
  | 'analytics' 
  | 'solver'
  | 'graph'
  | 'flashcards' 
  | 'journal' 
  | 'goals' 
  | 'pomodoro' 
  | 'settings';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
  const { user, logout } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Heatmap', icon: BarChart2 },
    { id: 'solver', label: 'Socratic STEM Solver', icon: Sparkles },
    { id: 'graph', label: 'Concept Mastery Graph', icon: Network },
    { id: 'chat', label: 'Savantix Chat (AI Council)', icon: MessageSquare },
    { id: 'flashcards', label: 'Flashcards (SM-2)', icon: Layers },
    { id: 'journal', label: 'Journal & Reflections', icon: BookOpen },
    { id: 'goals', label: 'Goals & Milestones', icon: Target },
    { id: 'pomodoro', label: 'Pomodoro Focus Timer', icon: Clock },
    { id: 'settings', label: 'Universal AI Providers', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Savantix</h1>
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
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">Savantix</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Study Optimization</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTabType);
                setIsMobileMenuOpen(false);
              }}
              className={clsx(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-medium cursor-pointer",
                activeTab === tab.id 
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold" 
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-indigo-400" : "text-zinc-500")} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-800/50 rounded-xl border border-zinc-800/80">
            <div className="flex flex-col truncate pr-2">
              <span className="text-xs font-medium text-zinc-200 truncate">{user?.displayName || 'Scholar'}</span>
              <span className="text-[10px] text-zinc-500 truncate font-mono">{user?.email || 'Offline Guest'}</span>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-[calc(100vh-65px)] md:h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
};
