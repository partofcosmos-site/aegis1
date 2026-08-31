import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  MessageSquareHeart,
  Bug,
  Lightbulb,
  GraduationCap,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  Check,
  RefreshCw,
  Mail,
  ExternalLink,
  ShieldCheck,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Terminal,
  User,
  Clock,
  Zap,
  HelpCircle,
  ArrowRight,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export type FeedbackCategory = 'bug' | 'feature' | 'academic' | 'inquiry';
export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical';
export type AcademicFocus = 'ipho' | 'jee' | 'research' | 'general_academic';

export interface SubmittedTicket {
  id: string;
  timestamp: string;
  category: FeedbackCategory;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority?: FeaturePriority;
  academicFocus?: AcademicFocus;
  affiliation?: string;
  diagnosticsIncluded?: boolean;
  deliveryMethod: 'FormSubmit AJAX' | 'mailto Fallback' | 'Clipboard Export';
  status: 'Delivered' | 'Exported';
}

const DRAFT_STORAGE_KEY = 'savantix_feedback_draft';
const HISTORY_STORAGE_KEY = 'savantix_submitted_feedback';
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/debanjan8686@gmail.com';
const FOUNDER_EMAIL = 'debanjan8686@gmail.com';
const FOUNDER_GITHUB = 'https://github.com/debanjan8686';

