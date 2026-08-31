function extractVideos(obj: any, results: any[] = []): any[] {
  if (!obj || typeof obj !== 'object') return results;

  if (obj.videoRenderer && obj.videoRenderer.videoId) {
    const v = obj.videoRenderer;
    const title = v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || '';
    const author = v.ownerText?.runs?.map((r: any) => r.text).join('') || v.shortBylineText?.runs?.map((r: any) => r.text).join('') || '';
    const duration = v.lengthText?.simpleText || '';

    if (v.videoId && title) {
      results.push({
        id: 'yt_live_' + v.videoId,
        youtubeId: v.videoId,
        title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        artist: author.replace(/&amp;/g, '&'),
        category: 'custom',
        tag: duration ? `${duration}` : 'YouTube Video',
        duration: duration || 'Video'
      });
    }
  }

  for (const k of Object.keys(obj)) {
    extractVideos(obj[k], results);
  }
  return results;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query?.q as string || '').trim();
  if (!query) {
    return res.status(200).json({ results: [] });
  }

  try {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!ytRes.ok) {
      return res.status(200).json({ results: [] });
    }

    const html = await ytRes.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) {
      return res.status(200).json({ results: [] });
    }

    const json = JSON.parse(match[1]);
    const rawVideos = extractVideos(json);

    const seen = new Set<string>();
    const unique = rawVideos.filter(v => {
      if (seen.has(v.youtubeId)) return false;
      seen.add(v.youtubeId);
      return true;
    });

    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json({ results: unique.slice(0, 25) });
  } catch (err: any) {
    return res.status(200).json({ results: [] });
  }
}
