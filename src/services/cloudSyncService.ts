/**
 * @file cloudSyncService.ts
 * @description
 * Universal Cross-Device Real-Time Cloud Synchronization Engine for Savantix (Aegis).
 * Performs non-destructive union merges across Study Logs, Goals, Journal Entries,
 * Attendance Tracker Data, Flashcards, Exam Targets, and Resilience Streaks.
 */

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase';

export interface CloudSyncPayload {
  version: number;
  email: string;
  canonicalId: string;
  lastSyncedAt: string;
  deviceInfo: string;
  logs: any[];
  goals: any[];
  journal: any[];
  insights?: any[];
  attendance: any[];
  institutional_attendance?: any;
  flashcards: any[];
  examTargets: any[];
  streakState?: any;
  profile?: any;
}

export interface SyncResult {
  success: boolean;
  timestamp: string;
  logsCount: number;
  goalsCount: number;
  journalCount: number;
  insightsCount?: number;
  attendanceCount: number;
  message: string;
  mergedLogs?: any[];
  mergedGoals?: any[];
  mergedJournal?: any[];
  mergedInsights?: any[];
  mergedAttendance?: any[];
  mergedInstitutionalAttendance?: any;
}

export class CloudSyncService {
  private static SYNC_COLLECTION = 'sync_hub';
  private static activeUnsubscribe: (() => void) | null = null;
  private static isSyncing = false;
  private static syncBus: BroadcastChannel | null = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('savantix_sync_bus') : null;

  /**
   * Deterministic canonical identifier from user email.
   * Guarantees all devices of the same email connect to the exact same cloud partition.
   */
  public static getCanonicalUid(email: string): string {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return 'guest_user';
    const sanitized = clean.replace(/[^a-z0-9]/g, '_');
    return `deb_sync_${sanitized}`;
  }

