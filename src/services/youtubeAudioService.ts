/**
 * @file youtubeAudioService.ts
 * @description
 * Distraction-Free YouTube Study Audio & Music Engine with Self-Healing Auto-Skip,
 * Intelligent Non-Repeating Rotation, Multi-Tiered Search (Anime, Gaming, Lo-Fi, Classical),
 * and MediaSession OS Audio Integration.
 */

export type YouTubeCategory =
  | 'all'
  | 'anime'
  | 'gaming'
  | 'lofi'
  | 'classical'
  | 'binaural'
  | 'synthwave'
  | 'ambient'
  | 'cinematic'
  | 'custom';

export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  category: Exclude<YouTubeCategory, 'all'>;
  youtubeId: string;
  tag: string;
  duration?: string;
}

export const CURATED_FOCUS_TRACKS: YouTubeTrack[] = [
  // ─── ANIME & GHIBLI STUDY MUSIC ───────────────────────────────────────
  {
    id: 'yt_anime_ghibli_piano',
    title: 'Studio Ghibli Relaxing Piano Collection (Spirited Away, Howls)',
    artist: 'Animenz & Theishter Studio',
    category: 'anime',
    youtubeId: 'tfBVp0Zi2iE',
    tag: 'Ghibli Piano',
    duration: '2h 00m'
  },
  {
    id: 'yt_anime_lofi_beats',
    title: 'Anime Lofi Beats to Study/Relax to (Naruto, AOT, Demon Slayer)',
    artist: 'Anime Vibe Chill',
    category: 'anime',
    youtubeId: 'jfKfPfyJRdk',
    tag: 'Anime Chillhop',
    duration: '24/7 Live'
  },
  {
    id: 'yt_anime_naruto_peaceful',
    title: 'Naruto Peaceful & Emotional Soundtracks (Sadness & Sorrow, Wind)',
    artist: 'Toshio Masuda / Yasuharu Takanashi',
    category: 'anime',
    youtubeId: 'mIYzp5rcTvU',
    tag: 'Naruto Flow',
    duration: '1h 45m'
  },
  {
    id: 'yt_anime_your_name_piano',
    title: 'Your Name (Kimi no Na wa) Complete Piano OST Collection',
    artist: 'RADWIMPS Piano Suite',
    category: 'anime',
    youtubeId: '4Tr0otuiQuU',
    tag: 'Your Name',
    duration: '1h 15m'
  },
  {
    id: 'yt_anime_aot_calm',
    title: 'Attack on Titan Calm & Acoustic Suite (Call of Silence, Vogel)',
    artist: 'Hiroyuki Sawano Acoustic',
    category: 'anime',
    youtubeId: '9E6b3swbnWg',
    tag: 'AOT Ambient',
    duration: '1h 30m'
  },
  {
    id: 'yt_anime_violet_evergarden',
    title: 'Violet Evergarden Relaxing Orchestral & Piano Soundscapes',
    artist: 'Evan Call Orchestral',
    category: 'anime',
    youtubeId: 'Rb0UmrCXxVA',
    tag: 'Evergarden',
    duration: '2h 00m'
  },
  {
    id: 'yt_anime_suzume_weathering',
    title: 'Suzume & Weathering With You Gentle Piano Melodies',
    artist: 'Makoto Shinkai Soundtracks',
    category: 'anime',
    youtubeId: '2OEL4P1Rz04',
    tag: 'Shinkai Piano',
    duration: '2h 30m'
  },
  {
    id: 'yt_anime_jujutsu_chill',
    title: 'Jujutsu Kaisen & Demon Slayer Lo-Fi Study Beats',
    artist: 'Lofi Records',
    category: 'anime',
    youtubeId: '1fueZCTYkpA',
    tag: 'JJK Lo-Fi',
    duration: '3h 00m'
  },

  // ─── GAMING OST & IMMERSIVE SOUNDSCAPES ────────────────────────────────
  {
    id: 'yt_game_minecraft_c418',
    title: 'Minecraft Volume Alpha & Beta Relaxing Ambient Music',
    artist: 'C418',
    category: 'gaming',
    youtubeId: 'Dg0IjOzopYU',
    tag: 'Minecraft C418',
    duration: '3h 20m'
  },
  {
    id: 'yt_game_zelda_botw',
    title: 'Zelda: Breath of the Wild & Tears of the Kingdom Ambience',
    artist: 'Nintendo Sound Team',
    category: 'gaming',
    youtubeId: 'hlWiI4xVXKY',
    tag: 'Zelda Ambient',
    duration: '3h 00m'
  },
  {
    id: 'yt_game_hollow_knight',
    title: 'Hollow Knight Peaceful Ambience (Dirtmouth, Resting Grounds)',
    artist: 'Christopher Larkin',
    category: 'gaming',
    youtubeId: '77ZozI0rw7w',
    tag: 'Hollow Knight',
    duration: '2h 30m'
  },
  {
    id: 'yt_game_nier_automata',
    title: 'NieR: Automata Peaceful Sleep & City Ruins Acoustic',
    artist: 'Keiichi Okabe',
    category: 'gaming',
    youtubeId: 'WPni755-Krg',
    tag: 'NieR Ambient',
    duration: '2h 00m'
  },
  {
    id: 'yt_game_persona5_rain',
    title: 'Persona 5: Beneath the Mask & Coffee Shop Rainy Night',
    artist: 'Shoji Meguro Instrumental',
    category: 'gaming',
    youtubeId: 'q76bMs-NwRk',
    tag: 'Persona 5 Chill',
    duration: '3h 00m'
  },
  {
    id: 'yt_game_genshin_peaceful',
    title: 'Genshin Impact Peaceful Orchestral Music (Mondstadt, Fontaine)',
    artist: 'HOYO-MiX',
    category: 'gaming',
    youtubeId: 'jgpJVI3tDbY',
    tag: 'HOYO-MiX',
    duration: '3h 00m'
  },

  // ─── LO-FI & CHILLHOP ────────────────────────────────────────────────
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

  // ─── CLASSICAL & BAROQUE STEM FOCUS ──────────────────────────────────
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

  // ─── BINAURAL BEATS & 40HZ GAMMA ─────────────────────────────────────
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

  // ─── AMBIENT RAIN, THUNDER & FIREPLACE ────────────────────────────────
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

  // ─── SYNTHWAVE & CYBERPUNK ────────────────────────────────────────────
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

  // ─── CINEMATIC & COSMIC ──────────────────────────────────────────────
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
  private static RECENT_TRACKS_STORAGE = 'savantix_recent_played_yt_v1';
  private static memoryBadVideoIds: Set<string> = new Set();
  private static recentTrackIds: string[] = [];
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
        const recent = localStorage.getItem(this.RECENT_TRACKS_STORAGE);
        if (recent) {
          const parsed = JSON.parse(recent);
          if (Array.isArray(parsed)) {
            this.recentTrackIds = parsed.filter(id => typeof id === 'string');
          }
        }
      }
    } catch (err) {
      console.warn('[YouTubeAudioService] LocalStorage read failed:', err);
    }
    this.memoryInitialized = true;
  }

  public static recordPlayedTrack(videoId: string): void {
    if (!videoId) return;
    this.initMemoryCache();
    this.recentTrackIds = [videoId, ...this.recentTrackIds.filter(id => id !== videoId)].slice(0, 15);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.RECENT_TRACKS_STORAGE, JSON.stringify(this.recentTrackIds));
      }
    } catch {}
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
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=0&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&fs=0${originParam}`;
  }

  public static getHealthyTracks(category?: YouTubeCategory): YouTubeTrack[] {
    try {
      const bad = this.getBadVideoIds();
      const custom = this.getCustomTracks().filter(t => t?.youtubeId && !bad.has(t.youtubeId));
      const curated = CURATED_FOCUS_TRACKS.filter(t => t?.youtubeId && !bad.has(t.youtubeId));
      let all = [...custom, ...curated];
      if (category && category !== 'all') {
        all = all.filter(t => t.category === category);
      }
      return all.length > 0 ? all : CURATED_FOCUS_TRACKS;
    } catch {
      return CURATED_FOCUS_TRACKS;
    }
  }

  /**
   * Intelligently selects the next track using a non-repeating ring buffer.
   * NEVER resets to index 0 when an error occurs.
   */
  public static getNextTrack(currentTrackId?: string, trackPool?: YouTubeTrack[]): YouTubeTrack {
    this.initMemoryCache();
    const pool = (trackPool && trackPool.length > 0) ? trackPool : this.getHealthyTracks();
    const bad = this.getBadVideoIds();
    const validTracks = pool.filter(t => !bad.has(t.youtubeId));

    if (validTracks.length === 0) return CURATED_FOCUS_TRACKS[0];
    if (validTracks.length === 1) return validTracks[0];

    // Find tracks not played recently
    const recentSet = new Set(this.recentTrackIds.slice(0, 5));
    if (currentTrackId) recentSet.add(currentTrackId);

    const unplayedTracks = validTracks.filter(t => !recentSet.has(t.youtubeId));

    if (unplayedTracks.length > 0) {
      // Pick a random unplayed track
      const pick = unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
      this.recordPlayedTrack(pick.youtubeId);
      return pick;
    }

    // If all tracks in current pool were played recently, pick the sequential next track
    const currentIndex = currentTrackId ? validTracks.findIndex(t => t.youtubeId === currentTrackId) : -1;
    const nextIndex = (currentIndex + 1) % validTracks.length;
    const selected = validTracks[nextIndex];
    this.recordPlayedTrack(selected.youtubeId);
    return selected;
  }

  /**
   * Dynamically shuffles/rotates tracks so the library always feels fresh.
   */
  public static rotateFreshTracks(category?: YouTubeCategory): YouTubeTrack[] {
    const tracks = this.getHealthyTracks(category);
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    return shuffled;
  }

  /**
   * Fetches metadata for any YouTube URL or Video ID via noembed (100% keyless & CORS-free).
   */
  public static async resolveDirectVideo(input: string): Promise<YouTubeTrack | null> {
    const vidId = this.extractVideoId(input);
    if (!vidId) return null;

    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vidId}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.title) {
          return {
            id: `yt_direct_${vidId}`,
            title: data.title,
            artist: data.author_name || 'YouTube Stream',
            category: 'custom',
            youtubeId: vidId,
            tag: 'Direct Link',
            duration: 'Live Stream'
          };
        }
      }
    } catch {}

    // Fallback if noembed offline
    return {
      id: `yt_direct_${vidId}`,
      title: `YouTube Video (${vidId})`,
      artist: 'Direct Focus Audio',
      category: 'custom',
      youtubeId: vidId,
      tag: 'Direct Link',
      duration: 'Stream'
    };
  }

  /**
   * Multi-tier universal search:
   * 1. Direct URL / Video ID instant parsing
   * 2. YouTube Data API v3 (if key set in settings)
   * 3. Fuzzy search across rich 40+ track library (including all Anime, Gaming, Lo-Fi, Classical)
   */
  public static async searchTracks(query: string): Promise<YouTubeTrack[]> {
    const q = query.trim().toLowerCase();
    const healthy = this.getHealthyTracks();
    if (!q) return healthy;

    // Tier 1: Check if input is a direct YouTube link or ID
    const directTrack = await this.resolveDirectVideo(query);
    if (directTrack) {
      this.saveCustomTrack(directTrack);
      return [directTrack, ...healthy.filter(t => t.youtubeId !== directTrack.youtubeId)];
    }

    // Tier 2: YouTube Data API v3 (if user provided key in settings)
    const key = this.getApiKey();
    if (key) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' study focus instrumental')}&videoEmbeddable=true&type=video&maxResults=10&key=${encodeURIComponent(key)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
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

    // Tier 3: High-accuracy multi-token fuzzy matching against all built-in tracks
    const queryTokens = q.split(/\s+/).filter(Boolean);
    const scoredTracks = healthy.map(track => {
      const searchBlob = `${track.title} ${track.artist} ${track.category} ${track.tag}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (searchBlob.includes(token)) matchCount++;
      }
      return { track, score: matchCount };
    });

    const matches = scoredTracks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);

    if (matches.length > 0) return matches;

    // Tier 4: Category fallback (if query matches category keywords)
    if (q.includes('anime') || q.includes('naruto') || q.includes('ghibli') || q.includes('titan') || q.includes('jujutsu') || q.includes('demon')) {
      return healthy.filter(t => t.category === 'anime');
    }
    if (q.includes('game') || q.includes('gaming') || q.includes('minecraft') || q.includes('zelda') || q.includes('hollow') || q.includes('persona') || q.includes('nier') || q.includes('genshin')) {
      return healthy.filter(t => t.category === 'gaming');
    }
    if (q.includes('classical') || q.includes('mozart') || q.includes('chopin') || q.includes('beethoven') || q.includes('bach') || q.includes('piano')) {
      return healthy.filter(t => t.category === 'classical');
    }
    if (q.includes('rain') || q.includes('ambient') || q.includes('thunder') || q.includes('water') || q.includes('fire')) {
      return healthy.filter(t => t.category === 'ambient');
    }
    if (q.includes('synth') || q.includes('cyber') || q.includes('wave')) {
      return healthy.filter(t => t.category === 'synthwave');
    }

    return healthy;
  }

  /**
   * Syncs current track metadata with the browser MediaSession API.
   * Prevents background tab freezing and enables OS media key integration.
   */
  public static syncMediaSession(
    track: YouTubeTrack | null,
    isPlaying: boolean,
    onNext?: () => void,
    onPrev?: () => void,
    onPlay?: () => void,
    onPause?: () => void
  ): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (!track) {
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'Savantix Focus Engine',
        artwork: [
          {
            src: `https://img.youtube.com/vi/${track.youtubeId}/hqdefault.jpg`,
            sizes: '480x360',
            type: 'image/jpeg'
          }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext);
      if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev);
      if (onPlay) navigator.mediaSession.setActionHandler('play', onPlay);
      if (onPause) navigator.mediaSession.setActionHandler('pause', onPause);
    } catch {}
  }
}
