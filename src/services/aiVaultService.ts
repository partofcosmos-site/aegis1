import { AIProviderConfig, ProviderType, PROVIDER_TEMPLATES, AIModelPreset } from './aiProviderTypes';

const STORAGE_KEY = 'aegis_ai_providers_vault_v1';
const ACTIVE_PROVIDER_ID_KEY = 'aegis_active_ai_provider_id';

export class AIVaultService {
  public static getProviders(): AIProviderConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const defaultOpenRouter: AIProviderConfig = {
          id: 'prov_openrouter_default',
          name: 'OpenRouter (16 Free Models)',
          providerType: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKey: '',
          selectedModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          temperature: 0.2,
          maxTokens: 4096,
          thinkingLevel: 'high',
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
          isDefault: false,
          createdAt: Date.now()
        };

        const initial = [defaultOpenRouter, defaultGoogle];
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
      throw new Error("No AI Provider configured. Please add an API key or custom endpoint in Settings.");
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

  /**
   * Smart Code/cURL/Doc Snippet Parser:
   * Auto-extracts baseUrl, model, and apiKey from pasted Python, JavaScript, cURL, or JSON snippets.
   */
  public static parseSnippetToConfig(raw: string): Partial<AIProviderConfig> {
    const text = raw.trim();
    const result: Partial<AIProviderConfig> = {};

    // 1. Check for JSON format
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const json = JSON.parse(text);
        if (json.baseUrl || json.base_url || json.url) result.baseUrl = json.baseUrl || json.base_url || json.url;
        if (json.model || json.model_id || json.modelId) result.selectedModel = json.model || json.model_id || json.modelId;
        if (json.apiKey || json.api_key || json.key) result.apiKey = json.apiKey || json.api_key || json.key;
        if (json.name || json.label) result.name = json.name || json.label;
        return result;
      } catch (e) {}
    }

    // 2. Extract Base URL
    const urlMatch = text.match(/https?:\/\/[^\s"'\)\,\}]+/i);
    if (urlMatch) {
      let u = urlMatch[0];
      // Clean trailing /chat/completions or /models from URL
      u = u.replace(/\/chat\/completions\/?$/, '').replace(/\/models\/?$/, '');
      result.baseUrl = u;
    }

    // 3. Extract Model Name
    const modelMatch = text.match(/(?:model|model_id|modelName)\s*[:=]\s*["']([^"']+)["']/i) ||
                       text.match(/"model"\s*:\s*"([^"]+)"/i) ||
                       text.match(/--model\s+([^\s]+)/i);
    if (modelMatch) {
      result.selectedModel = modelMatch[1];
    }

    // 4. Extract API Key (Bearer or api_key)
    const keyMatch = text.match(/(?:Bearer|api_key|apiKey|key)\s*[:= ]\s*["']?([a-zA-Z0-9_\-]{15,})["']?/i) ||
                     text.match(/Authorization:\s*Bearer\s+([^\s"']+)/i);
    if (keyMatch && !keyMatch[1].includes('$') && !keyMatch[1].includes('<')) {
      result.apiKey = keyMatch[1];
    }

    // 5. Inferred Name
    if (result.selectedModel) {
      result.name = `Custom: ${result.selectedModel.split('/').pop()}`;
    } else if (result.baseUrl) {
      try {
        result.name = `Custom: ${new URL(result.baseUrl).hostname}`;
      } catch {
        result.name = 'Custom Provider';
      }
    }

    return result;
  }

  /**
   * Dynamically fetch live model list from ANY endpoint (GET /models)
   */
  public static async fetchRemoteModels(baseUrl: string, apiKey?: string): Promise<AIModelPreset[]> {
    try {
      const cleanUrl = baseUrl.replace(/\/$/, '');
      const modelsUrl = cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`;
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(modelsUrl, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.data || [];
      return list.map(m => ({
        id: m.id || m.name,
        name: m.name || m.id,
        contextWindow: m.context_length || 128000,
        isFree: m.id?.includes(':free') || false
      }));
    } catch {
      return [];
    }
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
        // Universal OpenAI Compatible / OpenRouter / Groq / DeepSeek / Ollama / Custom Endpoint
        const cleanBase = config.baseUrl.replace(/\/$/, '');
        const url = cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(config.customHeaders || {})
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
