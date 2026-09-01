# Savantix (Aegis) — Comprehensive Survey & Architecture Analysis (R3 & R4)

**Prepared by:** Explorer 2  
**Date:** 2026-09-01  
**Project Root:** `C:\Users\white\master-hub\aegis1`  
**Target Scope:** Requirements R3 (Dynamic Daily AI Insight Regeneration) & R4 (Bidirectional Cross-Device Cloud Sync & Real-time Persistence)

---

## 1. Executive Summary

This investigation surveys the current architecture of Savantix (Aegis) regarding **Daily AI Insights Generation & Caching** and **Cross-Device Bidirectional Cloud Sync**.

Key findings:
1. **Insights Lifecycle & Stale Snapshot Issue**: `InsightsPanel.tsx` currently provides a one-time "Generate Daily Analysis" button when `!todayInsight`. Once generated, the panel enters a static render mode with **no mechanism to re-analyze** when subsequent sessions are logged later in the day. Furthermore, `insights` state is omitted from local cache rehydration on login and is absent from `CloudSyncService`.
2. **Dynamic Re-analysis Solution (R3)**: Implement an explicit, prominent **"🔄 Re-analyze with Latest Logs"** control in `InsightsPanel.tsx` (and quick trigger in `Dashboard.tsx`) that re-evaluates cumulative daily study time, problem throughput, mistake clusters, and PID equilibrium adjustments, overwriting the stale daily snapshot with zero data loss.
3. **Cross-Device Cloud Sync Architecture (R4)**: `CloudSyncService.ts` partitions data by deterministic canonical email hashes (`deb_sync_<sanitized_email>`), uses non-destructive union merges across 31+ storage keys, and listens to Firestore `/sync_hub/{canonicalId}` via `onSnapshot`.
4. **Critical Sync Flaws & Enhancements Identified**:
   - `onAuthStateChanged` anonymous auth triggers overwriting `savantix_user_session` if `authUser.email` is null, defaulting to `scholar@savantix.app` / `guest_user` unless cached email is preserved.
   - `insights` array is not currently synchronized across devices in `CloudSyncService.ts` or reloaded upon authenticated session bootstrap in `AppContext.tsx`.
   - Real-time listener (`subscribeToCloudSync`) needs immediate activation upon app boot when `savantix_user_session` is present in `localStorage`.

---

## 2. Deep Dive: Daily AI Insights Generation & Caching

### 2.1 Current Workflow & Component Flow
```
[User logs study session via LogInput / MicroLogger]
           │
           ▼
[AppContext.addLog updates `logs` state & localStorage]
           │
           ▼
[Dashboard.tsx renders <InsightsPanel selectedDate={selectedDate} />]
           │
           ├── If `!todayInsight` (no insight for selectedDate):
           │     └─ Shows empty placeholder + "Generate Daily Analysis" button.
           │     └─ Clicking triggers UniversalAIService.generateDailyInsights(todayLogs, constraints)
           │     └─ Calls addInsight(...) in AppContext
           │
           └── If `todayInsight` exists:
                 └─ Renders static Performance Summary, Mistakes & Weaknesses, Next Day Plan, Warnings.
                 └─ ❌ NO button to re-analyze or update with new logs.
```

### 2.2 Stale Snapshot Mechanism & Limitations
1. **Static UI Lock**: When `todayInsight = insights.find(i => i.date === selectedDate)` is truthy, the render branch only shows the output cards. If a user logs a 90-minute Physics session at 10:00 AM, generates insights, and later completes a 120-minute Mathematics session at 4:00 PM and a 60-minute Chemistry session at 9:00 PM, the insights panel remains permanently locked to the 10:00 AM snapshot.
2. **Missing Session Multiplicity**: The prompt in `UniversalAIService.generateDailyInsights` receives `todayLogs` at generation time. When new logs are added, `todayLogs` in `InsightsPanel` expands, but no automatic or manual trigger re-evaluates the AI output.
3. **State Rehydration Gap in `AppContext.tsx`**:
   - In `addInsight`: Writes to `savantix_user_insights_${user.uid}` and Firestore `daily_insights`.
   - In `authenticateUser` / `useEffect`: `savantix_user_insights_${uid}` is **NEVER read back** into `insights` state on page reload! Only guest mode reads `savantix_guest_insights`.

