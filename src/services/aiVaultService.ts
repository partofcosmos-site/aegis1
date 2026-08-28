import { AIProviderConfig, ProviderType, PROVIDER_TEMPLATES } from './aiProviderTypes';

const STORAGE_KEY = 'aegis_ai_providers_vault_v1';
const ACTIVE_PROVIDER_ID_KEY = 'aegis_active_ai_provider_id';

export class AIVaultService {
  public static getProviders(): AIProviderConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Provide pre-configured templates
        const defaultOpenRouter: AIProviderConfig = {
          id: 'prov_openrouter_default',
          name: 'OpenRouter Free Models',
          providerType: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKey: '',
          selectedModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          temperature: 0.2,
          maxTokens: 4096,
          thinkingLevel: 'high',
          supportsVision: true,
          isDefault: true,
          createdAt: Date.now()
        };

        const defaultGoogle: AIProviderConfig = {
          id: 'prov_google_default',
          name: 'Google Gemini',
          providerType: 'google',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          apiKey: '',
          selectedModel: 'gemini-2.5-pro',
          temperature: 0.2,
          maxTokens: 8192,
          thinkingLevel: 'high',
          supportsVision: true,
          isDefault: false,
          createdAt: Date.now()
        };

        const defaultGroq: AIProviderConfig = {
          id: 'prov_groq_default',
          name: 'Groq (Free Tier LPU)',
          providerType: 'groq',
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: '',
          selectedModel: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          maxTokens: 4096,
          thinkingLevel: 'none',
          supportsVision: false,
          isDefault: false,
          createdAt: Date.now()
        };

        const initial = [defaultOpenRouter, defaultGoogle, defaultGroq];
        this.saveProviders(initial);
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveProviders(providers: AIProviderConfig[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  }

  public static getActiveProvider(): AIProviderConfig {
    const providers = this.getProviders();
    const activeId = localStorage.getItem(ACTIVE_PROVIDER_ID_KEY);
    const found = providers.find(p => p.id === activeId) || providers.find(p => p.isDefault) || providers[0];
    if (!found) {
      throw new Error("No AI Provider configured. Please add an API key in Settings.");
    }
    return found;
  }

  public static setActiveProvider(id: string): void {
    const providers = this.getProviders().map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    this.saveProviders(providers);
    localStorage.setItem(ACTIVE_PROVIDER_ID_KEY, id);
  }

  public static async testConnection(config: AIProviderConfig): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      if (config.providerType === 'google') {
        const url = `${config.baseUrl.replace(/\/$/, '')}/models/${config.selectedModel}:generateContent?key=${config.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
        });
        const latencyMs = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          return { success: false, latencyMs, message: err.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, latencyMs, message: `Connected (${latencyMs}ms)` };
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
            max_tokens: 5,
            messages: [{ role: 'user', content: 'ping' }]
          })
        });
        const latencyMs = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          return { success: false, latencyMs, message: err.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, latencyMs, message: `Connected (${latencyMs}ms)` };
      } else {
        // OpenAI / OpenRouter / Groq / DeepSeek / Ollama / LM Studio
        const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
        if (config.providerType === 'openrouter') {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'Aegis Study Engine';
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.selectedModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          })
        });
        const latencyMs = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          return { success: false, latencyMs, message: err.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, latencyMs, message: `Connected (${latencyMs}ms)` };
      }
    } catch (e: any) {
      return { success: false, latencyMs: Math.round(performance.now() - start), message: e.message || 'Connection failed' };
    }
  }
}
