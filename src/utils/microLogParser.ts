/**
 * Savantix (Aegis) — Deterministic Sub-Millisecond Micro-Log NLP Parser
 *
 * Client-side deterministic extraction for voice & text micro-logs.
 * Extracts Subject, Topic, Subtopic, Duration, Problems Solved, Accuracy, Mistakes, Focus, and Energy.
 * Sub-millisecond execution (< 1ms), zero network overhead.
 */

export interface MicroLogEntity {
  subject: string;
  topic: string;
  subtopic: string;
  durationMinutes: number;
  problemsSolved: number;
  accuracyPercent: number | null;
  mistakes: string[];
  focusScore: number;
  efficiencyScore: number;
  energyMood: string;
  rawText: string;
}

// Subject keyword ontology with word-boundary matchers
const SUBJECT_TAXONOMY: Record<string, string[]> = {
  Physics: [
    'physics', 'phy', 'mechanics', 'electrostatics', 'electromagnetism', 'thermodynamics',
    'optics', 'kinematics', 'rotation', 'rotational', 'rotational dynamics', 'capacitance',
    'gravitation', 'waves', 'modern physics', 'shm', 'simple harmonic motion', 'fluid mechanics',
    'fluids', 'newton laws', 'nlm', 'work power energy', 'wpe', 'magnetism', 'emi',
    'electromagnetic induction', 'ac circuits', 'alternating current', 'ray optics',
    'wave optics', 'semiconductors', 'nuclear physics', 'current electricity', 'vectors'
  ],
  Chemistry: [
    'chemistry', 'chem', 'organic', 'inorganic', 'physical chem', 'physical chemistry',
    'equilibrium', 'electrochemistry', 'bonding', 'chemical bonding', 'aldehydes', 'amines',
    'ketones', 'carboxylic', 'hydrocarbons', 'polymers', 'biomolecules', 'coordination compounds',
    'coordination', 'p-block', 'd-block', 'f-block', 's-block', 'periodic table', 'kinetics',
    'chemical kinetics', 'solutions', 'solid state', 'surface chemistry', 'metallurgy',
    'haloalkanes', 'alcohols', 'phenols', 'ethers', 'aromatic', 'stoichiometry', 'redox',
    'thermodynamics chemistry', 'reaction mechanisms', 'organic chemistry'
  ],
  Mathematics: [
    'mathematics', 'math', 'maths', 'calculus', 'integration', 'integral', 'integrals',
    'derivative', 'derivatives', 'differentiation', 'diff eq', 'differential equations',
    'algebra', 'matrices', 'determinants', '3d geometry', 'coordinate geometry', 'conics',
    'parabola', 'ellipse', 'hyperbola', 'circles', 'straight lines', 'trigonometry', 'trig',
    'probability', 'permutations', 'combinations', 'pnc', 'complex numbers', 'sequences',
    'series', 'binomial theorem', 'quadratic equations', 'relations', 'functions', 'limits',
    'continuity', 'vectors math', 'definite integration', 'indefinite integration'
  ],
  Biology: [
    'biology', 'bio', 'genetics', 'botany', 'zoology', 'biotech', 'biotechnology',
    'ecology', 'physiology', 'human physiology', 'plant physiology', 'cytology', 'cell biology',
    'evolution', 'microbiology', 'anatomy', 'morphology', 'reproduction', 'biochemistry'
  ],
  'Computer Science': [
    'computer science', 'cs', 'coding', 'algorithms', 'dsa', 'programming', 'python',
    'cpp', 'c++', 'java', 'data structures', 'javascript', 'typescript', 'sql', 'database',
    'web dev', 'frontend', 'backend', 'machine learning', 'ai', 'system design'
  ]
};

const WORD_TO_NUM: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100
};

/**
 * Normalizes spoken English worded numbers, fractions, and time idioms into standard numerical strings.
 */
