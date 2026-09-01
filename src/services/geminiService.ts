import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { AIVaultService } from './aiVaultService';

const WORKING_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-2.0-flash'];

const getApiKey = () => {
  const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
  if (envKey && envKey !== 'MISSING_API_KEY') return String(envKey).trim();
  
  try {
    const googleProv = AIVaultService.getProviders().find(p => p.providerType === 'google' && p.apiKey?.trim());
    if (googleProv && googleProv.apiKey?.trim()) return googleProv.apiKey.trim();
  } catch {}
  return "MISSING_API_KEY";
};

export const getGeminiInstance = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

export const logStudySessionTool: FunctionDeclaration = {
  name: "logStudySession",
  description: "Log a new study session for the user. Use this when the user asks to log or record a study session.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      topic: { type: Type.STRING },
      durationMinutes: { type: Type.INTEGER },
      problemsSolved: { type: Type.INTEGER },
      mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
      efficiencyScore: { type: Type.INTEGER, description: "1-10" },
      focusScore: { type: Type.INTEGER, description: "1-10" },
      date: { type: Type.STRING, description: "YYYY-MM-DD format" }
    },
    required: ["subject", "topic", "durationMinutes", "problemsSolved", "mistakes", "efficiencyScore", "focusScore", "date"]
  }
};

export const navigateAppTool: FunctionDeclaration = {
  name: "navigateApp",
  description: "Navigate to a different section of the application.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tab: { type: Type.STRING, enum: ['dashboard', 'analytics', 'chat', 'flashcards', 'journal', 'goals', 'pomodoro', 'settings', 'attendance'] }
    },
    required: ["tab"]
  }
};

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

/**
 * Offline Deterministic Heuristic NLP Parser for instant scene handling
 */
function parseStudyLogOffline(rawText: string): ParsedLog {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Detect Subject
  let subject = 'General';
  if (/physic|mechanic|electro|optic|irodov|krotov|nsep|ipho|thermo/i.test(lower)) {
    subject = 'Physics';
  } else if (/math|calculus|algebra|integrat|matrix|vector|cmi|isi/i.test(lower)) {
    subject = 'Mathematics';
  } else if (/chem|organic|inorganic|equilibrium|reaction|ncert/i.test(lower)) {
    subject = 'Chemistry';
  } else if (/web|code|program|canvas|react|js|ts|python|arduino/i.test(lower)) {
    subject = 'Web Application';
  } else if (/pe|physical education|fitness|sports|yoga/i.test(lower)) {
    subject = 'Physical Education';
  } else if (/english|comprehension|grammar|literature/i.test(lower)) {
    subject = 'English Core';
  }

  // 2. Detect Duration (e.g. 2h 30m, 90 mins, 45m, 2.5 hours)
  let durationMinutes = 60;
  const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  const minsMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m)\b/);
  if (hoursMatch || minsMatch) {
    const hrs = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    durationMinutes = Math.round(hrs * 60 + mins);
  } else {
    const rawNum = lower.match(/\b(\d+)\s*min\b/);
    if (rawNum) durationMinutes = parseInt(rawNum[1], 10);
  }
  if (durationMinutes <= 0) durationMinutes = 60;

  // 3. Detect Problems Solved
  let problemsSolved = 0;
  const probMatch = lower.match(/(\d+)\s*(?:problems?|questions?|qs|numericals?|exercises?)\b/);
  if (probMatch) {
    problemsSolved = parseInt(probMatch[1], 10);
  }

  // 4. Mistakes extraction
  const mistakes: string[] = [];
  if (lower.includes('mistake') || lower.includes('error') || lower.includes('confus') || lower.includes('struggle') || lower.includes('stuck')) {
    mistakes.push('Calculation or conceptual difficulty noted in session notes');
  }

  // 5. Clean Topic extraction
  let topic = text.replace(/(?:for\s+)?\d+\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/gi, '')
                  .replace(/(?:solved\s+)?\d+\s*(?:problems?|questions?|qs)\b/gi, '')
                  .replace(/^(?:studied|did|worked on|practiced|completed)\s+/i, '')
                  .trim();
  if (topic.length > 80) topic = topic.substring(0, 80);
  if (!topic) topic = `${subject} Problem Solving`;

  return {
    subject,
    topic,
    subtopic: '',
    durationMinutes,
    problemsSolved,
    mistakes,
    efficiencyScore: problemsSolved > 0 ? 8 : 7,
    focusScore: 8
  };
}

