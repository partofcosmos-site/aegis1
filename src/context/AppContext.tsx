import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db, loginWithGoogle, logout as firebaseLogout, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  ElasticStreakState,
  loadElasticStreakState,
  saveElasticStreakState,
  evaluateElasticStreak,
  recomputeStreakFromHistory,
  DEFAULT_STREAK_STATE
} from '../utils/streakResilienceEngine';
import { seedDebanjanHistoryIfEmpty } from '../utils/debanjanHistoryData';
import { CloudSyncService, SyncResult } from '../services/cloudSyncService';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  schoolHours?: number;
  targetExams?: string[];
  createdAt: any;
}

interface AppContextType {
  user: any | null;
  profile: UserProfile | null;
  logs: any[];
  insights: any[];
  goals: any[];
  journalEntries: any[];
  chatSessions: any[];
  elasticStreak: ElasticStreakState;
  loading: boolean;
  isGuest: boolean;
  syncStatus: { isSyncing: boolean; lastSyncedAt: string; message?: string };
  forceSyncNow: () => Promise<SyncResult>;
  login: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addLog: (log: any) => Promise<any>;
  updateLog: (id: string, data: any) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  addInsight: (insight: any) => Promise<any>;
  addGoal: (goal: any) => Promise<any>;
  updateGoal: (id: string, data: any) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addJournalEntry: (entry: any) => Promise<any>;
  updateJournalEntry: (id: string, data: any) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  updateElasticStreak: (data: Partial<ElasticStreakState>) => void;
  recomputeElasticStreak: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GUEST_STORAGE_PREFIX = 'savantix_guest_';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [elasticStreak, setElasticStreak] = useState<ElasticStreakState>(() => loadElasticStreakState());
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ isSyncing: boolean; lastSyncedAt: string; message?: string }>(() => ({
    isSyncing: false,
    lastSyncedAt: (typeof window !== 'undefined' && localStorage.getItem('savantix_last_cloud_sync_time')) || 'Never'
  }));

  // Smart state updaters: deeply verify content equality before updating React state to prevent re-render thrashing
  const setLogsSmart = useCallback((newLogs: any[]) => {
    if (!Array.isArray(newLogs)) return;
    setLogs(prev => {
      if (prev.length === newLogs.length && prev.length > 0) {
        if (prev[0]?.id === newLogs[0]?.id && prev[prev.length - 1]?.id === newLogs[newLogs.length - 1]?.id) {
          return prev;
        }
      }
      return newLogs;
    });
  }, []);

  const setGoalsSmart = useCallback((newGoals: any[]) => {
    if (!Array.isArray(newGoals)) return;
    setGoals(prev => (prev.length === newGoals.length && prev[0]?.id === newGoals[0]?.id ? prev : newGoals));
  }, []);

  const setJournalSmart = useCallback((newJournal: any[]) => {
    if (!Array.isArray(newJournal)) return;
    setJournalEntries(prev => (prev.length === newJournal.length && prev[0]?.id === newJournal[0]?.id ? prev : newJournal));
  }, []);

  const setInsightsSmart = useCallback((newInsights: any[]) => {
    if (!Array.isArray(newInsights)) return;
    setInsights(prev => (prev.length === newInsights.length && prev[0]?.date === newInsights[0]?.date ? prev : newInsights));
  }, []);

  // Synchronize and evaluate elastic streak health & resilience tokens
  useEffect(() => {
    if (loading) return;
    try {
      setElasticStreak(prev => {
        const evaluated = evaluateElasticStreak(prev, logs, prev.targetMinutesDaily);
        saveElasticStreakState(evaluated);
        return evaluated;
      });
    } catch (err) {
      console.warn('Failed to evaluate elastic streak resilience state:', err);
    }
  }, [logs, loading]);

  const loadGuestData = () => {
    try {
      const gLogs = JSON.parse(localStorage.getItem(`${GUEST_STORAGE_PREFIX}logs`) || '[]');
      const gInsights = JSON.parse(localStorage.getItem(`${GUEST_STORAGE_PREFIX}insights`) || '[]');
      const gGoals = JSON.parse(localStorage.getItem(`${GUEST_STORAGE_PREFIX}goals`) || '[]');
      const gJournal = JSON.parse(localStorage.getItem(`${GUEST_STORAGE_PREFIX}journal`) || '[]');
      const gChat = JSON.parse(localStorage.getItem(`${GUEST_STORAGE_PREFIX}chat_sessions`) || '[]');
      setLogs(gLogs);
      setInsights(gInsights);
      setGoals(gGoals);
      setJournalEntries(gJournal);
      setChatSessions(gChat);
    } catch {
      setLogs([]);
      setInsights([]);
      setGoals([]);
      setJournalEntries([]);
      setChatSessions([]);
    }
  };

  const normalizeLogData = (logData: any, uid: string) => {
    const nowIso = new Date().toISOString();
    const dateStr = (logData.date ? String(logData.date) : nowIso.substring(0, 10)).substring(0, 10);
    const duration = typeof logData.durationMinutes === 'number'
      ? Math.max(0, logData.durationMinutes)
      : (parseInt(logData.durationMinutes, 10) || 60);
    const subject = String(logData.subject || 'Physics').substring(0, 99);
    const topic = String(logData.topic || 'General Practice').substring(0, 199);
    const subtopic = String(logData.subtopic || 'Session').substring(0, 199);
    const rawText = String(logData.rawText || `${subject}: ${topic} (${duration} min)`).substring(0, 1999);
    const problemsSolved = typeof logData.problemsSolved === 'number' ? Math.max(0, logData.problemsSolved) : 0;
    const mistakes = Array.isArray(logData.mistakes) ? logData.mistakes.slice(0, 50).map(String) : [];
    const efficiencyScore = typeof logData.efficiencyScore === 'number' ? Math.min(10, Math.max(0, logData.efficiencyScore)) : 8;
    const focusScore = typeof logData.focusScore === 'number' ? Math.min(10, Math.max(0, logData.focusScore)) : 8;

    return {
      uid,
      rawText,
      subject,
      topic,
      subtopic,
      durationMinutes: duration,
      problemsSolved,
      mistakes,
      efficiencyScore,
      focusScore,
      date: dateStr,
      notes: logData.notes || ''
    };
  };

  const parseFirestoreDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    try {
      if (typeof val.toDate === 'function') return val.toDate().toISOString();
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
      if (typeof val === 'string') return val;
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {}
    return new Date().toISOString();
  };

  const authenticateUser = async (authUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }) => {
    let cleanEmail = (authUser.email || '').trim().toLowerCase();
    
    // Guard against anonymous auth email nullification by preserving cached email
    if (!cleanEmail) {
      try {
        const savedSession = localStorage.getItem('savantix_user_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.email && parsed.email !== 'scholar@savantix.app' && parsed.email !== 'guest@savantix.app') {
            cleanEmail = parsed.email.trim().toLowerCase();
          }
        }
      } catch {}
    }

    const canonicalId = CloudSyncService.getCanonicalUid(cleanEmail);
    const namePart = cleanEmail ? cleanEmail.split('@')[0] : 'scholar';
    const fallbackName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._]/g, ' ');
    const displayName = authUser.displayName || fallbackName || 'Scholar';
    
    // Canonical user identity
    const sessionUser = {
      uid: authUser.uid || canonicalId,
      canonicalId,
      email: cleanEmail || 'scholar@savantix.app',
      displayName,
      photoURL: authUser.photoURL || ''
    };

    localStorage.setItem('savantix_user_session', JSON.stringify(sessionUser));
    localStorage.removeItem('savantix_is_guest');
    setIsGuest(false);
    setUser(sessionUser);

    // Ensure Firebase Auth session is active
    await CloudSyncService.ensureAuth();

    const isFounder = ['debanjan8686@gmail.com', 'partofcosmmos@gmail.com'].includes(cleanEmail);
    const initialTargetExams = isFounder 
      ? ['IPhO (Gold Track) / NSEP 2026–2027', 'INPhO / OCSC 2027', 'JEE Advanced 2028', 'ISI / CMI 2028', 'CBSE Class 12 Boards (March 2028)']
      : ['IPhO (Gold Track) / NSEP 2026–2027', 'JEE Advanced 2028', 'ISI / CMI 2028', 'CBSE Class 12 Boards (March 2028)'];

    try {
      const profileRef = doc(db, 'users', authUser.uid || canonicalId);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        const newProfile = {
          uid: authUser.uid || canonicalId,
          email: cleanEmail,
          displayName,
          schoolHours: 6,
          targetExams: initialTargetExams,
          createdAt: serverTimestamp(),
        };
        await setDoc(profileRef, newProfile);
        setProfile(newProfile as UserProfile);
      } else {
        setProfile(profileSnap.data() as UserProfile);
      }
    } catch (e) {
      console.warn("Firestore profile init fallback:", e);
      setProfile({
        uid: authUser.uid || canonicalId,
        email: cleanEmail,
        displayName,
        schoolHours: 6,
        targetExams: initialTargetExams,
        createdAt: Date.now()
      });
    }

    // 1. Load local cache immediately (Logs, Goals, Journal, Insights)
    const userUidKey = authUser.uid || canonicalId;
    const localLogsKey = `savantix_user_logs_${userUidKey}`;
    const localGoalsKey = `savantix_user_goals_${userUidKey}`;
    const localJournalKey = `savantix_user_journal_${userUidKey}`;
    const localInsightsKey = `savantix_user_insights_${userUidKey}`;

    if (cleanEmail === 'debanjan8686@gmail.com' || cleanEmail === 'partofcosmmos@gmail.com') {
      const seeded = seedDebanjanHistoryIfEmpty(userUidKey);
      if (seeded) {
        setLogs(seeded.mergedLogs);
        setGoals(seeded.mergedGoals);
        setJournalEntries(seeded.mergedJournal);
      }
    } else {
      const savedLogs = localStorage.getItem(localLogsKey);
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      const savedGoals = localStorage.getItem(localGoalsKey);
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      const savedJournal = localStorage.getItem(localJournalKey);
      if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
    }

    // Rehydrate cached insights state on auth bootstrap
    const savedInsights = localStorage.getItem(localInsightsKey) || localStorage.getItem(`savantix_user_insights_${canonicalId}`);
    if (savedInsights) {
      try { setInsights(JSON.parse(savedInsights)); } catch {}
    }

    // 2. Real-Time Cloud Sync: Pull remote snapshot & start bidirectional real-time subscription
    CloudSyncService.pullFromCloud(cleanEmail, userUidKey).then(res => {
      if (res.success) {
        if (res.mergedLogs) setLogsSmart(res.mergedLogs);
        if (res.mergedGoals) setGoalsSmart(res.mergedGoals);
        if (res.mergedJournal) setJournalSmart(res.mergedJournal);
        if (res.mergedInsights) setInsightsSmart(res.mergedInsights);
        setSyncStatus(prev => ({
          isSyncing: false,
          lastSyncedAt: res.timestamp,
          message: res.message
        }));
      }
    });

    CloudSyncService.subscribeToCloudSync(cleanEmail, userUidKey, (res) => {
      if (res.mergedLogs) setLogsSmart(res.mergedLogs);
      if (res.mergedGoals) setGoalsSmart(res.mergedGoals);
      if (res.mergedJournal) setJournalSmart(res.mergedJournal);
      if (res.mergedInsights) setInsightsSmart(res.mergedInsights);
      setSyncStatus(prev => ({
        isSyncing: false,
        lastSyncedAt: res.timestamp,
        message: res.message
      }));
    });
  };

  useEffect(() => {
    // 1. Check existing cached user session
    const savedSession = localStorage.getItem('savantix_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        setIsGuest(false);
        const savedProf = localStorage.getItem(`savantix_user_profile_${parsed.uid}`);
        if (savedProf) setProfile(JSON.parse(savedProf));
        
        const savedLogsKey = `savantix_user_logs_${parsed.uid}`;
        const savedGoalsKey = `savantix_user_goals_${parsed.uid}`;
        const savedJournalKey = `savantix_user_journal_${parsed.uid}`;
        const savedInsightsKey = `savantix_user_insights_${parsed.uid}`;

        if (parsed.email === 'debanjan8686@gmail.com' || parsed.email === 'partofcosmmos@gmail.com') {
          const seeded = seedDebanjanHistoryIfEmpty(parsed.uid);
          if (seeded) {
            setLogs(seeded.mergedLogs);
            setGoals(seeded.mergedGoals);
            setJournalEntries(seeded.mergedJournal);
          }
        } else {
          const savedLogs = localStorage.getItem(savedLogsKey);
          if (savedLogs) setLogs(JSON.parse(savedLogs));
          const savedGoals = localStorage.getItem(savedGoalsKey);
          if (savedGoals) setGoals(JSON.parse(savedGoals));
          const savedJournal = localStorage.getItem(savedJournalKey);
          if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
        }

        const savedInsights = localStorage.getItem(savedInsightsKey) || localStorage.getItem(`savantix_user_insights_${parsed.canonicalId || parsed.uid}`);
        if (savedInsights) {
          try { setInsights(JSON.parse(savedInsights)); } catch {}
        }

        // Mount live real-time subscription immediately on startup
        CloudSyncService.subscribeToCloudSync(parsed.email, parsed.uid, (res) => {
          if (res.mergedLogs) setLogs(res.mergedLogs);
          if (res.mergedGoals) setGoals(res.mergedGoals);
          if (res.mergedJournal) setJournalEntries(res.mergedJournal);
          if (res.mergedInsights) setInsights(res.mergedInsights);
          setSyncStatus({
            isSyncing: false,
            lastSyncedAt: res.timestamp,
            message: res.message
          });
        });

        // Trigger background cloud sync on app start and rehydrate state
        CloudSyncService.pullFromCloud(parsed.email, parsed.uid).then(res => {
          if (res.success) {
            if (res.mergedLogs) setLogs(res.mergedLogs);
            if (res.mergedGoals) setGoals(res.mergedGoals);
            if (res.mergedJournal) setJournalEntries(res.mergedJournal);
            if (res.mergedInsights) setInsights(res.mergedInsights);
            setSyncStatus({
              isSyncing: false,
              lastSyncedAt: res.timestamp,
              message: res.message
            });
          }
        });
      } catch {}
    } else if (localStorage.getItem('savantix_is_guest') === 'true') {
      const guestUser = { uid: 'guest_user', email: 'guest@savantix.app', displayName: 'Guest Scholar' };
      setUser(guestUser);
      setIsGuest(true);
      loadGuestData();
    }

    // 2. Always listen to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await authenticateUser(currentUser);
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  // Force Instant Manual Sync across all devices
  const forceSyncNow = useCallback(async (): Promise<SyncResult> => {
    if (!user || isGuest) {
      return {
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        logsCount: logs.length,
        goalsCount: goals.length,
        journalCount: journalEntries.length,
        insightsCount: insights.length,
        attendanceCount: 0,
        message: 'Please sign in to synchronize across devices.'
      };
    }
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await CloudSyncService.pullFromCloud(user.email, user.uid);
      if (res.mergedLogs) setLogsSmart(res.mergedLogs);
      if (res.mergedGoals) setGoalsSmart(res.mergedGoals);
      if (res.mergedJournal) setJournalSmart(res.mergedJournal);
      if (res.mergedInsights) setInsightsSmart(res.mergedInsights);

      setSyncStatus(prev => ({
        isSyncing: false,
        lastSyncedAt: res.timestamp,
        message: res.message
      }));
      return res;
    } catch (err: any) {
      const res: SyncResult = {
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        logsCount: logs.length,
        goalsCount: goals.length,
        journalCount: journalEntries.length,
        insightsCount: insights.length,
        attendanceCount: 0,
        message: err.message || 'Sync failed.'
      };
      setSyncStatus(prev => ({
        isSyncing: false,
        lastSyncedAt: res.timestamp,
        message: res.message
      }));
      return res;
    }
  }, [user, isGuest, logs.length, goals.length, journalEntries.length, insights.length, setLogsSmart, setGoalsSmart, setJournalSmart, setInsightsSmart]);

  // Event-Driven Sync & Gentle Background Heartbeat (60s + on focus + on tab visibility change + on network reconnect)
  useEffect(() => {
    if (!user || isGuest) return;

    let isSyncInProgress = false;
    const handleAutoSync = async () => {
      if (isSyncInProgress) return;
      isSyncInProgress = true;
      try {
        await forceSyncNow();
      } finally {
        isSyncInProgress = false;
      }
    };

    const intervalId = setInterval(handleAutoSync, 60000); // 60s background keep-alive

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleAutoSync();
      }
    };

    const handleFocus = () => {
      handleAutoSync();
    };

    const handleOnline = () => {
      handleAutoSync();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, isGuest, forceSyncNow]);

  const login = async () => {
    setLoading(true);
    try {
      const googleUser = await loginWithGoogle();
      if (!googleUser) {
        setLoading(false);
        return;
      }
      await authenticateUser(googleUser);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (emailInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
    const canonicalId = CloudSyncService.getCanonicalUid(cleanEmail);
    await CloudSyncService.ensureAuth(cleanEmail);
    await authenticateUser({ uid: canonicalId, email: cleanEmail });
  };

  const continueAsGuest = () => {
    const guestUser = { uid: 'guest_user', email: 'guest@savantix.app', displayName: 'Guest Scholar' };
    setUser(guestUser);
    setProfile({
      uid: 'guest_user',
      email: 'guest@savantix.app',
      displayName: 'Guest Scholar',
      schoolHours: 6,
      targetExams: ['IPhO (Gold Track) / NSEP 2026–2027', 'JEE Advanced 2028', 'ISI / CMI 2028', 'CBSE Class 12 Boards (March 2028)'],
      createdAt: Date.now()
    });
    setIsGuest(true);
    localStorage.setItem('savantix_is_guest', 'true');
    loadGuestData();
  };

  const handleLogout = async () => {
    localStorage.removeItem('savantix_user_session');
    localStorage.removeItem('savantix_is_guest');
    setIsGuest(false);
    setUser(null);
    setProfile(null);
    setLogs([]);
    setInsights([]);
    setGoals([]);
    setJournalEntries([]);
    setChatSessions([]);
    try {
      await firebaseLogout();
    } catch {}
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    // 1. Optimistic state & local storage update
    setProfile(prev => {
      const next = prev ? { ...prev, ...data } : { uid: user.uid, email: user.email, ...data } as any;
      localStorage.setItem(`savantix_user_profile_${user.uid}`, JSON.stringify(next));
      return next;
    });

    if (data.displayName) {
      setUser((prev: any) => {
        const next = prev ? { ...prev, displayName: data.displayName } : prev;
        localStorage.setItem('savantix_user_session', JSON.stringify(next));
        return next;
      });
    }

    // 2. Safe background Firestore update
    if (!isGuest) {
      try {
        const profileRef = doc(db, 'users', user.uid);
        await setDoc(profileRef, data, { merge: true });
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore profile background sync notice:", err);
      }
    }
  };

  // CRUD Helpers
  const addLog = async (logData: any) => {
    if (!user) return;
    const normalized = normalizeLogData(logData, user.uid);
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...normalized,
      createdAt: new Date().toISOString()
    };
    
    // 1. Optimistic state & persistent storage
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updatedLogs));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_logs_${canonicalId}`, JSON.stringify(updatedLogs));
    }
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(updatedLogs));

    // 2. Safe background Firestore update & Cloud Push
    if (!isGuest) {
      try {
        const logsRef = collection(db, 'users', user.uid, 'logs');
        await import('firebase/firestore').then(f => f.addDoc(logsRef, {
          ...normalized,
          createdAt: f.serverTimestamp()
        }));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore addLog background sync notice:", err);
      }
    }
    return newLog;
  };

  const updateLog = async (id: string, data: any) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updated = logs.map(l => l.id === id ? { ...l, ...data } : l);
    setLogs(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_logs_${canonicalId}`, JSON.stringify(updated));
    }
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(updated));

    if (!isGuest) {
      try {
        const logRef = doc(db, 'users', user.uid, 'logs', id);
        await import('firebase/firestore').then(f => f.updateDoc(logRef, data));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore updateLog background sync notice:", err);
      }
    }
  };

  const deleteLog = async (id: string) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_logs_${canonicalId}`, JSON.stringify(updated));
    }
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(updated));

    if (!isGuest) {
      try {
        const logRef = doc(db, 'users', user.uid, 'logs', id);
        await import('firebase/firestore').then(f => f.deleteDoc(logRef));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore deleteLog background sync notice:", err);
      }
    }
  };

  const addInsight = async (insightData: any) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const dateStr = (insightData.date ? String(insightData.date) : new Date().toISOString().substring(0, 10)).substring(0, 10);
    const summary = String(insightData.performanceSummary || insightData.summary || 'Daily Study Review').substring(0, 4999);
    const newInsight = {
      id: 'ins_' + Date.now(),
      uid: user.uid,
      ...insightData,
      date: dateStr,
      performanceSummary: summary,
      createdAt: new Date().toISOString()
    };
    const updated = [newInsight, ...insights.filter(i => i.date !== dateStr)];
    setInsights(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}insights` : `savantix_user_insights_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_insights_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = collection(db, 'users', user.uid, 'daily_insights');
        await import('firebase/firestore').then(f => f.addDoc(ref, {
          uid: user.uid,
          date: dateStr,
          performanceSummary: summary,
          keyInefficiencies: insightData.keyInefficiencies || [],
          biggestMistakePattern: insightData.biggestMistakePattern || '',
          hiddenWeakness: insightData.hiddenWeakness || '',
          nextDayPlan: insightData.nextDayPlan || [],
          priorityRanking: insightData.priorityRanking || [],
          warnings: insightData.warnings || [],
          createdAt: f.serverTimestamp()
        }));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore addInsight background sync notice:", err);
      }
    }
    return newInsight;
  };

  const addGoal = async (goalData: any) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const title = String(goalData.title || 'Target Objective').substring(0, 199);
    const desc = String(goalData.description || '').substring(0, 999);
    const completed = Boolean(goalData.completed || goalData.progress === 100);
    const targetDate = goalData.targetDate ? String(goalData.targetDate).substring(0, 10) : undefined;
    
    const newGoal = {
      id: 'goal_' + Date.now(),
      uid: user.uid,
      ...goalData,
      title,
      description: desc,
      completed,
      targetDate,
      createdAt: new Date().toISOString()
    };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}goals` : `savantix_user_goals_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_goals_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = collection(db, 'users', user.uid, 'goals');
        await import('firebase/firestore').then(f => f.addDoc(ref, {
          uid: user.uid,
          title,
          description: desc,
          completed,
          ...(targetDate ? { targetDate } : {}),
          createdAt: f.serverTimestamp()
        }));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore addGoal background sync notice:", err);
      }
    }
    return newGoal;
  };

  const updateGoal = async (id: string, data: any) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updated = goals.map(g => g.id === id ? { ...g, ...data } : g);
    setGoals(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}goals` : `savantix_user_goals_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_goals_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'goals', id);
        await import('firebase/firestore').then(f => f.updateDoc(ref, data));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore updateGoal background sync notice:", err);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}goals` : `savantix_user_goals_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_goals_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'goals', id);
        await import('firebase/firestore').then(f => f.deleteDoc(ref));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore deleteGoal background sync notice:", err);
      }
    }
  };

  const addJournalEntry = async (entryData: any) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const title = String(entryData.title || 'Daily Journal').substring(0, 199);
    const content = String(entryData.content || entryData.notes || 'Reflection note').substring(0, 9999);
    const date = (entryData.date ? String(entryData.date) : new Date().toISOString().substring(0, 10)).substring(0, 10);
    
    const newEntry = {
      id: 'jour_' + Date.now(),
      uid: user.uid,
      ...entryData,
      title,
      content,
      date,
      createdAt: new Date().toISOString()
    };
    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}journal` : `savantix_user_journal_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_journal_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = collection(db, 'users', user.uid, 'journal_entries');
        await import('firebase/firestore').then(f => f.addDoc(ref, {
          uid: user.uid,
          title,
          content,
          date,
          createdAt: f.serverTimestamp()
        }));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore addJournalEntry background sync notice:", err);
      }
    }
    return newEntry;
  };

  const updateJournalEntry = async (id: string, data: any) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updated = journalEntries.map(j => j.id === id ? { ...j, ...data } : j);
    setJournalEntries(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}journal` : `savantix_user_journal_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_journal_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'journal_entries', id);
        await import('firebase/firestore').then(f => f.updateDoc(ref, data));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore updateJournalEntry background sync notice:", err);
      }
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (!user) return;
    const canonicalId = CloudSyncService.getCanonicalUid(user.email);
    const updated = journalEntries.filter(j => j.id !== id);
    setJournalEntries(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}journal` : `savantix_user_journal_${user.uid}`, JSON.stringify(updated));
    if (!isGuest && canonicalId) {
      localStorage.setItem(`savantix_user_journal_${canonicalId}`, JSON.stringify(updated));
    }

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'journal_entries', id);
        await import('firebase/firestore').then(f => f.deleteDoc(ref));
        CloudSyncService.pushToCloud(user.email, user.uid);
      } catch (err) {
        console.warn("Firestore deleteJournalEntry background sync notice:", err);
      }
    }
  };

  const updateElasticStreak = (data: Partial<ElasticStreakState>) => {
    setElasticStreak(prev => {
      const next = { ...prev, ...data };
      saveElasticStreakState(next);
      return next;
    });
  };

  const recomputeElasticStreak = () => {
    const target = elasticStreak?.targetMinutesDaily || 120;
    const fresh = recomputeStreakFromHistory(logs, target);
    setElasticStreak(fresh);
    saveElasticStreakState(fresh);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        logs,
        insights,
        goals,
        journalEntries,
        chatSessions,
        elasticStreak,
        loading,
        isGuest,
        syncStatus,
        forceSyncNow,
        login,
        loginWithEmail,
        continueAsGuest,
        logout: handleLogout,
        updateProfile,
        addLog,
        updateLog,
        deleteLog,
        addInsight,
        addGoal,
        updateGoal,
        deleteGoal,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        updateElasticStreak,
        recomputeElasticStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