### 2.3 Implementation Design: "🔄 Re-analyze with Latest Logs" (R3)
- **UI Architecture in `InsightsPanel.tsx`**:
  - Replace the static card header with an interactive control bar:
    - **Header Title**: "Daily AI Cognitive Insights"
    - **Session Badge**: "Evaluated on $N$ sessions ($X$ mins) • Active: $M$ sessions ($Y$ mins)"
    - **Action Button**: `[🔄 Re-analyze with Latest Logs]`
      - Icon: `RotateCcw` or `Sparkles` with spin animation during generation (`Loader2`).
      - Disabled when `todayLogs.length === 0` or while `isGenerating`.
      - Tooltip: "Re-evaluate cumulative daily performance, recalculate mistake patterns, and refresh next-day plan with your latest study logs."
- **Data Aggregation & Prompt Payload**:
  - Compute cumulative session statistics for `selectedDate`:
    - Total focus minutes and subject breakdown.
    - Total problem count and weighted average efficiency/focus scores.
    - Aggregated mistake notes and error categories across all sessions.
    - PID equilibrium subject skew and recommendations.
  - Dispatch to `UniversalAIService.generateDailyInsights(todayLogs, constraints)`.
  - Call `addInsight(...)` which atomically replaces the insight for `selectedDate` in `AppContext` state and updates both `localStorage` and Firestore.

---

## 3. Deep Dive: Cross-Device Bidirectional Cloud Sync

### 3.1 Partitioning & Identity Architecture
`CloudSyncService` maps user email addresses to deterministic canonical partition keys:
```typescript
public static getCanonicalUid(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return 'guest_user';
  const sanitized = clean.replace(/[^a-z0-9]/g, '_');
  return `deb_sync_${sanitized}`;
}
```
- `debanjan8686@gmail.com` $\rightarrow$ `deb_sync_debanjan8686_gmail_com`
- `partofcosmmos@gmail.com` $\rightarrow$ `deb_sync_partofcosmmos_gmail_com`
- Firestore location: `/sync_hub/${canonicalId}`

All connected devices (Desktop PC, Laptop, Samsung Galaxy M56, Tablet) targeting the same email read and write to this exact document partition.

### 3.2 Non-Destructive Additive Union Merge (`mergeAndPersist`)
To enforce the **Zero Data Loss Invariant**, `CloudSyncService.mergeAndPersist` performs non-destructive union merges across all data domains:

| Data Domain | Storage Key | Merge Signature / Strategy | Invariant Guarantee |
|-------------|-------------|----------------------------|---------------------|
| **Study Logs** | `savantix_user_logs_${uid}` | `log.id \|\| \`${log.date}_${log.subject}_${log.topic}\`` | All local and remote logs preserved in Map, sorted desc by date |
| **Goals & Targets** | `savantix_user_goals_${uid}` | `goal.id \|\| goal.title` | Existing progress preserved, new remote goals incorporated |
| **Daily Journal** | `savantix_user_journal_${uid}` | `journal.id \|\| \`${journal.date}_${journal.title}\`` | All reflections preserved without overwriting |
| **Attendance Data** | `savantix_attendance_data_v1` | `att.id \|\| att.name` | Subject records merged union |
| **Flashcards** | `savantix_flashcards` | `fc.id \|\| \`${fc.front}_${fc.deck}\`` | FSRS/SM-2 card decks merged union |
| **Exam Targets** | `savantix_exam_targets` | Array union merge | Exam dates and countdowns preserved |
| **Streak State** | `savantix_streak_resilience_state_v1` | Highest active streak / latest timestamp merge | 100 HP health bar & shield tokens preserved |
| **Fail-Safe Backup** | `savantix_logs_backup_latest` | Exact clone of latest merged logs | Secondary safety net if browser cache is cleared |