export const ContactFeedback: React.FC = () => {
  const { user } = useAppContext();

  // Active view tab: 'form' | 'history' | 'faq'
  const [activeView, setActiveView] = useState<'form' | 'history' | 'faq'>('form');

  // Form states
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<FeaturePriority>('medium');
  const [academicFocus, setAcademicFocus] = useState<AcademicFocus>('ipho');
  const [affiliation, setAffiliation] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [showDiagnosticsPreview, setShowDiagnosticsPreview] = useState(false);

  // UI / Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<SubmittedTicket | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Submission History
  const [history, setHistory] = useState<SubmittedTicket[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // FAQ Accordion
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  // Validation touch states
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load draft & history on initial mount
  useEffect(() => {
    // 1. Load History
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse feedback history:', err);
    }

    // 2. Load Draft
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.category) setCategory(draft.category);
        if (draft.name) setName(draft.name);
        if (draft.email) setEmail(draft.email);
        if (draft.subject) setSubject(draft.subject);
        if (draft.message) setMessage(draft.message);
        if (draft.priority) setPriority(draft.priority);
        if (draft.academicFocus) setAcademicFocus(draft.academicFocus);
        if (draft.affiliation) setAffiliation(draft.affiliation);
        if (typeof draft.includeDiagnostics === 'boolean') setIncludeDiagnostics(draft.includeDiagnostics);
        setHasDraft(true);
      } else {
        // Prefill from authenticated user if no draft
        if (user?.displayName && !name) setName(user.displayName);
        if (user?.email && !email) setEmail(user.email);
      }
    } catch (err) {
      console.warn('Failed to parse feedback draft:', err);
    }
  }, [user]);

  // Adjust default diagnostics toggle when category changes
  const handleCategoryChange = (newCategory: FeedbackCategory) => {
    setCategory(newCategory);
    if (newCategory === 'bug') {
      setIncludeDiagnostics(true);
    }
  };

  // Auto-save draft on changes
  useEffect(() => {
    if (!name && !email && !subject && !message) {
      return;
    }
    const draftPayload = {
      category,
      name,
      email,
      subject,
      message,
      priority,
      academicFocus,
      affiliation,
      includeDiagnostics,
      lastSaved: new Date().toISOString()
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      setHasDraft(true);
    } catch (e) {
      console.warn('Could not save draft to localStorage:', e);
    }
  }, [category, name, email, subject, message, priority, academicFocus, affiliation, includeDiagnostics]);

  // System Diagnostics Extractor (Safe & Non-invasive)
  const diagnosticsData = useMemo(() => {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform || 'Browser' : 'Browser',
      language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
      screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height} (DPR: ${window.devicePixelRatio || 1})` : 'N/A',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
      onlineStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0 (Savantix Aegis Edition)',
      storageHealth: {
        logsExist: Boolean(localStorage.getItem('savantix_logs')),
        streakExists: Boolean(localStorage.getItem('savantix_streak_state')),
        goalsExist: Boolean(localStorage.getItem('savantix_goals')),
        profileExists: Boolean(localStorage.getItem('savantix_user_profile')),
      }
    };
  }, []);

  // Real-time Validation Checks
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = email.trim() === '' || emailRegex.test(email.trim());
  const isEmailFilledAndValid = email.trim() !== '' && emailRegex.test(email.trim());
  const isNameValid = name.trim().length >= 2;
  const isSubjectValid = subject.trim().length >= 3;
  const isMessageValid = message.trim().length >= 10;

  const isFormValid = isEmailFilledAndValid && isNameValid && isSubjectValid && isMessageValid;

  // Clear Draft Handler
  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setName(user?.displayName || '');
    setEmail(user?.email || '');
    setSubject('');
    setMessage('');
    setAffiliation('');
    setHasDraft(false);
    setTouched({ name: false, email: false, subject: false, message: false });
    showToast('Draft cleared successfully', 'info');
  };

  // Construct structured payload text
  const getStructuredPayloadText = () => {
    let content = `================ SAVANTIX FEEDBACK TICKET ================\n`;
    content += `Category: ${category.toUpperCase()}\n`;
    content += `Sender: ${name} <${email}>\n`;
    content += `Subject: ${subject}\n`;
    content += `Timestamp: ${new Date().toISOString()}\n`;
    if (category === 'feature') {
      content += `Priority: ${priority.toUpperCase()}\n`;
    }
    if (category === 'academic') {
      content += `Academic Focus: ${academicFocus.toUpperCase()}\n`;
      content += `Affiliation: ${affiliation || 'Independent'}\n`;
    }
    content += `\n--- MESSAGE ---\n${message}\n`;
    if (includeDiagnostics) {
      content += `\n--- SYSTEM DIAGNOSTICS ---\n${JSON.stringify(diagnosticsData, null, 2)}\n`;
    }
    content += `==========================================================`;
    return content;
  };

  // Generate mailto link
  const mailtoUrl = useMemo(() => {
    const sub = encodeURIComponent(`[Savantix ${category.toUpperCase()}] ${subject || 'Feedback'}`);
    let body = `Hi Debanjan,\n\nName: ${name}\nEmail: ${email}\nCategory: ${category}\n`;
    if (category === 'feature') body += `Priority: ${priority}\n`;
    if (category === 'academic') body += `Focus: ${academicFocus}\nAffiliation: ${affiliation}\n`;
    body += `\nMessage:\n${message}\n`;
    if (includeDiagnostics) {
      body += `\n--- Diagnostics ---\n${JSON.stringify(diagnosticsData, null, 2)}\n`;
    }
    return `mailto:${FOUNDER_EMAIL}?subject=${sub}&body=${encodeURIComponent(body)}`;
  }, [category, subject, name, email, priority, academicFocus, affiliation, message, includeDiagnostics, diagnosticsData]);

  // Copy Payload Handler
  const handleCopyPayload = async () => {
    try {
      const payload = getStructuredPayloadText();
      await navigator.clipboard.writeText(payload);
      setCopiedPayload(true);
      showToast('📋 Feedback payload copied to clipboard!', 'success');
      setTimeout(() => setCopiedPayload(false), 3000);
    } catch (e) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Copy Founder Email Handler
  const handleCopyFounderEmail = async () => {
    try {
      await navigator.clipboard.writeText(FOUNDER_EMAIL);
      setCopiedEmail(true);
      showToast('📧 Founder email copied to clipboard!', 'success');
      setTimeout(() => setCopiedEmail(false), 3000);
    } catch (e) {
      showToast('Failed to copy email', 'error');
    }
  };

  // Record Ticket to History
  const saveTicketToHistory = (deliveryMethod: 'FormSubmit AJAX' | 'mailto Fallback' | 'Clipboard Export') => {
    const newTicket: SubmittedTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      category,
      name,
      email,
      subject,
      message,
      priority: category === 'feature' ? priority : undefined,
      academicFocus: category === 'academic' ? academicFocus : undefined,
      affiliation: category === 'academic' ? affiliation : undefined,
      diagnosticsIncluded: includeDiagnostics,
      deliveryMethod,
      status: deliveryMethod === 'FormSubmit AJAX' ? 'Delivered' : 'Exported'
    };

    const updatedHistory = [newTicket, ...history];
    setHistory(updatedHistory);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Failed to persist feedback history:', e);
    }
    return newTicket;
  };

  // Primary Submission Engine via FormSubmit AJAX
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true });

    if (!isFormValid) {
      showToast('Please correct the highlighted fields before sending', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const postData: Record<string, any> = {
      name,
      email,
      category: category.toUpperCase(),
      _subject: `[Savantix Feedback: ${category.toUpperCase()}] ${subject}`,
      subject,
      message,
      _template: 'table',
      _captcha: 'false',
    };

    if (category === 'feature') {
      postData.priority = priority.toUpperCase();
    }
    if (category === 'academic') {
      postData.academicFocus = academicFocus;
      postData.affiliation = affiliation || 'Independent';
    }
    if (includeDiagnostics) {
      postData.diagnostics = JSON.stringify(diagnosticsData, null, 2);
    }

    try {
      const response = await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success !== 'false') {
        const ticket = saveTicketToHistory('FormSubmit AJAX');
        setSubmitSuccess(ticket);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasDraft(false);
        setSubject('');
        setMessage('');
        setAffiliation('');
        setTouched({ name: false, email: false, subject: false, message: false });
        showToast('🎉 Feedback dispatched successfully to founder!', 'success');
      } else {
        throw new Error(data.message || 'FormSubmit endpoint returned an error response.');
      }
    } catch (err: any) {
      console.error('FormSubmit dispatch failed:', err);
      setSubmitError(
        err.message || 'Network dispatch encountered an issue. You can instantly use the 1-Click Mailto or Clipboard fallback below!'
      );
      showToast('Submission issue detected. Fallback options available.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete single history item
  const handleDeleteHistoryItem = (ticketId: string) => {
    const updated = history.filter(t => t.id !== ticketId);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      showToast('Ticket removed from local history', 'info');
    } catch (e) {
      console.warn('Failed to update history in storage:', e);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear your local feedback history?')) {
      setHistory([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      showToast('All feedback history cleared', 'info');
    }
  };

  // Category Configuration Matrix
  const categories = [
    {
      id: 'bug' as FeedbackCategory,
      name: 'Bug Report',
      icon: Bug,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      activeBg: 'bg-rose-600/20 text-rose-300 border-rose-500/50 shadow-rose-500/10',
      description: 'Report UI glitches, calculation anomalies, or sync bugs'
    },
    {
      id: 'feature' as FeedbackCategory,
      name: 'Feature Request',
      icon: Lightbulb,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      activeBg: 'bg-amber-600/20 text-amber-300 border-amber-500/50 shadow-amber-500/10',
      description: 'Propose new STEM tools, algorithmic enhancements, or workflows'
    },
    {
      id: 'academic' as FeedbackCategory,
      name: 'Academic Collab',
      icon: GraduationCap,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      activeBg: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-indigo-500/10',
      description: 'IPhO Physics, JEE Advanced, STEM research, or pedagogy'
    },
    {
      id: 'inquiry' as FeedbackCategory,
      name: 'General Inquiry',
      icon: MessageSquare,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      activeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10',
      description: 'General questions, founder connect, and community thoughts'
    }
  ];

  // FAQ Items Data
  const faqItems = [
    {
      id: 'faq-1',
      question: 'Zero Data Loss Guarantee: How is my study data protected?',
      answer: 'Savantix is built with an offline-first resilient architecture. All your logged study sessions, active streaks, shield tokens, flashcards, and Error Vault entries are saved in structured localStorage and synced to Firestore. The Feedback Hub uses an independent namespace and will never mutate, clear, or overwrite your academic records.'
    },
    {
      id: 'faq-2',
      question: 'AI Privacy & Vault: Are my API keys or private study notes shared?',
      answer: 'Never. Your personal AI provider keys (Gemini, OpenRouter, Groq, Ollama) and your private journal notes remain securely stored in your local browser vault. Feedback submissions only transmit the exact text and metadata you explicitly review and send in this form.'
    },
    {
      id: 'faq-3',
      question: 'Expected Response Time & Support SLA',
      answer: 'Critical bug reports are typically investigated and deployed within 24 to 48 hours. Feature requests and academic collaboration proposals are reviewed weekly by founder Debanjan Biswas. If you provide a valid email, you will receive a direct reply.'
    },
    {
      id: 'faq-4',
      question: 'How do Academic Collaborations (IPhO & JEE Advanced) work?',
      answer: 'We actively collaborate with Physics Olympiad medalists, JEE Advanced rankers, and cognitive science researchers to expand Savantix\'s Socratic STEM solvers, FSRS spaced repetition algorithms, and curated problem banks. Reach out via the Academic category!'
    }
  ];

  return (
    <div className="w-full px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className={clsx(
            "fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 border",
            toastMessage.type === 'success' && "bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-900/30",
            toastMessage.type === 'error' && "bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-900/30",
            toastMessage.type === 'info' && "bg-indigo-950/90 text-indigo-200 border-indigo-500/50 shadow-indigo-900/30"
          )}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-2">
              <MessageSquareHeart className="w-3.5 h-3.5 text-indigo-400" />
              <span>Community & Feedback Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
              Contact & Community Feedback
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Direct connection with founder <span className="text-zinc-200 font-medium">Debanjan Biswas</span> and the Savantix STEM community.
            </p>
          </div>

          {/* Operational Status Pill & Navigation Views */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FormSubmit Engine Active</span>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveView('form')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  activeView === 'form'
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  activeView === 'history'
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {history.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-950 border border-indigo-400/40 text-indigo-300 text-[10px] rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('faq')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  activeView === 'faq'
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>FAQ</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Grid: Left side interactive panel, Right side Founder card & quick helpers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Main Active View (Form / History / FAQ) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* VIEW 1: FORM SUBMISSION */}
            {activeView === 'form' && (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
                
                {/* Category Pills */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                    Select Feedback Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {categories.map(cat => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className={clsx(
                            "flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer group",
                            isSelected
                              ? cat.activeBg
                              : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                          )}
                        >
                          <Icon className={clsx("w-5 h-5 mb-1.5 transition-transform group-hover:scale-110", isSelected ? cat.color : "text-zinc-400")} />
                          <span className="text-xs font-semibold">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {categories.find(c => c.id === category)?.description}
                  </p>
                </div>

                {/* Success Banner */}
                {submitSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-bold text-emerald-300">Feedback Dispatched Successfully</h3>
                        <p className="text-xs text-emerald-200/80">
                          Thank you, {submitSuccess.name}! Your {submitSuccess.category} ticket has been routed to Debanjan Biswas via FormSubmit AJAX.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveView('history');
                              setSubmitSuccess(null);
                            }}
                            className="text-xs text-emerald-300 hover:text-emerald-100 underline font-medium cursor-pointer"
                          >
                            View in History Log →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubmitSuccess(null)}
                            className="text-xs text-zinc-400 hover:text-zinc-200 ml-3 cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner with 1-Click Fallbacks */}
                {submitError && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-rose-300">Transmission Fallback Active</h3>
                        <p className="text-xs text-rose-200/80">{submitError}</p>
                      </div>
                    </div>

                    {/* Instant 1-Click Fallback Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={mailtoUrl}
                        onClick={() => saveTicketToHistory('mailto Fallback')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send via Email Client (mailto:)</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPayload}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPayload ? 'Copied!' : 'Copy Ticket Payload'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Row: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                        <span>Your Name *</span>
                        {touched.name && !isNameValid && (
                          <span className="text-[10px] text-rose-400 font-semibold">Min 2 characters</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                          placeholder="e.g. Marie Curie"
                          className={clsx(
                            "w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all",
                            touched.name && !isNameValid
                              ? "border-rose-500/60 focus:ring-rose-500/40"
                              : "border-zinc-800 focus:border-indigo-500/60 focus:ring-indigo-500/30"
                          )}
                        />
                        <User className="w-4 h-4 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                        <span>Email Address *</span>
                        {touched.email && !isEmailValid && (
                          <span className="text-[10px] text-rose-400 font-semibold">Valid email required</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                          placeholder="debanjan@example.com"
                          className={clsx(
                            "w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all",
                            touched.email && !isEmailValid
                              ? "border-rose-500/60 focus:ring-rose-500/40"
                              : "border-zinc-800 focus:border-indigo-500/60 focus:ring-indigo-500/30"
                          )}
                        />
                        <Mail className="w-4 h-4 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fields: Feature Priority or Academic Affiliation */}
                  {category === 'feature' && (
                    <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <label className="block text-xs font-semibold text-amber-300 mb-2">
                        Feature Impact / Priority
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['low', 'medium', 'high', 'critical'] as FeaturePriority[]).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={clsx(
                              "px-2.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider border transition-all cursor-pointer",
                              priority === p
                                ? "bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-sm"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {category === 'academic' && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-300 mb-1.5">
                          Academic & STEM Focus
                        </label>
                        <select
                          value={academicFocus}
                          onChange={e => setAcademicFocus(e.target.value as AcademicFocus)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <option value="ipho">International Physics Olympiad (IPhO) / USAPhO</option>
                          <option value="jee">JEE Advanced Physics & Mathematics Optimization</option>
                          <option value="research">Cognitive Science & Memory Spacing (FSRS/Anki) Research</option>
                          <option value="general_academic">STEM Pedagogy & Socratic Solvers</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Institution / Organization (Optional)
                        </label>
                        <input
                          type="text"
                          value={affiliation}
                          onChange={e => setAffiliation(e.target.value)}
                          placeholder="e.g. MIT, IIT Bombay, Olympiad Foundation"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* Subject Input */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>Subject / Summary *</span>
                      {touched.subject && !isSubjectValid && (
                        <span className="text-[10px] text-rose-400 font-semibold">Min 3 characters</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, subject: true }))}
                      placeholder={
                        category === 'bug'
                          ? "e.g. Socratic Solver step 3 rendering glitch on mobile"
                          : category === 'feature'
                          ? "e.g. Export flashcards to Anki .apkg format"
                          : category === 'academic'
                          ? "e.g. IPhO Wave Optics simulation module collaboration"
                          : "e.g. Question regarding Savantix local storage persistence"
                      }
                      className={clsx(
                        "w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all",
                        touched.subject && !isSubjectValid
                          ? "border-rose-500/60 focus:ring-rose-500/40"
                          : "border-zinc-800 focus:border-indigo-500/60 focus:ring-indigo-500/30"
                      )}
                    />
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Detailed Description *
                      </label>
                      <div className="flex items-center gap-2">
                        {touched.message && !isMessageValid && (
                          <span className="text-[10px] text-rose-400 font-semibold">Min 10 characters</span>
                        )}
                        <span className={clsx("text-[10px] font-mono", message.length >= 10 ? "text-zinc-500" : "text-amber-400")}>
                          {message.length} chars
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                      placeholder={
                        category === 'bug'
                          ? "Describe the issue, what happened vs what you expected, and steps to reproduce..."
                          : category === 'feature'
                          ? "Describe the proposed tool or enhancement, why it will benefit STEM scholars, and suggested workflow..."
                          : category === 'academic'
                          ? "Share details about your academic background, Olympiad/research focus, and how you would like to collaborate..."
                          : "Type your inquiry or feedback here..."
                      }
                      className={clsx(
                        "w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all font-sans leading-relaxed resize-y",
                        touched.message && !isMessageValid
                          ? "border-rose-500/60 focus:ring-rose-500/40"
                          : "border-zinc-800 focus:border-indigo-500/60 focus:ring-indigo-500/30"
                      )}
                    />
                  </div>

                  {/* System Diagnostics Toggle (Especially useful for Bug reports) */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeDiagnostics}
                          onChange={e => setIncludeDiagnostics(e.target.checked)}
                          className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500/40 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                          Include Anonymized System Diagnostics
                        </span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => setShowDiagnosticsPreview(prev => !prev)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showDiagnosticsPreview ? 'Hide' : 'Preview'}</span>
                        {showDiagnosticsPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-500">
                      Attaches browser version, screen resolution, and local storage integrity status. Zero private study notes or keys are ever included.
                    </p>

                    {showDiagnosticsPreview && (
                      <pre className="mt-2 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-400 overflow-x-auto max-h-40">
                        {JSON.stringify(diagnosticsData, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Form Footer: Draft Notice & Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {hasDraft && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>Draft auto-saved locally</span>
                          <button
                            type="button"
                            onClick={handleClearDraft}
                            className="text-zinc-500 hover:text-rose-400 ml-1 underline cursor-pointer"
                            title="Clear saved draft"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Secondary Payload Copy */}
                      <button
                        type="button"
                        onClick={handleCopyPayload}
                        className="px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Copy structured ticket to clipboard"
                      >
                        {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                        <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Primary Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx(
                          "px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer",
                          isSubmitting
                            ? "bg-indigo-700 text-indigo-200 cursor-not-allowed opacity-75"
                            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                            <span>Dispatching via FormSubmit...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            )}

            {/* VIEW 2: SUBMISSION HISTORY */}
            {activeView === 'history' && (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-400" />
                      <span>Submitted Feedback Tickets</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Locally preserved record of your bug reports, feature requests, and collaboration inquiries.
                    </p>
                  </div>

                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mx-auto text-zinc-500">
                      <MessageSquareHeart className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-300">No Feedback Submitted Yet</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Whenever you submit a bug report or feature request, a copy of your ticket is archived right here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveView('form')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Compose New Feedback</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map(ticket => {
                      const isExpanded = expandedTicketId === ticket.id;
                      const catConfig = categories.find(c => c.id === ticket.category) || categories[0];
                      const Icon = catConfig.icon;

                      return (
                        <div
                          key={ticket.id}
                          className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className={clsx("p-2 rounded-lg border", catConfig.bgColor, catConfig.borderColor)}>
                                <Icon className={clsx("w-4 h-4", catConfig.color)} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-zinc-200">{ticket.subject}</h4>
                                  <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", catConfig.bgColor, catConfig.color)}>
                                    {ticket.category}
                                  </span>
                                  {ticket.priority && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold uppercase">
                                      {ticket.priority}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(ticket.timestamp), 'MMM dd, yyyy • HH:mm')}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-medium">{ticket.deliveryMethod}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHistoryItem(ticket.id)}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Delete Ticket"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Message Details */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-zinc-800/80 space-y-3 animate-in fade-in">
                              <div>
                                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                  Message Content
                                </span>
                                <p className="text-xs text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                                  {ticket.message}
                                </p>
                              </div>

                              {ticket.affiliation && (
                                <p className="text-xs text-zinc-400">
                                  <span className="text-zinc-500">Affiliation:</span> {ticket.affiliation}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-mono text-zinc-500">Ticket ID: {ticket.id}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(
                                      `Ticket: ${ticket.subject}\nCategory: ${ticket.category}\nTimestamp: ${ticket.timestamp}\n\n${ticket.message}`
                                    );
                                    showToast('Ticket copied to clipboard', 'success');
                                  }}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Content</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: FAQ & GUARANTEES */}
            {activeView === 'faq' && (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="pb-4 border-b border-zinc-800">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    <span>Frequently Asked Questions & Architecture Guarantees</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Clear transparent commitments on privacy, zero data loss, response times, and academic collaboration.
                  </p>
                </div>

                <div className="space-y-3">
                  {faqItems.map(faq => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 bg-zinc-900/30">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Founder Card & Community Touchpoints */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Founder Channel Card */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20">
                    <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                      <Zap className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                      Debanjan Biswas
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                        Bidu
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-400 font-medium">Founder & Core Architect, Savantix</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Physics Olympiad & JEE Advanced researcher building antifragile, socratic study operating systems for serious STEM scholars.
                </p>

                <div className="pt-2 space-y-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-zinc-500">Direct Email:</span>
                    <button
                      type="button"
                      onClick={handleCopyFounderEmail}
                      className="font-mono text-zinc-300 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy Email"
                    >
                      <span>{FOUNDER_EMAIL}</span>
                      {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-zinc-500">Repository:</span>
                    <a
                      href={FOUNDER_GITHUB}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>GitHub Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Quick Action Links */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <a
                    href={`mailto:${FOUNDER_EMAIL}?subject=[Savantix%20Inquiry]%20Direct%20Connect`}
                    className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700 cursor-pointer text-center"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Direct Mail</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyFounderEmail}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-800 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Address</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Zero Data Loss & Privacy Shield Badge */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Zero Data Loss Guarantee
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your study streaks, pomodoro focus metrics, flashcard SM-2 intervals, and custom solver models remain strictly isolated and preserved at all times.
              </p>
            </div>

            {/* Quick Tips Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Helpful Submission Tips
                </h4>
              </div>
              <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span>For bugs, keep system diagnostics enabled for instant environment reproduction.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span>For Olympiad solvers or new formula modules, specify your target syllabus in Academic focus.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Your drafts are auto-saved in local storage if you accidentally close or refresh your browser.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
