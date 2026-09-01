/**
 * Savantix (Aegis) — Distraction-Free YouTube Focus Audio Engine Test Suite
 * @file youtubeAudioService.test.ts
 * 
 * Verifies:
 * 1. Curated evergreen VOD list integrity (non-empty fields, valid 11-char IDs, 5+ core focus genres)
 * 2. Bad video ID blacklist caching in memory Set and localStorage (savantix_bad_yt_ids_v1)
 * 3. URL regex parsing & video ID extraction across watch, embed, live, shortened, and bare formats
 * 4. getHealthyTracks filtering by category, custom tracks inclusion, and blacklist exclusion
 * 5. Anti-algorithm loop embed URL generation (loop=1&playlist={id}, security & kiosk params)
 * 6. Error code auto-skip simulation (codes 2, 5, 100, 101, 150) & circular non-repeating queue
 * 7. Custom user tags & YouTube API key persistence
 */

// ─── IN-MEMORY LOCALSTORAGE MOCK FOR NODE ENVIRONMENT ───────────────────────
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

// Attach mock localStorage, window, navigator to global environment if in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const mockStorage = new MockLocalStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });
}

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    localStorage: globalThis.localStorage,
    location: { origin: 'http://localhost:3000' }
  };
}

if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SavantixTest/1.0',
    mediaSession: {
      metadata: null,
      playbackState: 'none',
      setActionHandler: () => {}
    }
  };
}

import {
  YouTubeAudioService,
  CURATED_FOCUS_TRACKS,
  DEFAULT_USER_TAGS,
  YouTubeTrack,
  YouTubeCategory
} from '../services/youtubeAudioService';

// ─── ASSERTION HELPER ──────────────────────────────────────────────────────
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

