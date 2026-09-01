export type ProviderType = 
  | 'custom'
  | 'openrouter'
  | 'google'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'deepseek'
  | 'ollama'
  | 'lmstudio'
  | 'openai-compatible';

export type ModelSpecialization = 
  | 'speed'
  | 'stem_math'
  | 'deep_reasoning'
  | 'code'
  | 'synthesis'
  | 'general';

export interface AIModelPreset {
  id: string;
  name: string;
  contextWindow?: number;
  supportsVision?: boolean;
  isFree?: boolean;
  specialization?: ModelSpecialization;
  description?: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  thinkingLevel?: 'none' | 'low' | 'medium' | 'high';
  customHeaders?: Record<string, string>;
  isDefault: boolean;
  createdAt: number;
  /** Encryption flag for zero-leakage local storage */
  isEncrypted?: boolean;
}

export interface ProviderTemplate {
  type: ProviderType;
  label: string;
  defaultBaseUrl: string;
  requiresKey: boolean;
  defaultModels: AIModelPreset[];
  setupGuideUrl?: string;
}

/**
 * Frontier Free Models Catalog (Expanded with latest frontier open-weight & reasoning models)
 */
export const OPENROUTER_FREE_MODELS: AIModelPreset[] = [
  // --- Speed & High-Throughput Tier (Liquid LFM / Ultra Fast) ---
  { 
    id: 'liquid/lfm-40b:free', 
    name: 'Liquid: LFM 40B MoE (Free Speed Champion)', 
    contextWindow: 32768, 
    isFree: true, 
    specialization: 'speed',
    description: 'Dynamic neural liquid state-space architecture. Ultra-low latency for instant intuition & drafting.'
  },
  { 
    id: 'liquid/lfm-7b:free', 
    name: 'Liquid: LFM 7B (Free Ultra Fast)', 
    contextWindow: 32768, 
    isFree: true, 
    specialization: 'speed',
    description: 'Lightweight Liquid foundation model for instantaneous sub-100ms first-token responses.'
  },
  { 
    id: 'meta-llama/llama-3.3-70b-instruct:free', 
    name: 'Meta: Llama 3.3 70B Instruct (Free Frontier)', 
    contextWindow: 131072, 
    isFree: true, 
    specialization: 'general',
    description: 'Industry standard 70B open weight instruction tuned model with massive knowledge base.'
  },
  { 
    id: 'mistralai/mistral-small-24b-instruct-2501:free', 
    name: 'Mistral: Small 24B Instruct (Free)', 
    contextWindow: 32768, 
    isFree: true, 
    specialization: 'speed',
    description: 'High-speed reasoning and concise synthesis from Mistral AI.'
  },

  // --- STEM, Mathematics & Scientific Precision Tier (Nemotron / Qwen) ---
  { 
    id: 'nvidia/nemotron-3-super-120b-a12b:free', 
    name: 'NVIDIA: Nemotron 3 Super 120B (Free STEM Math)', 
    contextWindow: 131072, 
    isFree: true, 
    specialization: 'stem_math',
    description: 'NVIDIA flagship STEM/Math specialist model. Unrivaled numerical accuracy, physics derivations & formulas.'
  },
  { 
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free', 
    name: 'NVIDIA: Nemotron 3 Ultra 550B (Free Math/Science)', 
    contextWindow: 131072, 
    isFree: true, 
    specialization: 'stem_math',
    description: 'Massive 550B parameter ensemble for rigorous STEM proof verification and multi-step math problems.'
  },
  { 
    id: 'nvidia/nemotron-3.5-lightning:free', 
    name: 'NVIDIA: Nemotron 3.5 Lightning (Free)', 
    contextWindow: 65536, 
    isFree: true, 
    specialization: 'speed',
    description: 'Accelerated latency-optimized Nemotron engine for real-time mathematical validation.'
  },
  { 
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 
    name: 'NVIDIA: Nemotron 3 Nano Omni (Free Reasoning)', 
    contextWindow: 32768, 
    isFree: true, 
    specialization: 'stem_math',
    description: 'Compact multimodal STEM reasoning architecture.'
  },
  { 
    id: 'qwen/qwen-2.5-coder-32b-instruct:free', 
    name: 'Qwen: 2.5 Coder 32B (Free Code/Math)', 
    contextWindow: 131072, 
    isFree: true, 
    specialization: 'code',
    description: 'Top-tier code generation, formal logic proofing, and algorithmic math calculation.'
  },
  { 
    id: 'qwen/qwen-2.5-72b-instruct:free', 
    name: 'Qwen: 2.5 72B Instruct (Free Frontier)', 
    contextWindow: 131072, 
    isFree: true, 
    specialization: 'stem_math',
    description: 'Excels across Olympiad mathematics, chemistry problem solving, and complex structured schema.'
  },

  // --- Deep Reasoning, Step-by-Step Proofs & Frontier Tier (DeepSeek R1 / Gemini) ---
  { 
    id: 'deepseek/deepseek-r1:free', 
    name: 'DeepSeek: R1 Reasoner (Free Frontier Deep Reasoning)', 
    contextWindow: 65536, 
    isFree: true, 
    specialization: 'deep_reasoning',
    description: 'Frontier RL reasoning model. Generates extensive CoT (Chain-of-Thought) and self-verifying proofs.'
  },
  { 
    id: 'deepseek/deepseek-r1-distill-llama-70b:free', 
    name: 'DeepSeek: R1 Distill Llama 70B (Free Logic Engine)', 
    contextWindow: 131072, 
    isFree: true, 
    specialization: 'deep_reasoning',
    description: 'Distilled R1 reasoning capabilities combined with Llama 70B base precision.'
  },
  { 
    id: 'deepseek/deepseek-chat:free', 
    name: 'DeepSeek: V3 671B Chat (Free Multi-Domain)', 
    contextWindow: 65536, 
    isFree: true, 
    specialization: 'general',
    description: 'High-throughput 671B MoE model for cross-domain synthesis and multi-turn discourse.'
  },
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Google: Gemini 2.0 Flash Exp (Free Multimodal)', 
    contextWindow: 1048576, 
    isFree: true, 
    specialization: 'speed',
    description: '1M context window with next-gen multimodal understanding and rapid response latency.'
  },
  { 
    id: 'google/gemini-2.0-flash-thinking-exp:free', 
    name: 'Google: Gemini 2.0 Flash Thinking Exp (Free Reasoning)', 
    contextWindow: 32768, 
    isFree: true, 
    specialization: 'deep_reasoning',
    description: 'Google explicit reasoning model displaying internal thoughts before answer synthesis.'
  },
  { 
    id: 'poolside/laguna-s-2.1:free', 
    name: 'Poolside: Laguna S 2.1 (Free Coding & Logic)', 
    contextWindow: 32768, 
    isFree: true, 
    specialization: 'code',
    description: 'Specialized coding and formal constraint solver.'
  },
  { 
    id: 'minimax/minimax-m3:free', 
    name: 'MiniMax: MiniMax M3 (Free 1M Long-Context)', 
    contextWindow: 1000000, 
    isFree: true, 
    specialization: 'general',
    description: 'Ultra large context capacity for full textbook and multi-chapter study session analysis.'
  },
  { 
    id: 'stepfun/step-2-16k:free', 
    name: 'StepFun: Step-2 16K (Free)', 
    contextWindow: 16384, 
    isFree: true, 
    specialization: 'general',
    description: 'Robust bilingual comprehension and reasoning model.'
  }
];

