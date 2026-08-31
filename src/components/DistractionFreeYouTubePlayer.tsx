import React, { useEffect, useRef, memo, useCallback, useState } from 'react';
import { ExternalLink, SkipForward, Brain, ShieldCheck, Repeat, Volume2, VolumeX, Sparkles, Wand2 } from 'lucide-react';
import { YouTubeTrack, YouTubeAudioService } from '../services/youtubeAudioService';

interface DistractionFreeYouTubePlayerProps {
  track: YouTubeTrack | null;
  isPlaying: boolean;
  onTrackRestricted?: (track: YouTubeTrack) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onPlayPause?: () => void;
  onSwitchToSynth?: () => void;
  autoLoop?: boolean;
  onToggleAutoLoop?: () => void;
}

const ERROR_CODES = new Set([2, 5, 100, 101, 150]);

export const DistractionFreeYouTubePlayer = memo(function DistractionFreeYouTubePlayer({
  track,
  isPlaying,
  onTrackRestricted,
  onNextTrack,
  onPrevTrack,
  onPlayPause,
  onSwitchToSynth,
  autoLoop = true,
  onToggleAutoLoop
}: DistractionFreeYouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackRef = useRef(track);
  const onTrackRestrictedRef = useRef(onTrackRestricted);
  const onNextTrackRef = useRef(onNextTrack);
  const autoLoopRef = useRef(autoLoop);
  const [playerVolume, setPlayerVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    trackRef.current = track;
    onTrackRestrictedRef.current = onTrackRestricted;
    onNextTrackRef.current = onNextTrack;
    autoLoopRef.current = autoLoop;
  });

  // 1. Sync OS MediaSession API for Background Playback
  useEffect(() => {
    if (track) {
      YouTubeAudioService.syncMediaSession(
        track,
        isPlaying,
        onNextTrack,
        onPrevTrack,
        onPlayPause,
        onPlayPause
      );
    }
  }, [track, isPlaying, onNextTrack, onPrevTrack, onPlayPause]);

  // 2. Send postMessage handshake on iframe load & resume if playing
  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
        '*'
      );
      if (isPlaying) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      }
    } catch {}
  }, [isPlaying]);

  // 3. Manage Playback via postMessage API (playVideo / pauseVideo)
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    try {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
    } catch {}
  }, [isPlaying]);

  // 4. Volume Controller via postMessage
  const postVolume = useCallback((vol: number) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }),
        '*'
      );
    } catch {}
  }, []);

  // 5. Gentle Fade-Out Controller (like someone peacefully leaving the room)
  const handleFadeOut = useCallback(() => {
    if (isFading || !isPlaying) return;
    setIsFading(true);
    let current = playerVolume;
    const stepTime = 100;
    const totalSteps = 15;
    const stepVal = current / totalSteps;

    const interval = setInterval(() => {
      current = Math.max(0, current - stepVal);
      postVolume(Math.round(current));
      if (current <= 0) {
        clearInterval(interval);
        setIsFading(false);
        if (onPlayPause) onPlayPause();
        postVolume(playerVolume); // Reset volume state for next play
      }
    }, stepTime);
  }, [isFading, isPlaying, playerVolume, postVolume, onPlayPause]);

  // 6. Centralized Event Listener: Anti-Algorithm Loop & Error Interceptor
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }
        if (!data || typeof data !== 'object') return;

        // Catch End-Of-Video (State 0): Prevent YouTube auto-playing random algorithm content
        if (data.event === 'onStateChange' && (data.info === 0 || data.data === 0)) {
          if (autoLoopRef.current && iframeRef.current?.contentWindow) {
            // Instant seamless replay of current study stream
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
              '*'
            );
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
              '*'
            );
          } else if (onNextTrackRef.current) {
            // Auto-advance to the next study track in user's queue
            onNextTrackRef.current();
          }
          return;
        }

        // Extract error codes (2: invalid param, 5: html5 error, 100: not found, 101/150: embedding disabled)
        let errorCode: number | null = null;
        if (typeof data.data === 'number' && ERROR_CODES.has(data.data)) {
          errorCode = data.data;
        } else if (typeof data.info === 'number' && ERROR_CODES.has(data.info)) {
          errorCode = data.info;
        } else if (data.info && typeof data.info === 'object' && typeof data.info.errorCode === 'number' && ERROR_CODES.has(data.info.errorCode)) {
          errorCode = data.info.errorCode;
        } else if (data.event === 'onError') {
          errorCode = typeof data.data === 'number' ? data.data : (typeof data.info === 'number' ? data.info : 150);
        }

        if (errorCode !== null && trackRef.current) {
          const badTrack = trackRef.current;
          console.warn(`[Savantix Focus Engine] YouTube stream '${badTrack.title}' (${badTrack.youtubeId}) restricted by creator (code: ${errorCode}). Auto-skipping to non-repeating fresh track...`);
          YouTubeAudioService.reportBadVideoId(badTrack.youtubeId);
          
          if (onTrackRestrictedRef.current) {
            onTrackRestrictedRef.current(badTrack);
          } else if (onNextTrackRef.current) {
            onNextTrackRef.current();
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  if (!track) return null;

  // Build clean anti-algorithm embed URL with loop=1&playlist={id}
  const embedUrl = YouTubeAudioService.getEmbedUrl(track.youtubeId, true, autoLoop);

  return (
    <div className="space-y-2">
      {/* Distraction-Free Kiosk Video Viewport */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner relative group">
        <iframe
          ref={iframeRef}
          key={`${track.youtubeId}_${autoLoop}`}
          src={embedUrl}
          title={track.title}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen={false}
          onLoad={handleIframeLoad}
        />
      </div>

      {/* Stream Meta & Player Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-zinc-100 truncate flex items-center gap-1.5">
            <span>{track.title}</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-2.5 h-2.5" /> Ad-Filtered
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 truncate mt-0.5 flex items-center gap-2">
            <span>{track.artist} • {track.tag} {track.duration ? `(${track.duration})` : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Loop / Auto-Next Toggle */}
          {onToggleAutoLoop && (
            <button
              type="button"
              onClick={onToggleAutoLoop}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                autoLoop
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
              }`}
              title={autoLoop ? 'Loop current track infinitely (No external ads/videos)' : 'Auto-advance to next study track'}
            >
              <Repeat className="w-3 h-3" />
              <span>{autoLoop ? 'Loop 1' : 'Queue'}</span>
            </button>
          )}

          {/* Smooth Fade-Out Button */}
          <button
            type="button"
            onClick={handleFadeOut}
            disabled={isFading || !isPlaying}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/40 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
            title="Smoothly fade out audio like someone gently leaving the room"
          >
            <Wand2 className={`w-3 h-3 ${isFading ? 'animate-spin' : ''}`} />
            <span>Fade</span>
          </button>

          <a
            href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors flex items-center gap-1"
            title="Open in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>

          {onNextTrack && (
            <button
              type="button"
              onClick={onNextTrack}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-900/40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Skip to next non-repeating track"
            >
              <SkipForward className="w-3 h-3" />
              Next
            </button>
          )}

          {onSwitchToSynth && (
            <button
              type="button"
              onClick={onSwitchToSynth}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to Offline Web Audio Synth"
            >
              <Brain className="w-3 h-3" />
              Synth
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
