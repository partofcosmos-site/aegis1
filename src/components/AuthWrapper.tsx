import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BrainCircuit, Loader2, Sparkles, ShieldCheck, ArrowRight, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, login, loginWithEmail, continueAsGuest } = useAppContext();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
          <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-medium tracking-wide">Initializing Savantix OS...</span>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      await login();
    } catch (error: any) {
      console.warn("Google Auth error:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User closed the popup window deliberately
        setErrorMsg(null);
      } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        setErrorMsg("This domain is pending Firebase authorization. Use 1-Click Quick Sign-In or Email below!");
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg("Browser blocked the Google popup. Please allow popups or use Email Sign-In.");
      } else {
        setErrorMsg(error.message || "Failed to sign in with Google. Please try Email Sign-In.");
      }
    } finally {
      setIsGoogleLoading(false);
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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10">
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-xl shadow-indigo-600/25 ring-1 ring-white/20 mb-2">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              Savantix
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.4
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xs mx-auto">
              Universal STEM Decision Support & Cognitive Velocity System
            </p>
          </div>

          {/* Main Auth Card */}
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/50 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            {/* Primary Google Auth Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-zinc-800/90 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-700/80 hover:border-indigo-500/60 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 group"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Clean Section Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-zinc-900 px-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold whitespace-nowrap">
                Or Sign In with Email
              </span>
              <div className="border-t border-zinc-800 w-full" />
            </div>

            {/* Email Sign-In Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!emailInput.trim() || isSubmittingEmail}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/25 disabled:shadow-none disabled:cursor-not-allowed group"
              >
                {isSubmittingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Offline / Demo Explore Option */}
            <div className="pt-1">
              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full flex items-center justify-center gap-2 bg-zinc-950/60 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700 px-4 py-2.5 rounded-2xl font-medium text-xs transition-all cursor-pointer group"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explore Demo / Offline Mode</span>
              </button>
            </div>

            {/* Security Badge */}
            <div className="pt-2 text-center border-t border-zinc-800/60">
              <span className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Leakage Architecture • 100% Free & Open
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
