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
  // Lo-Fi & Chillhop (100% Verified Evergreen Uploads)
  {
    id: 'yt_lofi_1',
    title: 'lofi hip hop radio 📚 beats to relax/study to',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'jfKfPfyJRdk',
    tag: 'Chillhop Focus',
    duration: '24/7 Live'
  },
  {
    id: 'yt_lofi_2',
    title: 'Morning Coffee ☕️ [lofi hip hop]',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: '1fueZCTYkpA',
    tag: 'Late Night Flow',
    duration: '3h 00m'
  },
  {
    id: 'yt_lofi_3',
    title: '4 A.M Study Session 📚 [lofi hip hop]',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'TURbeWK2wwg',
    tag: 'Flow State',
    duration: '3h 00m'
  },
  {
    id: 'yt_lofi_4',
    title: '1 A.M Study Session 📚 [lofi hip hop]',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'lTRiuFIWV54',
    tag: 'Midnight Vibe',
    duration: '3h 15m'
  },
  {
    id: 'yt_lofi_5',
    title: 'code-fi / lofi beats to code/relax to',
    artist: 'The AMP Channel',
    category: 'lofi',
    youtubeId: 'f02mOEt11OQ',
    tag: 'Coding Flow',
    duration: '2h 30m'
  },
  {
    id: 'yt_lofi_6',
    title: 'calm piano radio 🎹 peaceful piano music',
    artist: 'Abao in Tokyo',
    category: 'lofi',
    youtubeId: 'tfBVp0Zi2iE',
    tag: 'Peaceful Piano',
    duration: '24/7 Live'
  },

  // Classical Music for Deep STEM & Derivations
  {
    id: 'yt_classical_1',
    title: 'Classical Music for Reading - Mozart, Chopin, Debussy',
    artist: 'HALIDONMUSIC',
    category: 'classical',
    youtubeId: 'mIYzp5rcTvU',
    tag: 'Classical Focus',
    duration: '2h 15m'
  },
  {
    id: 'yt_classical_2',
    title: 'The Best of Classical Music 🎻 Mozart, Beethoven, Bach, Vivaldi',
    artist: 'Just Instrumental Music',
    category: 'classical',
    youtubeId: 'jgpJVI3tDbY',
    tag: 'Baroque Flow',
    duration: '3h 00m'
  },
  {
    id: 'yt_classical_3',
    title: 'Four Seasons ~ Antonio Vivaldi (Complete Concertos)',
    artist: 'Evan Bennet',
    category: 'classical',
    youtubeId: 'GRxofEmo3HA',
    tag: 'Four Seasons',
    duration: '42m'
  },
  {
    id: 'yt_classical_4',
    title: 'Beethoven - Moonlight Sonata (FULL Masterpiece)',
    artist: 'andrea romano',
    category: 'classical',
    youtubeId: '4Tr0otuiQuU',
    tag: 'Sonata Focus',
    duration: '15m'
  },
  {
    id: 'yt_classical_5',
    title: 'The Best of Mozart for Cognitive Concentration',
    artist: 'HALIDONMUSIC',
    category: 'classical',
    youtubeId: 'Rb0UmrCXxVA',
    tag: 'Mozart Effect',
    duration: '2h 00m'
  },
  {
    id: 'yt_classical_6',
    title: 'Chopin - Nocturne op.9 No.2 in E Flat Major',
    artist: 'andrea romano',
    category: 'classical',
    youtubeId: '9E6b3swbnWg',
    tag: 'Nocturnes',
    duration: '30m'
  },

  // Alpha Waves & Neuroscience Binaural Beats
  {
    id: 'yt_binaural_1',
    title: 'Study Music Alpha Waves: Relaxing Studying Music & Brain Power',
    artist: 'Yellow Brick Cinema',
    category: 'binaural',
    youtubeId: 'WPni755-Krg',
    tag: 'Alpha Waves',
    duration: '3h 00m'
  },
  {
    id: 'yt_binaural_2',
    title: 'Sunny Mornings: Relaxing Piano & Acoustic Guitar for Study',
    artist: 'Soothing Relaxation',
    category: 'binaural',
    youtubeId: 'hlWiI4xVXKY',
    tag: 'Acoustic Focus',
    duration: '3h 00m'
  },
  {
    id: 'yt_binaural_3',
    title: 'Soothing Relaxation: Relaxing Piano Music & Water Sounds',
    artist: 'Soothing Relaxation',
    category: 'binaural',
    youtubeId: '77ZozI0rw7w',
    tag: 'Piano Flow',
    duration: '3h 00m'
  },

  // Cyberpunk & Synthwave Coding Beats
  {
    id: 'yt_synthwave_1',
    title: 'synthwave radio 🌌 beats to chill/game to',
    artist: 'Lofi Girl',
    category: 'synthwave',
    youtubeId: '4xDzrJKXOOY',
    tag: 'Cyberpunk Flow',
    duration: '24/7 Live'
  },
  {
    id: 'yt_synthwave_2',
    title: 'The Good Life Radio • 24/7 Live Radio | Chillout & Study',
    artist: 'Sensual Musique',
    category: 'synthwave',
    youtubeId: '36YnV9STBqc',
    tag: 'Chillhouse Vibe',
    duration: '24/7 Live'
  },

  // Heavy Rain, Thunder & Cozy Ambience
  {
    id: 'yt_ambient_1',
    title: 'Rain Sound On Window with Thunder Sounds (Heavy Rain Study)',
    artist: 'Relaxing Ambience ASMR',
    category: 'ambient',
    youtubeId: 'mPZkdNFkNps',
    tag: 'Rain & Thunder',
    duration: '8h 00m'
  },
  {
    id: 'yt_ambient_2',
    title: '3 Hours of Gentle Night Rain for Sleeping & Deep Study',
    artist: 'The Relaxed Guy',
    category: 'ambient',
    youtubeId: 'q76bMs-NwRk',
    tag: 'Gentle Rain',
    duration: '3h 00m'
  },
  {
    id: 'yt_ambient_3',
    title: 'Fireplace Ambience – Cozy Fire for Relaxation & Reading',
    artist: 'Fireplace Atmosphere',
    category: 'ambient',
    youtubeId: 'L_LUpnjgPso',
    tag: 'Fireplace Warmth',
    duration: '3h 00m'
  },
  {
    id: 'yt_ambient_4',
    title: 'Natural Calm Forest Waterfall & Gentle Stream for Study',
    artist: 'johnnielawson',
    category: 'ambient',
    youtubeId: 'eKFTSSKCzWA',
    tag: 'Forest Stream',
    duration: '8h 00m'
  },

  // Deep Space Ambient & Cosmic Exploration
  {
    id: 'yt_cinematic_1',
    title: 'The Hidden Valley: Ambient Relaxing Music for Flow State',
    artist: 'Soothing Relaxation',
    category: 'cinematic',
    youtubeId: '2OEL4P1Rz04',
    tag: 'Cosmic Flow',
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
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`;
  }

  /**
   * Returns active, non-blacklisted curated and custom tracks.
   * Dynamically rotated for variety.
   */
  public static getHealthyTracks(): YouTubeTrack[] {
    const bad = this.getBadVideoIds();
    const custom = this.getCustomTracks().filter(t => !bad.has(t.youtubeId));
    const curated = CURATED_FOCUS_TRACKS.filter(t => !bad.has(t.youtubeId));
    const all = [...custom, ...curated];
    return all.length > 0 ? all : CURATED_FOCUS_TRACKS;
  }

  /**
   * Dynamically shuffles/rotates tracks so the library always feels fresh.
   */
  public static rotateFreshTracks(): YouTubeTrack[] {
    const tracks = this.getHealthyTracks();
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