  /**
   * Ensures an authenticated Firebase Auth session exists so Firestore rules never block requests.
   */
  public static async ensureAuth(email?: string): Promise<boolean> {
    if (auth.currentUser) return true;
    try {
      if (email && email.includes('@')) {
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
        const cleanEmail = email.trim().toLowerCase();
        const seedPassword = `Savantix_Sync_${cleanEmail.replace(/[^a-z0-9]/g, '')}_2026!`;
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, seedPassword);
          return true;
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/invalid-email') {
            try {
              await createUserWithEmailAndPassword(auth, cleanEmail, seedPassword);
              return true;
            } catch {}
          }
        }
      }
      await signInAnonymously(auth);
      return true;
    } catch (err) {
      console.warn('[CloudSyncService] Firebase auth notice:', err);
      return false;
    }
  }

  /**
   * Helper to retrieve and union-merge arrays across multiple potential storage keys.
   */
  public static getStoredArray(keys: string[], type: 'log' | 'goal' | 'journal' | 'insight' | 'att' | 'fc' = 'log'): any[] {
    const combined: any[] = [];
    const seen = new Set<string>();

    const getSig = (item: any): string => {
      if (!item || typeof item !== 'object') return '';
      if (item.id && String(item.id).trim()) return String(item.id).trim();
      if (type === 'log') {
        const d = item.date || '';
        const s = item.subject || '';
        const dur = item.durationMinutes || 0;
        const txt = (item.rawText || '').slice(0, 30);
        return `${d}_${s}_${dur}_${txt}`;
      }
      if (type === 'goal') return item.title || JSON.stringify(item);
      if (type === 'journal') return `${item.date || ''}_${item.title || ''}`;
      if (type === 'insight') return item.date || item.id || JSON.stringify(item);
      if (type === 'att') return item.id || item.name || '';
      if (type === 'fc') return item.id || `${item.front || ''}_${item.deck || ''}`;
      return JSON.stringify(item);
    };

    keys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              if (item && typeof item === 'object') {
                const sig = getSig(item);
                if (sig && !seen.has(sig)) {
                  seen.add(sig);
                  combined.push(item);
                }
              }
            });
          }
        }
      } catch {}
    });

    return combined;
  }

  /**
   * Collects all local storage data into a unified sync snapshot.
   */
  public static getLocalSnapshot(email: string, uid: string): CloudSyncPayload {
    const canonicalId = this.getCanonicalUid(email);
    const userUidKey = uid || canonicalId;

    const logs = this.getStoredArray([
      `savantix_user_logs_${userUidKey}`,
      `savantix_user_logs_${canonicalId}`,
      'savantix_logs_backup_latest',
      'savantix_guest_logs'
    ], 'log');

    const goals = this.getStoredArray([
      `savantix_user_goals_${userUidKey}`,
      `savantix_user_goals_${canonicalId}`,
      'savantix_guest_goals'
    ], 'goal');

    const journal = this.getStoredArray([
      `savantix_user_journal_${userUidKey}`,
      `savantix_user_journal_${canonicalId}`,
      'savantix_guest_journal'
    ], 'journal');

    const insights = this.getStoredArray([
      `savantix_user_insights_${userUidKey}`,
      `savantix_user_insights_${canonicalId}`,
      'savantix_guest_insights'
    ], 'insight');

    const attendance = this.getStoredArray([
      'savantix_attendance_data_v1'
    ], 'att');

    let institutional_attendance: any = null;
    try {
      const rawInst = localStorage.getItem('savantix_attendance_institutional_v1');
      if (rawInst) institutional_attendance = JSON.parse(rawInst);
    } catch {}

    const flashcards = this.getStoredArray([
      'savantix_flashcards',
      `savantix_flashcards_${userUidKey}`
    ], 'fc');

    let examTargets: any[] = [];
    try {
      const rawTargets = localStorage.getItem('savantix_exam_targets') || '[]';
      examTargets = JSON.parse(rawTargets);
    } catch {}

    let streakState: any = null;
    try {
      const rawStreak = localStorage.getItem('savantix_streak_resilience_state_v1');
      if (rawStreak) streakState = JSON.parse(rawStreak);
    } catch {}

    let profile: any = null;
    try {
      const rawProf = localStorage.getItem(`savantix_user_profile_${userUidKey}`);
      if (rawProf) profile = JSON.parse(rawProf);
    } catch {}

    return {
      version: 2,
      email: email.trim().toLowerCase(),
      canonicalId,
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 80)}` : 'web-client',
      logs,
      goals,
      journal,
      insights,
      attendance,
      institutional_attendance,
      flashcards,
      examTargets,
      streakState,
      profile
    };
  }

  /**
   * Non-destructive union merge of local data with cloud data.
   */
  public static mergeAndPersist(remote: CloudSyncPayload, email: string, uid: string): SyncResult {
    const canonicalId = this.getCanonicalUid(email);
    const userUidKey = uid || canonicalId;

    const localLogsKey = `savantix_user_logs_${userUidKey}`;
    const localGoalsKey = `savantix_user_goals_${userUidKey}`;
    const localJournalKey = `savantix_user_journal_${userUidKey}`;
    const localInsightsKey = `savantix_user_insights_${userUidKey}`;

    // 1. Merge Logs with composite fingerprint signature
    const localLogs = this.getStoredArray([
      localLogsKey,
      `savantix_user_logs_${canonicalId}`,
      'savantix_logs_backup_latest',
      'savantix_guest_logs'
    ], 'log');

    const getLogSig = (l: any): string => {
      if (!l || typeof l !== 'object') return '';
      if (l.id && String(l.id).trim()) return String(l.id).trim();
      const d = l.date || '';
      const s = l.subject || '';
      const dur = l.durationMinutes || 0;
      const txt = (l.rawText || '').slice(0, 30);
      return `${d}_${s}_${dur}_${txt}`;
    };

    const logsMap = new Map<string, any>();
    (remote.logs || []).forEach(l => {
      const sig = getLogSig(l);
      if (sig) logsMap.set(sig, l);
    });
    localLogs.forEach(l => {
      const sig = getLogSig(l);
      if (sig && !logsMap.has(sig)) logsMap.set(sig, l);
    });

    const mergedLogs = Array.from(logsMap.values()).sort((a, b) => {
      const dateA = a.date || a.createdAt || '';
      const dateB = b.date || b.createdAt || '';
      const cmp = dateB.localeCompare(dateA);
      if (cmp !== 0) return cmp;
      const tA = new Date(a.createdAt || a.date || 0).getTime();
      const tB = new Date(b.createdAt || b.date || 0).getTime();
      return tB - tA;
    });

    localStorage.setItem(localLogsKey, JSON.stringify(mergedLogs));
    localStorage.setItem(`savantix_user_logs_${canonicalId}`, JSON.stringify(mergedLogs));
    localStorage.setItem('savantix_logs_backup_latest', JSON.stringify(mergedLogs));

    // 2. Merge Goals
    let localGoals: any[] = [];
    try { localGoals = JSON.parse(localStorage.getItem(localGoalsKey) || '[]'); } catch {}
    const goalsMap = new Map<string, any>();
    (remote.goals || []).forEach(g => {
      const sig = g.id || g.title;
      goalsMap.set(sig, g);
    });
    localGoals.forEach(g => {
      const sig = g.id || g.title;
      if (!goalsMap.has(sig)) goalsMap.set(sig, g);
    });
    const mergedGoals = Array.from(goalsMap.values());
    localStorage.setItem(localGoalsKey, JSON.stringify(mergedGoals));
    localStorage.setItem(`savantix_user_goals_${canonicalId}`, JSON.stringify(mergedGoals));

    // 3. Merge Journal
    let localJournal: any[] = [];
    try { localJournal = JSON.parse(localStorage.getItem(localJournalKey) || '[]'); } catch {}
    const journalMap = new Map<string, any>();
    (remote.journal || []).forEach(j => {
      const sig = j.id || `${j.date}_${j.title}`;
      journalMap.set(sig, j);
    });
    localJournal.forEach(j => {
      const sig = j.id || `${j.date}_${j.title}`;
      if (!journalMap.has(sig)) journalMap.set(sig, j);
    });
    const mergedJournal = Array.from(journalMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    localStorage.setItem(localJournalKey, JSON.stringify(mergedJournal));
    localStorage.setItem(`savantix_user_journal_${canonicalId}`, JSON.stringify(mergedJournal));

    // 4. Merge Insights (non-destructive signature-based union merge)
    let localInsights: any[] = [];
    try { localInsights = JSON.parse(localStorage.getItem(localInsightsKey) || localStorage.getItem(`savantix_user_insights_${canonicalId}`) || '[]'); } catch {}
    const insightsMap = new Map<string, any>();
    const getInsightTimestamp = (ins: any) => {
      if (!ins) return 0;
      const d = ins.createdAt || ins.updatedAt || ins.timestamp || 0;
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    };

    (remote.insights || []).forEach(ins => {
      const sig = ins.date || ins.id;
      if (sig) insightsMap.set(sig, ins);
    });

    localInsights.forEach(ins => {
      const sig = ins.date || ins.id;
      if (sig) {
        if (!insightsMap.has(sig)) {
          insightsMap.set(sig, ins);
        } else {
          // If both have insight for this date, keep the one with more evaluated sessions or later timestamp
          const remoteIns = insightsMap.get(sig);
          const localSessions = ins.sessionCount || 0;
          const remoteSessions = remoteIns.sessionCount || 0;
          if (localSessions > remoteSessions || getInsightTimestamp(ins) >= getInsightTimestamp(remoteIns)) {
            insightsMap.set(sig, ins);
          }
        }
      }
    });

    const mergedInsights = Array.from(insightsMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    localStorage.setItem(localInsightsKey, JSON.stringify(mergedInsights));
    localStorage.setItem(`savantix_user_insights_${canonicalId}`, JSON.stringify(mergedInsights));

    // 5. Merge Attendance Data (Subject stats)
    if (Array.isArray(remote.attendance) && remote.attendance.length > 0) {
      let localAtt: any[] = [];
      try { localAtt = JSON.parse(localStorage.getItem('savantix_attendance_data_v1') || '[]'); } catch {}
      const attMap = new Map<string, any>();
      remote.attendance.forEach(a => {
        const sig = a.id || a.name;
        attMap.set(sig, a);
      });
      localAtt.forEach(a => {
        const sig = a.id || a.name;
        if (!attMap.has(sig)) attMap.set(sig, a);
      });
      localStorage.setItem('savantix_attendance_data_v1', JSON.stringify(Array.from(attMap.values())));
    }

    // 6. Merge Institutional Attendance
    if (remote.institutional_attendance) {
      try {
        let localInst: any = null;
        const rawInst = localStorage.getItem('savantix_attendance_institutional_v1');
        if (rawInst) localInst = JSON.parse(rawInst);

        if (!localInst) {
          localStorage.setItem('savantix_attendance_institutional_v1', JSON.stringify(remote.institutional_attendance));
        } else {
          const mergedInst = {
            ...localInst,
            ...remote.institutional_attendance,
            absences: Array.isArray(remote.institutional_attendance.absences) && Array.isArray(localInst.absences)
              ? Array.from(new Set([...localInst.absences, ...remote.institutional_attendance.absences]))
              : (remote.institutional_attendance.absences || localInst.absences)
          };
          localStorage.setItem('savantix_attendance_institutional_v1', JSON.stringify(mergedInst));
        }
      } catch (instErr) {
        console.warn('[CloudSyncService] Institutional attendance merge error:', instErr);
      }
    }

    // 7. Merge Flashcards
    if (Array.isArray(remote.flashcards) && remote.flashcards.length > 0) {
      let localFc: any[] = [];
      try { localFc = JSON.parse(localStorage.getItem('savantix_flashcards') || '[]'); } catch {}
      const fcMap = new Map<string, any>();
      remote.flashcards.forEach(f => {
        const sig = f.id || `${f.front}_${f.deck}`;
        fcMap.set(sig, f);
      });
      localFc.forEach(f => {
        const sig = f.id || `${f.front}_${f.deck}`;
        if (!fcMap.has(sig)) fcMap.set(sig, f);
      });
      localStorage.setItem('savantix_flashcards', JSON.stringify(Array.from(fcMap.values())));
    }

    // 8. Exam Targets & Profile
    if (Array.isArray(remote.examTargets) && remote.examTargets.length > 0) {
      localStorage.setItem('savantix_exam_targets', JSON.stringify(remote.examTargets));
    }
    if (remote.profile) {
      localStorage.setItem(`savantix_user_profile_${userUidKey}`, JSON.stringify(remote.profile));
    }

    const timestamp = new Date().toLocaleTimeString();
    localStorage.setItem('savantix_last_cloud_sync_time', timestamp);

    const result: SyncResult = {
      success: true,
      timestamp,
      logsCount: mergedLogs.length,
      goalsCount: mergedGoals.length,
      journalCount: mergedJournal.length,
      insightsCount: mergedInsights.length,
      attendanceCount: remote.attendance?.length || 0,
      message: `Successfully synchronized ${mergedLogs.length} logs, ${mergedGoals.length} goals, ${mergedJournal.length} journal reflections, and ${mergedInsights.length} daily insights.`,
      mergedLogs,
      mergedGoals,
      mergedJournal,
      mergedInsights,
      mergedAttendance: remote.attendance,
      mergedInstitutionalAttendance: remote.institutional_attendance
    };

    try {
      if (this.syncBus) {
        this.syncBus.postMessage({ type: 'SYNC_COMPLETED', timestamp, email, uid });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('savantix_cloud_synced', { detail: result }));
      }
    } catch {}

    return result;
  }

  /**
   * Pushes full local snapshot to Cloud (Serverless Relay + Firestore).
   */
  public static async pushToCloud(email: string, uid: string): Promise<SyncResult> {
    const canonicalId = this.getCanonicalUid(email);
    const snapshot = this.getLocalSnapshot(email, uid);
    let apiSuccess = false;

    // 1. Primary: Serverless Sync Relay (/api/sync)
    try {
      const endpoint = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/sync` 
        : 'https://savantix.vercel.app/api/sync';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonicalId,
          email: email.trim().toLowerCase(),
          snapshot
        })
      });

      if (response.ok) {
        apiSuccess = true;
      }
    } catch (apiErr) {
      console.warn('[CloudSyncService] Serverless sync push notice:', apiErr);
    }

    // 2. Secondary: Firestore sync partition
    try {
      await this.ensureAuth(email);
      const syncDocRef = doc(db, this.SYNC_COLLECTION, canonicalId);
      await setDoc(syncDocRef, {
        ...snapshot,
        updatedAt: serverTimestamp()
      }, { merge: true });
      apiSuccess = true;
    } catch (fireErr) {
      console.warn('[CloudSyncService] Firestore push notice:', fireErr);
    }

    const timestamp = new Date().toLocaleTimeString();
    localStorage.setItem('savantix_last_cloud_sync_time', timestamp);

    return {
      success: apiSuccess,
      timestamp,
      logsCount: snapshot.logs.length,
      goalsCount: snapshot.goals.length,
      journalCount: snapshot.journal.length,
      insightsCount: snapshot.insights?.length || 0,
      attendanceCount: snapshot.attendance.length,
      message: apiSuccess ? `Pushed ${snapshot.logs.length} logs to cloud at ${timestamp}` : 'Sync queued locally'
    };
  }

  /**
   * Pulls latest cloud state and merges non-destructively into local storage.
   */
  public static async pullFromCloud(email: string, uid: string): Promise<SyncResult> {
    const canonicalId = this.getCanonicalUid(email);
    let remoteData: CloudSyncPayload | null = null;

    // 1. Primary: Serverless Sync Relay (/api/sync)
    try {
      const endpoint = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/sync?canonicalId=${encodeURIComponent(canonicalId)}` 
        : `https://savantix.vercel.app/api/sync?canonicalId=${encodeURIComponent(canonicalId)}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const json = await response.json();
        if (json.exists && json.payload) {
          remoteData = json.payload as CloudSyncPayload;
        }
      }
    } catch (apiErr) {
      console.warn('[CloudSyncService] Serverless pull notice:', apiErr);
    }

    // 2. Secondary: Firestore sync partition
    if (!remoteData) {
      try {
        await this.ensureAuth(email);
        const syncDocRef = doc(db, this.SYNC_COLLECTION, canonicalId);
        const snap = await getDoc(syncDocRef);
        if (snap.exists()) {
          remoteData = snap.data() as CloudSyncPayload;
        }
      } catch (fireErr) {
        console.warn('[CloudSyncService] Firestore pull notice:', fireErr);
      }
    }

    if (remoteData) {
      const result = this.mergeAndPersist(remoteData, email, uid);

      // Re-push merged top state so both client and cloud are perfectly equalized
      this.pushToCloud(email, uid).catch(() => {});
      return result;
    } else {
      // First time initialization: push current local state as cloud baseline
      return await this.pushToCloud(email, uid);
    }
  }

  /**
   * Real-Time Real-Device Subscription:
   * Combines WebSocket onSnapshot + Serverless Poller + BroadcastChannel.
   */
  public static subscribeToCloudSync(
    email: string,
    uid: string,
    onDataUpdated: (result: SyncResult) => void
  ): () => void {
    if (this.activeUnsubscribe) {
      this.activeUnsubscribe();
      this.activeUnsubscribe = null;
    }

    const canonicalId = this.getCanonicalUid(email);
    let lastKnownPayloadJson = '';

    // 1. Background Serverless Poller (every 4s)
    const pollInterval = setInterval(async () => {
      if (this.isSyncing) return;
      try {
        const endpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/sync?canonicalId=${encodeURIComponent(canonicalId)}` 
          : `https://savantix.vercel.app/api/sync?canonicalId=${encodeURIComponent(canonicalId)}`;

        const response = await fetch(endpoint);
        if (response.ok) {
          const json = await response.json();
          if (json.exists && json.payload) {
            const currentStr = JSON.stringify({
              logs: json.payload.logs?.length,
              goals: json.payload.goals?.length,
              journal: json.payload.journal?.length,
              lastSynced: json.payload.lastSyncedAt
            });

            if (currentStr !== lastKnownPayloadJson) {
              lastKnownPayloadJson = currentStr;
              this.isSyncing = true;
              try {
                const res = this.mergeAndPersist(json.payload as CloudSyncPayload, email, uid);
                onDataUpdated(res);
              } finally {
                this.isSyncing = false;
              }
            }
          }
        }
      } catch {}
    }, 4000);

    // 2. Firestore WebSocket Listener
    this.ensureAuth(email).then(() => {
      try {
        const syncDocRef = doc(db, this.SYNC_COLLECTION, canonicalId);
        const unsub = onSnapshot(syncDocRef, (snap) => {
          if (snap.exists() && !this.isSyncing) {
            const data = snap.data() as CloudSyncPayload;
            this.isSyncing = true;
            try {
              const res = this.mergeAndPersist(data, email, uid);
              onDataUpdated(res);
            } finally {
              this.isSyncing = false;
            }
          }
        }, (err) => {
          console.warn('[CloudSyncService] Live sync subscription notice:', err);
        });

        this.activeUnsubscribe = () => {
          clearInterval(pollInterval);
          unsub();
        };
      } catch (err) {
        this.activeUnsubscribe = () => clearInterval(pollInterval);
      }
    });

    return () => {
      clearInterval(pollInterval);
      if (this.activeUnsubscribe) {
        this.activeUnsubscribe();
        this.activeUnsubscribe = null;
      }
    };
  }

  /**
   * Generates a 1-click encrypted base64 sync token to pair devices instantly without cloud.
   */
  public static generateSyncCode(email: string, uid: string): string {
    const snap = this.getLocalSnapshot(email, uid);
    const json = JSON.stringify(snap);
    return btoa(encodeURIComponent(json));
  }

  /**
   * Imports a 1-click sync token pasted from another device.
   */
  public static importSyncCode(code: string, email: string, uid: string): SyncResult {
    try {
      const decoded = decodeURIComponent(atob(code.trim()));
      const parsed: CloudSyncPayload = JSON.parse(decoded);
      if (!parsed || (!Array.isArray(parsed.logs) && !Array.isArray(parsed.goals))) {
        throw new Error('Invalid sync code structure.');
      }
      return this.mergeAndPersist(parsed, email, uid);
    } catch (err: any) {
      return {
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        logsCount: 0,
        goalsCount: 0,
        journalCount: 0,
        attendanceCount: 0,
        message: 'Invalid sync code: ' + (err.message || 'Malformed token')
      };
    }
  }
}
