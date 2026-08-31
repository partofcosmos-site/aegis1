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
  // Lo-Fi & Chillhop (Prioritized Verified Multi-Hour Static VODs)
  {
    id: 'yt_lofi_morning_coffee',
    title: 'Morning Coffee ☕️ [lofi hip hop]',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: '1fueZCTYkpA',
    tag: 'Morning Flow',
    duration: '3h 00m'
  },
  {
    id: 'yt_lofi_4am_session',
    title: '4 A.M Study Session 📚 [lofi hip hop]',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'TURbeWK2wwg',
    tag: 'Flow State',
    duration: '3h 00m'
  },
  {
    id: 'yt_lofi_1am_session',
    title: '1 A.M Study Session 📚 [lofi hip hop]',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'lTRiuFIWV54',
    tag: 'Midnight Vibe',
    duration: '3h 15m'
  },
  {
    id: 'yt_lofi_codefi',
    title: 'code-fi / lofi beats to code/relax to',
    artist: 'The AMP Channel',
    category: 'lofi',
    youtubeId: 'f02mOEt11OQ',
    tag: 'Coding Flow',
    duration: '2h 30m'
  },
  {
    id: 'yt_lofi_radio',
    title: 'lofi hip hop radio 📚 beats to relax/study to',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'jfKfPfyJRdk',
    tag: 'Chillhop Focus',
    duration: '24/7 Live'
  },
  {
    id: 'yt_lofi_calm_piano',
    title: 'calm piano radio 🎹 peaceful piano music',
    artist: 'Abao in Tokyo',
    category: 'lofi',
    youtubeId: 'tfBVp0Zi2iE',
    tag: 'Peaceful Piano',
    duration: '24/7 Live'
  },

  // Classical Music for Deep STEM & Derivations (Prioritized Verified Static VODs)
  {
    id: 'yt_classical_reading',
    title: 'Classical Music for Reading - Mozart, Chopin, Debussy',
    artist: 'HALIDONMUSIC',
    category: 'classical',
    youtubeId: 'mIYzp5rcTvU',
    tag: 'Classical Focus',
    duration: '2h 15m'
  },
  {
    id: 'yt_classical_mozart_cognitive',
    title: 'The Best of Mozart for Cognitive Concentration',
    artist: 'HALIDONMUSIC',
    category: 'classical',
    youtubeId: 'Rb0UmrCXxVA',
    tag: 'Mozart Effect',
    duration: '2h 00m'
  },
  {
    id: 'yt_classical_moonlight',
    title: 'Beethoven - Moonlight Sonata (FULL Masterpiece)',
    artist: 'andrea romano',
    category: 'classical',
    youtubeId: '4Tr0otuiQuU',
    tag: 'Sonata Focus',
    duration: '15m'
  },
  {
    id: 'yt_classical_chopin_nocturne',
    title: 'Chopin - Nocturne op.9 No.2 in E Flat Major',
    artist: 'andrea romano',
    category: 'classical',
    youtubeId: '9E6b3swbnWg',
    tag: 'Nocturnes',
    duration: '30m'
  },
  {
    id: 'yt_classical_best_of',
    title: 'The Best of Classical Music 🎻 Mozart, Beethoven, Bach, Vivaldi',
    artist: 'Just Instrumental Music',
    category: 'classical',
    youtubeId: 'jgpJVI3tDbY',
    tag: 'Baroque Flow',
    duration: '3h 00m'
  },
  {
    id: 'yt_classical_four_seasons',
    title: 'Four Seasons ~ Antonio Vivaldi (Complete Concertos)',
    artist: 'Evan Bennet',
    category: 'classical',
    youtubeId: 'GRxofEmo3HA',
    tag: 'Four Seasons',
    duration: '42m'
  },

  // Alpha Waves & Neuroscience Binaural Beats (Prioritized Verified Static VODs)
  {
    id: 'yt_binaural_alpha',
    title: 'Study Music Alpha Waves: Relaxing Studying Music & Brain Power',
    artist: 'Yellow Brick Cinema',
    category: 'binaural',
    youtubeId: 'WPni755-Krg',
    tag: 'Alpha Waves',
    duration: '3h 00m'
  },
  {
    id: 'yt_binaural_sunny_mornings',
    title: 'Sunny Mornings: Relaxing Piano & Acoustic Guitar for Study',
    artist: 'Soothing Relaxation',
    category: 'binaural',
    youtubeId: 'hlWiI4xVXKY',
    tag: 'Acoustic Focus',
    duration: '3h 00m'
  },
  {
    id: 'yt_binaural_piano_water',
    title: 'Soothing Relaxation: Relaxing Piano Music & Water Sounds',
    artist: 'Soothing Relaxation',
    category: 'binaural',
    youtubeId: '77ZozI0rw7w',
    tag: 'Piano Flow',
    duration: '3h 00m'
  },

  // Heavy Rain, Thunder & Cozy Ambience (Prioritized Multi-Hour Permanent VODs)
  {
    id: 'yt_ambient_heavy_rain',
    title: 'Rain Sound On Window with Thunder Sounds (Heavy Rain Study)',
    artist: 'Relaxing Ambience ASMR',
    category: 'ambient',
    youtubeId: 'mPZkdNFkNps',
    tag: 'Rain & Thunder',
    duration: '8h 00m'
  },
  {
    id: 'yt_ambient_night_rain',
    title: '3 Hours of Gentle Night Rain for Sleeping & Deep Study',
    artist: 'The Relaxed Guy',
    category: 'ambient',
    youtubeId: 'q76bMs-NwRk',
    tag: 'Gentle Rain',
    duration: '3h 00m'
  },
  {
    id: 'yt_ambient_fireplace',
    title: 'Fireplace Ambience – Cozy Fire for Relaxation & Reading',
    artist: 'Fireplace Atmosphere',
    category: 'ambient',
    youtubeId: 'L_LUpnjgPso',
    tag: 'Fireplace Warmth',
    duration: '3h 00m'
  },
  {
    id: 'yt_ambient_waterfall',
    title: 'Natural Calm Forest Waterfall & Gentle Stream for Study',
    artist: 'johnnielawson',
    category: 'ambient',
    youtubeId: 'eKFTSSKCzWA',
    tag: 'Forest Stream',
    duration: '8h 00m'
  },

  // Cyberpunk & Synthwave Coding Beats
  {
    id: 'yt_synthwave_radio',
    title: 'synthwave radio 🌌 beats to chill/game to',
    artist: 'Lofi Girl',
    category: 'synthwave',
    youtubeId: '4xDzrJKXOOY',
    tag: 'Cyberpunk Flow',
    duration: '24/7 Live'
  },
  {
    id: 'yt_synthwave_good_life',
    title: 'The Good Life Radio • 24/7 Live Radio | Chillout & Study',
    artist: 'Sensual Musique',
    category: 'synthwave',
    youtubeId: '36YnV9STBqc',
    tag: 'Chillhouse Vibe',
    duration: '24/7 Live'
  },

  // Deep Space Ambient & Cosmic Exploration
  {
    id: 'yt_cinematic_hidden_valley',
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
  private static memoryBadVideoIds: Set<string> = new Set();
  private static memoryInitialized = false;

  private static initMemoryCache(): void {
    if (this.memoryInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.BAD_VIDEOS_STORAGE);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            parsed.forEach(id => {
              if (typeof id === 'string' && id.trim()) {
                this.memoryBadVideoIds.add(id.trim());
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn('[YouTubeAudioService] LocalStorage read failed, using memory cache fallback:', err);
    }
    this.memoryInitialized = true;
  }

  public static getApiKey(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return (localStorage.getItem(this.YT_API_KEY_STORAGE) || '').trim();
      }
      return '';
    } catch {
      return '';
    }
  }

  public static setApiKey(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.YT_API_KEY_STORAGE, key.trim());
      }
    } catch {}
  }

  public static getBadVideoIds(): Set<string> {
    this.initMemoryCache();
    return new Set(this.memoryBadVideoIds);
  }

  public static reportBadVideoId(videoId: string): void {
    if (!videoId || typeof videoId !== 'string') return;
    const cleanId = videoId.trim();
    if (!cleanId) return;

    this.initMemoryCache();
    this.memoryBadVideoIds.add(cleanId);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = Array.from(this.memoryBadVideoIds);
        localStorage.setItem(this.BAD_VIDEOS_STORAGE, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('[YouTubeAudioService] Failed to persist bad video ID to localStorage:', err);
    }
  }

  public static clearBadVideoIds(): void {
    this.memoryBadVideoIds.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.BAD_VIDEOS_STORAGE);
      }
    } catch {}
  }

  public static getCustomTracks(): YouTubeTrack[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.CUSTOM_TRACKS_STORAGE);
        return data ? JSON.parse(data) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public static saveCustomTrack(track: YouTubeTrack): void {
    try {
      const custom = this.getCustomTracks().filter(t => t.youtubeId !== track.youtubeId);
      custom.unshift(track);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.CUSTOM_TRACKS_STORAGE, JSON.stringify(custom.slice(0, 30)));
      }
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
    const origin = typeof window !== 'undefined' && window.location?.origin ? encodeURIComponent(window.location.origin) : '';
    const originParam = origin ? `&origin=${origin}` : '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&fs=0${originParam}`;
  }

  /**
   * Returns active, non-blacklisted curated and custom tracks.
   * Prioritizes verified multi-hour static VODs.
   */
  public static getHealthyTracks(): YouTubeTrack[] {
    try {
      const bad = this.getBadVideoIds();
      const custom = this.getCustomTracks().filter(t => t?.youtubeId && !bad.has(t.youtubeId));
      const curated = CURATED_FOCUS_TRACKS.filter(t => t?.youtubeId && !bad.has(t.youtubeId));
      const all = [...custom, ...curated];
      return all.length > 0 ? all : CURATED_FOCUS_TRACKS;
    } catch {
      return CURATED_FOCUS_TRACKS;
    }
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

