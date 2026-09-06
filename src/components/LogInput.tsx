import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Loader2, 
  Mic, 
  MicOff, 
  Sparkles, 
  Zap, 
  Clock, 
  BookOpen, 
  Tag, 
  Hash, 
  Percent, 
  Smile, 
  Flame 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UniversalAIService } from '../services/universalAIService';
import { AIVaultService } from '../services/aiVaultService';
import { VoiceService } from '../services/voiceService';
import { parseMicroLog, MicroLogEntity } from '../utils/microLogParser';
import { format } from 'date-fns';

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Physics: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Chemistry: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Mathematics: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Biology: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Computer Science': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  General: { bg: 'bg-zinc-800/40', text: 'text-zinc-300', border: 'border-zinc-700/50' }
};

export const LogInput = ({ selectedDate }: { selectedDate: string }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [activeModelName, setActiveModelName] = useState<string>('Universal AI');
  
  // Voice Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const { user, addLog } = useAppContext();

  // Instant client-side deterministic parsed tokens
  const parsedMicro: MicroLogEntity = useMemo(() => {
    return parseMicroLog(text);
  }, [text]);

  useEffect(() => {
    try {
      const activeProvider = AIVaultService.getActiveProvider();
      const modelShort = activeProvider.selectedModel.split('/').pop()?.replace(':free', ' (Free)') || activeProvider.name;
      setActiveModelName(modelShort);
    } catch {
      setActiveModelName('Universal AI');
    }
  }, []);

  // Initialize Web Speech Recognition with auto-keepalive
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setText(prev => {
            const cleanPrev = prev.trim();
            return cleanPrev ? `${cleanPrev} ${currentTranscript.trim()}` : currentTranscript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setMessage({ type: 'error', text: 'Microphone access blocked. Please enable permissions in your browser.' });
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const voiceService = useRef(new VoiceService());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseTextBeforeVoiceRef = useRef<string>('');

  const toggleVoiceInput = async () => {
    if (isListening) {
      const finalTranscript = await voiceService.current.stopRecording();
      if (finalTranscript) {
        const prefix = baseTextBeforeVoiceRef.current.trim();
        setText(prefix ? `${prefix} ${finalTranscript}` : finalTranscript);
      }
      setIsListening(false);
      setMessage(null);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
    } else {
      setIsListening(true);
      baseTextBeforeVoiceRef.current = text;
      setMessage({ type: 'info', text: 'Listening... Speak your study session details.' });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);

      await voiceService.current.startRecording(
        (transcript) => {
          const prefix = baseTextBeforeVoiceRef.current.trim();
          setText(prefix ? `${prefix} ${transcript}` : transcript);
        },
        (level) => {
          const canvas = document.getElementById('waveform-log') as HTMLCanvasElement;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#6366f1';
              ctx.fillRect(0, 0, (level / 100) * canvas.width, canvas.height);
            }
          }
        }
      );
    }
  };

  // Instant Sub-Second Micro-Log Save (deterministic regex NLP, zero network latency)
  const handleInstantFastLog = async () => {
    if (!text.trim() || !user || isSubmitting) return;

    if (isListening && recognitionRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSubmitting(true);
    const effectiveDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

    try {
      await addLog({
        rawText: text.substring(0, 1999),
        subject: (parsedMicro.subject || 'General').trim().substring(0, 99) || 'General',
        topic: (parsedMicro.topic || '').trim().substring(0, 199),
        subtopic: (parsedMicro.subtopic || 'Micro-Logged').trim().substring(0, 199),
        durationMinutes: Math.max(1, Math.round(Number(parsedMicro.durationMinutes))) || 60,
        problemsSolved: Math.max(0, Math.round(Number(parsedMicro.problemsSolved))) || 0,
        accuracyPercent: parsedMicro.accuracyPercent,
        mistakes: Array.isArray(parsedMicro.mistakes) ? parsedMicro.mistakes : [],
        efficiencyScore: Math.min(10, Math.max(1, Math.round(Number(parsedMicro.efficiencyScore)))) || 8,
        focusScore: Math.min(10, Math.max(1, Math.round(Number(parsedMicro.focusScore)))) || 8,
        energyMood: parsedMicro.energyMood || 'Normal',
        date: effectiveDate
      });

      setText('');
      setMessage({ type: 'success', text: `⚡ Instant Saved! Logged ${parsedMicro.subject} (${parsedMicro.durationMinutes}m) with sub-second parser.` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error("Failed to fast log", error);
      setMessage({ type: 'error', text: error.message || "Failed to save study log." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Full AI Deep Parser Save (with fallback to deterministic parser)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    if (isListening && recognitionRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSubmitting(true);
    setMessage({ type: 'info', text: `Analyzing log with ${activeModelName}... Please wait.` });

    try {
      let parsedData: any;
      try {
        // 1. Try Universal AI
        parsedData = await UniversalAIService.parseStudyLog(text);
      } catch (aiErr) {
        console.warn("AI parsing fallback to deterministic micro-log parser:", aiErr);
        parsedData = parsedMicro;
      }
      
      const effectiveDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

      // 2. Save via AppContext (persists to Firestore or Guest Storage)
      await addLog({
        rawText: text.substring(0, 1999),
        subject: (parsedData.subject || parsedMicro.subject || 'General').trim().substring(0, 99) || 'General',
        topic: (parsedData.topic || parsedMicro.topic || '').trim().substring(0, 199),
        subtopic: (parsedData.subtopic || parsedMicro.subtopic || '').trim().substring(0, 199),
        durationMinutes: Math.max(1, Math.round(Number(parsedData.durationMinutes || parsedMicro.durationMinutes))) || 60,
        problemsSolved: Math.max(0, Math.round(Number(parsedData.problemsSolved ?? parsedMicro.problemsSolved))) || 0,
        accuracyPercent: parsedData.accuracyPercent ?? parsedMicro.accuracyPercent,
        mistakes: Array.isArray(parsedData.mistakes) ? parsedData.mistakes : parsedMicro.mistakes,
        efficiencyScore: Math.min(10, Math.max(1, Math.round(Number(parsedData.efficiencyScore || parsedMicro.efficiencyScore)))) || 8,
        focusScore: Math.min(10, Math.max(1, Math.round(Number(parsedData.focusScore || parsedMicro.focusScore)))) || 8,
        energyMood: parsedData.energyMood || parsedMicro.energyMood || 'Normal',
        date: effectiveDate
      });

      setText('');
      setMessage({ type: 'success', text: `Saved! Parsed ${parsedData.subject || parsedMicro.subject} (${parsedData.durationMinutes || parsedMicro.durationMinutes}m) successfully.` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error("Failed to parse or save log", error);
      setMessage({ type: 'error', text: error.message || "Failed to process log. Please check your API key in Settings." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChip = (chipText: string) => {
    setText(prev => {
      const clean = prev.trim();
      if (!clean) return chipText;
      return `${clean}, ${chipText}`;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const currentSubjectStyle = SUBJECT_COLORS[parsedMicro.subject] || SUBJECT_COLORS.General;

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-lg relative space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quick Log & Dictate</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/50 text-indigo-300 border border-zinc-700">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {activeModelName}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Zap className="w-2.5 h-2.5 text-indigo-400" />
            Sub-Second Ready
          </span>
        </div>
        {message && (
          <span className={`text-xs font-medium ${
            message.type === 'success' ? 'text-emerald-400' :
            message.type === 'error' ? 'text-red-400' : 'text-indigo-300 animate-pulse'
          }`}>
            {message.text}
          </span>
        )}
      </div>

      {/* 1-Click Fast Presets Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider shrink-0">Presets:</span>
        <button
          type="button"
          onClick={() => handleAddChip('Physics')}
          className="px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium transition-all shrink-0 cursor-pointer"
        >
          ⚛️ Physics
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('Mathematics')}
          className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium transition-all shrink-0 cursor-pointer"
        >
          📐 Math
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('Chemistry')}
          className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium transition-all shrink-0 cursor-pointer"
        >
          🧪 Chemistry
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('Biology')}
          className="px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium transition-all shrink-0 cursor-pointer"
        >
          🧬 Biology
        </button>
        <div className="w-px h-3.5 bg-zinc-800 shrink-0 mx-0.5" />
        <button
          type="button"
          onClick={() => handleAddChip('45m')}
          className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-mono transition-all shrink-0 cursor-pointer"
        >
          +45m
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('60m')}
          className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-mono transition-all shrink-0 cursor-pointer"
        >
          +60m
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('90m')}
          className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-mono transition-all shrink-0 cursor-pointer"
        >
          +90m
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('120m')}
          className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-mono transition-all shrink-0 cursor-pointer"
        >
          +120m
        </button>
        <div className="w-px h-3.5 bg-zinc-800 shrink-0 mx-0.5" />
        <button
          type="button"
          onClick={() => handleAddChip('10 Qs')}
          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium transition-all shrink-0 cursor-pointer"
        >
          +10 Qs
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('25 Qs')}
          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium transition-all shrink-0 cursor-pointer"
        >
          +25 Qs
        </button>
        <button
          type="button"
          onClick={() => handleAddChip('50 Qs')}
          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium transition-all shrink-0 cursor-pointer"
        >
          +50 Qs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., Did 2h physics rotation, solved 25 questions 85% accuracy, torque confusion..."
          className={`w-full bg-zinc-950/60 border rounded-xl p-4 pr-24 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[110px] text-sm transition-all shadow-inner ${
            isListening ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-zinc-800/80'
          }`}
          disabled={isSubmitting}
        />

        {isListening && (
          <div className="absolute top-2 left-2 right-24 h-1">
            <canvas id="waveform-log" className="w-full h-full" />
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleVoiceInput}
            className={`p-2 transition-all rounded-lg cursor-pointer ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
            }`}
            title={isListening ? 'Stop voice recording' : 'Click to dictate (Web Speech)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Instant 1-Click Sub-Second Fast Save */}
          <button
            type="button"
            onClick={handleInstantFastLog}
            disabled={!text.trim() || isSubmitting}
            className="flex items-center gap-1 px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Sub-Second Fast Log (Deterministic NLP, zero AI delay)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Fast</span>
          </button>
          
          {/* AI Deep Analysis Save */}
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="flex items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors cursor-pointer shadow-md"
            title="AI Deep Log"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Real-time Sub-Second Parsed Token Preview (shows as student types/speaks) */}
      {text.trim().length > 0 && (
        <div className="rounded-xl bg-zinc-950/50 border border-zinc-800/70 p-2.5 transition-all animate-fadeIn">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mr-1">Preview:</span>

            {/* Subject */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${currentSubjectStyle.bg} ${currentSubjectStyle.text} ${currentSubjectStyle.border}`}>
              <BookOpen className="w-3 h-3" />
              {parsedMicro.subject}
            </span>

            {/* Topic */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-700/60 bg-zinc-800/50 text-zinc-200 text-[11px] font-medium">
              <Tag className="w-3 h-3 text-zinc-400" />
              <span className="truncate max-w-[160px]">{parsedMicro.topic}</span>
            </span>

            {/* Duration */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-700/60 bg-zinc-800/50 text-zinc-200 text-[11px] font-medium">
              <Clock className="w-3 h-3 text-indigo-400" />
              {parsedMicro.durationMinutes}m
            </span>

            {/* Problems */}
            {parsedMicro.problemsSolved > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
                <Hash className="w-3 h-3" />
                {parsedMicro.problemsSolved} Qs
              </span>
            )}

            {/* Accuracy */}
            {parsedMicro.accuracyPercent !== null && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                parsedMicro.accuracyPercent >= 80 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                  : parsedMicro.accuracyPercent >= 60 
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
                <Percent className="w-3 h-3" />
                {parsedMicro.accuracyPercent}%
              </span>
            )}

            {/* Energy / Mood */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-700/60 bg-zinc-800/50 text-zinc-300 text-[11px] font-medium">
              <Smile className="w-3 h-3 text-amber-400" />
              {parsedMicro.energyMood}
            </span>

            {/* Mistakes */}
            {parsedMicro.mistakes.map((mistake, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium">
                {mistake}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
