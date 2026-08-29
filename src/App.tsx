import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout, ActiveTabType } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/Chatbot';
import { Analytics } from './components/Analytics';
import { Journal } from './components/Journal';
import { Goals } from './components/Goals';
import { Pomodoro } from './components/Pomodoro';
import { Settings } from './components/Settings';
import { Flashcards } from './components/Flashcards';
import { StemSolver } from './components/StemSolver';
import { ConceptGraph } from './components/ConceptGraph';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorVault } from './components/ErrorVault';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthWrapper>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {/* Persistent Tab Viewport: Preserves background streams, solvers & timers across tab switches */}
            <div className={`h-full w-full ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
              <Dashboard />
            </div>
            <div className={`h-full w-full ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
              <Analytics />
            </div>
            <div className={`h-full w-full ${activeTab === 'solver' ? 'block' : 'hidden'}`}>
              <StemSolver />
            </div>
            <div className={`h-full w-full ${activeTab === 'graph' ? 'block' : 'hidden'}`}>
              <ConceptGraph />
            </div>
            <div className={`h-full w-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
              <Chatbot setActiveTab={setActiveTab} />
            </div>
            <div className={`h-full w-full ${activeTab === 'flashcards' ? 'block' : 'hidden'}`}>
              <Flashcards />
            </div>
            <div className={`h-full w-full ${activeTab === 'journal' ? 'block' : 'hidden'}`}>
              <Journal />
            </div>
            <div className={`h-full w-full ${activeTab === 'goals' ? 'block' : 'hidden'}`}>
              <Goals />
            </div>
            <div className={`h-full w-full ${activeTab === 'pomodoro' ? 'block' : 'hidden'}`}>
              <Pomodoro />
            </div>
            <div className={`h-full w-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
              <Settings />
            </div>
            <div className={`h-full w-full ${activeTab === 'vault' ? 'block' : 'hidden'}`}>
              <ErrorVault />
            </div>
          </Layout>
        </AuthWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
