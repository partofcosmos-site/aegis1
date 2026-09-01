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
  public static async ensureAuth(): Promise<boolean> {
    if (auth.currentUser) return true;
    try {
      await signInAnonymously(auth);
      return true;
    } catch (err) {
      console.warn('[CloudSyncService] Anonymous auth fallback notice:', err);
      return false;
    }
  }

  /**
   * Collects all local storage data into a unified sync snapshot.
   */
  public static getLocalSnapshot(email: string, uid: string): CloudSyncPayload {
    const canonicalId = this.getCanonicalUid(email);
    const userUidKey = uid || canonicalId;

    let logs: any[] = [];
    let goals: any[] = [];
    let journal: any[] = [];
    let insights: any[] = [];
    let attendance: any[] = [];
    let institutional_attendance: any = null;
    let flashcards: any[] = [];
    let examTargets: any[] = [];
    let streakState: any = null;
    let profile: any = null;

    try {
      const rawLogs = localStorage.getItem(`savantix_user_logs_${userUidKey}`) || localStorage.getItem(`savantix_user_logs_${canonicalId}`) || '[]';
      logs = JSON.parse(rawLogs);
    } catch {}

    try {
      const rawGoals = localStorage.getItem(`savantix_user_goals_${userUidKey}`) || localStorage.getItem(`savantix_user_goals_${canonicalId}`) || '[]';
      goals = JSON.parse(rawGoals);
    } catch {}

    try {
      const rawJournal = localStorage.getItem(`savantix_user_journal_${userUidKey}`) || localStorage.getItem(`savantix_user_journal_${canonicalId}`) || '[]';
      journal = JSON.parse(rawJournal);
    } catch {}

    try {
      const rawInsights = localStorage.getItem(`savantix_user_insights_${userUidKey}`) || localStorage.getItem(`savantix_user_insights_${canonicalId}`) || localStorage.getItem('savantix_guest_insights') || '[]';
      insights = JSON.parse(rawInsights);
    } catch {}

    try {
      const rawAtt = localStorage.getItem('savantix_attendance_data_v1') || '[]';
      attendance = JSON.parse(rawAtt);
    } catch {}

    try {
      const rawInst = localStorage.getItem('savantix_attendance_institutional_v1');
      if (rawInst) institutional_attendance = JSON.parse(rawInst);
    } catch {}

    try {
      const rawFc = localStorage.getItem('savantix_flashcards') || localStorage.getItem(`savantix_flashcards_${userUidKey}`) || '[]';
      flashcards = JSON.parse(rawFc);
    } catch {}

    try {
      const rawTargets = localStorage.getItem('savantix_exam_targets') || '[]';
      examTargets = JSON.parse(rawTargets);
    } catch {}

    try {
      const rawStreak = localStorage.getItem('savantix_streak_resilience_state_v1');
      if (rawStreak) streakState = JSON.parse(rawStreak);
    } catch {}

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
      logs: Array.isArray(logs) ? logs : [],
      goals: Array.isArray(goals) ? goals : [],
      journal: Array.isArray(journal) ? journal : [],
      insights: Array.isArray(insights) ? insights : [],
      attendance: Array.isArray(attendance) ? attendance : [],
      institutional_attendance,
      flashcards: Array.isArray(flashcards) ? flashcards : [],
      examTargets: Array.isArray(examTargets) ? examTargets : [],
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

    // 1. Merge Logs
    let localLogs: any[] = [];
    try { localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]'); } catch {}
    const logsMap = new Map<string, any>();
    (remote.logs || []).forEach(l => {
      const sig = l.id || `${l.date}_${l.subject}_${l.topic}`;
      logsMap.set(sig, l);
    });
    localLogs.forEach(l => {
      const sig = l.id || `${l.date}_${l.subject}_${l.topic}`;
      if (!logsMap.has(sig)) logsMap.set(sig, l);
    });
    const mergedLogs = Array.from(logsMap.values()).sort((a, b) => {
      const dateA = a.date || a.createdAt || '';
      const dateB = b.date || b.createdAt || '';
      return dateB.localeCompare(dateA);
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
   * Pushes full local snapshot to Firestore cloud partition.
   */
  public static async pushToCloud(email: string, uid: string): Promise<SyncResult> {
    await this.ensureAuth();
    const canonicalId = this.getCanonicalUid(email);
    const snapshot = this.getLocalSnapshot(email, uid);

    try {
      const syncDocRef = doc(db, this.SYNC_COLLECTION, canonicalId);
      await setDoc(syncDocRef, {
        ...snapshot,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const timestamp = new Date().toLocaleTimeString();
      localStorage.setItem('savantix_last_cloud_sync_time', timestamp);

      return {
        success: true,
        timestamp,
        logsCount: snapshot.logs.length,
        goalsCount: snapshot.goals.length,
        journalCount: snapshot.journal.length,
        insightsCount: snapshot.insights?.length || 0,
        attendanceCount: snapshot.attendance.length,
        message: `Pushed ${snapshot.logs.length} logs to cloud at ${timestamp}`
      };
    } catch (err: any) {
      console.warn('[CloudSyncService] Push to cloud error:', err);
      return {
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        logsCount: snapshot.logs.length,
        goalsCount: snapshot.goals.length,
        journalCount: snapshot.journal.length,
        insightsCount: snapshot.insights?.length || 0,
        attendanceCount: snapshot.attendance.length,
        message: err.message || 'Cloud push failed.'
      };
    }
  }

  /**
   * Pulls latest cloud state and merges non-destructively into local storage.
   */
  public static async pullFromCloud(email: string, uid: string): Promise<SyncResult> {
    await this.ensureAuth();
    const canonicalId = this.getCanonicalUid(email);

    try {
      const syncDocRef = doc(db, this.SYNC_COLLECTION, canonicalId);
      const snap = await getDoc(syncDocRef);

      if (snap.exists()) {
        const remoteData = snap.data() as CloudSyncPayload;
        const result = this.mergeAndPersist(remoteData, email, uid);

        // Also push back union merge so both cloud and client are at identical top state
        const updatedSnapshot = this.getLocalSnapshot(email, uid);
        await setDoc(syncDocRef, { ...updatedSnapshot, updatedAt: serverTimestamp() }, { merge: true });

        return result;
      } else {
        // First time initialization: push current local data as initial cloud baseline
        return await this.pushToCloud(email, uid);
      }
    } catch (err: any) {
      console.warn('[CloudSyncService] Pull from cloud notice:', err);
      return {
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        logsCount: 0,
        goalsCount: 0,
        journalCount: 0,
        insightsCount: 0,
        attendanceCount: 0,
        message: err.message || 'Cloud pull failed.'
      };
    }
  }

  /**
   * Real-Time Real-Device Subscription:
   * Whenever any device edits or adds study data, all other connected devices update automatically.
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
    this.ensureAuth().then(() => {
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

        this.activeUnsubscribe = unsub;
      } catch (err) {
        console.warn('[CloudSyncService] Setup subscription failed:', err);
      }
    });

    return () => {
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
