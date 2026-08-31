import React, { useEffect, useRef, memo } from 'react';
import { ExternalLink, SkipForward, Brain, ShieldCheck } from 'lucide-react';
import { YouTubeTrack, YouTubeAudioService } from '../services/youtubeAudioService';

interface DistractionFreeYouTubePlayerProps {
  track: YouTubeTrack | null;
  isPlaying: boolean;
  onTrackRestricted?: (track: YouTubeTrack) => void;
  onNextTrack?: () => void;
  onSwitchToSynth?: () => void;
}

export const DistractionFreeYouTubePlayer = memo(function DistractionFreeYouTubePlayer({
  track,
  isPlaying,
  onTrackRestricted,
  onNextTrack,
  onSwitchToSynth
}: DistractionFreeYouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Manage Playback via postMessage (Zero iframe DOM reloading or buffer resets)
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

  // 2. Intercept YouTube Player Error Messages & Embedding Restrictions
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

        // Error codes: 2 (invalid param), 5 (HTML5 error), 100 (not found/removed), 101/150 (embedding disabled)
        const isErrorEvent = data.event === 'onError' || (data.info && typeof data.info === 'number' && [2, 5, 100, 101, 150].includes(data.info));
        if (isErrorEvent && track) {
          console.warn(`[Savantix Focus Engine] YouTube stream '${track.title}' (${track.youtubeId}) restricted by creator. Auto-skipping...`);
          YouTubeAudioService.reportBadVideoId(track.youtubeId);
          if (onTrackRestricted) {
            onTrackRestricted(track);
          } else if (onNextTrack) {
            onNextTrack();
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [track, onTrackRestricted, onNextTrack]);

  if (!track) return null;

  // Build clean embed URL with distraction suppression parameters
  const embedUrl = `https://www.youtube-nocookie.com/embed/${track.youtubeId}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&fs=0`;

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
              title="Skip to next verified track"
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
