import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  // Synchronize and evaluate elastic streak health & resilience tokens whenever logs or user updates
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

  useEffect(() => {
    // Check if custom authenticated session was saved
    const savedSession = localStorage.getItem('savantix_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        const savedProf = localStorage.getItem(`savantix_user_profile_${parsed.uid}`);
        if (savedProf) {
          setProfile(JSON.parse(savedProf));
        } else {
          setProfile({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            schoolHours: 6,
            targetExams: ['JEE Advanced 2026'],
            createdAt: Date.now()
          });
        }

        if (parsed.email === 'debanjan8686@gmail.com' || parsed.email === 'partofcosmmos@gmail.com') {
          const seeded = seedDebanjanHistoryIfEmpty(parsed.uid);
          if (seeded) {
            setLogs(seeded.mergedLogs);
            setGoals(seeded.mergedGoals);
            setJournalEntries(seeded.mergedJournal);
          } else {
            const savedLogs = localStorage.getItem(`savantix_user_logs_${parsed.uid}`);
            if (savedLogs) setLogs(JSON.parse(savedLogs));
            const savedGoals = localStorage.getItem(`savantix_user_goals_${parsed.uid}`);
            if (savedGoals) setGoals(JSON.parse(savedGoals));
            const savedJournal = localStorage.getItem(`savantix_user_journal_${parsed.uid}`);
            if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
          }
        } else {
          const savedLogs = localStorage.getItem(`savantix_user_logs_${parsed.uid}`);
          if (savedLogs) setLogs(JSON.parse(savedLogs));
          const savedGoals = localStorage.getItem(`savantix_user_goals_${parsed.uid}`);
          if (savedGoals) setGoals(JSON.parse(savedGoals));
          const savedJournal = localStorage.getItem(`savantix_user_journal_${parsed.uid}`);
          if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
        }

        const savedInsights = localStorage.getItem(`savantix_user_insights_${parsed.uid}`);
        if (savedInsights) setInsights(JSON.parse(savedInsights));

        setIsGuest(false);
        setLoading(false);
        return;
      } catch {}
    }

    // Check if guest mode was previously selected
    const savedGuest = localStorage.getItem('savantix_is_guest');
    if (savedGuest === 'true') {
      const guestUser = { uid: 'guest_user', email: 'guest@savantix.app', displayName: 'Guest Scholar' };
      setUser(guestUser);
      setProfile({
        uid: 'guest_user',
        email: 'guest@savantix.app',
        displayName: 'Guest Scholar',
        schoolHours: 6,
        targetExams: ['JEE Advanced 2026', 'IPhO'],
        createdAt: Date.now()
      });
      setIsGuest(true);
      loadGuestData();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('savantix_is_guest');
        try {
          const profileRef = doc(db, 'users', currentUser.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (!profileSnap.exists()) {
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              schoolHours: 6,
              targetExams: ['JEE Advanced 2026'],
              createdAt: serverTimestamp(),
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile as UserProfile);
          } else {
            setProfile(profileSnap.data() as UserProfile);
          }

          if (currentUser.email === 'debanjan8686@gmail.com' || currentUser.email === 'partofcosmmos@gmail.com') {
            const seeded = seedDebanjanHistoryIfEmpty(currentUser.uid);
            if (seeded) {
              setLogs(seeded.mergedLogs);
              setGoals(seeded.mergedGoals);
              setJournalEntries(seeded.mergedJournal);
            }
          }
        } catch (error) {
          console.warn("Firestore profile fetch error:", error);
        }
      } else {
        setProfile(null);
        setLogs([]);
        setInsights([]);
        setGoals([]);
        setJournalEntries([]);
        setChatSessions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Firestore when authenticated user is active
  useEffect(() => {
    if (!user || user.uid === 'guest_user') return;

    const logsRef = collection(db, 'users', user.uid, 'logs');
    const qLogs = query(logsRef, orderBy('createdAt', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const insightsRef = collection(db, 'users', user.uid, 'daily_insights');
    const qInsights = query(insightsRef, orderBy('createdAt', 'desc'));
    const unsubInsights = onSnapshot(qInsights, (snapshot) => {
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const goalsRef = collection(db, 'users', user.uid, 'goals');
    const qGoals = query(goalsRef, orderBy('createdAt', 'desc'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const journalRef = collection(db, 'users', user.uid, 'journal_entries');
    const qJournal = query(journalRef, orderBy('createdAt', 'desc'));
    const unsubJournal = onSnapshot(qJournal, (snapshot) => {
      setJournalEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const chatSessionsRef = collection(db, 'users', user.uid, 'chat_sessions');
    const qChatSessions = query(chatSessionsRef, orderBy('updatedAt', 'desc'));
    const unsubChatSessions = onSnapshot(qChatSessions, (snapshot) => {
      setChatSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    return () => {
      unsubLogs();
      unsubInsights();
      unsubGoals();
      unsubJournal();
      unsubChatSessions();
    };
  }, [user]);

  const loginWithEmail = async (emailInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
    const uid = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const namePart = cleanEmail.split('@')[0];
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._]/g, ' ');
    const sessionUser = { uid, email: cleanEmail, displayName };
    
    localStorage.setItem('savantix_user_session', JSON.stringify(sessionUser));
    localStorage.removeItem('savantix_is_guest');
    setIsGuest(false);
    setUser(sessionUser);
    
    try {
      const profileRef = doc(db, 'users', uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        const newProfile = {
          uid,
          email: cleanEmail,
          displayName,
          schoolHours: 6,
          targetExams: ['JEE Advanced 2026'],
          createdAt: serverTimestamp(),
        };
        await setDoc(profileRef, newProfile);
        setProfile(newProfile as UserProfile);
      } else {
        setProfile(profileSnap.data() as UserProfile);
      }
    } catch (e) {
      console.warn("Firestore profile init:", e);
      setProfile({
        uid,
        email: cleanEmail,
        displayName,
        schoolHours: 6,
        targetExams: ['JEE Advanced 2026', 'IPhO', 'NSEP'],
        createdAt: Date.now()
      });
    }

    if (cleanEmail === 'debanjan8686@gmail.com' || cleanEmail === 'partofcosmmos@gmail.com') {
      const seeded = seedDebanjanHistoryIfEmpty(uid);
      if (seeded) {
        setLogs(seeded.mergedLogs);
        setGoals(seeded.mergedGoals);
        setJournalEntries(seeded.mergedJournal);
      }
    } else {
      const savedLogs = localStorage.getItem(`savantix_user_logs_${uid}`);
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      const savedGoals = localStorage.getItem(`savantix_user_goals_${uid}`);
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      const savedJournal = localStorage.getItem(`savantix_user_journal_${uid}`);
      if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
    }
  };

  const continueAsGuest = () => {
    const guestUser = { uid: 'guest_user', email: 'guest@savantix.app', displayName: 'Guest Scholar' };
    setUser(guestUser);
    setProfile({
      uid: 'guest_user',
      email: 'guest@savantix.app',
      displayName: 'Guest Scholar',
      schoolHours: 6,
      targetExams: ['JEE Advanced 2026', 'IPhO'],
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
      } catch (err) {
        console.warn("Firestore profile background sync notice:", err);
      }
    }
  };

  // CRUD Helpers
  const addLog = async (logData: any) => {
    if (!user) return;
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      uid: user.uid,
      ...logData,
      createdAt: new Date().toISOString()
    };
    
    // 1. Optimistic state & persistent storage
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updatedLogs));

    // 2. Safe background Firestore update
    if (!isGuest) {
      try {
        const logsRef = collection(db, 'users', user.uid, 'logs');
        await import('firebase/firestore').then(f => f.addDoc(logsRef, {
          uid: user.uid,
          ...logData,
          createdAt: serverTimestamp()
        }));
      } catch (err) {
        console.warn("Firestore addLog background sync notice:", err);
      }
    }
    return newLog;
  };

  const updateLog = async (id: string, data: any) => {
    if (!user) return;
    const updated = logs.map(l => l.id === id ? { ...l, ...data } : l);
    setLogs(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const logRef = doc(db, 'users', user.uid, 'logs', id);
        await import('firebase/firestore').then(f => f.updateDoc(logRef, data));
      } catch (err) {
        console.warn("Firestore updateLog background sync notice:", err);
      }
    }
  };

  const deleteLog = async (id: string) => {
    if (!user) return;
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const logRef = doc(db, 'users', user.uid, 'logs', id);
        await import('firebase/firestore').then(f => f.deleteDoc(logRef));
      } catch (err) {
        console.warn("Firestore deleteLog background sync notice:", err);
      }
    }
  };

  const addInsight = async (insightData: any) => {
    if (!user) return;
    const newInsight = {
      id: 'ins_' + Date.now(),
      uid: user.uid,
      ...insightData,
      createdAt: new Date().toISOString()
    };
    const updated = [newInsight, ...insights.filter(i => i.date !== insightData.date)];
    setInsights(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}insights` : `savantix_user_insights_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = collection(db, 'users', user.uid, 'daily_insights');
        await import('firebase/firestore').then(f => f.addDoc(ref, {
          uid: user.uid,
          ...insightData,
          createdAt: serverTimestamp()
        }));
      } catch (err) {
        console.warn("Firestore addInsight background sync notice:", err);
      }
    }
    return newInsight;
  };

  const addGoal = async (goalData: any) => {
    if (!user) return;
    const newGoal = {
      id: 'goal_' + Date.now(),
      uid: user.uid,
      ...goalData,
      createdAt: new Date().toISOString()
    };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}goals` : `savantix_user_goals_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = collection(db, 'users', user.uid, 'goals');
        await import('firebase/firestore').then(f => f.addDoc(ref, {
          uid: user.uid,
          ...goalData,
          createdAt: serverTimestamp()
        }));
      } catch (err) {
        console.warn("Firestore addGoal background sync notice:", err);
      }
    }
    return newGoal;
  };

  const updateGoal = async (id: string, data: any) => {
    if (!user) return;
    const updated = goals.map(g => g.id === id ? { ...g, ...data } : g);
    setGoals(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}goals` : `savantix_user_goals_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'goals', id);
        await import('firebase/firestore').then(f => f.updateDoc(ref, data));
      } catch (err) {
        console.warn("Firestore updateGoal background sync notice:", err);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}goals` : `savantix_user_goals_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'goals', id);
        await import('firebase/firestore').then(f => f.deleteDoc(ref));
      } catch (err) {
        console.warn("Firestore deleteGoal background sync notice:", err);
      }
    }
  };

  const addJournalEntry = async (entryData: any) => {
    if (!user) return;
    const newEntry = {
      id: 'jour_' + Date.now(),
      uid: user.uid,
      ...entryData,
      createdAt: new Date().toISOString()
    };
    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}journal` : `savantix_user_journal_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = collection(db, 'users', user.uid, 'journal_entries');
        await import('firebase/firestore').then(f => f.addDoc(ref, {
          uid: user.uid,
          ...entryData,
          createdAt: serverTimestamp()
        }));
      } catch (err) {
        console.warn("Firestore addJournalEntry background sync notice:", err);
      }
    }
    return newEntry;
  };

  const updateJournalEntry = async (id: string, data: any) => {
    if (!user) return;
    const updated = journalEntries.map(j => j.id === id ? { ...j, ...data } : j);
    setJournalEntries(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}journal` : `savantix_user_journal_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'journal_entries', id);
        await import('firebase/firestore').then(f => f.updateDoc(ref, data));
      } catch (err) {
        console.warn("Firestore updateJournalEntry background sync notice:", err);
      }
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (!user) return;
    const updated = journalEntries.filter(j => j.id !== id);
    setJournalEntries(updated);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}journal` : `savantix_user_journal_${user.uid}`, JSON.stringify(updated));

    if (!isGuest) {
      try {
        const ref = doc(db, 'users', user.uid, 'journal_entries', id);
        await import('firebase/firestore').then(f => f.deleteDoc(ref));
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
    try {
      const recomputed = recomputeStreakFromHistory(logs, elasticStreak.targetMinutesDaily, elasticStreak.shieldTokens);
      setElasticStreak(recomputed);
      saveElasticStreakState(recomputed);
    } catch (err) {
      console.warn('Failed to recompute elastic streak resilience state:', err);
    }
  };

  return (
    <AppContext.Provider value={{
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
      login: loginWithGoogle,
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
      recomputeElasticStreak
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
