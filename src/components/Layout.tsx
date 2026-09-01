import React, { useState, useEffect } from 'react';
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
  Network,
  Crown,
  Zap,
  Lock,
  MessageSquareHeart,
  GraduationCap
} from 'lucide-react';
import clsx from 'clsx';
import { MicroLoggerModal } from './MicroLoggerModal';
import { AIGatewayButton } from './AIGateway';

export type ActiveTabType = 
  | 'dashboard' 
  | 'chat' 
  | 'analytics' 
  | 'attendance'
  | 'solver'
  | 'graph'
  | 'journal' 
  | 'goals' 
  | 'pomodoro' 
  | 'settings'
  | 'vault'
  | 'feedback';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
  const { user, logout } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMicroLoggerOpen, setIsMicroLoggerOpen] = useState(false);
  const isFounder = ['debanjan8686@gmail.com', 'partofcosmmos@gmail.com'].includes(user?.email || '');

  // Global hotkeys for Micro-Logger HUD (Alt+L or Ctrl+K / Cmd+K) and AI Gateway (Alt+G)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check Alt+L
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsMicroLoggerOpen(prev => !prev);
      }
      // Check Ctrl+K or Cmd+K
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsMicroLoggerOpen(prev => !prev);
      }
      // Check Alt+G — open AI Gateway drawer
      else if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('savantix_open_ai_gateway', { detail: { open: true } }));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Heatmap', icon: BarChart2 },
    { id: 'attendance', label: 'Attendance Tracker', icon: GraduationCap },
    { id: 'solver', label: 'Socratic STEM Solver', icon: Sparkles },
    { id: 'graph', label: 'Concept Mastery Graph', icon: Network },
    { id: 'chat', label: 'Savantix Chat (AI Council)', icon: MessageSquare },
    { id: 'journal', label: 'Journal & Reflections', icon: BookOpen },
    { id: 'goals', label: 'Goals & Milestones', icon: Target },
    { id: 'pomodoro', label: 'Pomodoro Focus Timer', icon: Clock },
    { id: 'vault', label: '🔒 Error Vault', icon: Lock },
    { id: 'settings', label: 'Universal AI Providers', icon: Settings },
    { id: 'feedback', label: 'Contact & Feedback', icon: MessageSquareHeart },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col md:flex-row font-sans relative">
      {/* Global Floating Micro-Logger HUD Modal */}
      <MicroLoggerModal 
        isOpen={isMicroLoggerOpen} 
        onClose={() => setIsMicroLoggerOpen(false)} 
      />

      {/* Global Floating AI Gateway Button (Alt+G) */}
      <AIGatewayButton />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">Savantix</h1>
            <p className="text-[9px] text-indigo-400 font-semibold tracking-wider uppercase">
              An initiative of Part of Cosmos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Micro-Log HUD Trigger on Mobile */}
          <button
            onClick={() => setIsMicroLoggerOpen(true)}
            className="p-2 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
            title="Open Micro-Logger (Alt+L)"
          >
            <Zap className="w-5 h-5 text-amber-400" />
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-zinc-800/80">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">Savantix</h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              An initiative of Part of Cosmos
            </p>
          </div>
        </div>

        {/* Global Quick Micro-Logger Button */}
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={() => setIsMicroLoggerOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-900/40 to-indigo-800/20 hover:from-indigo-900/60 hover:to-indigo-800/40 text-indigo-200 border border-indigo-500/30 shadow-sm transition-all cursor-pointer group"
            title="Sub-Second Micro-Logger HUD (Alt+L or Ctrl+K)"
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Micro-Logger HUD</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
              Alt+L
            </span>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTabType);
                setIsMobileMenuOpen(false);
              }}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-medium cursor-pointer border border-transparent",
                activeTab === tab.id 
                  ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/30 shadow-inner font-semibold" 
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-indigo-400" : "text-zinc-500")} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
            <div className="flex flex-col truncate pr-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 truncate">
                {user?.displayName && !user.displayName.toLowerCase().includes('debanjan') ? user.displayName : 'Lead Scholar'}
                {isFounder && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
              </span>
              {isFounder && <span className="text-[9px] text-amber-400 font-bold uppercase mt-0.5">Core Researcher</span>}
            </div>
            <button 
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto min-h-0 h-[calc(100vh-60px)] md:h-screen scroll-smooth">
        {children}
      </main>
    </div>
  );
};
