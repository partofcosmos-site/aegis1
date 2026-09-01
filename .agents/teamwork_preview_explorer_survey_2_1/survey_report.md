# Survey Report: R1 — Contact & Community Feedback Hub

**Author**: Explorer 1 (Savantix Survey Phase)  
**Date**: 2026-08-31  
**Target Platform**: Savantix (Aegis) — Study Optimization Platform  
**Target Path**: `C:\Users\white\master-hub\aegis1`

---

## 1. Executive Summary

This report establishes the complete architectural specification and implementation blueprint for **R1: Contact & Community Feedback Hub** in Savantix (Aegis).

The proposed system delivers:
1. A dedicated, beautifully styled **Contact & Feedback Hub** component (`src/components/ContactFeedback.tsx`) seamlessly integrated into the navigation sidebar and mobile header.
2. A **100% free, zero-backend, client-side submission engine** utilizing FormSubmit AJAX (`https://formsubmit.co/ajax/debanjan8686@gmail.com`) with a secondary Web3Forms adapter, combined with an automated `mailto:` fallback and clipboard copy generator to guarantee 100% transmission reliability.
3. Four dedicated feedback categories (**Bug Report**, **Feature Request**, **Academic Collaboration**, **General Inquiry**) with tailored metadata fields, real-time client-side validation, and optional anonymized environment diagnostics.
4. Instant animated toast notifications for success/error feedback, automatic form reset upon successful dispatch, and local draft persistence so user input is never lost.
5. Strict adherence to the **Zero Data Loss Guarantee** — no mutation of existing logged study sessions, goals, streaks, or profile targets.

---

## 2. Codebase Investigation & Existing Patterns

### 2.1 Navigation & Tab Routing Architecture
- **`src/App.tsx`**:
  - State: `const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');`
  - Global navigation listener: `window.addEventListener('navigate', handleNavigate);` listening for `e.detail.tab`.
  - Viewport persistence: Uses `className={`h-full w-full ${activeTab === 'xyz' ? 'block' : 'hidden'}`}` to preserve background timers, solver states, and streams across tab switches.
  - Action required: Add `'feedback'` to `ActiveTabType` and render `<ContactFeedback />` in the persistent tab viewport.

- **`src/components/Layout.tsx`**:
  - Defines `ActiveTabType`: `'dashboard' | 'chat' | 'analytics' | 'solver' | 'graph' | 'flashcards' | 'journal' | 'goals' | 'pomodoro' | 'settings' | 'vault'`.
  - Renders sidebar navigation (`<nav className="flex-1 p-4 space-y-1 overflow-y-auto">`) with responsive mobile slide-out menu.
  - Contains user profile footer card with Founder badge (`Crown`) and sign-out button.
  - Action required: Add `{ id: 'feedback', label: 'Contact & Feedback', icon: MessageSquareHeart }` to `tabs` and add an accessible quick-action trigger.

### 2.2 Modal & HUD Patterns
- **`src/components/MicroLoggerModal.tsx`**:
  - Modal container: `fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md`.
  - Keybindings: Global hotkey (`Alt+L` / `Ctrl+K`), `Esc` to close, `Enter` to commit.
  - Pattern recommendation: `ContactFeedback.tsx` can support both a full-page view (when accessed via sidebar tab) and an embedded modal / overlay mode (if invoked as a quick modal from anywhere in the app).

### 2.3 Toast & Notification Handling
- **Current App Status**:
  - `src/components/Dashboard.tsx`: Local `toastMessage` state rendered as `fixed top-5 right-5 z-50 bg-zinc-900 border border-indigo-500/50 text-indigo-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2`.
  - `src/components/ConceptGraph.tsx`: Local `feedbackToast` with typed alerts (`success`, `error`, `info`) and auto-dismissal via `setTimeout`.
  - `src/components/StemSolver.tsx`: Local `flashcardToast` with timer-based dismissal.
- **Recommendation for Feedback Hub**:
  - Implement a dedicated, animated toast banner inside `ContactFeedback.tsx` featuring checkmark/alert icons, smooth CSS animations (`animate-in fade-in slide-in-from-top-2`), and a timer-based auto-dismiss (4000ms), alongside explicit banner state in the form.

---

## 3. Feedback Submission Engine Architecture

### 3.1 100% Free Client-Side Pipeline

```
┌────────────────────────────────────────────────────────┐
│               User Submits Feedback Form               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
           ┌──────────────────────────────────┐
           │ Client-Side Validation (< 1ms)   │
           │ • Email regex                    │
           │ • Min length checks              │
           │ • Category verification          │
           └────────────────┬─────────────────┘
                            │ Valid
                            ▼
           ┌──────────────────────────────────┐
           │ Primary: FormSubmit AJAX POST    │
           │ https://formsubmit.co/ajax/...   │
           │ Payload: JSON with custom subject│
           └────────────────┬─────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Success (200 OK)           Network Failure / CORS Block
              │                           │
              ▼                           ▼
   ┌───────────────────────┐   ┌─────────────────────────────┐
   │ • Show Success Toast  │   │ • Show Error Banner         │
   │ • Clear Form & Draft  │   │ • Offer 1-Click Mailto Link │
   │ • Log to Local History│   │ • Copy Payload to Clipboard │
   └───────────────────────┘   └─────────────────────────────┘
```

