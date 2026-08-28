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

export interface AIModelPreset {
  id: string;
  name: string;
  contextWindow?: number;
  supportsVision?: boolean;
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
  customHeaders?: Record<string, string>;
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
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA: Nemotron 3 Ultra 550B (Free)', isFree: true },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA: Nemotron 3.5 Lightning (Free)', isFree: true },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA: Nemotron 3 Super 120B (Free)', isFree: true },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'NVIDIA: Nemotron 3 Nano Omni (Free Reasoning)', isFree: true },
  { id: 'poolside/laguna-s-2.1:free', name: 'Poolside: Laguna S 2.1 (Free)', isFree: true },
  { id: 'minimax/minimax-m3:free', name: 'MiniMax: MiniMax M3 (Free)', isFree: true },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek: R1 Reasoner (OpenRouter)', isFree: false }
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
    label: 'OpenRouter (Any Model / Free Tier)',
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
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Reasoning)' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra Fast)' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview' }
    ],
    setupGuideUrl: 'https://aistudio.google.com/app/apikey'
  },
  groq: {
    type: 'groq',
    label: 'Groq (1000+ T/s)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' }
    ],
    setupGuideUrl: 'https://console.groq.com/keys'
  },
  openai: {
    type: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'o3-mini', name: 'o3-mini' }
    ],
    setupGuideUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    type: 'anthropic',
    label: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' }
    ],
    setupGuideUrl: 'https://console.anthropic.com/settings/keys'
  },
  deepseek: {
    type: 'deepseek',
    label: 'DeepSeek Official',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    defaultModels: [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' }
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
