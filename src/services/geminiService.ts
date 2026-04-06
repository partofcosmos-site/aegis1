import { GoogleGenAI, Type, ThinkingLevel, FunctionDeclaration } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || "MISSING_API_KEY";
const ai = new GoogleGenAI({ apiKey });

export const getGeminiInstance = () => ai;

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
      tab: { type: Type.STRING, enum: ['dashboard', 'analytics', 'chat'] }
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

export const parseStudyLog = async (rawText: string): Promise<ParsedLog> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
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
  if (!text) throw new Error("Failed to parse log");
  const parsed = JSON.parse(text) as ParsedLog;
  
  return {
    ...parsed,
    subject: (parsed.subject || 'General').substring(0, 99),
    topic: (parsed.topic || '').substring(0, 199),
    subtopic: (parsed.subtopic || '').substring(0, 199),
    durationMinutes: parsed.durationMinutes || 0,
    problemsSolved: parsed.problemsSolved || 0,
    mistakes: (parsed.mistakes || []).slice(0, 50).map(m => m.substring(0, 200)),
    efficiencyScore: parsed.efficiencyScore || 5,
    focusScore: parsed.focusScore || 5
  };
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

export const generateDailyInsights = async (logs: any[], constraints: any): Promise<DailyInsightData> => {
  const prompt = `Analyze the following study logs for the day and the user's constraints.
  
  Constraints:
  ${JSON.stringify(constraints, null, 2)}
  
  Logs:
  ${JSON.stringify(logs, null, 2)}
  
  Generate a comprehensive daily insight. Include a performance summary, key inefficiencies, the biggest mistake pattern, any hidden weaknesses, a constraint-aware next-day plan, priority ranking of subjects/topics, and any warnings (e.g., over-studying, low efficiency).
  Keep warnings minimal unless there's a serious issue.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
  if (!text) throw new Error("Failed to generate insights");
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
};

export interface AIFlashcard {
  front: string;
  back: string;
  deck: string;
  svgDiagram?: string;
}

export const generateFlashcardsWithAI = async (prompt: string, imageBase64?: string, mimeType?: string): Promise<AIFlashcard[]> => {
  const parts: any[] = [{ text: `Generate a comprehensive set of flashcards (aim for 10-20 cards if possible) based on the following request. 
  
  CRITICAL INSTRUCTIONS:
  - Return a JSON array of objects with 'front', 'back', 'deck', and optionally 'svgDiagram' properties.
  - Use Markdown for formatting (bold, italics, lists).
  - For any mathematical or scientific formulas, equations, or symbols, you MUST use LaTeX formatting. Use single dollar signs ($) for inline math (e.g., $E=mc^2$) and double dollar signs ($$) for block math.
  - Make the 'back' of the card detailed but easy to read (use bullet points if necessary).
  - If a concept would be much easier to understand with a diagram (e.g., cell structure, physics forces, geometry), generate a clean, valid SVG string in the 'svgDiagram' field. The SVG should be self-contained, use clear colors, and have a viewBox. Only generate SVGs when highly beneficial.
  
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
    model: 'gemini-3.1-pro-preview',
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
  if (!text) throw new Error("Failed to generate flashcards");
  return JSON.parse(text) as AIFlashcard[];
};

export const createChatSession = (logs: any[], insights: any[]) => {
  const context = `
  User's recent logs (last 10):
  ${JSON.stringify(logs.slice(0, 10), null, 2)}
  
  User's recent insights (last 5):
  ${JSON.stringify(insights.slice(0, 5), null, 2)}
  `;

  return ai.chats.create({
    model: 'gemini-3.1-pro-preview',
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      systemInstruction: `You are Savantix, an elite AI study optimization assistant for serious students (JEE Advanced, Olympiads). You are highly analytical, concise, and strategic. You do not coddle the user; you provide objective, data-driven advice to maximize their study ROI. You respect their constraints (school, fatigue) and focus on high-leverage activities.
      
      You have access to the user's recent study logs and daily insights. Use this data to provide personalized, context-aware advice. If the user points out an error in your previous analysis or parsing, acknowledge it, note the correction, and adjust your advice accordingly.
      
      ${context}`
    }
  });
};
