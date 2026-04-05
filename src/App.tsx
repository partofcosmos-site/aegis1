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
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'chat' && <Chatbot setActiveTab={setActiveTab} />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'journal' && <Journal />}
            {activeTab === 'goals' && <Goals />}
            {activeTab === 'pomodoro' && <Pomodoro />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'flashcards' && <Flashcards />}
          </Layout>
        </AuthWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
