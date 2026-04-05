import React, { useState, useEffect, useRef } from 'react';
import { getGeminiInstance, logStudySessionTool, navigateAppTool } from '../services/geminiService';
import { Send, Bot, User, Loader2, Globe, MessageSquarePlus, History } from 'lucide-react';
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
  const { user, logs, insights, chatSessions } = useAppContext();
  const [useSearch, setUseSearch] = useState(false);
  const [history, setHistory] = useState<any[]>([
    { role: 'user', parts: [{ text: "Hello" }] },
    { role: 'model', parts: [{ text: "I'm Aegis. How can we optimize your study plan today?" }] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const loadSession = async (sessionId: string) => {
    if (!user) return;
    setIsTyping(true);
    try {
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
          { role: 'model', parts: [{ text: "I'm Aegis. How can we optimize your study plan today?" }] }
        ]);
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
      { role: 'model', parts: [{ text: "I'm Aegis. How can we optimize your study plan today?" }] }
    ]);
    setCurrentSessionId(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !user) return;

    const userMsg = input.trim();
    setInput('');
    
    let currentHistory = [...history, { role: 'user', parts: [{ text: userMsg }] }];
    setHistory(currentHistory);
    setIsTyping(true);

    try {
      let sessionId = currentSessionId;
      
      // Create new session if none exists
      if (!sessionId) {
        const sessionRef = await addDoc(collection(db, 'users', user.uid, 'chat_sessions'), {
          uid: user.uid,
          title: userMsg.substring(0, 50) + (userMsg.length > 50 ? '...' : ''),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        sessionId = sessionRef.id;
        setCurrentSessionId(sessionId);
        
        // Save initial greeting if it's a new session
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
        // Update existing session timestamp
        await updateDoc(doc(db, 'users', user.uid, 'chat_sessions', sessionId), {
          updatedAt: serverTimestamp()
        });
      }

      // Save user message
      await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
        uid: user.uid,
        role: 'user',
        text: userMsg.substring(0, 9999),
        createdAt: serverTimestamp()
      });

      const ai = getGeminiInstance();
      const tools: any[] = [{ functionDeclarations: [logStudySessionTool, navigateAppTool] }];
      if (useSearch) {
        tools.push({ googleSearch: {} });
      }

      const systemInstruction = `You are Aegis, an elite AI study optimization assistant for serious students. You are highly analytical, concise, and strategic.
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

      let finalModelText = responseContent?.parts?.find(p => p.text)?.text || '';

      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        let functionResponseData: any = { success: false };

        if (call.name === 'logStudySession') {
          const args = call.args as any;
          if (user) {
            await addDoc(collection(db, 'users', user.uid, 'logs'), {
              uid: user.uid,
              rawText: "Logged via Assistant",
              subject: (args.subject || 'General').substring(0, 99),
              topic: (args.topic || '').substring(0, 199),
              durationMinutes: args.durationMinutes || 0,
              problemsSolved: args.problemsSolved || 0,
              mistakes: (args.mistakes || []).slice(0, 50),
              efficiencyScore: args.efficiencyScore || 5,
              focusScore: args.focusScore || 5,
              date: args.date || new Date().toISOString().split('T')[0],
              createdAt: serverTimestamp()
            });
            functionResponseData = { success: true, message: "Log saved successfully." };
          }
        } else if (call.name === 'navigateApp') {
          const args = call.args as any;
          setActiveTab(args.tab);
          functionResponseData = { success: true, message: `Navigated to ${args.tab}` };
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

      setHistory([...currentHistory]);

      // Save model message
      if (finalModelText) {
        await addDoc(collection(db, 'users', user.uid, 'chat_sessions', sessionId, 'messages'), {
          uid: user.uid,
          role: 'model',
          text: finalModelText.substring(0, 9999),
          createdAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error("Chat error", error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "I encountered an error analyzing that. Please try again." }] }]);
    } finally {
      setIsTyping(false);
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
              Aegis Assistant
            </h2>
            <p className="text-xs text-zinc-500">Strategic planning & deep analysis</p>
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
                <span className="text-xs text-zinc-500">Aegis is thinking...</span>
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
              placeholder="Ask Aegis..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-20 sm:pr-24 text-sm sm:text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              disabled={isTyping}
            />
            <button 
              type="button"
              onClick={() => setUseSearch(!useSearch)}
              className={clsx("absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 transition-colors rounded-md", useSearch ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-500 hover:text-zinc-300")}
              title="Toggle Google Search (Real-time data)"
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-zinc-400 hover:text-indigo-400 disabled:text-zinc-600 transition-colors"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
