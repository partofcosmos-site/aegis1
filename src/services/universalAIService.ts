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

export class UniversalAIService {
  public static async executeJsonRequest<T>(prompt: string, schemaDescription: string, activeProvider?: AIProviderConfig): Promise<T> {
    const config = activeProvider || AIVaultService.getActiveProvider();

    if (config.providerType === 'google') {
      const url = `${config.baseUrl.replace(/\/$/, '')}/models/${config.selectedModel}:generateContent?key=${config.apiKey}`;
      const body: any = {
        contents: [{ parts: [{ text: `${prompt}\n\nStrict requirement: Output strictly valid JSON matching this schema without any markdown wrapping or commentary:\n${schemaDescription}` }] }],
        generationConfig: {
          temperature: config.temperature ?? 0.2,
          responseMimeType: 'application/json'
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error ${res.status}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini API");
      return JSON.parse(text);
    } else if (config.providerType === 'anthropic') {
      const url = `${config.baseUrl.replace(/\/$/, '')}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
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
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Claude API error ${res.status}`);
      }
      const data = await res.json();
      const rawText = data.content?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } else {
      // OpenAI / OpenRouter (16 Free Models) / Groq / DeepSeek / Ollama / LM Studio
      const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      if (config.providerType === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
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

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `${config.name} API error: ${res.statusText}`);
      }
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
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

    const parsed = await this.executeJsonRequest<ParsedLog>(prompt, schemaDesc);
    return {
      subject: (parsed.subject || 'General').substring(0, 99),
      topic: (parsed.topic || '').substring(0, 199),
      subtopic: (parsed.subtopic || '').substring(0, 199),
      durationMinutes: parsed.durationMinutes || 0,
      problemsSolved: parsed.problemsSolved || 0,
      mistakes: (parsed.mistakes || []).slice(0, 50).map(m => m.substring(0, 200)),
      efficiencyScore: parsed.efficiencyScore || 5,
      focusScore: parsed.focusScore || 5
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

    const parsed = await this.executeJsonRequest<DailyInsightData>(prompt, schemaDesc);
    return {
      performanceSummary: (parsed.performanceSummary || 'No summary available.').substring(0, 4999),
      keyInefficiencies: (parsed.keyInefficiencies || []).slice(0, 20),
      biggestMistakePattern: (parsed.biggestMistakePattern || 'None identified.').substring(0, 999),
      hiddenWeakness: (parsed.hiddenWeakness || 'None identified.').substring(0, 999),
      nextDayPlan: (parsed.nextDayPlan || []).slice(0, 20),
      priorityRanking: (parsed.priorityRanking || []).slice(0, 20),
      warnings: (parsed.warnings || []).slice(0, 20)
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

    return await this.executeJsonRequest<AIFlashcard[]>(formattedPrompt, schemaDesc);
  }

  public static async sendChatMessage(message: string, history: any[]): Promise<string> {
    const config = AIVaultService.getActiveProvider();

    if (config.providerType === 'google') {
      const url = `${config.baseUrl.replace(/\/$/, '')}/models/${config.selectedModel}:generateContent?key=${config.apiKey}`;
      const contents = [
        ...history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini error ${res.status}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } else {
      // OpenAI / OpenRouter / Groq / DeepSeek / Ollama / Claude
      const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      if (config.providerType === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Aegis Chat';
      }

      const messages = [
        { role: 'system', content: 'You are Aegis, an elite AI study and time-management advisor for serious competitive STEM students.' },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.selectedModel,
          messages,
          temperature: config.temperature ?? 0.7
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `${config.name} error: ${res.statusText}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response generated.";
    }
  }
}
