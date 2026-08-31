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
    const cleanEmail = (authUser.email || '').trim().toLowerCase();
    const namePart = cleanEmail ? cleanEmail.split('@')[0] : 'scholar';
    const fallbackName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._]/g, ' ');
    const displayName = authUser.displayName || fallbackName || 'Scholar';
    const sessionUser = {
      uid: authUser.uid,
      email: cleanEmail || 'scholar@savantix.app',
      displayName,
      photoURL: authUser.photoURL || ''
    };

    localStorage.setItem('savantix_user_session', JSON.stringify(sessionUser));
    localStorage.removeItem('savantix_is_guest');
    setIsGuest(false);
    setUser(sessionUser);

    try {
      const profileRef = doc(db, 'users', authUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        const newProfile = {
          uid: authUser.uid,
          email: cleanEmail,
          displayName,
          schoolHours: 6,
          targetExams: ['JEE Advanced 2026', 'IPhO', 'NSEP'],
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
        uid: authUser.uid,
        email: cleanEmail,
        displayName,
        schoolHours: 6,
        targetExams: ['JEE Advanced 2026', 'IPhO', 'NSEP'],
        createdAt: Date.now()
      });
    }

    // Load local storage data first (instant cache)
    const localLogsKey = `savantix_user_logs_${authUser.uid}`;
    const localGoalsKey = `savantix_user_goals_${authUser.uid}`;
    const localJournalKey = `savantix_user_journal_${authUser.uid}`;

    if (cleanEmail === 'debanjan8686@gmail.com' || cleanEmail === 'partofcosmmos@gmail.com') {
      const seeded = seedDebanjanHistoryIfEmpty(authUser.uid);
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
        if (parsed.email === 'debanjan8686@gmail.com' || parsed.email === 'partofcosmmos@gmail.com') {
          const seeded = seedDebanjanHistoryIfEmpty(parsed.uid);
          if (seeded) {
            setLogs(seeded.mergedLogs);
            setGoals(seeded.mergedGoals);
            setJournalEntries(seeded.mergedJournal);
          }
        } else {
          const savedLogs = localStorage.getItem(`savantix_user_logs_${parsed.uid}`);
          if (savedLogs) setLogs(JSON.parse(savedLogs));
        }
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

  // Sync Firestore with bidirectional merge when authenticated user is active
  useEffect(() => {
    if (!user || user.uid === 'guest_user') return;

    const localLogsKey = `savantix_user_logs_${user.uid}`;
    const localGoalsKey = `savantix_user_goals_${user.uid}`;
    const localJournalKey = `savantix_user_journal_${user.uid}`;

    // 1. Real-time Study Logs Sync & Bidirectional Merge
    const logsRef = collection(db, 'users', user.uid, 'logs');
    const qLogs = query(logsRef, orderBy('createdAt', 'desc'));
    const unsubLogs = onSnapshot(qLogs, async (snapshot) => {
      try {
        const cloudLogs: any[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            createdAt: parseFirestoreDate(d.createdAt)
          };
        });

        // Read current local cache to merge
        let currentLocal: any[] = [];
        try {
          currentLocal = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
        } catch {}

        // Map cloud logs by unique signature (date + subject + topic or id)
        const cloudMap = new Map<string, any>();
        cloudLogs.forEach(cl => {
          cloudMap.set(cl.id, cl);
          const sig = `${cl.date}_${cl.subject}_${cl.topic || ''}`.toLowerCase();
          cloudMap.set(sig, cl);
        });

        // Identify local logs that haven't reached cloud yet, and push them to Firestore
        const unuploaded = currentLocal.filter(ll => {
          const sig = `${ll.date}_${ll.subject}_${ll.topic || ''}`.toLowerCase();
          return !cloudMap.has(ll.id) && !cloudMap.has(sig);
        });

        if (unuploaded.length > 0) {
          // Push un-uploaded logs to Firestore in background
          import('firebase/firestore').then(async ({ addDoc, serverTimestamp }) => {
            for (const item of unuploaded) {
              try {
                const normalized = normalizeLogData(item, user.uid);
                await addDoc(logsRef, {
                  ...normalized,
                  createdAt: serverTimestamp()
                });
              } catch (pushErr) {
                console.warn('Auto-sync unuploaded log notice:', pushErr);
              }
            }
          });
        }

        // Union merge cloud logs with any remaining unique local logs
        const mergedMap = new Map<string, any>();
        cloudLogs.forEach(l => mergedMap.set(l.id, l));
        currentLocal.forEach(l => {
          if (!mergedMap.has(l.id)) {
            const sig = `${l.date}_${l.subject}_${l.topic || ''}`.toLowerCase();
            if (!cloudMap.has(sig)) {
              mergedMap.set(l.id, l);
            }
          }
        });

        const unifiedLogs = Array.from(mergedMap.values()).sort((a, b) => {
          const dateA = a.date || a.createdAt || '';
          const dateB = b.date || b.createdAt || '';
          return dateB.localeCompare(dateA);
        });

        setLogs(unifiedLogs);
        localStorage.setItem(localLogsKey, JSON.stringify(unifiedLogs));
        localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(unifiedLogs));
      } catch (err) {
        console.warn('Logs snapshot sync notice:', err);
      }
    }, (err) => {
      console.warn('Firestore logs subscription notice:', err);
    });

    // 2. Real-time Goals Sync
    const goalsRef = collection(db, 'users', user.uid, 'goals');
    const qGoals = query(goalsRef, orderBy('createdAt', 'desc'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      try {
        const cloudGoals: any[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            createdAt: parseFirestoreDate(d.createdAt)
          };
        });

        let currentLocal: any[] = [];
        try {
          currentLocal = JSON.parse(localStorage.getItem(localGoalsKey) || '[]');
        } catch {}

        const mergedMap = new Map<string, any>();
        cloudGoals.forEach(g => mergedMap.set(g.id, g));
        currentLocal.forEach(g => {
          if (!mergedMap.has(g.id)) mergedMap.set(g.id, g);
        });

        const unifiedGoals = Array.from(mergedMap.values());
        setGoals(unifiedGoals);
        localStorage.setItem(localGoalsKey, JSON.stringify(unifiedGoals));
      } catch (err) {
        console.warn('Goals snapshot sync notice:', err);
      }
    }, () => {});

    // 3. Real-time Journal Sync
    const journalRef = collection(db, 'users', user.uid, 'journal_entries');
    const qJournal = query(journalRef, orderBy('createdAt', 'desc'));
    const unsubJournal = onSnapshot(qJournal, (snapshot) => {
      try {
        const cloudJournal: any[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            createdAt: parseFirestoreDate(d.createdAt)
          };
        });

        let currentLocal: any[] = [];
        try {
          currentLocal = JSON.parse(localStorage.getItem(localJournalKey) || '[]');
        } catch {}

        const mergedMap = new Map<string, any>();
        cloudJournal.forEach(j => mergedMap.set(j.id, j));
        currentLocal.forEach(j => {
          if (!mergedMap.has(j.id)) mergedMap.set(j.id, j);
        });

        const unifiedJournal = Array.from(mergedMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setJournalEntries(unifiedJournal);
        localStorage.setItem(localJournalKey, JSON.stringify(unifiedJournal));
      } catch (err) {
        console.warn('Journal snapshot sync notice:', err);
      }
    }, () => {});

    // 4. Daily Insights & Chat Sessions
    const insightsRef = collection(db, 'users', user.uid, 'daily_insights');
    const qInsights = query(insightsRef, orderBy('createdAt', 'desc'));
    const unsubInsights = onSnapshot(qInsights, (snapshot) => {
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: parseFirestoreDate(doc.data().createdAt) })));
    }, () => {});

    const chatSessionsRef = collection(db, 'users', user.uid, 'chat_sessions');
    const qChatSessions = query(chatSessionsRef, orderBy('updatedAt', 'desc'));
    const unsubChatSessions = onSnapshot(qChatSessions, (snapshot) => {
      setChatSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    return () => {
      unsubLogs();
      unsubGoals();
      unsubJournal();
      unsubInsights();
      unsubChatSessions();
    };
  }, [user]);

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
    const uid = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    await authenticateUser({ uid, email: cleanEmail });
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
    const normalized = normalizeLogData(logData, user.uid);
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...normalized,
      createdAt: new Date().toISOString()
    };
    
    // 1. Optimistic state & persistent storage
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(isGuest ? `${GUEST_STORAGE_PREFIX}logs` : `savantix_user_logs_${user.uid}`, JSON.stringify(updatedLogs));
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(updatedLogs));

    // 2. Safe background Firestore update
    if (!isGuest) {
      try {
        const logsRef = collection(db, 'users', user.uid, 'logs');
        await import('firebase/firestore').then(f => f.addDoc(logsRef, {
          ...normalized,
          createdAt: f.serverTimestamp()
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
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(updated));

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
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(updated));

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
      } catch (err) {
        console.warn("Firestore addInsight background sync notice:", err);
      }
    }
    return newInsight;
  };

  const addGoal = async (goalData: any) => {
    if (!user) return;
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
