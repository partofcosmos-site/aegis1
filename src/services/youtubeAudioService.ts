/**
 * @file youtubeAudioService.ts
 * @description
 * Distraction-Free YouTube Study Audio & Music Engine with Self-Healing Auto-Skip,
 * Blacklist Filtering, and Dynamic Playlist Refresh.
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
  // Lo-Fi & Chillhop
  {
    id: 'yt_lofi_1',
    title: 'Deep Study Lo-Fi Beats to Relax & Focus to',
    artist: 'Lofi Chill Lab',
    category: 'lofi',
    youtubeId: '5qap5aO4i9A',
    tag: 'Chillhop Focus',
    duration: '3h 30m'
  },
  {
    id: 'yt_lofi_2',
    title: 'Midnight Coding & Math Focus Beats',
    artist: 'Coffee Shop Vibes',
    category: 'lofi',
    youtubeId: 'DWcJFNfaw9c',
    tag: 'Late Night Flow',
    duration: '2h 45m'
  },
  {
    id: 'yt_lofi_3',
    title: 'Chill Study Beats for Deep Work & Problem Solving',
    artist: 'Chillhop Music',
    category: 'lofi',
    youtubeId: '1fueZCTYkpA',
    tag: 'Flow State',
    duration: '3h 00m'
  },
  {
    id: 'yt_lofi_4',
    title: 'Japanese Garden Lofi Chill Beats',
    artist: 'Lofi Records',
    category: 'lofi',
    youtubeId: 'rUxyKA_-grg',
    tag: 'Zen Garden',
    duration: '2h 00m'
  },
  {
    id: 'yt_lofi_5',
    title: 'Late Night Study Session Lo-Fi',
    artist: 'ChilledCow Classics',
    category: 'lofi',
    youtubeId: 'n61ULEU7SU0',
    tag: 'Midnight Vibe',
    duration: '3h 15m'
  },

  // 40Hz Gamma & Neuroscience Binaural Beats
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
    id: 'yt_binaural_3',
    title: '40Hz Gamma Focus Frequency for ADHD & Memory',
    artist: 'Cognitive Audio Lab',
    category: 'binaural',
    youtubeId: '21qNxnC46W0',
    tag: 'Gamma Resonance',
    duration: '4h 00m'
  },
  {
    id: 'yt_binaural_4',
    title: 'Pure 10Hz Alpha State Flow Generator',
    artist: 'Brainwave Lab',
    category: 'binaural',
    youtubeId: '92b3R4rQvY0',
    tag: '10Hz Alpha',
    duration: '2h 30m'
  },

  // Classical Music for Deep STEM & Derivations
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
    id: 'yt_classical_3',
    title: 'Vivaldi Complete Four Seasons (Concertos)',
    artist: 'Camerata Academica',
    category: 'classical',
    youtubeId: 'GRxofEmo3HA',
    tag: 'Four Seasons',
    duration: '42m'
  },
  {
    id: 'yt_classical_4',
    title: 'Chopin Nocturnes for Reading & Deep Thinking',
    artist: 'Frédéric Chopin',
    category: 'classical',
    youtubeId: 'RCObOzxZg4Y',
    tag: 'Romantic Piano',
    duration: '2h 00m'
  },

  // Cyberpunk & Synthwave Coding Beats
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
    id: 'yt_synthwave_2',
    title: 'Retrowave & Cyberpunk Deep Coding Session',
    artist: 'Nightride FM',
    category: 'synthwave',
    youtubeId: 'MVPTGNGiI-4',
    tag: 'Code Mode',
    duration: '3h 00m'
  },
  {
    id: 'yt_synthwave_3',
    title: 'Chillwave & Synth Ambient Coding Soundtrack',
    artist: 'Astral Wave',
    category: 'synthwave',
    youtubeId: 'UedTcufyrMH',
    tag: 'Neon Focus',
    duration: '2h 00m'
  },

  // Heavy Rain, Thunder & Cozy Library Acoustics
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
    id: 'yt_ambient_3',
    title: 'Gentle Night Rain on Window for Focused Study',
    artist: 'Calm River Studio',
    category: 'ambient',
    youtubeId: 'lTRiuFIWV54',
    tag: 'Night Rain',
    duration: '4h 00m'
  },

  // Deep Space Ambient & Cosmic Exploration
  {
    id: 'yt_cinematic_1',
    title: 'Space Ambient & Deep Cosmos Focus Odyssey',
    artist: 'Cosmos Audio',
    category: 'cinematic',
    youtubeId: 'sW4YFkK8n64',
    tag: 'Cosmic Ambient',
    duration: '2h 30m'
  },
  {
    id: 'yt_cinematic_2',
    title: 'Interstellar Deep Space Engine & Nebula Atmosphere',
    artist: 'Stellar Sounds',
    category: 'cinematic',
    youtubeId: 'O_OQ0b3hI1g',
    tag: 'Deep Cosmos',
    duration: '3h 00m'
  }
];

export class YouTubeAudioService {
  private static YT_API_KEY_STORAGE = 'savantix_google_yt_api_key_v1';
  private static BAD_VIDEOS_STORAGE = 'savantix_bad_yt_ids_v1';
  private static CUSTOM_TRACKS_STORAGE = 'savantix_custom_yt_tracks_v1';

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

  public static getBadVideoIds(): Set<string> {
    try {
      const data = localStorage.getItem(this.BAD_VIDEOS_STORAGE);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  }

  public static reportBadVideoId(videoId: string): void {
    try {
      const bad = this.getBadVideoIds();
      bad.add(videoId);
      localStorage.setItem(this.BAD_VIDEOS_STORAGE, JSON.stringify(Array.from(bad)));
    } catch {}
  }

  public static getCustomTracks(): YouTubeTrack[] {
    try {
      const data = localStorage.getItem(this.CUSTOM_TRACKS_STORAGE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCustomTrack(track: YouTubeTrack): void {
    try {
      const custom = this.getCustomTracks().filter(t => t.youtubeId !== track.youtubeId);
      custom.unshift(track);
      localStorage.setItem(this.CUSTOM_TRACKS_STORAGE, JSON.stringify(custom.slice(0, 30)));
    } catch {}
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

  /**
   * Returns active, non-blacklisted curated and custom tracks.
   * Dynamically rotated for variety.
   */
  public static getHealthyTracks(): YouTubeTrack[] {
    const bad = this.getBadVideoIds();
    const custom = this.getCustomTracks().filter(t => !bad.has(t.youtubeId));
    const curated = CURATED_FOCUS_TRACKS.filter(t => !bad.has(t.youtubeId));
    return [...custom, ...curated];
  }

  /**
   * Dynamically shuffles/rotates tracks so the library always feels fresh.
   */
  public static rotateFreshTracks(): YouTubeTrack[] {
    const tracks = this.getHealthyTracks();
    // Deterministic or time-based smart shuffle
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    return shuffled;
  }

  public static async searchTracks(query: string): Promise<YouTubeTrack[]> {
    const q = query.trim().toLowerCase();
    const healthy = this.getHealthyTracks();
    if (!q) return healthy;

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
              category: 'custom' as const,
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

    const filtered = healthy.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q)
    );

    return filtered.length > 0 ? filtered : healthy;
  }
}

