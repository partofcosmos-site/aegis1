import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Settings, Music } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';

export const Pomodoro = () => {
  const { user, addLog } = useAppContext();
  
  // Settings
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  const targetEndTimeRef = useRef<number | null>(null);

  // Play pleasant tone on timer complete
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
        setTimeout(() => {
          try { ctx.close(); } catch {}
        }, 1000);
      }
    } catch (e) {
      console.warn("Timer notification tone skipped:", e);
    }
  };

  // Update time left if duration settings change while not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
      targetEndTimeRef.current = null;
    }
  }, [focusDuration, breakDuration, mode, isActive]);

  // Drift-free Wall-Clock Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          playNotificationSound();
          if (mode === 'focus') {
            handleLogSession(focusDuration);
            setMode('break');
            const nextSecs = breakDuration * 60;
            setTimeLeft(nextSecs);
            targetEndTimeRef.current = Date.now() + nextSecs * 1000;
          } else {
            setMode('focus');
            const nextSecs = focusDuration * 60;
            setTimeLeft(nextSecs);
            targetEndTimeRef.current = Date.now() + nextSecs * 1000;
          }
        }
      }, 250);
    } else {
      targetEndTimeRef.current = null;
    }

    return () => clearInterval(interval);
  }, [isActive, mode, focusDuration, breakDuration, timeLeft]);

  const toggleTimer = () => {
    if (!isActive) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      setIsActive(true);
    } else {
      targetEndTimeRef.current = null;
      setIsActive(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    targetEndTimeRef.current = null;
    setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setIsActive(false);
    targetEndTimeRef.current = null;
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogSession = async (explicitMinutes?: number) => {
    if (!user || mode !== 'focus') return;
    
    setMessage(null);
    const durationMinutes = explicitMinutes ?? Math.round((focusDuration * 60 - timeLeft) / 60);
    if (durationMinutes <= 0) return;

    try {
      await addLog({
        rawText: `Pomodoro session: ${subject.trim() || 'General'} - ${topic.trim() || 'Focus Session'}`,
        subject: (subject.trim() || 'General').substring(0, 99),
        topic: (topic.trim() || 'Pomodoro Session').substring(0, 199),
        subtopic: '',
        durationMinutes,
        problemsSolved: 0,
        mistakes: [],
        efficiencyScore: 8,
        focusScore: 9,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setMessage({ type: 'success', text: 'Session logged successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error logging pomodoro:', error);
      setMessage({ type: 'error', text: 'Failed to log session.' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-4 z-20">
        <button 
          onClick={() => setShowMusic(!showMusic)}
          className={`p-2 sm:p-3 rounded-full transition-colors ${showMusic ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          title="Toggle Music"
        >
          <Music className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 sm:p-3 rounded-full transition-colors ${showSettings ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          title="Timer Settings"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="max-w-md w-full bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-2xl relative z-10 mt-12 sm:mt-0">
        
        {showSettings ? (
          <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-medium text-zinc-100 border-b border-zinc-800 pb-2">Timer Settings</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Focus Duration (minutes)</label>
              <div className="flex flex-wrap gap-2">
                {[15, 25, 50, 90].map(mins => (
                  <button
                    key={`focus-${mins}`}
                    onClick={() => setFocusDuration(mins)}
                    className={`flex-1 min-w-[60px] py-2 rounded-lg text-sm font-medium transition-colors ${focusDuration === mins ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    {mins}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Break Duration (minutes)</label>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 30].map(mins => (
                  <button
                    key={`break-${mins}`}
                    onClick={() => setBreakDuration(mins)}
                    className={`flex-1 min-w-[60px] py-2 rounded-lg text-sm font-medium transition-colors ${breakDuration === mins ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    {mins}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors font-medium mt-4"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => switchMode('focus')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  mode === 'focus' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Focus
              </button>
              <button
                onClick={() => switchMode('break')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  mode === 'break' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Break
              </button>
            </div>

            <div className="text-center mb-12">
              <div className="text-6xl sm:text-8xl font-bold text-zinc-100 tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="text-zinc-500 mt-2 font-medium">
                {mode === 'focus' ? 'Stay focused.' : 'Take a breather.'}
              </div>
            </div>

            <div className="flex justify-center gap-6 mb-8 sm:mb-12">
              <button
                onClick={toggleTimer}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${
                  isActive ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isActive ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />}
              </button>
              <button
                onClick={resetTimer}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-zinc-200 transition-colors"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {mode === 'focus' && (
              <div className="space-y-4 border-t border-zinc-800 pt-6 sm:pt-8">
                <h3 className="text-sm font-medium text-zinc-400 text-center mb-4">Session Details (for auto-logging)</h3>
                <input
                  type="text"
                  placeholder="Subject (e.g., Physics)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <input
                  type="text"
                  placeholder="Topic (e.g., Kinematics)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                {message && (
                  <div className={`text-sm text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.text}
                  </div>
                )}
                {!isActive && timeLeft < focusDuration * 60 && (
                  <button
                    onClick={() => handleLogSession()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Log Current Progress
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Music Player Overlay */}
      {showMusic && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-4">
          <div className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-400" />
              Lofi Focus Radio
            </h3>
          </div>
          <div className="aspect-video w-full bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0&controls=1" 
              title="Lofi Girl Radio" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};