export const PROVIDER_TEMPLATES: Record<ProviderType, ProviderTemplate> = {
  custom: {
    type: 'custom',
    label: 'Custom Any Endpoint',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    defaultModels: []
  },
  openrouter: {
    type: 'openrouter',
    label: 'OpenRouter (Parallel Free Frontier)',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    defaultModels: OPENROUTER_FREE_MODELS,
    setupGuideUrl: 'https://openrouter.ai/keys'
  },
  google: {
    type: 'google',
    label: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresKey: true,
    defaultModels: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Universal Fast)', specialization: 'speed' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', specialization: 'speed' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)', specialization: 'deep_reasoning' }
    ],
    setupGuideUrl: 'https://aistudio.google.com/app/apikey'
  },
  groq: {
    type: 'groq',
    label: 'Groq (1000+ T/s LPUs)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', specialization: 'speed' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', specialization: 'deep_reasoning' }
    ],
    setupGuideUrl: 'https://console.groq.com/keys'
  },
  openai: {
    type: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'gpt-4o', name: 'GPT-4o', specialization: 'general' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', specialization: 'speed' },
      { id: 'o3-mini', name: 'o3-mini (High Reasoning)', specialization: 'deep_reasoning' }
    ],
    setupGuideUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    type: 'anthropic',
    label: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', specialization: 'deep_reasoning' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', specialization: 'speed' }
    ],
    setupGuideUrl: 'https://console.anthropic.com/settings/keys'
  },
  deepseek: {
    type: 'deepseek',
    label: 'DeepSeek Official',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 Free', specialization: 'deep_reasoning' },
      { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat Free', specialization: 'general' },
      { id: 'deepseek-chat', name: 'DeepSeek Chat', specialization: 'general' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', specialization: 'deep_reasoning' }
    ],
    setupGuideUrl: 'https://platform.deepseek.com/api_keys'
  },
  ollama: {
    type: 'ollama',
    label: 'Local Ollama (Offline)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    defaultModels: []
  },
  lmstudio: {
    type: 'lmstudio',
    label: 'LM Studio (Offline)',
    defaultBaseUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    defaultModels: []
  },
  'openai-compatible': {
    type: 'openai-compatible',
    label: 'OpenAI Compatible (Together / Mistral / vLLM)',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    defaultModels: []
  }
};

