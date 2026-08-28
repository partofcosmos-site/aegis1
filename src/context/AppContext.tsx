import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, loginWithGoogle, logout as firebaseLogout, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

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
        setProfile({
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.displayName,
          schoolHours: 6,
          targetExams: ['JEE Advanced 2026'],
          createdAt: Date.now()
        });
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
        targetExams: ['JEE Advanced 2026'],
        createdAt: Date.now()
      });
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
    if (isGuest) {
      setProfile(prev => {
        const next = prev ? { ...prev, ...data } : null;
        if (next) localStorage.setItem(`${GUEST_STORAGE_PREFIX}profile`, JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, data, { merge: true });
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // CRUD Helpers
  const addLog = async (logData: any) => {
    if (!user) return;
    if (isGuest) {
      const newLog = { id: 'log_' + Date.now(), createdAt: new Date().toISOString(), ...logData };
      const updated = [newLog, ...logs];
      setLogs(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}logs`, JSON.stringify(updated));
      return newLog;
    } else {
      const logsRef = collection(db, 'users', user.uid, 'logs');
      const docRef = await import('firebase/firestore').then(f => f.addDoc(logsRef, {
        uid: user.uid,
        ...logData,
        createdAt: serverTimestamp()
      }));
      return docRef;
    }
  };

  const updateLog = async (id: string, data: any) => {
    if (!user) return;
    if (isGuest) {
      const updated = logs.map(l => l.id === id ? { ...l, ...data } : l);
      setLogs(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}logs`, JSON.stringify(updated));
    } else {
      const logRef = doc(db, 'users', user.uid, 'logs', id);
      await import('firebase/firestore').then(f => f.updateDoc(logRef, data));
    }
  };

  const deleteLog = async (id: string) => {
    if (!user) return;
    if (isGuest) {
      const updated = logs.filter(l => l.id !== id);
      setLogs(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}logs`, JSON.stringify(updated));
    } else {
      const logRef = doc(db, 'users', user.uid, 'logs', id);
      await import('firebase/firestore').then(f => f.deleteDoc(logRef));
    }
  };

  const addInsight = async (insightData: any) => {
    if (!user) return;
    if (isGuest) {
      const newInsight = { id: 'ins_' + Date.now(), createdAt: new Date().toISOString(), ...insightData };
      const updated = [newInsight, ...insights.filter(i => i.date !== insightData.date)];
      setInsights(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}insights`, JSON.stringify(updated));
      return newInsight;
    } else {
      const ref = collection(db, 'users', user.uid, 'daily_insights');
      return await import('firebase/firestore').then(f => f.addDoc(ref, {
        uid: user.uid,
        ...insightData,
        createdAt: serverTimestamp()
      }));
    }
  };

  const addGoal = async (goalData: any) => {
    if (!user) return;
    if (isGuest) {
      const newGoal = { id: 'goal_' + Date.now(), createdAt: new Date().toISOString(), ...goalData };
      const updated = [newGoal, ...goals];
      setGoals(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}goals`, JSON.stringify(updated));
      return newGoal;
    } else {
      const ref = collection(db, 'users', user.uid, 'goals');
      return await import('firebase/firestore').then(f => f.addDoc(ref, {
        uid: user.uid,
        ...goalData,
        createdAt: serverTimestamp()
      }));
    }
  };

  const updateGoal = async (id: string, data: any) => {
    if (!user) return;
    if (isGuest) {
      const updated = goals.map(g => g.id === id ? { ...g, ...data } : g);
      setGoals(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}goals`, JSON.stringify(updated));
    } else {
      const ref = doc(db, 'users', user.uid, 'goals', id);
      await import('firebase/firestore').then(f => f.updateDoc(ref, data));
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    if (isGuest) {
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}goals`, JSON.stringify(updated));
    } else {
      const ref = doc(db, 'users', user.uid, 'goals', id);
      await import('firebase/firestore').then(f => f.deleteDoc(ref));
    }
  };

  const addJournalEntry = async (entryData: any) => {
    if (!user) return;
    if (isGuest) {
      const newEntry = { id: 'jour_' + Date.now(), createdAt: new Date().toISOString(), ...entryData };
      const updated = [newEntry, ...journalEntries];
      setJournalEntries(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}journal`, JSON.stringify(updated));
      return newEntry;
    } else {
      const ref = collection(db, 'users', user.uid, 'journal_entries');
      return await import('firebase/firestore').then(f => f.addDoc(ref, {
        uid: user.uid,
        ...entryData,
        createdAt: serverTimestamp()
      }));
    }
  };

  const updateJournalEntry = async (id: string, data: any) => {
    if (!user) return;
    if (isGuest) {
      const updated = journalEntries.map(j => j.id === id ? { ...j, ...data } : j);
      setJournalEntries(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}journal`, JSON.stringify(updated));
    } else {
      const ref = doc(db, 'users', user.uid, 'journal_entries', id);
      await import('firebase/firestore').then(f => f.updateDoc(ref, data));
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (!user) return;
    if (isGuest) {
      const updated = journalEntries.filter(j => j.id !== id);
      setJournalEntries(updated);
      localStorage.setItem(`${GUEST_STORAGE_PREFIX}journal`, JSON.stringify(updated));
    } else {
      const ref = doc(db, 'users', user.uid, 'journal_entries', id);
      await import('firebase/firestore').then(f => f.deleteDoc(ref));
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
      deleteJournalEntry
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
