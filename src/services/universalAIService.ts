import { AIVaultService } from './aiVaultService';
import { AIProviderConfig } from './aiProviderTypes';

export interface ParsedLog {
  subject: string;
  topic: string;
  subtopic: string;
  durationMinutes: number;
  problemsSolved: number;
  mistakes: string[];
  efficiencyScore: number;
  focusScore: number;
}

export interface DailyInsightData {
  performanceSummary: string;
  keyInefficiencies: string[];
  biggestMistakePattern: string;
  hiddenWeakness: string;
  nextDayPlan: string[];
  priorityRanking: string[];
  warnings: string[];
}

export interface AIFlashcard {
  front: string;
  back: string;
  deck: string;
  svgDiagram?: string;
}

export function extractJsonFromText<T>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error("No content received from AI provider");
  }

  const trimmed = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Try extracting code fence content ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Find first JSON object { ... } or array [ ... ]
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');

  let startIndex = -1;
  let endIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = trimmed.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = trimmed.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const candidate = trimmed.substring(startIndex, endIndex + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Clean trailing commas before closing braces/brackets
      const cleaned = candidate.replace(/,\s*([\]\}])/g, '$1');
      try {
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  throw new Error(`Failed to extract valid JSON from AI response: ${trimmed.slice(0, 120)}...`);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Check endpoint responsiveness.`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export class UniversalAIService {
  public static async executeJsonRequest<T>(prompt: string, schemaDescription: string, activeProvider?: AIProviderConfig): Promise<T> {
    const config = activeProvider || AIVaultService.getActiveProvider();
    const apiKey = (config.apiKey || '').trim();
    const baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');

    if (config.providerType === 'google') {
      const url = `${baseUrl}/models/${config.selectedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const body: any = {
        contents: [{ parts: [{ text: `${prompt}\n\nStrict requirement: Output strictly valid JSON matching this schema without any markdown wrapping or commentary:\n${schemaDescription}` }] }],
        generationConfig: {
          temperature: config.temperature ?? 0.2,
          responseMimeType: 'application/json'
        }
      };

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, 35000);

      if (!res.ok) {
        let errMessage = `Gemini API error ${res.status}`;
        try {
          const err = await res.json();
          errMessage = err.error?.message || err.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini API");
      return extractJsonFromText<T>(text);
    } else if (config.providerType === 'anthropic') {
      const url = `${baseUrl}/messages`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.selectedModel,
          max_tokens: config.maxTokens || 4096,
          temperature: config.temperature ?? 0.2,
          system: `You are a strict JSON generator. Return only raw JSON without markdown code fences matching:\n${schemaDescription}`,
          messages: [{ role: 'user', content: prompt }]
        })
      }, 35000);

      if (!res.ok) {
        let errMessage = `Claude API error ${res.status}`;
        try {
          const err = await res.json();
          errMessage = err.error?.message || err.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      const rawText = data.content?.[0]?.text || '';
      return extractJsonFromText<T>(rawText);
    } else {
      // OpenAI / OpenRouter / Groq / DeepSeek / Ollama / LM Studio
      const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.customHeaders || {})
      };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      if (config.providerType === 'openrouter') {
        headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://savantix.app';
        headers['X-Title'] = 'Aegis Universal AI';
      }

      const body: any = {
        model: config.selectedModel,
        messages: [
          { role: 'system', content: `You are a strict JSON generator. Output only valid JSON without markdown fences matching this schema:\n${schemaDescription}` },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature ?? 0.2
      };

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      }, 35000);

      if (!res.ok) {
        let errMessage = `${config.name || 'AI'} API error ${res.status}: ${res.statusText}`;
        try {
          const err = await res.json();
          errMessage = err.error?.message || err.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      return extractJsonFromText<T>(rawText);
    }
  }

  public static async parseStudyLog(rawText: string): Promise<ParsedLog> {
    const prompt = `Parse the following natural language study log into structured data:
- Distinguish between watching lectures and solving practice questions.
- problemsSolved should ONLY be practice questions/numericals solved (0 if none mentioned).
- Convert durations like "2h" to 120 minutes.
Log: "${rawText}"`;

    const schemaDesc = `{
  "subject": "string (e.g. Physics, Chemistry, Math)",
  "topic": "string",
  "subtopic": "string",
  "durationMinutes": number,
  "problemsSolved": number,
  "mistakes": ["string"],
  "efficiencyScore": number (1-10),
  "focusScore": number (1-10)
}`;

    const parsed = await this.executeJsonRequest<Partial<ParsedLog>>(prompt, schemaDesc);
    
    const durationMinutes = Math.max(0, Math.round(Number(parsed.durationMinutes))) || 0;
    const problemsSolved = Math.max(0, Math.round(Number(parsed.problemsSolved))) || 0;
    const efficiencyScore = Math.min(10, Math.max(1, Math.round(Number(parsed.efficiencyScore)))) || 5;
    const focusScore = Math.min(10, Math.max(1, Math.round(Number(parsed.focusScore)))) || 5;

    const mistakes = Array.isArray(parsed.mistakes)
      ? parsed.mistakes.filter(Boolean).map(m => String(m).substring(0, 200)).slice(0, 50)
      : [];

    return {
      subject: (parsed.subject || 'General').substring(0, 99).trim() || 'General',
      topic: (parsed.topic || '').substring(0, 199).trim(),
      subtopic: (parsed.subtopic || '').substring(0, 199).trim(),
      durationMinutes,
      problemsSolved,
      mistakes,
      efficiencyScore,
      focusScore
    };
  }

  public static async generateDailyInsights(logs: any[], constraints: any): Promise<DailyInsightData> {
    const prompt = `Analyze today's study logs with respect to the user's constraints:
Constraints: ${JSON.stringify(constraints)}
Logs: ${JSON.stringify(logs)}
Generate actionable performance insights, hidden weakness identification, and constraint-aware next-day plan.`;

    const schemaDesc = `{
  "performanceSummary": "string",
  "keyInefficiencies": ["string"],
  "biggestMistakePattern": "string",
  "hiddenWeakness": "string",
  "nextDayPlan": ["string"],
  "priorityRanking": ["string"],
  "warnings": ["string"]
}`;

    const parsed = await this.executeJsonRequest<Partial<DailyInsightData>>(prompt, schemaDesc);
    
    const toStringArray = (arr: any, max = 20): string[] => {
      if (Array.isArray(arr)) {
        return arr.filter(Boolean).map(s => String(s).substring(0, 500)).slice(0, max);
      }
      if (typeof arr === 'string' && arr.trim()) {
        return [arr.trim().substring(0, 500)];
      }
      return [];
    };

    return {
      performanceSummary: String(parsed.performanceSummary || 'No summary available.').substring(0, 4999),
      keyInefficiencies: toStringArray(parsed.keyInefficiencies),
      biggestMistakePattern: String(parsed.biggestMistakePattern || 'None identified.').substring(0, 999),
      hiddenWeakness: String(parsed.hiddenWeakness || 'None identified.').substring(0, 999),
      nextDayPlan: toStringArray(parsed.nextDayPlan),
      priorityRanking: toStringArray(parsed.priorityRanking),
      warnings: toStringArray(parsed.warnings)
    };
  }

  public static async generateFlashcardsWithAI(prompt: string): Promise<AIFlashcard[]> {
    const formattedPrompt = `Create 10-20 elite study flashcards for: "${prompt}".
Rules:
- Format all mathematical equations in LaTeX ($...$ inline, $$...$$ block).
- When a visual diagram or schematic (physics force vectors, geometric proofs, chemical structures) is helpful, provide a clean, self-contained SVG XML string in the "svgDiagram" field.`;

    const schemaDesc = `[
  {
    "front": "string",
    "back": "string",
    "deck": "string",
    "svgDiagram": "optional valid inline SVG string"
  }
]`;

    const parsed = await this.executeJsonRequest<any>(formattedPrompt, schemaDesc);
    const cardArray = Array.isArray(parsed) ? parsed : (parsed?.flashcards || parsed?.cards || [parsed]);
    
    return cardArray.filter(Boolean).map((card: any) => ({
      front: String(card.front || '').substring(0, 499).trim(),
      back: String(card.back || '').substring(0, 1999).trim(),
      deck: String(card.deck || 'General').substring(0, 99).trim() || 'General',
      svgDiagram: typeof card.svgDiagram === 'string' ? card.svgDiagram : undefined
    })).filter(c => c.front && c.back);
  }

  public static async sendChatMessage(message: string, history: any[]): Promise<string> {
    const config = AIVaultService.getActiveProvider();
    const apiKey = (config.apiKey || '').trim();
    const baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');

    if (config.providerType === 'google') {
      const url = `${baseUrl}/models/${config.selectedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const contents = [
        ...history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content || '' }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }, 35000);

      if (!res.ok) {
        let errMessage = `Gemini error ${res.status}`;
        try {
          const err = await res.json();
          errMessage = err.error?.message || err.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } else {
      // OpenAI / OpenRouter / Groq / DeepSeek / Ollama / Claude
      const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.customHeaders || {})
      };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      if (config.providerType === 'openrouter') {
        headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://savantix.app';
        headers['X-Title'] = 'Aegis Chat';
      }

      const messages = [
        { role: 'system', content: 'You are Aegis, an elite AI study and time-management advisor for serious competitive STEM students.' },
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.content || '' })),
        { role: 'user', content: message }
      ];

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.selectedModel,
          messages,
          temperature: config.temperature ?? 0.7
        })
      }, 35000);

      if (!res.ok) {
        let errMessage = `${config.name || 'AI'} error ${res.status}: ${res.statusText}`;
        try {
          const err = await res.json();
          errMessage = err.error?.message || err.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response generated.";
    }
  }
}
