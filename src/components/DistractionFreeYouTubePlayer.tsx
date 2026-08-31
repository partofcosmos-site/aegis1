import React, { useEffect, useRef, memo, useCallback } from 'react';
import { ExternalLink, SkipForward, Brain, ShieldCheck } from 'lucide-react';
import { YouTubeTrack, YouTubeAudioService } from '../services/youtubeAudioService';

interface DistractionFreeYouTubePlayerProps {
  track: YouTubeTrack | null;
  isPlaying: boolean;
  onTrackRestricted?: (track: YouTubeTrack) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onPlayPause?: () => void;
  onSwitchToSynth?: () => void;
}

const ERROR_CODES = new Set([2, 5, 100, 101, 150]);

export const DistractionFreeYouTubePlayer = memo(function DistractionFreeYouTubePlayer({
  track,
  isPlaying,
  onTrackRestricted,
  onNextTrack,
  onPrevTrack,
  onPlayPause,
  onSwitchToSynth
}: DistractionFreeYouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackRef = useRef(track);
  const onTrackRestrictedRef = useRef(onTrackRestricted);
  const onNextTrackRef = useRef(onNextTrack);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    trackRef.current = track;
    onTrackRestrictedRef.current = onTrackRestricted;
    onNextTrackRef.current = onNextTrack;
    isPlayingRef.current = isPlaying;
  });

  // 1. Sync OS MediaSession API for Background Playback & Media Key Control
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

  // 4. Centralized Fast Error Interceptor (<50ms trigger, non-repeating blacklist persistence)
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

        // Extract error codes (2: invalid param, 5: html5 error, 100: not found/removed, 101/150: embedding disabled)
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
          
          // Instant callback to parent (<50ms)
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

  // Build clean embed URL with distraction suppression parameters & origin
  const origin = typeof window !== 'undefined' && window.location?.origin ? encodeURIComponent(window.location.origin) : '';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${track.youtubeId}?autoplay=1&mute=0&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&fs=0${origin ? `&origin=${origin}` : ''}`;

  return (
    <div className="space-y-2">
      {/* Distraction-Free Kiosk Video Viewport */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner relative group">
        <iframe
          ref={iframeRef}
          key={track.youtubeId}
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
          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
            {track.artist} • {track.tag} {track.duration ? `(${track.duration})` : ''}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
