import React, { useState, useEffect, useRef } from 'react';
import { getGeminiInstance, logStudySessionTool, navigateAppTool } from '../services/geminiService';
import { UniversalAIService } from '../services/universalAIService';
import { AIVaultService } from '../services/aiVaultService';
import { Send, Bot, User, Loader2, Globe, MessageSquarePlus, History, Volume2, Square, Mic, MicOff, Cpu } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useAppContext } from '../context/AppContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

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
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ttsVoice, setTtsVoice] = useState('Zephyr');
  const [ttsSpeed, setTtsSpeed] = useState(1);
  const [playingMsgIndex, setPlayingMsgIndex] = useState<number | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [activeModelName, setActiveModelName] = useState<string>('Savantix AI');

  // Speech-to-Text state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      const activeProvider = AIVaultService.getActiveProvider();
      const modelShort = activeProvider.selectedModel.split('/').pop()?.replace(':free', ' (Free)') || activeProvider.name;
      setActiveModelName(modelShort);
    } catch {
      setActiveModelName('Savantix AI');
    }
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
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice transcription is not supported in this browser. Please try Chrome/Edge or type directly.');
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !user) return;

    // Stop TTS if playing
    stopTTS();

    const userMsg = input.trim();
    setInput('');
    
    let currentHistory = [...history, { role: 'user', parts: [{ text: userMsg }] }];
    setHistory(currentHistory);
    setIsTyping(true);

    try {
      let sessionId = currentSessionId;
      
      // Save session metadata if not guest
      if (!isGuest) {
        if (!sessionId) {
          const sessionRef = await addDoc(collection(db, 'users', user.uid, 'chat_sessions'), {
            uid: user.uid,
            title: userMsg.substring(0, 50) + (userMsg.length > 50 ? '...' : ''),
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          sessionId = sessionRef.id;
          setCurrentSessionId(sessionId);
          
          if (history.length === 2 && history[0].parts[0].text === "Hello") {
             await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
              uid: user.uid,
              role: 'user',
              text: history[0].parts[0].text,
              createdAt: serverTimestamp()
            });
            await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
              uid: user.uid,
              role: 'model',
              text: history[1].parts[0].text,
              createdAt: serverTimestamp()
            });
          }
        } else {
          await updateDoc(doc(db, 'users', user.uid, 'chat_sessions', sessionId), {
            updatedAt: serverTimestamp()
          });
        }

        await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
          uid: user.uid,
          role: 'user',
          text: userMsg.substring(0, 9999),
          createdAt: serverTimestamp()
        });
      } else {
        if (!sessionId) {
          sessionId = 'guest_sess_' + Date.now();
          setCurrentSessionId(sessionId);
        }
      }

      let finalModelText = '';

      // Try with Universal AI Service or Gemini Instance
      try {
        const ai = getGeminiInstance();
        const tools: any[] = [{ functionDeclarations: [logStudySessionTool, navigateAppTool] }];
        if (useSearch) {
          tools.push({ googleSearch: {} });
        }

        const systemInstruction = `You are Savantix, an elite AI study optimization assistant for serious students. You are highly analytical, concise, and strategic.
        Today is ${format(new Date(), 'yyyy-MM-dd')}.
        User's recent logs: ${JSON.stringify(logs.slice(0, 5))}
        User's recent insights: ${JSON.stringify(insights.slice(0, 3))}
        
        You can log study sessions for the user or navigate the app using the provided tools. If the user asks for real-time information and the Google Search tool is enabled, use it.`;

        let response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: currentHistory,
          config: { 
            systemInstruction,
            tools: tools,
            toolConfig: { includeServerSideToolInvocations: true }
          }
        });

        let responseContent = response.candidates?.[0]?.content;
        if (responseContent) {
          currentHistory.push(responseContent);
        }

        finalModelText = responseContent?.parts?.find(p => p.text)?.text || '';

        if (response.functionCalls && response.functionCalls.length > 0) {
          const call = response.functionCalls[0];
          let functionResponseData: any = { success: false };

          if (call.name === 'logStudySession') {
            try {
              const args = call.args as any;
              await addLog({
                rawText: "Logged via Assistant",
                subject: (args.subject || 'General').trim().substring(0, 99) || 'General',
                topic: (args.topic || '').trim().substring(0, 199),
                subtopic: '',
                durationMinutes: Math.max(0, Math.round(Number(args.durationMinutes))) || 0,
                problemsSolved: Math.max(0, Math.round(Number(args.problemsSolved))) || 0,
                mistakes: Array.isArray(args.mistakes) ? args.mistakes.slice(0, 50) : [],
                efficiencyScore: Math.min(10, Math.max(1, Math.round(Number(args.efficiencyScore)))) || 5,
                focusScore: Math.min(10, Math.max(1, Math.round(Number(args.focusScore)))) || 5,
                date: args.date || format(new Date(), 'yyyy-MM-dd')
              });
              functionResponseData = { success: true, message: "Log saved successfully." };
            } catch (err: any) {
              functionResponseData = { success: false, error: err.message || "Failed to save log" };
            }
          } else if (call.name === 'navigateApp') {
            try {
              const args = call.args as any;
              setActiveTab(args.tab);
              functionResponseData = { success: true, message: `Navigated to ${args.tab}` };
            } catch (err: any) {
              functionResponseData = { success: false, error: err.message || "Failed to navigate" };
            }
          }

          const funcRespContent = {
            role: 'user',
            parts: [{
              functionResponse: {
                name: call.name,
                response: functionResponseData
              }
            }]
          };
          currentHistory.push(funcRespContent);

          response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: currentHistory,
            config: { 
              systemInstruction,
              tools: tools,
              toolConfig: { includeServerSideToolInvocations: true }
            }
          });

          responseContent = response.candidates?.[0]?.content;
          if (responseContent) {
            currentHistory.push(responseContent);
            finalModelText = responseContent?.parts?.find(p => p.text)?.text || finalModelText;
          }
        }
      } catch (geminiError) {
        console.warn("Primary Gemini call failed, falling back to Universal AI Service:", geminiError);
        const formattedHistory = currentHistory
          .filter(h => h.parts?.some((p: any) => p.text))
          .map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts.find((p: any) => p.text)?.text || ''
          }));
        
        finalModelText = await UniversalAIService.sendChatMessage(userMsg, formattedHistory);
        currentHistory.push({ role: 'model', parts: [{ text: finalModelText }] });
      }

      setHistory([...currentHistory]);

      if (isGuest && sessionId) {
        localStorage.setItem(`savantix_guest_session_${sessionId}`, JSON.stringify(currentHistory));
      } else if (!isGuest && sessionId && finalModelText) {
        await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
          uid: user.uid,
          role: 'model',
          text: finalModelText.substring(0, 9999),
          createdAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error("Chat error", error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "I encountered an error analyzing that. Please check your AI endpoint or API key in Settings." }] }]);
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              Savantix Assistant
            </h2>
            <p className="text-xs text-zinc-500">Strategic planning & deep analysis</p>
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
            if (!textPart) return null; // Hide function calls/responses from UI
            
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
                    textPart.text
                  ) : (
                    <div className="relative group">
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 overflow-x-auto">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            img: ({node, ...props}) => <img {...props} referrerPolicy="no-referrer" className="max-w-full rounded-lg my-2" />
                          }}
                        >
                          {textPart.text}
                        </ReactMarkdown>
                      </div>
                      <button
                        onClick={() => handlePlayTTS(textPart.text, idx)}
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

        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening... Speak now..." : `Ask Savantix (${activeModelName})...`}
              className={`w-full bg-zinc-950 border rounded-xl py-3 pl-4 pr-28 sm:pr-32 text-sm sm:text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                isListening ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-zinc-800'
              }`}
              disabled={isTyping}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                type="button"
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
                disabled={!input.trim() || isTyping}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-indigo-400 disabled:text-zinc-600 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
