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

  // 1. Primary: YouTube live index scraping
  try {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(4500)
    });

    if (ytRes.ok) {
      const html = await ytRes.text();
      const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);
      if (match) {
        const json = JSON.parse(match[1]);
        const rawVideos = extractVideos(json);

        const seen = new Set<string>();
        const unique = rawVideos.filter(v => {
          if (seen.has(v.youtubeId)) return false;
          seen.add(v.youtubeId);
          return true;
        });

        if (unique.length > 0) {
          res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
          return res.status(200).json({ results: unique.slice(0, 25) });
        }
      }
    }
  } catch {}

  // 2. Secondary Fallback: Invidious Open Public Instances
  const invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.jing.rocks',
    'https://vid.puffyan.us'
  ];

  for (const instance of invidiousInstances) {
    try {
      const invUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;
      const invRes = await fetch(invUrl, { signal: AbortSignal.timeout(3500) });
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData) && invData.length > 0) {
          const results = invData.slice(0, 20).map((item: any) => ({
            id: 'yt_inv_' + item.videoId,
            youtubeId: item.videoId,
            title: item.title,
            artist: item.author || 'YouTube Artist',
            category: 'custom',
            tag: item.lengthSeconds ? `${Math.floor(item.lengthSeconds / 60)}m` : 'Audio Stream',
            duration: item.lengthSeconds ? `${Math.floor(item.lengthSeconds / 60)}m` : 'Stream'
          }));
          return res.status(200).json({ results });
        }
      }
    } catch {}
  }

  return res.status(200).json({ results: [] });
}