export const parseStudyLog = async (rawText: string): Promise<ParsedLog> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'MISSING_API_KEY') {
    return parseStudyLogOffline(rawText);
  }

  // Automatic Scene Handling: Try primary model, then fallback model, then offline parser
  for (const modelName of WORKING_MODELS) {
    try {
      const ai = getGeminiInstance();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Parse the following study log into structured data. Extract subject, topic, subtopic, duration in minutes, problems solved, mistakes made, and infer an efficiency score (1-10) and focus score (1-10) based on the sentiment and output.
        
        CRITICAL INSTRUCTIONS:
        - Distinguish between watching lectures/videos and solving problems. If the user says they watched "2 lectures", do NOT put 2 in problemsSolved.
        - problemsSolved should ONLY be a count of practice questions, exercises, or numericals solved. If none are explicitly mentioned as solved, set it to 0.
        - If the user mentions a duration like "2h", convert it to 120 minutes.
        
        Log: "${rawText}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: "The main subject, e.g., Physics, Chemistry, Math" },
              topic: { type: Type.STRING, description: "The main topic studied" },
              subtopic: { type: Type.STRING, description: "Specific subtopic if mentioned" },
              durationMinutes: { type: Type.INTEGER, description: "Total duration in minutes" },
              problemsSolved: { type: Type.INTEGER, description: "Number of problems solved, 0 if none mentioned" },
              mistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of mistakes or weak areas mentioned" },
              efficiencyScore: { type: Type.INTEGER, description: "Inferred efficiency score from 1 to 10" },
              focusScore: { type: Type.INTEGER, description: "Inferred focus score from 1 to 10" }
            },
            required: ["subject", "topic", "subtopic", "durationMinutes", "problemsSolved", "mistakes", "efficiencyScore", "focusScore"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as Partial<ParsedLog>;
        return {
          subject: (parsed.subject || 'General').substring(0, 99).trim() || 'General',
          topic: (parsed.topic || '').substring(0, 199).trim(),
          subtopic: (parsed.subtopic || '').substring(0, 199).trim(),
          durationMinutes: Math.max(0, Math.round(Number(parsed.durationMinutes))) || 0,
          problemsSolved: Math.max(0, Math.round(Number(parsed.problemsSolved))) || 0,
          mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes.slice(0, 50).map(m => String(m).substring(0, 200)) : [],
          efficiencyScore: Math.min(10, Math.max(1, Math.round(Number(parsed.efficiencyScore)))) || 5,
          focusScore: Math.min(10, Math.max(1, Math.round(Number(parsed.focusScore)))) || 5
        };
      }
    } catch (err) {
      console.warn(`[GeminiService] Model ${modelName} parse failed, trying next fallback:`, err);
    }
  }

  // Offline Heuristic Fallback
  return parseStudyLogOffline(rawText);
};

export interface DailyInsightData {
  performanceSummary: string;
  keyInefficiencies: string[];
  biggestMistakePattern: string;
  hiddenWeakness: string;
  nextDayPlan: string[];
  priorityRanking: string[];
  warnings: string[];
}

/**
 * Offline Intelligent Insight Generator
 */
function generateDailyInsightsOffline(logs: any[], constraints: any): DailyInsightData {
  const totalMins = (logs || []).reduce((acc: number, l: any) => acc + (Number(l.durationMinutes) || 0), 0);
  const totalProbs = (logs || []).reduce((acc: number, l: any) => acc + (Number(l.problemsSolved) || 0), 0);
  const subjects = Array.from(new Set((logs || []).map((l: any) => l.subject || 'Physics')));

  const hours = (totalMins / 60).toFixed(1);
  const performanceSummary = `Cumulative daily study completed: ${hours} hours across ${logs.length} sessions (${subjects.join(', ')}). Solved ${totalProbs} problems with sustained focus. High-leverage Olympiad and conceptual foundation maintained.`;

  return {
    performanceSummary,
    keyInefficiencies: totalProbs === 0 ? ['Low problem-to-theory ratio — increase active problem solving.'] : ['Ensure thorough error logging for every missed question.'],
    biggestMistakePattern: 'Algebraic execution under timed pressure — review calculation checkpoints.',
    hiddenWeakness: 'Second-order differential mechanics and thermodynamic state functions.',
    nextDayPlan: [
      'Morning Focus (06:00–08:30): High-intensity Irodov Mechanics & Rotational Dynamics.',
      'Afternoon Session (14:00–16:00): Integral Calculus & Vector Geometry problem sets.',
      'Evening Review (19:30–22:00): Chemistry Physical Equilibrium & Error Vault postmortems.'
    ],
    priorityRanking: subjects.length ? subjects : ['Physics', 'Mathematics', 'Chemistry'],
    warnings: totalMins > 480 ? ['High cumulative study volume: maintain hydration and circadian sleep hygiene.'] : []
  };
}

