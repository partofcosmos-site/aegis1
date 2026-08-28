import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BrainCircuit, Loader2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, login, continueAsGuest } = useAppContext();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const handleLogin = async () => {
    setErrorMsg(null);
    try {
      await login();
    } catch (error: any) {
      console.warn("Google Auth error:", error);
      const friendlyError = error?.code === 'auth/unauthorized-domain' 
        ? "Domain not authorized for authentication." 
        : "Sign-in failed. Please try again or use Guest Mode.";
        
      setErrorMsg(`${friendlyError} Transitioning to Guest Mode...`);
      setTimeout(() => {
        continueAsGuest();
      }, 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Savantix</h1>
            <p className="text-zinc-400 mt-2 text-sm font-medium">Universal AI Study & Decision-Support System</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <p className="text-zinc-300 text-xs leading-relaxed">
              Log study sessions naturally, build LaTeX/KaTeX flashcards, run Pomodoro intervals, and use 16 free AI models or custom endpoints.
            </p>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 p-2.5 rounded-lg">{errorMsg}</p>
            )}

            <div className="space-y-3">
              <button
                onClick={handleLogin}
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

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-zinc-800 w-full"></div>
                <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">or</span>
                <div className="border-t border-zinc-800 w-full"></div>
              </div>

              <button
                onClick={continueAsGuest}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer group"
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
