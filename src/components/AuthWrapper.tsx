import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BrainCircuit, Loader2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, login, loginWithEmail, continueAsGuest } = useAppContext();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [emailInput, setEmailInput] = React.useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await login();
    } catch (error: any) {
      console.warn("Google Auth popup fallback:", error);
      // Focus email input seamlessly without displaying ugly restriction warnings
      const emailEl = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailEl) {
        emailEl.focus();
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setErrorMsg(null);
    setIsSubmittingEmail(true);
    try {
      await loginWithEmail(emailInput);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with email.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/20">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Savantix</h1>
            <p className="text-zinc-400 mt-2 text-sm font-medium">Universal AI Study & Decision-Support System</p>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            <p className="text-zinc-300 text-xs leading-relaxed text-center">
              Log study sessions naturally, build LaTeX/KaTeX flashcards, run Pomodoro intervals, and use 16 free AI models or custom endpoints.
            </p>

            {errorMsg && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl text-center leading-relaxed">
                {errorMsg}
              </p>
            )}

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-zinc-800 w-full"></div>
                <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">or email sign in</span>
                <div className="border-t border-zinc-800 w-full"></div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!emailInput.trim() || isSubmittingEmail}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {isSubmittingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue with Email'}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-zinc-800 w-full"></div>
                <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">or</span>
                <div className="border-t border-zinc-800 w-full"></div>
              </div>

              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 px-5 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Explore Demo / Offline Mode</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-zinc-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & Zero-Leakage Architecture
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
