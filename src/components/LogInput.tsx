import React, { useState } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseStudyLog } from '../services/geminiService';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const LogInput = ({ selectedDate }: { selectedDate: string }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      // 1. Parse with Gemini
      const parsedData = await parseStudyLog(text);
      
      // 2. Save to Firestore
      const logsRef = collection(db, 'users', user.uid, 'logs');
      await addDoc(logsRef, {
        uid: user.uid,
        rawText: text.substring(0, 1999),
        ...parsedData,
        date: selectedDate || new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      setText('');
      setMessage({ type: 'success', text: 'Log saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to parse or save log", error);
      setMessage({ type: 'error', text: "Failed to process log. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Quick Log</h2>
        {message && (
          <span className={`text-xs ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </span>
        )}
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., Did 2h physics rotation, solved 25 questions, torque mistakes..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 pr-24 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[100px]"
          disabled={isSubmitting}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md hover:bg-zinc-800"
            title="Voice input (coming soon)"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};
