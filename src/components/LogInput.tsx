import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff, Sparkles, Cpu } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UniversalAIService } from '../services/universalAIService';
import { AIVaultService } from '../services/aiVaultService';
import { format } from 'date-fns';

export const LogInput = ({ selectedDate }: { selectedDate: string }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [activeModelName, setActiveModelName] = useState<string>('Universal AI');
  
  // Voice Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { user, addLog } = useAppContext();

  useEffect(() => {
    try {
      const activeProvider = AIVaultService.getActiveProvider();
      const modelShort = activeProvider.selectedModel.split('/').pop()?.replace(':free', ' (Free)') || activeProvider.name;
      setActiveModelName(modelShort);
    } catch {
      setActiveModelName('Universal AI');
    }
  }, []);

  // Initialize Web Speech Recognition
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
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      // Fallback for unsupported browsers
      setMessage({ type: 'info', text: 'Voice recognition is not supported in this browser. Try Chrome/Edge or type directly.' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setMessage({ type: 'info', text: 'Listening... Speak your study session details.' });
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSubmitting(true);
    setMessage({ type: 'info', text: `Analyzing log with ${activeModelName}... Please wait.` });

    try {
      // 1. Parse with Universal AI
      const parsedData = await UniversalAIService.parseStudyLog(text);
      
      const effectiveDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

      // 2. Save via AppContext (persists to Firestore or Guest Storage)
      await addLog({
        rawText: text.substring(0, 1999),
        subject: (parsedData.subject || 'General').trim().substring(0, 99) || 'General',
        topic: (parsedData.topic || '').trim().substring(0, 199),
        subtopic: (parsedData.subtopic || '').trim().substring(0, 199),
        durationMinutes: Math.max(0, Math.round(Number(parsedData.durationMinutes))) || 0,
        problemsSolved: Math.max(0, Math.round(Number(parsedData.problemsSolved))) || 0,
        mistakes: Array.isArray(parsedData.mistakes) ? parsedData.mistakes : [],
        efficiencyScore: Math.min(10, Math.max(1, Math.round(Number(parsedData.efficiencyScore)))) || 5,
        focusScore: Math.min(10, Math.max(1, Math.round(Number(parsedData.focusScore)))) || 5,
        date: effectiveDate
      });

      setText('');
      setMessage({ type: 'success', text: `Saved! Parsed ${parsedData.subject} (${parsedData.durationMinutes}m) successfully.` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error("Failed to parse or save log", error);
      setMessage({ type: 'error', text: error.message || "Failed to process log. Please check your API key in Settings." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm relative">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quick Log</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-indigo-300 border border-zinc-700">
            <Cpu className="w-3 h-3 text-indigo-400" />
            {activeModelName}
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

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., Did 2h physics rotation, solved 25 questions, torque mistakes..."
          className={`w-full bg-zinc-950 border rounded-lg p-4 pr-24 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[100px] text-sm transition-all ${
            isListening ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-zinc-800'
          }`}
          disabled={isSubmitting}
        />

        {isListening && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-semibold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            Listening...
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2 transition-all rounded-md cursor-pointer ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isListening ? 'Stop voice recording' : 'Click to dictate (Web Speech)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors cursor-pointer"
            title="Submit study log"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};
