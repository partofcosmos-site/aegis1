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
    title: 'Lofi Girl 24/7 Beats to Relax/Study to',
    artist: 'Lofi Girl',
    category: 'lofi',
    youtubeId: 'jfKfPfyJRdk',
    tag: '24/7 Live Focus',
    duration: 'Live Stream'
  },
  {
    id: 'yt_classical_1',
    title: 'Chopin Complete Nocturnes for Deep Study',
    artist: 'Frédéric Chopin',
    category: 'classical',
    youtubeId: '9E6b3swbnWg',
    tag: 'Classical Piano',
    duration: '1h 58m'
  },
  {
    id: 'yt_cinematic_1',
    title: 'Hans Zimmer Interstellar & Cinematic Deep Work',
    artist: 'Hans Zimmer & Cinematic',
    category: 'cinematic',
    youtubeId: 'N1t9pIu3G_M',
    tag: 'Cinematic Flow',
    duration: '2h 14m'
  },
  {
    id: 'yt_binaural_1',
    title: '40Hz Gamma Pure Binaural Beats for Problem Solving',
    artist: 'Brainwave Science',
    category: 'binaural',
    youtubeId: '1_G6EZncv8k',
    tag: '40Hz Focus',
    duration: '3h 00m'
  },
  {
    id: 'yt_synthwave_1',
    title: 'Synthwave / Cyberpunk Coding & Intense Math Focus',
    artist: 'Lofi & Synth',
    category: 'synthwave',
    youtubeId: '4xDzrJKXOOY',
    tag: 'Cyberpunk Focus',
    duration: '2h 00m'
  },
  {
    id: 'yt_ambient_1',
    title: 'Cozy Rainy Night Café & Soft Piano Study',
    artist: 'Ambience Studio',
    category: 'ambient',
    youtubeId: 'h2zkV-l_TbY',
    tag: 'Rain & Café',
    duration: '3h 30m'
  },
  {
    id: 'yt_classical_2',
    title: 'Mozart Classical Concentration & Learning Symphony',
    artist: 'W.A. Mozart',
    category: 'classical',
    youtubeId: 'Rb0UmrCXxVA',
    tag: 'Mozart Effect',
    duration: '2h 05m'
  },
  {
    id: 'yt_ghibli_1',
    title: 'Relaxing Studio Ghibli Piano Collection',
    artist: 'Joe Hisaishi / Ghibli',
    category: 'lofi',
    youtubeId: '3jWRrafhO7M',
    tag: 'Ghibli Piano',
    duration: '1h 35m'
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
    const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }

  public static getEmbedUrl(videoId: string, autoplay = true): string {
    return 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=' + (autoplay ? 1 : 0) + '&controls=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1';
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
              title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '\"'),
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