### 3.2 Primary Provider: FormSubmit AJAX
- **Endpoint**: `https://formsubmit.co/ajax/debanjan8686@gmail.com`
- **Cost**: 100% Free, zero backend infrastructure, zero API keys required.
- **Request Format**:
  ```typescript
  const response = await fetch('https://formsubmit.co/ajax/debanjan8686@gmail.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      category: formData.category,
      _subject: `[Savantix Feedback: ${formData.category}] ${formData.subject}`,
      subject: formData.subject,
      message: formData.message,
      diagnostics: formData.includeDiagnostics ? getSystemDiagnostics() : undefined,
      _template: 'table',
      _captcha: 'false'
    })
  });
  ```

### 3.3 Fail-Safe Fallbacks
1. **Direct `mailto:` Generator**:
   - Pre-formats: `mailto:debanjan8686@gmail.com?subject=[Savantix%20Feedback]%20...&body=...`
   - Opened automatically or via a distinct button if network submission fails or user prefers desktop email client.
2. **Clipboard One-Click Copy**:
   - Copies the full structured feedback payload so the user never loses their writing.
3. **Local Draft Auto-Save**:
   - Uses `localStorage.setItem('savantix_feedback_draft', JSON.stringify(formData))` on keystrokes, cleared on successful dispatch.
4. **Sent Feedback History**:
   - Saves submitted tickets to `localStorage.getItem('savantix_submitted_feedback')` so users can reference past reports and suggestions.

---

## 4. Feature Specification & Category Matrix

| Category | Icon | Theme Colors | Purpose & Specific Fields |
|---|---|---|---|
| **🐛 Bug Report** | `Bug` | Rose (`rose-500`) | Issues, unexpected behavior, UI glitches. Includes toggle for Anonymized System Diagnostics (Browser, OS, Screen resolution, App version, LocalStorage integrity status). |
| **💡 Feature Request** | `Lightbulb` | Amber (`amber-400`) | New tool proposals, UI enhancements, study velocity ideas, priority ranking (Low / Medium / High / Critical). |
| **🔬 Academic Collaboration** | `GraduationCap` | Indigo (`indigo-400`) | Physics Olympiad (IPhO), JEE Advanced preparation, research initiatives, institution/affiliation details. |
| **💬 General Inquiry** | `MessageSquare` | Emerald (`emerald-400`) | General questions, user feedback, community discussion, founder direct connect. |

---

## 5. UI/UX Design & Community Touchpoints

The page is designed with a premium, distraction-free aesthetic matching the Savantix dark-mode theme (`bg-zinc-950`, `border-zinc-800`, `text-zinc-100`):

1. **Header Section**:
   - Gradient badge: "Community & Support Hub"
   - Title: "Contact & Community Feedback"
   - Subtitle: "Direct connection with the creator & open-source community"
   - System Status Pill: `● All Systems Operational • Offline-First Engine`

2. **Main Layout (Grid on Desktop, Stack on Mobile)**:
   - **Left Column (Feedback Submission Card)**:
     - Category pills selector with active indicator badges.
     - Name input (prefilled from User profile).
     - Email input (validated with regex).
     - Subject / Title input.
     - Message textarea with character counter.
     - Anonymized Diagnostics toggle (for Bug Reports).
     - Submit button with loading spinner & secure transmission badge.
     - Interactive toast & status banner with instant retry / mailto fallback.
   - **Right Column (Community Hub & Quick Resources)**:
     - **Founder Channel Card**: Debanjan Biswas ("Bidu") profile, direct email (`debanjan8686@gmail.com`), GitHub repository link.
     - **FAQ Accordion**:
       - *Zero Data Loss Guarantee*: Explains how study logs, goals, and streaks are safely preserved locally and in Firestore.
       - *AI Vault & Privacy*: Explains client-side API key encryption and local execution.
       - *Response Time*: Typical turnaround for bug fixes and feature reviews.
     - **Previous Submissions Log Tab**: Shows user's local history of submitted feedback tickets.

---

## 6. Implementation File Plan

### 6.1 New Files to Create:
1. `src/components/ContactFeedback.tsx`:
   - Comprehensive feedback submission form, category picker, diagnostics engine, toast notifications, draft auto-save, sent history viewer, and community FAQ links.

### 6.2 Files to Modify:
1. `src/components/Layout.tsx`:
   - Extend `ActiveTabType` to include `'feedback'`.
   - Add `{ id: 'feedback', label: 'Contact & Feedback', icon: MessageSquareHeart }` (or `MessageSquareShare` / `HelpCircle`) to `tabs`.
   - Add quick trigger button in sidebar footer or mobile navigation.
2. `src/App.tsx`:
   - Import `ContactFeedback`.
   - Add `<div className={`h-full w-full ${activeTab === 'feedback' ? 'block' : 'hidden'}`}><ContactFeedback /></div>` into the persistent tab viewport.

---

## 7. Verification & Quality Assurance Plan

1. **Compilation Audit**:
   - Execute `node node_modules/typescript/bin/tsc --noEmit` to verify 0 type errors.
2. **Production Bundle Verification**:
   - Execute `node node_modules/vite/bin/vite.js build` to ensure clean asset bundling.
3. **Zero Data Loss Verification**:
   - Verify that all `localStorage` keys (`savantix_logs`, `savantix_streak_state`, `savantix_goals`, `savantix_user_profile`) remain completely untouched.
4. **Form Flow Verification**:
   - Test category selection, field validation (invalid email, short subject, empty message).
   - Test FormSubmit AJAX submission, success toast notification, and form reset.
   - Test offline/error fallback, triggering the mailto generator and clipboard copy.
   - Test draft auto-save and sent feedback history persistence.

---
*Report compiled by Explorer 1. Ready for Team Lead Review and Implementation Phase.*
