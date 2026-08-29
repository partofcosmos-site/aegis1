import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Hash, 
  Percent, 
  Tag, 
  Smile, 
  Keyboard,
  Flame,
  Layers
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseMicroLog, MicroLogEntity } from '../utils/microLogParser';
import { format } from 'date-fns';

interface MicroLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Physics: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  Chemistry: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  Mathematics: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  Biology: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  'Computer Science': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
  General: { bg: 'bg-zinc-800/40', text: 'text-zinc-300', border: 'border-zinc-700/50', glow: 'shadow-zinc-500/10' }
};

export const MicroLoggerModal: React.FC<MicroLoggerModalProps> = ({
  isOpen,
  onClose,
  initialText = ''
}) => {
  const { user, addLog } = useAppContext();
  const [input, setInput] = useState(initialText);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);

  // Parse in real time on every keystroke (< 1ms execution)
  const parsed: MicroLogEntity = useMemo(() => {
    return parseMicroLog(input);
  }, [input]);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setInput(initialText);
      setStatusMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      stopVoiceCapture();
    }
  }, [isOpen, initialText]);

  // Global keydown within modal (Escape to close, Enter to submit)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Web Speech Recognition setup
  const startVoiceCapture = async () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatusMessage({ type: 'error', text: 'Web Speech API is not supported in this browser.' });
      return;
    }

    try {
      // Audio level analyser for waveform feedback
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudio = () => {
          if (!isListeningRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / (dataArray.length || 1);
          setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
          animFrameRef.current = requestAnimationFrame(updateAudio);
        };
        updateAudio();
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInput(prev => {
            const cleanPrev = prev.trim();
            return cleanPrev ? `${cleanPrev} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Micro-logger voice error:', event.error);
        if (event.error === 'not-allowed') {
          setStatusMessage({ type: 'error', text: 'Microphone permission denied.' });
          stopVoiceCapture();
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            stopVoiceCapture();
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
      setStatusMessage({ type: 'info', text: 'Listening... Speak your study log (e.g. "Did 45m Physics 20 questions 85%")' });
    } catch (err: any) {
      console.error('Failed to start voice capture:', err);
      setStatusMessage({ type: 'error', text: 'Microphone access failed. Please check device permissions.' });
      stopVoiceCapture();
    }
  };

  const stopVoiceCapture = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setAudioLevel(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopVoiceCapture();
      setStatusMessage(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    } else {
      startVoiceCapture();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    }
  };

  const handleQuickPreset = (presetText: string) => {
    setInput(presetText);
    inputRef.current?.focus();
  };

  const handleCommit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user || isSubmitting) return;

    stopVoiceCapture();
    setIsSubmitting(true);
    setStatusMessage({ type: 'info', text: 'Saving session...' });

    try {
      const effectiveDate = format(new Date(), 'yyyy-MM-dd');
      
      await addLog({
        rawText: input.substring(0, 1999),
        subject: parsed.subject,
        topic: parsed.topic,
        subtopic: parsed.subtopic || 'Micro-Logged',
        durationMinutes: parsed.durationMinutes,
        problemsSolved: parsed.problemsSolved,
        accuracyPercent: parsed.accuracyPercent,
        mistakes: parsed.mistakes,
        focusScore: parsed.focusScore,
        efficiencyScore: parsed.efficiencyScore,
        energyMood: parsed.energyMood,
        date: effectiveDate
      });

      setStatusMessage({ type: 'success', text: `Logged ${parsed.subject} (${parsed.durationMinutes}m) successfully!` });
      
      setTimeout(() => {
        setInput('');
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to commit micro-log:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save log. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSubjectStyle = SUBJECT_COLORS[parsed.subject] || SUBJECT_COLORS.General;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-zinc-900/95 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden transition-all transform scale-100 flex flex-col ring-1 ring-white/10">
        
        {/* Header HUD Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950/80 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Micro-Logger HUD</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Sub-Second NLP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Enter</kbd> to save
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Esc</kbd> to close
            </div>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleCommit} className="p-5 space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 45m Physics electrostatics 20 questions 85% acc felt tired..."
              className={`w-full bg-zinc-950/80 border rounded-xl py-3.5 pl-4 pr-24 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm shadow-inner transition-all ${
                isListening ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-zinc-800'
              }`}
              disabled={isSubmitting}
            />

            <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleVoice}
                className={`h-full px-2.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                }`}
                title={isListening ? 'Stop speech recognition' : 'Dictate with Voice (Web Speech)'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] hidden sm:inline">Rec</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="text-[10px] hidden sm:inline">Voice</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isSubmitting}
                className="h-full px-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg flex items-center justify-center gap-1 text-xs font-semibold shadow-md transition-colors cursor-pointer"
                title="Log Session (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log</span>
              </button>
            </div>
          </div>

          {/* Voice Waveform Activity Indicator */}
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/40 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] text-red-300 font-medium">Listening to voice stream...</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden ml-2">
                <div 
                  className="h-full bg-red-500 transition-all duration-75"
                  style={{ width: `${Math.max(8, audioLevel)}%` }}
                />
              </div>
            </div>
          )}

          {/* Real-Time Parsed Entity Chips */}
          <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Live Extracted Entities
              </span>
              <span className="text-[10px] text-zinc-500">Instant client-side regex/NLP</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Subject Chip */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${currentSubjectStyle.bg} ${currentSubjectStyle.text} ${currentSubjectStyle.border}`}>
                <BookOpen className="w-3.5 h-3.5" />
                <span>{parsed.subject}</span>
              </div>

              {/* Topic Chip */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-800/50 text-zinc-200 text-xs font-medium">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate max-w-[200px]">{parsed.topic}</span>
              </div>

              {/* Duration Chip */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-800/50 text-zinc-200 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{parsed.durationMinutes} mins</span>
              </div>

              {/* Problems Solved Chip */}
              {parsed.problemsSolved > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <Hash className="w-3.5 h-3.5" />
                  <span>{parsed.problemsSolved} Solved</span>
                </div>
              )}

              {/* Accuracy Chip */}
              {parsed.accuracyPercent !== null && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  parsed.accuracyPercent >= 80 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                    : parsed.accuracyPercent >= 60 
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  <Percent className="w-3.5 h-3.5" />
                  <span>{parsed.accuracyPercent}% Accuracy</span>
                </div>
              )}

              {/* Energy / Mood Chip */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-800/50 text-zinc-300 text-xs font-medium">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>{parsed.energyMood}</span>
              </div>

              {/* Focus / Efficiency Metric */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
                <Flame className="w-3.5 h-3.5 text-indigo-400" />
                <span>Focus {parsed.focusScore}/10</span>
              </div>
            </div>

            {/* Mistakes Tags */}
            {parsed.mistakes.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Flagged Mistakes:</span>
                {parsed.mistakes.map((mistake, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium">
                    {mistake}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Presets for 1-click test / rapid logging */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Quick Templates:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                '45m Physics electrostatics 20 questions 85% accuracy',
                '2h math integration solved 35 problems 28 correct 7 wrong',
                '1.5 hrs chemistry organic reaction mechanisms 15 numericals 90% acc felt tired',
                'Physics kinematics 50 mins 12 qs high focus',
                'CS algorithms 90m 5 problems hyper focus'
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPreset(template)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[11px] transition-colors cursor-pointer truncate max-w-full"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' :
              statusMessage.type === 'error' ? 'bg-red-950/40 text-red-300 border border-red-500/30' :
              'bg-indigo-950/40 text-indigo-300 border border-indigo-500/30'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> :
               statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> :
               <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
