# Savantix (Aegis) — Context & Engineering Constitution
> "The rate of feedback is your speed limit. Never take on a task blind." — The Pragmatic Programmer

## 1. Domain Model & Project Overview
Savantix is a high-performance, distraction-free **STEM Decision Support & Institutional Attendance Operating System** built for competitive scholars and students.

### Key Subsystems:
* **Attendance Reality Math Engine**: Dynamic CBSE compliance tracker (75% statutory safe threshold, 60% medical condonation floor) with live recovery formulas, projected safe leaves, and institutional calendar ingestion.
* **Universal Focus Engine**: Distraction-free YouTube music streamer with custom postMessage iframe communication, loop management, and zero background throttling.
* **Dynamic Daily Insights**: Cognitive efficiency score calculation and mistake-pattern extraction that recalculates whenever new study logs are added.
* **AI Gateway & STEM Derivations**: Fast frontier model router (GPT-4o, Claude, Gemini 2.5 Pro, DeepSeek R1, Perplexity) with KaTeX math rendering and Socratic derivations.
* **Cross-Platform Synchronization**: Additive, non-destructive bi-directional sync across Web and Native Android (Capacitor 8) with Android Home Screen RemoteViews Widget.

---

## 2. Non-Negotiable Invariants (Strict Engineering Rules)

### Rule 1: Universal Anonymity (Zero Identity Leaks)
* Savantix is a **universal product**.
* **NEVER** expose personal founder names, private email addresses, or personal identity chips in the public UI or login screens.
* Keep all auth flows generic: "Continue with Google", "Sign in with Email", "Demo Mode".
* Institutional datasets (e.g. The Bandhan School Aranghata) belong to the specific scholar account and must **never** be forced onto neutral guest or foreign accounts.

### Rule 2: Zero Data Loss (Strict Additive Merging)
* NEVER delete, wipe, or destructively overwrite study logs, goals, reflections, or attendance records.
* Any cloud sync or local hydration must execute a **non-destructive union merge**.

### Rule 3: 60fps Performance (No Aggressive Polling)
* Avoid aggressive setInterval loops (<30s).
* Use event-driven triggers (`window.focus`, `visibilitychange`, Firestore `onSnapshot`) and content fingerprints (`getContentFingerprint`) to prevent unnecessary React re-renders.

### Rule 4: Native Android RemoteViews Integrity
* Android Home Screen widgets (`RemoteViews`) **only** support a strict XML whitelist (`LinearLayout`, `FrameLayout`, `RelativeLayout`, `TextView`, `ImageView`, `Button`).
* **NEVER** use `<View>` tags or modern attributes like `android:marginHorizontal` or `android:paddingVertical` in `savantix_widget_layout.xml`.
* Always wrap widget updates in defensive `try/catch` to prevent launcher crashes.

---

## 3. Fast Verification Seams (How to Verify Before Claiming "Done")

Always verify in this order before completing a task:

1. **TypeScript Compilation**:
   ```powershell
   npx tsc --noEmit
   ```
2. **Comprehensive Test Suite (62/62 Tests across 9 Suites)**:
   ```powershell
   npx tsx src/test/allTests.test.ts
   ```
3. **Vite Production Bundle & Capacitor Sync**:
   ```powershell
   npm run build:mobile
   ```
4. **Android Native APK Build (when touching Android/Widget files)**:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   .\android\gradlew.bat -p android assembleDebug
   Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "savantix-debug.apk" -Force
   ```
