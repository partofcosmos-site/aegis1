/**
 * @file youtubeAudioService.ts
 * @description
 * Distraction-Free YouTube Study Audio Engine with Open Live YouTube Search,
 * User-Customizable One-Tap Tags, Non-Repeating Rotation, Anti-Algorithm Guardrails,
 * Audio Fade-Out, and MediaSession OS Integration.
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
  thumbnail?: string;
}

export const DEFAULT_USER_TAGS: string[] = [
  '⛩️ Ghibli Piano',
  '🍜 Naruto Lo-Fi',
  '⚔️ Attack on Titan',
  '🎮 Minecraft Ambience',
  '☕ 4 A.M Study Session',
  '🧠 40Hz Gamma Focus',
  '🌌 Synthwave Beats',
  '🌧️ Heavy Rain Thunder'
];

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
  {
    id: 'yt_anime_demon_slayer_battle',
    title: 'Demon Slayer: Kimetsu no Yaiba Epic Battle & Fighting OST Suite (Gurenge, Mugen Train)',
    artist: 'Go Shiina & Yuki Kajiura',
    category: 'anime',
    youtubeId: '1fueZCTYkpA',
    tag: 'Demon Slayer Fight',
    duration: '2h 15m'
  },
  {
    id: 'yt_anime_naruto_fighting_spirit',
    title: 'Naruto: Strong and Strike & The Raising Fighting Spirit (Epic Battle Suite)',
    artist: 'Toshio Masuda / Yasuharu Takanashi',
    category: 'anime',
    youtubeId: 'mIYzp5rcTvU',
    tag: 'Fighting Spirit',
    duration: '1h 50m'
  },
  {
    id: 'yt_anime_aot_battle_theme',
    title: 'Attack on Titan: YouSeeBIGGIRL / T:T & Ashes on The Fire (Epic Battle Mix)',
    artist: 'Hiroyuki Sawano & Kohta Yamamoto',
    category: 'anime',
    youtubeId: '9E6b3swbnWg',
    tag: 'AOT Fight',
    duration: '2h 00m'
  },
  {
    id: 'yt_anime_bleach_battle',
    title: 'Bleach: Number One & Stand Up Be Strong (Orchestral Battle Theme)',
    artist: 'Shiro Sagisu',
    category: 'anime',
    youtubeId: 'Rb0UmrCXxVA',
    tag: 'Bleach Battle',
    duration: '1h 30m'
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
  private static USER_TAGS_STORAGE = 'savantix_user_custom_yt_tags_v1';
  private static SEARCH_CACHE_STORAGE = 'savantix_yt_search_cache_v1';
  
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

  // ─── USER CUSTOM ONE-TAP TAGS ──────────────────────────────────────────
  public static getUserCustomTags(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(this.USER_TAGS_STORAGE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      return DEFAULT_USER_TAGS;
    } catch {
      return DEFAULT_USER_TAGS;
    }
  }

  public static addUserCustomTag(tag: string): string[] {
    const clean = tag.trim();
    if (!clean) return this.getUserCustomTags();
    const current = this.getUserCustomTags().filter(t => t.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...current].slice(0, 20);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.USER_TAGS_STORAGE, JSON.stringify(updated));
      }
    } catch {}
    return updated;
  }

  public static removeUserCustomTag(tag: string): string[] {
    const updated = this.getUserCustomTags().filter(t => t !== tag);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.USER_TAGS_STORAGE, JSON.stringify(updated));
      }
    } catch {}
    return updated;
  }

  // ─── RECENT & HEALTH PERSISTENCE ──────────────────────────────────────
  public static recordPlayedTrack(videoId: string): void {
    if (!videoId) return;
    this.initMemoryCache();
    this.recentTrackIds = [videoId, ...this.recentTrackIds.filter(id => id !== videoId)].slice(0, 25);
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
        localStorage.setItem(this.CUSTOM_TRACKS_STORAGE, JSON.stringify(custom.slice(0, 50)));
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

  /**
   * Anti-Algorithm Distraction-Free Embed URL:
   * Uses loop=1&playlist={id} so YouTube NEVER auto-plays external random recommended videos (e.g. BBC news / clickbait)!
   */
  public static getEmbedUrl(videoId: string, autoplay = true, autoLoop = true): string {
    const origin = typeof window !== 'undefined' && window.location?.origin ? encodeURIComponent(window.location.origin) : '';
    const originParam = origin ? `&origin=${origin}` : '';
    const loopParam = autoLoop ? `&loop=1&playlist=${videoId}` : '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=0&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&fs=0${loopParam}${originParam}`;
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
   * Intelligent non-repeating circular queue.
   * NEVER jumps to index 0 when error occurs.
   */
  public static getNextTrack(currentTrackId?: string, trackPool?: YouTubeTrack[]): YouTubeTrack {
    this.initMemoryCache();
    const pool = (trackPool && trackPool.length > 0) ? trackPool : this.getHealthyTracks();
    const bad = this.getBadVideoIds();
    const validTracks = pool.filter(t => !bad.has(t.youtubeId));

    if (validTracks.length === 0) return CURATED_FOCUS_TRACKS[0];
    if (validTracks.length === 1) return validTracks[0];

    // Find tracks not played recently
    const recentSet = new Set(this.recentTrackIds.slice(0, 10));
    if (currentTrackId) recentSet.add(currentTrackId);

    const unplayedTracks = validTracks.filter(t => !recentSet.has(t.youtubeId));

    if (unplayedTracks.length > 0) {
      const pick = unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
      this.recordPlayedTrack(pick.youtubeId);
      return pick;
    }

    // Circular fallback: sequential next track
    const currentIndex = currentTrackId ? validTracks.findIndex(t => t.youtubeId === currentTrackId) : -1;
    const nextIndex = (currentIndex + 1) % validTracks.length;
    const selected = validTracks[nextIndex];
    this.recordPlayedTrack(selected.youtubeId);
    return selected;
  }

  public static rotateFreshTracks(category?: YouTubeCategory): YouTubeTrack[] {
    const tracks = this.getHealthyTracks(category);
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    return shuffled;
  }

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
   * Universal Open Search Engine:
   * 1. Direct URL / Video ID instant parsing
   * 2. Live YouTube open search via /api/yt-search
   * 3. Google YouTube Data API v3 (if key provided)
   * 4. Multi-token weighted fuzzy matcher against built-in 40+ track library
   * 5. Fallback category routing
   */
  public static async searchTracks(query: string): Promise<YouTubeTrack[]> {
    const q = query.trim();
    const healthy = this.getHealthyTracks();
    if (!q) return healthy;

    // 1. Direct Link / Video ID
    const directTrack = await this.resolveDirectVideo(q);
    if (directTrack) {
      this.saveCustomTrack(directTrack);
      return [directTrack, ...healthy.filter(t => t.youtubeId !== directTrack.youtubeId)];
    }

    // Check search cache in localStorage
    const cacheKey = `savantix_cache_${q.toLowerCase()}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // 2. Open Live YouTube Search via Vercel Serverless Function /api/yt-search
    try {
      const apiRes = await fetch(`/api/yt-search?q=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(4500)
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          const bad = this.getBadVideoIds();
          const cleanResults: YouTubeTrack[] = data.results
            .filter((v: any) => v.youtubeId && !bad.has(v.youtubeId))
            .map((v: any) => ({
              id: v.id || `yt_${v.youtubeId}`,
              title: v.title,
              artist: v.artist || 'YouTube Creator',
              category: 'custom' as const,
              youtubeId: v.youtubeId,
              tag: v.duration || 'Open Search',
              duration: v.duration || 'Stream'
            }));

          if (cleanResults.length > 0) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(cleanResults));
            } catch {}
            return cleanResults;
          }
        }
      }
    } catch {}

    // 3. YouTube Data API v3 (if key configured)
    const key = this.getApiKey();
    if (key) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q + ' study instrumental')}&videoEmbeddable=true&type=video&maxResults=12&key=${encodeURIComponent(key)}`;
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
      } catch {}
    }

    // 4. Multi-token fuzzy match against library
    const qLower = q.toLowerCase();
    const queryTokens = qLower.split(/\s+/).filter(Boolean);
    const scoredTracks = healthy.map(track => {
      const searchBlob = `${track.title} ${track.artist} ${track.category} ${track.tag}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (searchBlob.includes(token)) matchCount += 2;
      }
      return { track, score: matchCount };
    });

    const matches = scoredTracks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);

    if (matches.length > 0) return matches;

    // 5. Category & Semantic fallback
    if (qLower.includes('fight') || qLower.includes('battle') || qLower.includes('epic') || qLower.includes('action') || qLower.includes('phonk') || qLower.includes('boss')) {
      const fightMatches = healthy.filter(t => 
        t.title.toLowerCase().includes('fight') || 
        t.title.toLowerCase().includes('battle') || 
        t.title.toLowerCase().includes('titan') || 
        t.title.toLowerCase().includes('demon') || 
        t.title.toLowerCase().includes('naruto') || 
        t.title.toLowerCase().includes('bleach') ||
        t.tag.toLowerCase().includes('fight')
      );
      if (fightMatches.length > 0) return fightMatches;
    }
    if (qLower.includes('anime') || qLower.includes('naruto') || qLower.includes('ghibli') || qLower.includes('titan') || qLower.includes('jujutsu') || qLower.includes('demon')) {
      return healthy.filter(t => t.category === 'anime');
    }
    if (qLower.includes('game') || qLower.includes('gaming') || qLower.includes('minecraft') || qLower.includes('zelda') || qLower.includes('hollow') || qLower.includes('persona') || qLower.includes('nier') || qLower.includes('genshin')) {
      return healthy.filter(t => t.category === 'gaming');
    }
    if (qLower.includes('classical') || qLower.includes('mozart') || qLower.includes('chopin') || qLower.includes('beethoven') || qLower.includes('bach') || qLower.includes('piano')) {
      return healthy.filter(t => t.category === 'classical');
    }
    if (qLower.includes('rain') || qLower.includes('ambient') || qLower.includes('thunder') || qLower.includes('water') || qLower.includes('fire')) {
      return healthy.filter(t => t.category === 'ambient');
    }
    if (qLower.includes('synth') || qLower.includes('cyber') || qLower.includes('wave')) {
      return healthy.filter(t => t.category === 'synthwave');
    }
    if (qLower.includes('40hz') || qLower.includes('gamma') || qLower.includes('binaural') || qLower.includes('brain')) {
      return healthy.filter(t => t.category === 'binaural');
    }

    return healthy;
  }

  public static getTracksByCategory(category: YouTubeCategory): YouTubeTrack[] {
    const all = this.getHealthyTracks();
    if (!category || category === 'all') return all;
    const filtered = all.filter(t => t.category === category);
    return filtered.length > 0 ? filtered : all;
  }

  // ─── MEDIASESSION & BACKGROUND PLAYBACK ────────────────────────────────
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