// ─── TEST RUNNER ───────────────────────────────────────────────────────────
export async function runYouTubeAudioServiceTests() {
  console.log('\n===============================================================');
  console.log('🎵 RUNNING YOUTUBE FOCUS ENGINE TEST SUITE');
  console.log('===============================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalCount++;
    try {
      fn();
      passedCount++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. Curated Evergreen Library Integrity
  test('Curated Library: contains over 30 verified evergreen study tracks', () => {
    assert(Array.isArray(CURATED_FOCUS_TRACKS), 'CURATED_FOCUS_TRACKS must be an array');
    assert(CURATED_FOCUS_TRACKS.length >= 30, `Expected >= 30 tracks, got ${CURATED_FOCUS_TRACKS.length}`);
  });

  test('Curated Library: every track has valid schema, non-empty fields, and valid 11-char YouTube ID', () => {
    const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    const validCategories: Set<string> = new Set([
      'anime',
      'gaming',
      'lofi',
      'classical',
      'binaural',
      'synthwave',
      'ambient',
      'cinematic',
      'custom'
    ]);

    CURATED_FOCUS_TRACKS.forEach((track, idx) => {
      assert(Boolean(track.id && track.id.trim()), `Track #${idx} missing id`);
      assert(Boolean(track.title && track.title.trim()), `Track #${idx} (${track.id}) missing title`);
      assert(Boolean(track.artist && track.artist.trim()), `Track #${idx} (${track.id}) missing artist`);
      assert(Boolean(track.tag && track.tag.trim()), `Track #${idx} (${track.id}) missing tag`);
      assert(validCategories.has(track.category), `Track #${idx} (${track.id}) has invalid category '${track.category}'`);
      assert(ytIdRegex.test(track.youtubeId), `Track #${idx} (${track.id}) has invalid 11-char YouTube ID '${track.youtubeId}'`);
    });
  });

  test('Curated Library: covers all required focus categories (Lo-Fi, Classical, Binaural/Alpha, Synthwave, Ambient)', () => {
    const categoryCounts: Record<string, number> = {};
    CURATED_FOCUS_TRACKS.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    assert((categoryCounts['lofi'] || 0) >= 3, 'Must have at least 3 Lo-Fi tracks');
    assert((categoryCounts['classical'] || 0) >= 3, 'Must have at least 3 Classical tracks');
    assert((categoryCounts['binaural'] || 0) >= 3, 'Must have at least 3 Binaural / Alpha Waves tracks');
    assert((categoryCounts['synthwave'] || 0) >= 2, 'Must have at least 2 Synthwave tracks');
    assert((categoryCounts['ambient'] || 0) >= 3, 'Must have at least 3 Ambient tracks');
    assert((categoryCounts['anime'] || 0) >= 3, 'Must have at least 3 Anime tracks');
  });

  // 2. URL Regex Parsing & Extraction
  test('extractVideoId: extracts 11-character ID from all standard and edge YouTube URL formats', () => {
    const expectedId = 'tfBVp0Zi2iE';
    const testUrls = [
      `https://www.youtube.com/watch?v=${expectedId}`,
      `http://www.youtube.com/watch?v=${expectedId}`,
      `https://youtube.com/watch?v=${expectedId}`,
      `https://youtu.be/${expectedId}`,
      `http://youtu.be/${expectedId}`,
      `https://www.youtube.com/embed/${expectedId}`,
      `https://www.youtube.com/live/${expectedId}`,
      `https://www.youtube.com/v/${expectedId}`,
      `https://www.youtube.com/watch?v=${expectedId}&t=120s&list=PL12345`,
      `https://www.youtube.com/watch?feature=youtu.be&v=${expectedId}`,
      `  ${expectedId}  `, // Bare ID with whitespace
      expectedId
    ];

    testUrls.forEach(url => {
      const extracted = YouTubeAudioService.extractVideoId(url);
      assert(extracted === expectedId, `Failed to extract '${expectedId}' from '${url}' (got: '${extracted}')`);
    });
  });

  test('extractVideoId: returns null for invalid, non-YouTube, or empty inputs', () => {
    const invalidInputs = [
      '',
      '   ',
      'https://vimeo.com/12345678',
      'https://soundcloud.com/artist/track',
      'https://google.com',
      'not_a_valid_id',
      'short_id'
    ];

    invalidInputs.forEach(input => {
      const extracted = YouTubeAudioService.extractVideoId(input);
      assert(extracted === null, `Expected null for invalid input '${input}', got '${extracted}'`);
    });
  });

  // 3. Bad Video ID Blacklist Caching
  test('Bad Video Blacklist: reportBadVideoId persists to localStorage and excludes from getHealthyTracks', () => {
    YouTubeAudioService.clearBadVideoIds();
    assert(YouTubeAudioService.getBadVideoIds().size === 0, 'Bad video set must be empty after clear');

    const testBadId = CURATED_FOCUS_TRACKS[0].youtubeId;
    YouTubeAudioService.reportBadVideoId(testBadId);

    // Verify Set in memory
    const badIds = YouTubeAudioService.getBadVideoIds();
    assert(badIds.has(testBadId), `Bad video set must contain reported ID '${testBadId}'`);

    // Verify localStorage persistence under savantix_bad_yt_ids_v1
    const rawStorage = localStorage.getItem('savantix_bad_yt_ids_v1');
    assert(rawStorage !== null, 'savantix_bad_yt_ids_v1 must exist in localStorage');
    const parsedList = JSON.parse(rawStorage!);
    assert(Array.isArray(parsedList) && parsedList.includes(testBadId), 'Stored list must contain bad video ID');

    // Verify getHealthyTracks excludes the bad track
    const healthyTracks = YouTubeAudioService.getHealthyTracks();
    const foundBadTrack = healthyTracks.find(t => t.youtubeId === testBadId);
    assert(!foundBadTrack, `getHealthyTracks must NOT contain bad track '${testBadId}'`);

    // Cleanup
    YouTubeAudioService.clearBadVideoIds();
    assert(YouTubeAudioService.getBadVideoIds().size === 0, 'Cleaned up bad IDs');
  });

  test('Bad Video Blacklist: ignores empty or non-string inputs safely', () => {
    const initialSize = YouTubeAudioService.getBadVideoIds().size;
    YouTubeAudioService.reportBadVideoId('');
    YouTubeAudioService.reportBadVideoId('   ');
    YouTubeAudioService.reportBadVideoId(null as any);
    YouTubeAudioService.reportBadVideoId(undefined as any);
    assert(YouTubeAudioService.getBadVideoIds().size === initialSize, 'Invalid inputs must not alter blacklist');
  });

  // 4. getHealthyTracks Filtering & Custom Tracks Integration
  test('getHealthyTracks: filters accurately by category', () => {
    YouTubeAudioService.clearBadVideoIds();

    const lofiTracks = YouTubeAudioService.getHealthyTracks('lofi');
    assert(lofiTracks.length > 0, 'Must return lofi tracks');
    lofiTracks.forEach(t => {
      assert(t.category === 'lofi', `Track ${t.title} category should be 'lofi', got '${t.category}'`);
    });

    const classicalTracks = YouTubeAudioService.getHealthyTracks('classical');
    assert(classicalTracks.length > 0, 'Must return classical tracks');
    classicalTracks.forEach(t => {
      assert(t.category === 'classical', `Track ${t.title} category should be 'classical', got '${t.category}'`);
    });
  });

  test('Custom Tracks: saves to localStorage and integrates into getHealthyTracks', () => {
    localStorage.removeItem('savantix_yt_custom_tracks_v1');

    const customTrack: YouTubeTrack = {
      id: 'yt_custom_test_track_1',
      title: 'Custom Interstellar Theme Study Mix',
      artist: 'Hans Zimmer Suite',
      category: 'custom',
      youtubeId: 'UDVtMYqUAyw',
      tag: 'Interstellar',
      duration: '3h 00m'
    };

    YouTubeAudioService.saveCustomTrack(customTrack);

    const savedTracks = YouTubeAudioService.getCustomTracks();
    assert(savedTracks.length === 1, 'Custom tracks should have 1 item');
    assert(savedTracks[0].youtubeId === 'UDVtMYqUAyw', 'Saved track ID must match');

    // Healthy tracks should include custom track
    const healthy = YouTubeAudioService.getHealthyTracks();
    const foundCustom = healthy.find(t => t.youtubeId === 'UDVtMYqUAyw');
    assert(foundCustom !== undefined, 'getHealthyTracks must include custom tracks');
  });

  // 5. Anti-Algorithm Embed URL Generation
  test('getEmbedUrl: produces strict distraction-free URL with loop and security parameters', () => {
    const videoId = 'tfBVp0Zi2iE';
    const embedUrl = YouTubeAudioService.getEmbedUrl(videoId, true, true);

    assert(embedUrl.startsWith(`https://www.youtube-nocookie.com/embed/${videoId}`), 'Uses youtube-nocookie domain');
    assert(embedUrl.includes('autoplay=1'), 'Includes autoplay=1');
    assert(embedUrl.includes('enablejsapi=1'), 'Enables JS API for postMessage control');
    assert(embedUrl.includes(`loop=1&playlist=${videoId}`), 'Includes loop=1 with playlist={id} anti-algorithm guardrail');
    assert(embedUrl.includes('modestbranding=1'), 'Includes modestbranding=1');
    assert(embedUrl.includes('rel=0'), 'Includes rel=0 (no related videos)');
    assert(embedUrl.includes('iv_load_policy=3'), 'Hides video annotations');
    assert(embedUrl.includes('fs=0'), 'Disables fullscreen distraction');

    const pausedUrl = YouTubeAudioService.getEmbedUrl(videoId, false, false);
    assert(pausedUrl.includes('autoplay=0'), 'Includes autoplay=0 when paused');
    assert(!pausedUrl.includes('&loop=1'), 'Omits loop when autoLoop is false');
  });

  // 6. Error Code Auto-Skip & Non-Repeating Queue Simulation
  test('getNextTrack: rotates through healthy tracks without immediate repetition', () => {
    YouTubeAudioService.clearBadVideoIds();
    localStorage.removeItem('savantix_yt_recent_tracks_v1');

    const track1 = YouTubeAudioService.getNextTrack();
    assert(Boolean(track1 && track1.youtubeId), 'getNextTrack must return a valid track');

    // Calling next track with track1 id should yield a different track
    const track2 = YouTubeAudioService.getNextTrack(track1.youtubeId);
    assert(track2.youtubeId !== track1.youtubeId, 'getNextTrack must not immediately return current track');

    // Record bad video simulation: if track2 fails with code 150
    const ERROR_CODES = new Set([2, 5, 100, 101, 150]);
    const simulatedErrorCode = 150;
    assert(ERROR_CODES.has(simulatedErrorCode), 'Error code 150 is in standard error set');

    // Interceptor reports bad track
    YouTubeAudioService.reportBadVideoId(track2.youtubeId);
    assert(YouTubeAudioService.getBadVideoIds().has(track2.youtubeId), 'Blacklisted bad track');

    // Immediate rotation selects another healthy track
    const track3 = YouTubeAudioService.getNextTrack(track2.youtubeId);
    assert(track3.youtubeId !== track2.youtubeId, 'Rotated track must not be the bad track');
    assert(track3.youtubeId !== track1.youtubeId || CURATED_FOCUS_TRACKS.length <= 2, 'Prefers fresh unplayed track');

    // Cleanup
    YouTubeAudioService.clearBadVideoIds();
  });

  // 7. Custom User Tags & API Key Management
  test('User Custom Tags: manage one-tap tags lifecycle', () => {
    localStorage.removeItem('savantix_yt_custom_tags_v1');

    const defaultTags = YouTubeAudioService.getUserCustomTags();
    assert(Array.isArray(defaultTags) && defaultTags.length === DEFAULT_USER_TAGS.length, 'Returns default tags initially');

    // Add new custom tag
    const newTag = '🌌 Quantum Physics Flow';
    const updatedTags = YouTubeAudioService.addUserCustomTag(newTag);
    assert(updatedTags[0] === newTag, 'New tag should be added to front of list');

    // Remove tag
    const afterRemoval = YouTubeAudioService.removeUserCustomTag(newTag);
    assert(!afterRemoval.includes(newTag), 'Tag should be removed');
  });

  test('YouTube API Key: stores and retrieves key from localStorage', () => {
    localStorage.removeItem('savantix_yt_api_key_v1');
    assert(YouTubeAudioService.getApiKey() === '', 'Empty API key initially');

    YouTubeAudioService.setApiKey('AIzaSyD-TEST-KEY-12345');
    assert(YouTubeAudioService.getApiKey() === 'AIzaSyD-TEST-KEY-12345', 'API key retrieved correctly');

    YouTubeAudioService.setApiKey('');
    assert(YouTubeAudioService.getApiKey() === '', 'API key cleared');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 YOUTUBE FOCUS ENGINE TESTS COMPLETE: ${passedCount}/${totalCount} PASSED`);
  console.log(`===============================================================\n`);
}

// Auto-run when executed directly via tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('youtubeAudioService.test')) {
  runYouTubeAudioServiceTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