export const generateDailyInsights = async (logs: any[], constraints: any): Promise<DailyInsightData> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'MISSING_API_KEY' || !logs || logs.length === 0) {
    return generateDailyInsightsOffline(logs, constraints);
  }

  for (const modelName of WORKING_MODELS) {
    try {
      const ai = getGeminiInstance();
      const prompt = `Analyze the following study logs for the day and the user's constraints.
      
      Constraints:
      ${JSON.stringify(constraints, null, 2)}
      
      Logs:
      ${JSON.stringify(logs, null, 2)}
      
      Generate a comprehensive daily insight. Include a performance summary, key inefficiencies, the biggest mistake pattern, any hidden weaknesses, a constraint-aware next-day plan, priority ranking of subjects/topics, and any warnings (e.g., over-studying, low efficiency).
      Keep warnings minimal unless there's a serious issue.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              performanceSummary: { type: Type.STRING },
              keyInefficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
              biggestMistakePattern: { type: Type.STRING },
              hiddenWeakness: { type: Type.STRING },
              nextDayPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
              priorityRanking: { type: Type.ARRAY, items: { type: Type.STRING } },
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["performanceSummary", "keyInefficiencies", "biggestMistakePattern", "hiddenWeakness", "nextDayPlan", "priorityRanking", "warnings"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as DailyInsightData;
        return {
          ...parsed,
          performanceSummary: (parsed.performanceSummary || 'No summary available.').substring(0, 4999),
          keyInefficiencies: (parsed.keyInefficiencies || []).slice(0, 20),
          biggestMistakePattern: (parsed.biggestMistakePattern || 'None identified.').substring(0, 999),
          hiddenWeakness: (parsed.hiddenWeakness || 'None identified.').substring(0, 999),
          nextDayPlan: (parsed.nextDayPlan || []).slice(0, 20),
          priorityRanking: (parsed.priorityRanking || []).slice(0, 20),
          warnings: (parsed.warnings || []).slice(0, 20)
        };
      }
    } catch (err) {
      console.warn(`[GeminiService] Insights generation on ${modelName} failed, trying fallback:`, err);
    }
  }

  return generateDailyInsightsOffline(logs, constraints);
};

export interface AIFlashcard {
  front: string;
  back: string;
  deck: string;
  svgDiagram?: string;
}

export const generateFlashcardsWithAI = async (prompt: string, imageBase64?: string, mimeType?: string): Promise<AIFlashcard[]> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'MISSING_API_KEY') {
    return [
      {
        front: `What is the moment of inertia of a solid cylinder of mass $M$ and radius $R$ about its central longitudinal axis?`,
        back: `$$I = \\frac{1}{2} M R^2$$\\n\\n**Derivation Note:** Obtained by integrating cylindrical shells $dI = r^2 dm = r^2 (\\rho 2\\pi r L dr)$.`,
        deck: 'Physics — Rotational Dynamics'
      },
      {
        front: `State the Carnot efficiency formula for a heat engine operating between temperatures $T_H$ and $T_C$.`,
        back: `$$\\eta_{\\text{Carnot}} = 1 - \\frac{T_C}{T_H}$$\\n\\nWhere temperatures must be in Kelvin ($K$).`,
        deck: 'Physics — Thermodynamics'
      }
    ];
  }

  for (const modelName of WORKING_MODELS) {
    try {
      const ai = getGeminiInstance();
      const parts: any[] = [{ text: `Generate a comprehensive set of flashcards (aim for 10-20 cards if possible) based on the following request. 
      
      CRITICAL INSTRUCTIONS:
      - Return a JSON array of objects with 'front', 'back', 'deck', and optionally 'svgDiagram' properties.
      - Use Markdown for formatting (bold, italics, lists).
      - For any mathematical or scientific formulas, equations, or symbols, you MUST use LaTeX formatting. Use single dollar signs ($) for inline math (e.g., $E=mc^2$) and double dollar signs ($$) for block math.
      - Make the 'back' of the card detailed but easy to read (use bullet points if necessary).
      
      Request: ${prompt}` }];
      
      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING, description: "The question or prompt on the front of the card" },
                back: { type: Type.STRING, description: "The answer or information on the back of the card" },
                deck: { type: Type.STRING, description: "The suggested deck name for this card" },
                svgDiagram: { type: Type.STRING, description: "Optional valid SVG code for a diagram if it helps explain the concept" }
              },
              required: ["front", "back", "deck"]
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text) as AIFlashcard[];
      }
    } catch (err) {
      console.warn(`[GeminiService] Flashcard generation on ${modelName} failed:`, err);
    }
  }

  return [
    {
      front: `Key Concept: ${prompt.slice(0, 60)}`,
      back: `Review relevant chapter derivations and formula fundamentals.`,
      deck: 'General STEM'
    }
  ];
};

export const createChatSession = (logs: any[], insights: any[]) => {
  const ai = getGeminiInstance();
  const context = `
  User's recent logs (last 10):
  ${JSON.stringify(logs.slice(0, 10), null, 2)}
  
  User's recent insights (last 5):
  ${JSON.stringify(insights.slice(0, 5), null, 2)}
  `;

  return ai.chats.create({
    model: 'gemini-3.5-flash',
    config: {
      systemInstruction: `You are Savantix, an elite AI study optimization assistant for serious students (JEE Advanced, Olympiads). You are highly analytical, concise, and strategic. You do not coddle the user; you provide objective, data-driven advice to maximize their study ROI. You respect their constraints (school, fatigue) and focus on high-leverage activities.
      
      You have access to the user's recent study logs and daily insights. Use this data to provide personalized, context-aware advice.
      
      Logs and Context:
      ${context}`
    }
  });
};