export function normalizeSpokenLogText(input: string): string {
  if (!input) return '';
  let str = input.toLowerCase();

  // 1. Spoken multi-hour fractions
  str = str.replace(/\b(?:an?\s+)?hour\s+and\s+(?:a\s+)?half\b/gi, '90 minutes');
  str = str.replace(/\bone\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '90 minutes');
  str = str.replace(/\b1\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '90 minutes');
  str = str.replace(/\btwo\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '150 minutes');
  str = str.replace(/\b2\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '150 minutes');
  str = str.replace(/\bthree\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '210 minutes');
  str = str.replace(/\b3\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '210 minutes');
  str = str.replace(/\bfour\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '270 minutes');
  str = str.replace(/\b4\s+and\s+(?:a\s+)?half\s+hours?\b/gi, '270 minutes');

  str = str.replace(/\bhalf\s+(?:an?\s+)?hour\b/gi, '30 minutes');
  str = str.replace(/\bquarter\s+(?:of\s+an?\s+)?hour\b/gi, '15 minutes');
  str = str.replace(/\b(?:a\s+)?couple\s+of\s+hours?\b/gi, '2 hours');
  str = str.replace(/\b(?:an?|one)\s+hour\b/gi, '1 hour');

  // 2. Convert compound worded numbers (e.g., "twenty five" -> 25)
  const tens = '(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)';
  const units = '(?:one|two|three|four|five|six|seven|eight|nine)';
  const compoundRegex = new RegExp(`\\b(${tens})[\\s-](${units})\\b`, 'gi');
  str = str.replace(compoundRegex, (_, tenWord, unitWord) => {
    const t = WORD_TO_NUM[tenWord.toLowerCase()] || 0;
    const u = WORD_TO_NUM[unitWord.toLowerCase()] || 0;
    return String(t + u);
  });

  // 3. Convert standalone worded numbers
  Object.keys(WORD_TO_NUM).forEach(word => {
    const num = WORD_TO_NUM[word];
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    str = str.replace(regex, String(num));
  });

  return str;
}

/**
 * Parses raw text or voice transcript into structured study log entity.
 */
