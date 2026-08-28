import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/Chatbot';
import { Analytics } from './components/Analytics';
import { Journal } from './components/Journal';
import { Goals } from './components/Goals';
import { Pomodoro } from './components/Pomodoro';
import { Settings } from './components/Settings';
import { Flashcards } from './components/Flashcards';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'analytics' | 'journal' | 'goals' | 'pomodoro' | 'settings' | 'flashcards'>('dashboard');

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthWrapper>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {/* Persistent Tab Viewport: Preserves background streams & timers across tab switches */}
            <div className={`h-full w-full ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
              <Dashboard />
            </div>
            <div className={`h-full w-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
              <Chatbot setActiveTab={setActiveTab} />
            </div>
            <div className={`h-full w-full ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
              <Analytics />
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
            <div className={`h-full w-full ${activeTab === 'flashcards' ? 'block' : 'hidden'}`}>
              <Flashcards />
            </div>
          </Layout>
        </AuthWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
