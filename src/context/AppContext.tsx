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
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
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

  useEffect(() => {
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
  };

  const handleLogout = async () => {
    if (isGuest) {
      localStorage.removeItem('savantix_is_guest');
      setIsGuest(false);
      setUser(null);
      setProfile(null);
    } else {
      await firebaseLogout();
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    if (isGuest) {
      setProfile(prev => prev ? { ...prev, ...data } : null);
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
      continueAsGuest,
      logout: handleLogout,
      updateProfile
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
