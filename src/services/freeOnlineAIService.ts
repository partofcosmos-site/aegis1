/**
 * @file freeOnlineAIService.ts
 * @description
 * Online, Keyless, Zero-API-Key Free AI Knowledge & Diagram Service.
 * Connects directly to public, unauthenticated scientific APIs:
 * - Wikipedia REST API (instant factual & conceptual summaries)
 * - ArXiv Open Scholarly Search (peer-reviewed papers & advanced derivations)
 * - Pollinations Keyless Image AI (concept diagrams & visual illustrations)
 */

export interface WikiConceptSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  pageUrl?: string;
}

export interface ArxivPaperSummary {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  pdfUrl?: string;
}

export class FreeOnlineAIService {
  /**
   * Fetches instant, verified scientific concept summaries from Wikipedia REST API without any API key.
   */
  public static async fetchConceptSummary(topic: string): Promise<WikiConceptSummary | null> {
    try {
      const clean = topic
        .trim()
        .replace(/^(foundations of|governing equations of|advanced|intermediate)\s+/i, '')
        .replace(/\s+/g, '_');
      
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) return null;
      const data = await res.json();
      return {
        title: data.title,
        extract: data.extract,
        description: data.description,
        thumbnailUrl: data.thumbnail?.source,
        pageUrl: data.content_urls?.desktop?.page
      };
    } catch (e) {
      console.warn('Keyless Wikipedia summary fetch failed:', e);
      return null;
    }
  }

  /**
   * Searches ArXiv for real scientific preprints & derivations on any STEM topic without an API key.
   */
  public static async searchArxivPapers(topic: string, maxResults = 3): Promise<ArxivPaperSummary[]> {
    try {
      const clean = topic.replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '+');
      const res = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(clean)}&start=0&max_results=${maxResults}`);
      if (!res.ok) return [];

      const xmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const entries = Array.from(doc.querySelectorAll('entry'));

      return entries.map(entry => {
        const id = entry.querySelector('id')?.textContent || '';
        const title = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || '';
        const summary = entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || '';
        const published = entry.querySelector('published')?.textContent?.slice(0, 10) || '';
        const authors = Array.from(entry.querySelectorAll('author name')).map(a => a.textContent || '');
        const pdfLink = Array.from(entry.querySelectorAll('link')).find(l => l.getAttribute('title') === 'pdf')?.getAttribute('href') || id.replace('abs', 'pdf');

        return { id, title, summary, authors, published, pdfUrl: pdfLink };
      });
    } catch (e) {
      console.warn('Keyless ArXiv search failed:', e);
      return [];
    }
  }

  /**
   * Generates a keyless AI concept diagram URL using Pollinations.
   */
  public static getConceptDiagramUrl(prompt: string, width = 800, height = 480): string {
    const cleanPrompt = encodeURIComponent(`scientific technical diagram, clean vector art, educational illustration: ${prompt}, high resolution, schematic`);
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true`;
  }
}