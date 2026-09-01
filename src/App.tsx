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
import { StemSolver } from './components/StemSolver';
import { ConceptGraph } from './components/ConceptGraph';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorVault } from './components/ErrorVault';
import { DeepWorkFortress } from './components/DeepWorkFortress';
import { ContactFeedback } from './components/ContactFeedback';
import { AttendanceCalculator } from './components/AttendanceCalculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');
  const [isFortressMode, setIsFortressMode] = useState(false);

  useEffect(() => {
    // 1. In-app navigation custom event listener
    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('navigate', handleNavigate);

    // 2. Android PWA / Home Screen Widget Shortcut Deep Linking
    try {
      const params = new URLSearchParams(window.location.search);
      const targetTab = params.get('tab') as ActiveTabType;
      const validTabs = ['dashboard', 'analytics', 'attendance', 'solver', 'graph', 'chat', 'journal', 'goals', 'pomodoro', 'vault', 'settings', 'feedback'];
      if (targetTab && validTabs.includes(targetTab)) {
        setActiveTab(targetTab);
      }

      const action = params.get('action');
      if (action === 'microlog') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('savantix_open_microlog'));
        }, 350);
      } else if (action === 'aigateway') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('savantix_open_ai_gateway', { detail: { open: true } }));
        }, 350);
      }
    } catch {}

    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthWrapper>
          {isFortressMode && <DeepWorkFortress onClose={() => setIsFortressMode(false)} />}
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
            <div className={`h-full w-full ${activeTab === 'journal' ? 'block' : 'hidden'}`}>
              <Journal />
            </div>
            <div className={`h-full w-full ${activeTab === 'goals' ? 'block' : 'hidden'}`}>
              <Goals />
            </div>
            <div className={`h-full w-full ${activeTab === 'pomodoro' ? 'block' : 'hidden'}`}>
              <Pomodoro isFortressMode={isFortressMode} setIsFortressMode={setIsFortressMode} />
            </div>
            <div className={`h-full w-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
              <Settings />
            </div>
            <div className={`h-full w-full ${activeTab === 'vault' ? 'block' : 'hidden'}`}>
              <ErrorVault />
            </div>
            <div className={`h-full w-full ${activeTab === 'feedback' ? 'block' : 'hidden'}`}>
              <ContactFeedback />
            </div>
            <div className={`h-full w-full overflow-y-auto ${activeTab === 'attendance' ? 'block' : 'hidden'}`}>
              <AttendanceCalculator />
            </div>
          </Layout>
        </AuthWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
