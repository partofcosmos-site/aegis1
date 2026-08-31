import React, { useState, useEffect, useRef } from 'react';
import { getGeminiInstance, logStudySessionTool, navigateAppTool } from '../services/geminiService';
import { UniversalAIService } from '../services/universalAIService';
import { AIVaultService } from '../services/aiVaultService';
import { VoiceService } from '../services/voiceService';
import { Send, Bot, User, Loader2, Globe, MessageSquarePlus, History, Volume2, Square, Mic, MicOff, Cpu, Image as ImageIcon, Paperclip, X, Eye, Sparkles } from 'lucide-react';

import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAppContext } from '../context/AppContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  previewUrl: string;
}

interface ChatbotProps {
  setActiveTab: (tab: 'dashboard' | 'chat' | 'analytics' | 'journal' | 'goals' | 'pomodoro' | 'settings' | 'flashcards') => void;
}

export const Chatbot = ({ setActiveTab }: ChatbotProps) => {
  const { user, isGuest, logs, insights, chatSessions, addLog } = useAppContext();
  const [useSearch, setUseSearch] = useState(false);
  const [history, setHistory] = useState<any[]>([
    { role: 'user', parts: [{ text: "Hello" }] },
    { role: 'model', parts: [{ text: "I'm Savantix. How can we optimize your study plan today?" }] }
  ]);
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<ChatAttachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ttsVoice, setTtsVoice] = useState('Zephyr');
  const [ttsSpeed, setTtsSpeed] = useState(1);
  const [playingMsgIndex, setPlayingMsgIndex] = useState<number | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [activeModelName, setActiveModelName] = useState<string>('Savantix AI');

  // Speech-to-Text state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const updateActiveModel = () => {
    try {
      const activeProvider = AIVaultService.getActiveProvider();
      const modelShort = activeProvider.selectedModel.split('/').pop()?.replace(':free', ' (Free)') || activeProvider.name;
      setActiveModelName(modelShort);
    } catch {
      setActiveModelName('Savantix AI');
    }
  };

  useEffect(() => {
    updateActiveModel();
    const handler = () => updateActiveModel();
    window.addEventListener('aegis_ai_provider_changed', handler);
    window.addEventListener('storage', handler);
    window.addEventListener('focus', handler);
    // visibilitychange fires when switching between browser tabs
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('aegis_ai_provider_changed', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);

  const isListeningRef = useRef(false);

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
          setInput(prev => {
            const clean = prev.trim();
            return clean ? `${clean} ${currentTranscript.trim()}` : currentTranscript.trim();
          });
        }
      };

      recognition.onerror = () => {
        // Don't abort on transient silence
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
    // Cleanup: stop mic and clear ref on unmount to prevent memory leak
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const voiceService = useRef(new VoiceService());
  const chatInputRef = useRef<HTMLInputElement>(null);
  const baseInputBeforeVoiceRef = useRef<string>('');

  const toggleVoiceInput = async () => {
    if (isListening) {
      const finalTranscript = await voiceService.current.stopRecording();
      if (finalTranscript) {
        const prefix = baseInputBeforeVoiceRef.current.trim();
        setInput(prefix ? `${prefix} ${finalTranscript}` : finalTranscript);
      }
      setIsListening(false);
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
          const len = chatInputRef.current.value.length;
          chatInputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    } else {
      setIsListening(true);
      baseInputBeforeVoiceRef.current = input;
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
          const len = chatInputRef.current.value.length;
          chatInputRef.current.setSelectionRange(len, len);
        }
      }, 50);

      await voiceService.current.startRecording(
        (transcript) => {
          const prefix = baseInputBeforeVoiceRef.current.trim();
          setInput(prefix ? `${prefix} ${transcript}` : transcript);
        },
        (level) => {
          const canvas = document.getElementById('waveform') as HTMLCanvasElement;
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

  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);

  const stopTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    setPlayingMsgIndex(null);
    setIsTtsLoading(false);
  };

  useEffect(() => {
    return () => {
      stopTTS();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const loadSession = async (sessionId: string) => {
    if (!user) return;
    setIsTyping(true);
    try {
      if (isGuest) {
        const guestData = localStorage.getItem(`savantix_guest_session_${sessionId}`);
        if (guestData) {
          setHistory(JSON.parse(guestData));
        }
      } else {
        const messagesRef = collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const loadedHistory = snapshot.docs.map(doc => ({
          role: doc.data().role,
          parts: [{ text: doc.data().text }]
        }));
        if (loadedHistory.length > 0) {
          setHistory(loadedHistory);
        } else {
          setHistory([
            { role: 'user', parts: [{ text: "Hello" }] },
            { role: 'model', parts: [{ text: "I'm Savantix. How can we optimize your study plan today?" }] }
          ]);
        }
      }
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewSession = () => {
    setHistory([
      { role: 'user', parts: [{ text: "Hello" }] },
      { role: 'model', parts: [{ text: "I'm Savantix. How can we optimize your study plan today?" }] }
    ]);
    setCurrentSessionId(null);
  };

  // Image Attachment & Clipboard Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 4).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image "${file.name}" exceeds 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAttachedImages(prev => {
            if (prev.length >= 4) return prev;
            return [...prev, {
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              name: file.name,
              mimeType: file.type,
              base64: base64,
              previewUrl: base64
            }];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
              setAttachedImages(prev => {
                if (prev.length >= 4) return prev;
                return [...prev, {
                  id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                  name: `pasted_image_${Date.now()}.png`,
                  mimeType: file.type,
                  base64: base64,
                  previewUrl: base64
                }];
              });
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedImages.length === 0) || isTyping || !user) return;

    // Stop TTS if playing
    stopTTS();

    const userMsg = input.trim() || (attachedImages.length > 0 ? "Please analyze this attached problem diagram / document." : "");
    const outgoingImages = [...attachedImages];
    setInput('');
    setAttachedImages([]);
    
    let currentHistory = [
      ...history, 
      { 
        role: 'user', 
        parts: [{ text: userMsg }],
        images: outgoingImages.map(img => img.previewUrl)
      }
    ];
    setHistory(currentHistory);
    setIsTyping(true);

    try {
      let sessionId = currentSessionId || 'sess_' + Date.now();
      if (!currentSessionId) setCurrentSessionId(sessionId);

      // 1. Format history for AI engine
      const formattedHistory = currentHistory
        .filter(h => h.parts && h.parts.length > 0 && h.parts[0].text)
        .map(h => ({
          role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
          content: h.parts[0].text
        }));

      const systemInstruction = `You are Savantix, an elite AI study optimization and STEM problem-solving mentor for serious competitive exam aspirants (JEE Advanced, Olympiads, Putnam, College STEM). You are analytical, concise, and structured. Use KaTeX formulas ($...$ or $$...$$) where appropriate.
Today's Date: ${format(new Date(), 'yyyy-MM-dd')}.
Recent user study logs: ${JSON.stringify(logs.slice(0, 5).map(l => ({ subject: l.subject, topic: l.topic, mins: l.durationMinutes, problems: l.problemsSolved })))}
Recent insights: ${JSON.stringify(insights.slice(0, 2))}`;

      // 2. Dispatch to Universal Multimodal AI Engine
      let finalModelText = await UniversalAIService.sendChatMessage(
        userMsg, 
        formattedHistory.slice(0, -1), 
        systemInstruction,
        undefined,
        outgoingImages.map(img => ({ mimeType: img.mimeType, base64: img.base64 }))
      );

      if (!finalModelText || !finalModelText.trim()) {
        finalModelText = UniversalAIService.generateOfflineAdvisorResponse(userMsg, outgoingImages.length > 0);
      }

      currentHistory.push({ role: 'model', parts: [{ text: finalModelText }] });
      setHistory([...currentHistory]);

      // 3. Auto-detect study logging commands in chat
      if (/\b(?:log|studied|did|solved)\b/i.test(userMsg) && /\b(?:\d+h|\d+m|\d+\s*hours?|\d+\s*questions?)\b/i.test(userMsg)) {
        try {
          const parsed = UniversalAIService.parseStudyLogLocal(userMsg);
          await addLog({
            rawText: userMsg,
            subject: parsed.subject,
            topic: parsed.topic,
            subtopic: parsed.subtopic,
            durationMinutes: parsed.durationMinutes,
            problemsSolved: parsed.problemsSolved,
            mistakes: parsed.mistakes,
            efficiencyScore: parsed.efficiencyScore,
            focusScore: parsed.focusScore,
            date: format(new Date(), 'yyyy-MM-dd')
          });
        } catch {}
      }

      // 4. Auto-detect navigation commands
      const lower = userMsg.toLowerCase();
      if (lower.includes('go to solver') || lower.includes('open stem solver')) setActiveTab('solver' as any);
      else if (lower.includes('go to graph') || lower.includes('open concept graph')) setActiveTab('graph' as any);
      else if (lower.includes('go to flashcards')) setActiveTab('flashcards' as any);
      else if (lower.includes('go to pomodoro')) setActiveTab('pomodoro' as any);
      else if (lower.includes('go to analytics')) setActiveTab('analytics' as any);

      // 5. Persistent Local Storage
      const storageKey = `savantix_chat_session_${user.uid || 'guest'}_${sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(currentHistory));

      // 6. Safe Background Firestore write
      if (!isGuest && user) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
            uid: user.uid,
            role: 'user',
            text: userMsg.substring(0, 9999),
            hasImages: outgoingImages.length > 0,
            createdAt: serverTimestamp()
          });
          await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
            uid: user.uid,
            role: 'model',
            text: finalModelText.substring(0, 9999),
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.warn("Firestore chat background sync notice:", err);
        }
      }
    } catch (error) {
      console.error("Chat error fallback:", error);
      const fallbackResponse = UniversalAIService.generateOfflineAdvisorResponse(userMsg, outgoingImages.length > 0);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: fallbackResponse }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakWithBrowserSynthesis = (text: string, voiceName: string, speed: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setPlayingMsgIndex(null);
      setIsTtsLoading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[\*\_#`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = Math.max(0.5, Math.min(2, speed));
    
    const isFemale = ['Kore', 'Zephyr', 'Aoede'].includes(voiceName);
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => isFemale ? /female|zira|samantha|karen|victoria/i.test(v.name) : /male|david|george|alex/i.test(v.name));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onend = () => {
      setPlayingMsgIndex(null);
      setIsTtsLoading(false);
    };
    utterance.onerror = () => {
      setPlayingMsgIndex(null);
      setIsTtsLoading(false);
    };

    setIsTtsLoading(false);
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayTTS = async (text: string, index: number) => {
    if (playingMsgIndex === index) {
      stopTTS();
      return;
    }

    // Stop any currently playing TTS
    stopTTS();

    const selection = typeof window !== 'undefined' ? window.getSelection()?.toString() : '';
    const textToRead = selection && selection.trim().length > 0 ? selection : text;

    setIsTtsLoading(true);
    setPlayingMsgIndex(index);
    
    ttsAbortControllerRef.current = new AbortController();
    const signal = ttsAbortControllerRef.current.signal;
    
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        speakWithBrowserSynthesis(textToRead, ttsVoice, ttsSpeed);
        return;
      }

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      const audioCtx = audioCtxRef.current;

      // Handle suspended audio context (browser autoplay policy)
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (e) {
          console.warn("AudioContext resume failed:", e);
        }
      }

      let nextStartTime = audioCtx.currentTime;
      let isFirstChunk = true;

      // Split text into manageable chunks
      const textChunks = textToRead.match(/[^.!?\n]+[.!?\n]+/g) || [textToRead];
      const processedChunks: string[] = [];
      let currentChunk = "";
      for (const chunk of textChunks) {
        currentChunk += chunk;
        if (currentChunk.length > 100) {
          processedChunks.push(currentChunk.trim());
          currentChunk = "";
        }
      }
      if (currentChunk.trim()) {
        processedChunks.push(currentChunk.trim());
      }

      const ai = getGeminiInstance();

      for (let i = 0; i < processedChunks.length; i++) {
        if (signal.aborted) break;
        
        const chunkText = processedChunks[i];
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: chunkText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: ttsVoice },
              },
            },
          },
        });

        for await (const chunk of responseStream) {
          if (signal.aborted) break;

          const base64Audio = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            if (isFirstChunk) {
              setIsTtsLoading(false);
              isFirstChunk = false;
            }

            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            
            // The PCM data is 16-bit little-endian
            const int16Array = new Int16Array(bytes.buffer);
            const audioBuffer = audioCtx.createBuffer(1, int16Array.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let j = 0; j < int16Array.length; j++) {
              channelData[j] = int16Array[j] / 32768.0; // Convert to [-1.0, 1.0]
            }

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = ttsSpeed;
            source.connect(audioCtx.destination);
            
            const startTime = Math.max(audioCtx.currentTime, nextStartTime);
            source.start(startTime);
            
            nextStartTime = startTime + (audioBuffer.duration / ttsSpeed);
            activeSourcesRef.current.push(source);
            
            const isLastChunk = i === processedChunks.length - 1;
            
            source.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
              if (activeSourcesRef.current.length === 0 && !ttsAbortControllerRef.current && isLastChunk) {
                setPlayingMsgIndex(null);
              }
            };
          }
        }
      }
      
      ttsAbortControllerRef.current = null;
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.warn("Gemini TTS failed, falling back to Browser Speech Synthesis:", error);
        speakWithBrowserSynthesis(textToRead, ttsVoice, ttsSpeed);
      } else {
        setPlayingMsgIndex(null);
        setIsTtsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex h-full bg-zinc-950 overflow-hidden">
      {/* Sidebar for Chat History */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            <History className="w-3 h-3" />
            Recent Chats
          </div>
          {chatSessions.map(session => (
            <button
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-zinc-800 text-indigo-400' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              {session.title}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Recent Chats Drawer Sheet */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-zinc-900 border-r border-zinc-800 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Recent Chats</span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-zinc-800">
              <button
                onClick={() => {
                  startNewSession();
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-medium shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Saved Sessions ({chatSessions.length})
              </div>
              {chatSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No conversation history yet
                </div>
              ) : (
                chatSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => {
                      loadSession(session.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm truncate transition-colors cursor-pointer ${
                      currentSessionId === session.id 
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium' 
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    {session.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors shadow-sm cursor-pointer"
              title="View saved conversation sessions"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chats</span>
              {chatSessions.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono font-bold">
                  {chatSessions.length}
                </span>
              )}
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                Savantix Assistant
              </h2>
              <p className="text-xs text-zinc-500 hidden sm:block">Strategic planning & deep analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
             <select 
               value={ttsVoice} 
               onChange={(e) => setTtsVoice(e.target.value)}
               className="bg-zinc-800 text-xs text-zinc-300 rounded px-2 py-1.5 border border-zinc-700 outline-none focus:border-indigo-500 transition-colors"
               title="Select Voice"
             >
               <option value="Puck">Puck (Male)</option>
               <option value="Charon">Charon (Male)</option>
               <option value="Fenrir">Fenrir (Male)</option>
               <option value="Kore">Kore (Female)</option>
               <option value="Zephyr">Zephyr (Female)</option>
               <option value="Aoede">Aoede (Female)</option>
             </select>
             <select 
               value={ttsSpeed} 
               onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
               className="bg-zinc-800 text-xs text-zinc-300 rounded px-2 py-1.5 border border-zinc-700 outline-none focus:border-indigo-500 transition-colors"
               title="Playback Speed"
             >
               <option value={0.5}>0.5x</option>
               <option value={0.75}>0.75x</option>
               <option value={1}>1x</option>
               <option value={1.25}>1.25x</option>
               <option value={1.5}>1.5x</option>
               <option value={2}>2x</option>
             </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {history.map((msg, idx) => {
            const textPart = msg.parts?.find((p: any) => p.text);
            if (!textPart && (!msg.images || msg.images.length === 0)) return null;
            
            return (
              <div key={idx} className={clsx("flex gap-3 sm:gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-zinc-800" : "bg-indigo-500/20"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />}
                </div>
                <div className={clsx(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden",
                  msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm w-full"
                )}>
                  {msg.role === 'user' ? (
                    <div>
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.images.map((imgUrl: string, imgIdx: number) => (
                            <img
                              key={imgIdx}
                              src={imgUrl}
                              alt="Attachment"
                              className="max-h-48 max-w-xs rounded-xl border border-white/20 object-contain shadow-md bg-black/40"
                            />
                          ))}
                        </div>
                      )}
                      {textPart?.text && <div className="whitespace-pre-wrap">{textPart.text}</div>}
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 overflow-x-auto">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            img: ({node, ...props}) => <img {...props} referrerPolicy="no-referrer" className="max-w-full rounded-lg my-2 border border-zinc-800 shadow-md" />
                          }}
                        >
                          {textPart?.text || ''}
                        </ReactMarkdown>
                      </div>
                      <button
                        onClick={() => textPart?.text && handlePlayTTS(textPart.text, idx)}
                        disabled={isTtsLoading && playingMsgIndex !== idx}
                        className="absolute -bottom-2 -right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700 disabled:opacity-50 shadow-sm"
                        title="Listen to message (select text to read only selection)"
                      >
                        {playingMsgIndex === idx ? (
                           <Square className="w-3.5 h-3.5" />
                        ) : (
                           <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex gap-3 sm:gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-xs text-zinc-500">Savantix is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800" onPaste={handlePaste}>
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative space-y-2">
            <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
              <canvas id="waveform" className={clsx("h-full transition-opacity", isListening ? "opacity-100" : "opacity-0")} />
            </div>

            {/* Attached Images Tray */}
            {attachedImages.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-zinc-950/90 rounded-xl border border-indigo-500/30 overflow-x-auto">
                {attachedImages.map(img => (
                  <div key={img.id} className="relative group flex-shrink-0">
                    <img src={img.previewUrl} alt={img.name} className="w-14 h-14 object-cover rounded-lg border border-zinc-700" />
                    <button
                      type="button"
                      onClick={() => removeAttachment(img.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <span className="text-xs text-zinc-400 pl-2">
                  {attachedImages.length}/4 image(s) attached • Ready for multimodal analysis
                </span>
              </div>
            )}

            <div className="relative">
              <input
                ref={chatInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening 
                    ? "Listening... Speak now..." 
                    : attachedImages.length > 0
                      ? "Add a question about your attached image(s)..."
                      : `Ask Savantix (${activeModelName}) or paste image (Ctrl+V)...`
                }
                className={`w-full bg-zinc-950 border rounded-xl py-3 pl-4 pr-36 sm:pr-40 text-sm sm:text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  isListening ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-zinc-800'
                }`}
                disabled={isTyping}
              />

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    "p-1.5 sm:p-2 transition-colors rounded-md cursor-pointer",
                    attachedImages.length > 0 ? "text-indigo-400 bg-indigo-500/20" : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="Attach Problem Image / Diagram / Screenshot (or paste with Ctrl+V)"
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleVoiceInput}
                  className={clsx(
                    "p-1.5 sm:p-2 transition-all rounded-md cursor-pointer",
                    isListening ? "text-red-400 bg-red-500/20 animate-pulse border border-red-500/30" : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title={isListening ? "Stop voice input" : "Voice input (Speak to Savantix)"}
                >
                  {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <button 
                  type="button"
                  onClick={() => setUseSearch(!useSearch)}
                  className={clsx("p-1.5 sm:p-2 transition-colors rounded-md cursor-pointer", useSearch ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-500 hover:text-zinc-300")}
                  title="Toggle Google Search (Real-time data)"
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="submit"
                  disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-indigo-400 disabled:text-zinc-600 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
