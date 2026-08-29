/**
 * @file youtubeAudioService.ts
 * @description
 * Distraction-Free YouTube Study Audio & Music Engine.
 */

export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  category: 'lofi' | 'classical' | 'binaural' | 'synthwave' | 'ambient' | 'cinematic' | 'custom';
  youtubeId: string;
  tag: string;
  duration?: string;
}

export const CURATED_FOCUS_TRACKS: YouTubeTrack[] = [
  {
    id: 'yt_lofi_1',
    title: 'Lofi Hip Hop Study & Focus Beats — 24/7 Radio',
    artist: 'Lofi Records',
    category: 'lofi',
    youtubeId: 'jfKfPfyJRdk',
    tag: '24/7 Focus Stream',
    duration: 'Live / Endless'
  },
  {
    id: 'yt_lofi_2',
    title: 'Deep Study Lo-Fi Beats to Relax & Focus to',
    artist: 'Lofi Chill Lab',
    category: 'lofi',
    youtubeId: '5qap5aO4i9A',
    tag: 'Chillhop Focus',
    duration: '3h 30m'
  },
  {
    id: 'yt_lofi_3',
    title: 'Midnight Coding & Math Focus Beats',
    artist: 'Coffee Shop Vibes',
    category: 'lofi',
    youtubeId: 'DWcJFNfaw9c',
    tag: 'Late Night Flow',
    duration: '2h 45m'
  },
  {
    id: 'yt_binaural_1',
    title: '40Hz Gamma Pure Binaural Focus Waves (Study & Cognition)',
    artist: 'Brainwave Neuroscience',
    category: 'binaural',
    youtubeId: 'WPni755-Krg',
    tag: '40Hz Gamma',
    duration: '3h 00m'
  },
  {
    id: 'yt_binaural_2',
    title: '14Hz Beta & Alpha Waves for Intense Concentration',
    artist: 'Neuro Focus Lab',
    category: 'binaural',
    youtubeId: '3H3gQc0J09k',
    tag: 'Alpha / Beta Wave',
    duration: '2h 00m'
  },
  {
    id: 'yt_classical_1',
    title: 'Classical Music for Brain Power & Deep Mathematics',
    artist: 'Mozart & Bach Ensemble',
    category: 'classical',
    youtubeId: 'mIYzp5rcTvU',
    tag: 'Classical Focus',
    duration: '2h 15m'
  },
  {
    id: 'yt_classical_2',
    title: 'Vivaldi Four Seasons & Baroque Concentration',
    artist: 'Antonio Vivaldi',
    category: 'classical',
    youtubeId: 'jgpJVI3tDbY',
    tag: 'Baroque Flow',
    duration: '1h 45m'
  },
  {
    id: 'yt_synthwave_1',
    title: 'Synthwave & Cyberpunk Coding Beats (No Vocals)',
    artist: 'Synth Study Hub',
    category: 'synthwave',
    youtubeId: '4xDzrJKXOOY',
    tag: 'Cyberpunk Flow',
    duration: '2h 30m'
  },
  {
    id: 'yt_ambient_1',
    title: 'Heavy Rainstorm & Thunder for Sleep & Deep Study',
    artist: 'Nature Sounds Studio',
    category: 'ambient',
    youtubeId: 'mPZkdNFkNps',
    tag: 'Rain & Thunder',
    duration: '8h 00m'
  },
  {
    id: 'yt_ambient_2',
    title: 'Cozy Library Study with Gentle Rain & Fireplace',
    artist: 'Ambient World',
    category: 'ambient',
    youtubeId: 'q76bMs-NwRk',
    tag: 'Library & Rain',
    duration: '3h 00m'
  },
  {
    id: 'yt_cinematic_1',
    title: 'Space Ambient & Deep Cosmos Focus Odyssey',
    artist: 'Cosmos Audio',
    category: 'cinematic',
    youtubeId: 'sW4YFkK8n64',
    tag: 'Cosmic Ambient',
    duration: '2h 30m'
  }
];

export class YouTubeAudioService {
  private static YT_API_KEY_STORAGE = 'savantix_google_yt_api_key_v1';

  public static getApiKey(): string {
    try {
      return (localStorage.getItem(this.YT_API_KEY_STORAGE) || '').trim();
    } catch {
      return '';
    }
  }

  public static setApiKey(key: string): void {
    localStorage.setItem(this.YT_API_KEY_STORAGE, key.trim());
  }

  public static extractVideoId(input: string): string | null {
    const clean = input.trim();
    if (!clean) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
    const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([\w-]{11})/);
    return match ? match[1] : null;
  }

  public static getEmbedUrl(videoId: string, autoplay = true): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://savantix.vercel.app';
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}&rel=0&modestbranding=1&playsinline=1`;
  }

  public static async searchTracks(query: string): Promise<YouTubeTrack[]> {
    const q = query.trim().toLowerCase();
    if (!q) return CURATED_FOCUS_TRACKS;

    const key = this.getApiKey();
    if (key) {
      try {
        const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(query + ' study focus instrumental') + '&type=video&maxResults=8&key=' + encodeURIComponent(key);
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            return data.items.map((item: any) => ({
              id: 'yt_' + item.id.videoId,
              title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
              artist: item.snippet.channelTitle,
              category: 'custom',
              youtubeId: item.id.videoId,
              tag: 'YouTube Live',
              duration: 'Study Audio'
            }));
          }
        }
      } catch (err) {
        console.warn('Google YouTube Data API search error:', err);
      }
    }

    const filtered = CURATED_FOCUS_TRACKS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q)
    );

    return filtered.length > 0 ? filtered : CURATED_FOCUS_TRACKS;
  }
}