### 3.3 Real-Time Firestore Synchronization (`subscribeToCloudSync`)
1. **Subscription Hook**: `CloudSyncService.subscribeToCloudSync(email, uid, onDataUpdated)` attaches a real-time Firestore listener via `onSnapshot(doc(db, 'sync_hub', canonicalId))`.
2. **Loop Suppression**: A boolean concurrency mutex (`isSyncing = true`) prevents local merge writes from triggering redundant cyclic re-sync events.
3. **Instant React State Synchronization**: When remote changes are detected on another device (e.g. mobile session logged):
   - `mergeAndPersist` runs and updates local storage.
   - `onDataUpdated` callback in `AppContext.tsx` immediately executes:
     ```typescript
     setLogs(mergedLogs);
     setGoals(mergedGoals);
     setJournalEntries(mergedJournal);
     setInsights(mergedInsights);
     setSyncStatus({ isSyncing: false, lastSyncedAt: res.timestamp, message: res.message });
     ```
   - React components across the entire app re-render instantaneously with zero page refreshes.

---

## 4. Key Gaps & Strategic Recommendations

### Gap 1: Anonymous Auth Session Email Loss in `AppContext.tsx`
- **Issue**: In `AppContext.tsx` (lines 155–175), when `onAuthStateChanged` triggers with an anonymous Firebase user, `authUser.email` is null. If `authenticateUser` is invoked without checking `savedSession?.email`, it sets `email: 'scholar@savantix.app'` and canonical ID to `'guest_user'`, decoupling the device from the cloud partition.
- **Fix**: Preserve `savedSession?.email` if `authUser.email` is null or empty.

### Gap 2: Daily AI Insights Omitted from Cloud Sync
- **Issue**: `daily_insights` are stored in `savantix_user_insights_${uid}` locally and Firestore subcollection `users/{uid}/daily_insights`, but omitted from `CloudSyncPayload` and `mergeAndPersist` in `cloudSyncService.ts`.
- **Fix**: Add `insights: any[]` to `CloudSyncPayload`, include in `getLocalSnapshot`, and add signature-based merge `insight.id || insight.date` in `mergeAndPersist`.

### Gap 3: Daily Insights State Rehydration on Session Start
- **Issue**: On app launch / user login, `AppContext.tsx` reads logs, goals, and journal, but does NOT load `savantix_user_insights_${uid}` into `insights` state.
- **Fix**: Add `localStorage.getItem(\`savantix_user_insights_${userUidKey}\`)` to `authenticateUser` and `useEffect`.

### Gap 4: Add "🔄 Re-analyze with Latest Logs" in `InsightsPanel.tsx`
- **Issue**: Once generated, daily insights cannot be refreshed with new afternoon/night logs.
- **Fix**: Add the re-analyze button in `InsightsPanel.tsx` header with dynamic session count comparison and instant recalculation.

---

## 5. Verification Plan

1. **TypeScript Compilation**: Verify `node node_modules/typescript/bin/tsc --noEmit` returns 0 errors.
2. **Zero Data Loss Invariant**: Verify all 31+ storage keys, canonical hash formulas, and non-destructive union merges pass in `src/test/zeroDataLoss.test.ts`.
3. **Cross-Device Sync Simulation**: Verify simulated multi-device payloads for `debanjan8686@gmail.com` and `partofcosmmos@gmail.com` merge bidirectionally without dropping any sessions.
4. **Dynamic Re-analysis Verification**: Verify that adding a second study log on the same date enables the "Re-analyze with Latest Logs" action and refreshes performance summary and action plans.