export function parseMicroLog(input: string): MicroLogEntity {
  const text = (input || '').trim();
  if (!text) {
    return {
      subject: 'General',
      topic: 'Study Session',
      subtopic: 'Micro-Logged',
      durationMinutes: 60,
      problemsSolved: 0,
      accuracyPercent: null,
      mistakes: [],
      focusScore: 8,
      efficiencyScore: 8,
      energyMood: 'Normal',
      rawText: ''
    };
  }

  const lower = normalizeSpokenLogText(text);

  // 1. Duration Parsing (e.g. "1.5h", "1h 30m", "45m", "90 mins", "2 hours", "30 minutes")
  let durationMinutes = 60;
  let hasExplicitDuration = false;

  const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const minsMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);

  if (hoursMatch) {
    hasExplicitDuration = true;
    const hours = parseFloat(hoursMatch[1]);
    durationMinutes = Math.round(hours * 60);
    if (minsMatch && !lower.slice(hoursMatch.index || 0).startsWith(minsMatch[0])) {
      durationMinutes += parseInt(minsMatch[1], 10);
    }
  } else if (minsMatch) {
    hasExplicitDuration = true;
    durationMinutes = parseInt(minsMatch[1], 10);
  }

  if (!hasExplicitDuration) {
    // Check for "studied for 45" or "spent 30"
    const genericDurationMatch = lower.match(/(?:for|spent|duration|time)[:\s]+(\d+)\b/i);
    if (genericDurationMatch) {
      durationMinutes = parseInt(genericDurationMatch[1], 10);
    }
  }

  durationMinutes = Math.max(1, Math.min(1440, durationMinutes));

  // 2. Problems Solved & Accuracy
  let problemsSolved = 0;
  const probMatch = lower.match(/(?:solved|did|completed|attempted|practiced)?\s*(\d+)\s*(?:questions?|problems?|numericals?|mcqs?|qs?|q)\b/i);
  if (probMatch) {
    problemsSolved = parseInt(probMatch[1], 10);
  }

  // 3. Accuracy Parsing
  let accuracyPercent: number | null = null;
  const accDirect = lower.match(/(?:accuracy|acc)[:\s]*(\d+(?:\.\d+)?)%/i) ||
                    lower.match(/(\d+(?:\.\d+)?)%\s*(?:accuracy|acc)\b/i);
  const correctWrongMatch = lower.match(/(\d+)\s*(?:correct|right)[\s,]+(?:and\s+)?(\d+)\s*(?:wrong|incorrect|mistakes?|errors?)/i);
  const fractionMatch = lower.match(/(\d+)\s*\/\s*(\d+)\s*(?:correct|right|score|marks)/i);

  if (accDirect) {
    accuracyPercent = Math.min(100, Math.max(0, Math.round(parseFloat(accDirect[1]))));
  } else if (correctWrongMatch) {
    const correct = parseInt(correctWrongMatch[1], 10);
    const wrong = parseInt(correctWrongMatch[2], 10);
    const total = correct + wrong;
    if (total > 0) {
      accuracyPercent = Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
      if (problemsSolved === 0) problemsSolved = total;
    }
  } else if (fractionMatch) {
    const correct = parseInt(fractionMatch[1], 10);
    const total = parseInt(fractionMatch[2], 10);
    if (total > 0) {
      accuracyPercent = Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
      if (problemsSolved === 0) problemsSolved = total;
    }
  } else {
    // Standalone % pattern (e.g. "85%")
    const percentMatch = lower.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      accuracyPercent = Math.min(100, Math.max(0, Math.round(parseFloat(percentMatch[1]))));
    }
  }

  // 4. Subject Detection
  let detectedSubject = 'General';
  let bestMatchScore = 0;

  for (const [subject, keywords] of Object.entries(SUBJECT_TAXONOMY)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        // Longer keyword matches are prioritized (e.g. "rotational dynamics" > "rotation")
        const score = kw.length;
        if (score > bestMatchScore) {
          bestMatchScore = score;
          detectedSubject = subject;
        }
      }
    }
  }

  // 5. Mistakes / Confusion Extraction
  const mistakes: string[] = [];
  const mistakeRegex = /(?:mistakes?|errors?|wrong(?: answers?)?|confus(?:ed|ion)(?:\s+with)?|struggl(?:ed|ing)(?:\s+with)?|blunders?)[:\s]+([^,.;\n]+)/gi;
  let mMatch: RegExpExecArray | null;
  while ((mMatch = mistakeRegex.exec(text)) !== null) {
    const rawMistake = mMatch[1].trim();
    if (rawMistake && rawMistake.length > 1 && rawMistake.length < 120) {
      mistakes.push(rawMistake);
    }
  }

  // Specific common mistake cues if not caught by prefix regex
  if (mistakes.length === 0) {
    if (lower.includes('torque confusion') || lower.includes('confused with torque')) {
      mistakes.push('Torque direction / equilibrium confusion');
    } else if (lower.includes('sign error') || lower.includes('sign mistake')) {
      mistakes.push('Sign convention errors');
    } else if (lower.includes('calculation mistake') || lower.includes('calculation error') || lower.includes('arithmetic error')) {
      mistakes.push('Calculation & algebraic blunders');
    } else if (lower.includes('formula error') || lower.includes('forgot formula')) {
      mistakes.push('Formula recall mistake');
    }
  }

  // 6. Focus, Efficiency, and Energy/Mood Extraction
  let focusScore = 8;
  let efficiencyScore = 8;
  let energyMood = 'Normal';

  if (
    lower.includes('hyper focus') ||
    lower.includes('peak flow') ||
    lower.includes('in the zone') ||
    lower.includes('super focused') ||
    lower.includes('beast mode') ||
    lower.includes('uninterrupted')
  ) {
    focusScore = 10;
    efficiencyScore = 10;
    energyMood = 'Peak Flow';
  } else if (
    lower.includes('high focus') ||
    lower.includes('deep focus') ||
    lower.includes('great flow') ||
    lower.includes('very productive')
  ) {
    focusScore = 9;
    efficiencyScore = 9;
    energyMood = 'High Energy';
  } else if (
    lower.includes('tired') ||
    lower.includes('exhausted') ||
    lower.includes('fatigued') ||
    lower.includes('sleepy') ||
    lower.includes('drained') ||
    lower.includes('headache')
  ) {
    focusScore = 5;
    efficiencyScore = 5;
    energyMood = 'Fatigued';
  } else if (
    lower.includes('distracted') ||
    lower.includes('slow') ||
    lower.includes('procrastinated') ||
    lower.includes('mind wandered') ||
    lower.includes('low focus')
  ) {
    focusScore = 4;
    efficiencyScore = 4;
    energyMood = 'Distracted';
  } else if (lower.includes('moderate') || lower.includes('average')) {
    focusScore = 7;
    efficiencyScore = 7;
    energyMood = 'Steady';
  }

  // If accuracy is high, adjust efficiency slightly
  if (accuracyPercent !== null) {
    if (accuracyPercent >= 85 && efficiencyScore < 9) {
      efficiencyScore = Math.min(10, efficiencyScore + 1);
    } else if (accuracyPercent < 50 && efficiencyScore > 4) {
      efficiencyScore = Math.max(3, efficiencyScore - 1);
    }
  }

  // 7. Topic Extraction
  // Clean away extracted tokens to isolate the core topic/chapter
  let cleaned = normalizeSpokenLogText(text)
    .replace(/(?:did|solved|completed|practiced|studied|revised|revision on|covered|worked on|spent)\s+/gi, '')
    .replace(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/gi, '')
    .replace(/(\d+)\s*(?:minutes?|mins?|m)\b/gi, '')
    .replace(/(?:solved|did|completed|attempted)?\s*(\d+)\s*(?:questions?|problems?|numericals?|mcqs?|qs?|q)\b/gi, '')
    .replace(/(?:accuracy|acc)[:\s]*\d+(?:\.\d+)?%/gi, '')
    .replace(/\d+(?:\.\d+)?%\s*(?:accuracy|acc)?/gi, '')
    .replace(/\b\d+\s*(?:correct|right)[\s,]+(?:and\s+)?\d+\s*(?:wrong|incorrect|mistakes?|errors?)\b/gi, '')
    .replace(/(?:mistakes?|errors?|wrong|confus(?:ed|ion)(?:\s+with)?|struggl(?:ed|ing)(?:\s+with)?)[:\s]+[^,.;\n]+/gi, '')
    .replace(/\b(torque confusion|sign error|calculation mistake|formula error)\b/gi, '')
    .replace(/\b(hyper focus|peak flow|in the zone|super focused|high focus|deep focus|tired|exhausted|fatigued|sleepy|distracted|slow|felt tired)\b/gi, '')
    .replace(/\b(physics|chemistry|mathematics|math|maths|biology|bio|cs|computer science)\b/gi, '')
    .replace(/\b(of|for|on|in|with|about|and|an|a|the)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Also remove any explicitly extracted mistakes from the topic text
  for (const m of mistakes) {
    if (m && m.length > 2) {
      cleaned = cleaned.replace(new RegExp(m.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');
    }
  }

  // Clean trailing and consecutive punctuation and whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/^[\s,;:\-–—]+|[\s,;:\-–—]+$/g, '').trim();

  let topic = cleaned;
  if (topic.includes(',')) {
    topic = topic.split(',')[0].trim();
  } else if (topic.includes(';')) {
    topic = topic.split(';')[0].trim();
  }

  // Capitalize nicely
  if (topic.length > 0) {
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);
    if (topic.length > 80) topic = topic.substring(0, 80).trim();
  }

  if (!topic || topic.length < 2) {
    topic = detectedSubject !== 'General' ? `${detectedSubject} Practice` : 'General Study';
  }

  return {
    subject: detectedSubject,
    topic,
    subtopic: 'Micro-Logged',
    durationMinutes,
    problemsSolved,
    accuracyPercent,
    mistakes,
    focusScore,
    efficiencyScore,
    energyMood,
    rawText: text
  };
}
