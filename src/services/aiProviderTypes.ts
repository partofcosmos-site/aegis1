export type ProviderType = 
  | 'google'
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'deepseek'
  | 'ollama'
  | 'lmstudio'
  | 'openai-compatible';

export interface AIModelPreset {
  id: string;
  name: string;
  contextWindow: number;
  supportsVision: boolean;
  isFree?: boolean;
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
  supportsVision?: boolean;
  isDefault: boolean;
  createdAt: number;
}

export interface ProviderTemplate {
  type: ProviderType;
  label: string;
  defaultBaseUrl: string;
  requiresKey: boolean;
  defaultModels: AIModelPreset[];
  setupGuideUrl?: string;
}

export const OPENROUTER_FREE_MODELS: AIModelPreset[] = [
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA: Nemotron 3 Ultra 550B (Free)', contextWindow: 131000, supportsVision: false, isFree: true },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA: Nemotron 3.5 Lightning (Free)', contextWindow: 131000, supportsVision: false, isFree: true },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA: Nemotron 3 Super 120B (Free)', contextWindow: 131000, supportsVision: false, isFree: true },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'NVIDIA: Nemotron 3 Nano Omni (Free Reasoning)', contextWindow: 131000, supportsVision: true, isFree: true },
  { id: 'poolside/laguna-s-2.1:free', name: 'Poolside: Laguna S 2.1 (Free)', contextWindow: 64000, supportsVision: false, isFree: true },
  { id: 'poolside/laguna-xs-2.1:free', name: 'Poolside: Laguna XS 2.1 (Free)', contextWindow: 64000, supportsVision: false, isFree: true },
  { id: 'minimax/minimax-m3:free', name: 'MiniMax: MiniMax M3 (Free)', contextWindow: 128000, supportsVision: false, isFree: true },
  { id: 'minimax/minimax-m2.7:free', name: 'MiniMax: MiniMax M2.7 (Free)', contextWindow: 128000, supportsVision: false, isFree: true },
  { id: 'cohere/north-mini-code:free', name: 'Cohere: North Mini Code (Free)', contextWindow: 64000, supportsVision: false, isFree: true },
  { id: 'dots-studio/dots-3-note-preview:free', name: 'Dots Studio: Dots3-Note Preview (Free)', contextWindow: 64000, supportsVision: false, isFree: true },
  { id: 'thinkingmachines/inkling:free', name: 'Thinking Machines: Inkling (Free)', contextWindow: 64000, supportsVision: false, isFree: true },
  { id: 'thinkingmachines/inkling-small:free', name: 'Thinking Machines: Inkling Small (Free)', contextWindow: 32000, supportsVision: false, isFree: true },
  { id: 'z-ai/glm-5.2:free', name: 'Z.ai: GLM 5.2 (Free)', contextWindow: 128000, supportsVision: false, isFree: true },
  { id: 'inclusionai/ling-3.0-flash-fin:free', name: 'InclusionAI: Ling 3.0 Flash Fin (Free)', contextWindow: 64000, supportsVision: false, isFree: true },
  { id: 'liquid/lfm-2.5-2.6b:free', name: 'LiquidAI: LFM2.5-2.6B (Free)', contextWindow: 32000, supportsVision: false, isFree: true },
  { id: 'nvidia/llama-nemotron-rerank-vl-1b-v2:free', name: 'NVIDIA: Llama Nemotron Rerank VL (Free)', contextWindow: 32000, supportsVision: true, isFree: true },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek: R1 Reasoner (OpenRouter)', contextWindow: 164000, supportsVision: false, isFree: false }
];

export const PROVIDER_TEMPLATES: Record<ProviderType, ProviderTemplate> = {
  openrouter: {
    type: 'openrouter',
    label: 'OpenRouter (16 Free Models)',
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
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Reasoning)', contextWindow: 2000000, supportsVision: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra Fast)', contextWindow: 1000000, supportsVision: true },
      { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro', contextWindow: 2000000, supportsVision: true },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', contextWindow: 2000000, supportsVision: true }
    ],
    setupGuideUrl: 'https://aistudio.google.com/app/apikey'
  },
  groq: {
    type: 'groq',
    label: 'Groq (1000+ T/s Ultra-Fast)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Free Tier)', contextWindow: 128000, supportsVision: false, isFree: true },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B (Free Tier)', contextWindow: 128000, supportsVision: false, isFree: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Free Tier)', contextWindow: 128000, supportsVision: false, isFree: true }
    ],
    setupGuideUrl: 'https://console.groq.com/keys'
  },
  openai: {
    type: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship)', contextWindow: 128000, supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Efficient)', contextWindow: 128000, supportsVision: true },
      { id: 'o3-mini', name: 'o3-mini (High-Speed Reasoning)', contextWindow: 200000, supportsVision: false },
      { id: 'o1', name: 'o1 (Deep STEM Reasoning)', contextWindow: 200000, supportsVision: true }
    ],
    setupGuideUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    type: 'anthropic',
    label: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', contextWindow: 200000, supportsVision: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet v2', contextWindow: 200000, supportsVision: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, supportsVision: true }
    ],
    setupGuideUrl: 'https://console.anthropic.com/settings/keys'
  },
  deepseek: {
    type: 'deepseek',
    label: 'DeepSeek Official',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat & Coding)', contextWindow: 64000, supportsVision: false },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Deep Reasoner)', contextWindow: 64000, supportsVision: false }
    ],
    setupGuideUrl: 'https://platform.deepseek.com/api_keys'
  },
  ollama: {
    type: 'ollama',
    label: 'Local Ollama (100% Offline)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    defaultModels: [
      { id: 'llama3.3:latest', name: 'Llama 3.3 (Local)', contextWindow: 32000, supportsVision: false, isFree: true },
      { id: 'qwen2.5-coder:32b', name: 'Qwen 2.5 Coder 32B (Local)', contextWindow: 32000, supportsVision: false, isFree: true },
      { id: 'deepseek-r1:latest', name: 'DeepSeek R1 (Local)', contextWindow: 32000, supportsVision: false, isFree: true }
    ]
  },
  lmstudio: {
    type: 'lmstudio',
    label: 'LM Studio (Local)',
    defaultBaseUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    defaultModels: [
      { id: 'local-model', name: 'Currently Active Model in LM Studio', contextWindow: 32000, supportsVision: false, isFree: true }
    ]
  },
  'openai-compatible': {
    type: 'openai-compatible',
    label: 'Custom OpenAI Compatible',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    defaultModels: []
  }
};