/**
 * Multi-Model Parallel Router Architectures & Types
 */

export interface RouterTargetModel {
  id: string;
  name: string;
  specialization: ModelSpecialization;
  roleDescription: string;
  timeoutMs?: number;
}

/**
 * The Default Tri-Model Consensus Ensemble:
 * 1. Liquid LFM 40B/7B for extreme speed & prompt intuition
 * 2. NVIDIA Nemotron 3 Super 120B for STEM math precision & equations
 * 3. DeepSeek R1 for rigorous chain-of-thought and proof deduction
 */
export const DEFAULT_PARALLEL_ROUTER_MODELS: RouterTargetModel[] = [
  {
    id: 'liquid/lfm-40b:free',
    name: 'Liquid LFM 40B MoE',
    specialization: 'speed',
    roleDescription: 'Speed & Initial Intuition Specialist',
    timeoutMs: 20000
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'NVIDIA Nemotron 3 Super 120B',
    specialization: 'stem_math',
    roleDescription: 'STEM Math & Formula Precision Specialist',
    timeoutMs: 28000
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 Reasoner',
    specialization: 'deep_reasoning',
    roleDescription: 'Deep Step-by-Step Proof & Logic Specialist',
    timeoutMs: 32000
  }
];

export const FALLBACK_FREE_MODELS: Record<ModelSpecialization, string[]> = {
  speed: [
    'liquid/lfm-7b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-24b-instruct-2501:free',
    'google/gemini-2.0-flash-exp:free'
  ],
  stem_math: [
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'nvidia/nemotron-3.5-lightning:free'
  ],
  deep_reasoning: [
    'deepseek/deepseek-r1-distill-llama-70b:free',
    'google/gemini-2.0-flash-thinking-exp:free',
    'deepseek/deepseek-chat:free',
    'poolside/laguna-s-2.1:free'
  ],
  code: [
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'poolside/laguna-s-2.1:free',
    'meta-llama/llama-3.3-70b-instruct:free'
  ],
  synthesis: [
    'deepseek/deepseek-chat:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'minimax/minimax-m3:free'
  ],
  general: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'minimax/minimax-m3:free',
    'stepfun/step-2-16k:free'
  ]
};

export interface ModelCandidateResponse {
  modelId: string;
  modelName: string;
  specialization: ModelSpecialization;
  role: string;
  content: string;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
  error?: string;
  isFallback?: boolean;
}

export type ConsensusStrategy = 
  | 'synthesis_blend'          // Combines speed intuition + STEM math accuracy + R1 deep proof
  | 'rigorous_stem_validation' // Prioritizes Nemotron math formulas & R1 formal proofs
  | 'fastest_first_with_verify'// Returns fastest response immediately while validating in background
  | 'majority_vote';           // High agreement clustering across 3+ models

export interface MultiModelConsensusRequest {
  prompt: string;
  systemPrompt?: string;
  schemaDescription?: string;
  models?: RouterTargetModel[];
  strategy?: ConsensusStrategy;
  timeoutMs?: number;
  temperature?: number;
  activeProviderOverride?: AIProviderConfig;
  requireStructuredJson?: boolean;
}

export interface MultiModelConsensusResult<T = any> {
  synthesizedResponse: string;
  parsedData?: T;
  consensusSummary: string;
  confidenceScore: number; // 0.0 to 1.0
  agreementRate: number;   // Percentage (e.g. 94%)
  candidates: ModelCandidateResponse[];
  fastestCandidate?: ModelCandidateResponse;
  stemMathCandidate?: ModelCandidateResponse;
  deepReasoningCandidate?: ModelCandidateResponse;
  totalLatencyMs: number;
  successfulCount: number;
  failedCount: number;
  timestamp: number;
}
