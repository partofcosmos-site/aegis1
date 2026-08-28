/**
 * @file aiVaultService.ts
 * @module Services/AIVaultService
 * @description
 * Client-side cryptographic and zero-leak configuration vault for Universal AI providers.
 * 
 * ## Architecture Rationale & Zero-Leak Security Model
 * In competitive academic research and high-volume AI usage, students frequently configure
 * custom high-tier API keys (OpenAI, Anthropic, OpenRouter, Together AI) or connect to local
 * self-hosted inferencing servers (Ollama, LM Studio, vLLM).
 * 
 * Traditional platforms send these keys to server backends or cloud databases, introducing
 * significant credential leakage risks.
 * 
 * **AIVaultService enforces a strict Client-Side Zero-Leak policy**:
 * - Secrets are stored exclusively in the browser's origin-isolated `localStorage`.
 * - Credentials are NEVER transmitted to Cloud Firestore, telemetry streams, build artifacts, or server logs.
 * - Outbound API calls stream directly from the user's browser client to the provider endpoint using direct browser CORS headers.
 * 
 * ## Core Capabilities
 * - **Provider Multi-Tenancy**: Store, switch, and manage unlimited AI provider configurations.
 * - **Smart Code & Doc Snippet Parser**: Heuristic regex/AST extractor that automatically parses Python SDK calls,
 *   cURL commands, JavaScript fetches, and JSON payloads to extract Base URLs, Model IDs, and API keys in 1 click.
 * - **Live Model Discovery**: Dynamically queries `GET /v1/models` on custom endpoints to populate available models.
 * - **Latency Ping & Handshake Validator**: Measures real-time round-trip latency (ms) and connection validity before execution.
 */

import { AIProviderConfig, ProviderType, PROVIDER_TEMPLATES, AIModelPreset } from './aiProviderTypes';

/** Local storage key under which provider profiles are securely persisted in the browser. */
const STORAGE_KEY = 'aegis_ai_providers_vault_v1';

/** Local storage key tracking the identifier of the currently active default AI provider. */
const ACTIVE_PROVIDER_ID_KEY = 'aegis_active_ai_provider_id';

/**
 * Service class managing client-side AI credentials, endpoint configurations, and connection testing.
 */
export class AIVaultService {
  /**
   * Retrieves the full list of configured AI providers from local storage.
   * If no providers exist, initializes default production presets (OpenRouter Free Tier + Google Gemini).
   * 
   * @returns {AIProviderConfig[]} Array of stored provider configurations.
   */
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

  /**
   * Persists an array of AI provider configurations into browser local storage.
   * 
   * @param {AIProviderConfig[]} providers Array of provider configurations to save.
   */
  public static saveProviders(providers: AIProviderConfig[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aegis_ai_provider_changed'));
    }
  }

  /**
   * Retrieves the active AI provider configuration designated for primary inference tasks.
   * 
   * @returns {AIProviderConfig} The active provider configuration.
   */
  public static getActiveProvider(): AIProviderConfig {
    const providers = this.getProviders();
    const activeId = localStorage.getItem(ACTIVE_PROVIDER_ID_KEY);
    
    // 1. Explicitly selected active provider
    const explicit = providers.find(p => p.id === activeId);
    if (explicit) return explicit;

    // 2. Default provider
    const defaultProv = providers.find(p => p.isDefault);
    if (defaultProv) return defaultProv;

    // 3. ANY provider with a configured non-empty API key
    const withKey = providers.find(p => (p.apiKey || '').trim());
    if (withKey) return withKey;

    // 4. Fallback to first or default template
    return providers[0] || {
      id: 'prov_fallback',
      name: 'Google Gemini (Free Tier)',
      providerType: 'google',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: '',
      selectedModel: 'gemini-2.0-flash',
      temperature: 0.2,
      maxTokens: 4096,
      isDefault: true,
      createdAt: Date.now()
    };
  }

  /**
   * Sets the default active AI provider by ID and updates persistence.
   * 
   * @param {string} id The unique provider identifier to activate.
   */
  public static setActiveProvider(id: string): void {
    const providers = this.getProviders().map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    localStorage.setItem(ACTIVE_PROVIDER_ID_KEY, id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aegis_ai_provider_changed'));
    }
  }

  /**
   * Smart Code / cURL / Doc Snippet Parser:
   * Heuristically parses pasted documentation code snippets (Python SDK, cURL bash commands,
   * JavaScript fetch, or JSON payloads) and extracts the `baseUrl`, `selectedModel`, `apiKey`, and `name`.
   * 
   * @param {string} raw Raw code or snippet text pasted by the user.
   * @returns {Partial<AIProviderConfig>} Inferred configuration properties.
   */
  public static parseSnippetToConfig(raw: string): Partial<AIProviderConfig> {
    const text = raw.trim();
    const result: Partial<AIProviderConfig> = {};

    // 1. Check for JSON format
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const json = JSON.parse(text);
        if (json.baseUrl || json.base_url || json.url) result.baseUrl = String(json.baseUrl || json.base_url || json.url).trim();
        if (json.model || json.model_id || json.modelId) result.selectedModel = String(json.model || json.model_id || json.modelId).trim();
        if (json.apiKey || json.api_key || json.key) result.apiKey = String(json.apiKey || json.api_key || json.key).trim();
        if (json.name || json.label) result.name = String(json.name || json.label).trim();
        return result;
      } catch (e) {}
    }

    // 2. Extract Base URL from HTTP / HTTPS patterns
    const urlMatch = text.match(/https?:\/\/[^\s"'\)\,\}]+/i);
    if (urlMatch) {
      let u = urlMatch[0].trim();
      // Clean trailing /chat/completions or /models from URL
      u = u.replace(/\/chat\/completions\/?$/, '').replace(/\/models\/?$/, '');
      result.baseUrl = u;
    }

    // 3. Extract Model Name via common assignment patterns
    const modelMatch = text.match(/(?:model|model_id|modelName)\s*[:=]\s*["']([^"']+)["']/i) ||
                       text.match(/"model"\s*:\s*"([^"]+)"/i) ||
                       text.match(/--model\s+([^\s]+)/i);
    if (modelMatch) {
      result.selectedModel = modelMatch[1].trim();
    }

    // 4. Extract API Key (Bearer tokens or key assignments)
    const keyMatch = text.match(/(?:Bearer|api_key|apiKey|key)\s*[:= ]\s*["']?([a-zA-Z0-9_\-]{15,})["']?/i) ||
                     text.match(/Authorization:\s*Bearer\s+([^\s"']+)/i);
    if (keyMatch && !keyMatch[1].includes('$') && !keyMatch[1].includes('<')) {
      result.apiKey = keyMatch[1].trim();
    }

    // 5. Infer display name from model or hostname
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
   * Dynamically queries `GET /v1/models` on any OpenAI-compatible custom endpoint OR
   * Google Gemini models endpoint to retrieve the live list of available models and context windows.
   * 
   * @param {string} baseUrl The root or /v1 Base URL of the endpoint.
   * @param {string} [apiKey] Optional authentication token.
   * @param {ProviderType} [providerType] Optional provider type to force a specific lookup.
   * @returns {Promise<AIModelPreset[]>} Array of available models with metadata.
   */
  public static async fetchRemoteModels(baseUrl: string, apiKey?: string, providerType?: ProviderType): Promise<AIModelPreset[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const cleanUrl = baseUrl.trim().replace(/\/$/, '');
      const trimmedKey = (apiKey || '').trim();

      // Case 1: Google Gemini API
      if (providerType === 'google' || cleanUrl.includes('generativelanguage.googleapis.com')) {
        const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`;
        const res = await fetch(modelsUrl, { signal: controller.signal });
        if (!res.ok) return [];
        const data = await res.json();
        const models = data.models || [];
        return models.map((m: any) => ({
          id: String(m.name || '').replace('models/', ''),
          name: String(m.displayName || m.name || '').replace('models/', ''),
          contextWindow: Number(m.inputTokenLimit) || 128000,
          isFree: false
        }));
      }

      // Case 2: OpenAI / OpenRouter / DeepSeek / Compatible
      const modelsUrl = cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`;
      const headers: Record<string, string> = {};
      if (trimmedKey) headers['Authorization'] = `Bearer ${trimmedKey}`;

      const res = await fetch(modelsUrl, { headers, signal: controller.signal });
      if (!res.ok) return [];
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.data || [];
      return list.map(m => ({
        id: String(m.id || m.name || ''),
        name: String(m.name || m.id || ''),
        contextWindow: Number(m.context_length) || 128000,
        isFree: String(m.id || '').includes(':free') || false
      })).filter(m => m.id);
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Performs an immediate diagnostic connection test and latency benchmark against a provider configuration.
   * Dispatches a minimal single-token ping to verify authentication, endpoint routing, and round-trip response time.
   * 
   * @param {AIProviderConfig} config Provider configuration to test.
   * @returns {Promise<{ success: boolean; latencyMs: number; message: string }>} Diagnostic test result.
   */
  public static async testConnection(config: AIProviderConfig): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const apiKey = (config.apiKey || '').trim();
    const baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');

    try {
      if (config.providerType === 'google') {
        const url = `${baseUrl}/models/${config.selectedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
          signal: controller.signal
        });
        const latencyMs = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          return { success: false, latencyMs, message: err.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, latencyMs, message: `Connected (${latencyMs}ms)` };
      } else if (config.providerType === 'anthropic') {
        const url = `${baseUrl}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.selectedModel,
            max_tokens: 5,
            messages: [{ role: 'user', content: 'ping' }]
          }),
          signal: controller.signal
        });
        const latencyMs = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          return { success: false, latencyMs, message: err.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, latencyMs, message: `Connected (${latencyMs}ms)` };
      } else {
        // Universal OpenAI Compatible / OpenRouter / Groq / DeepSeek / Ollama / Custom Endpoint
        const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(config.customHeaders || {})
        };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        if (config.providerType === 'openrouter') {
          headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://savantix.app';
          headers['X-Title'] = 'Aegis Study Engine';
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.selectedModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          }),
          signal: controller.signal
        });
        const latencyMs = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          return { success: false, latencyMs, message: err.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, latencyMs, message: `Connected (${latencyMs}ms)` };
      }
    } catch (e: any) {
      const latencyMs = Math.round(performance.now() - start);
      if (e.name === 'AbortError') {
        return { success: false, latencyMs, message: 'Connection timed out (>12s)' };
      }
      return { success: false, latencyMs, message: e.message || 'Connection failed' };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Scrubs sensitive API keys, bearer tokens, and credentials from error messages before logging or displaying.
   */
  public static scrubError(errorStr: string): string {
    if (!errorStr || typeof errorStr !== 'string') return 'An error occurred';
    return errorStr.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
                   .replace(/sk-or-v1-[0-9a-f]{64}/g, '[REDACTED_KEY]')
                   .replace(/sk-[0-9a-zA-Z]{20,}/g, '[REDACTED_KEY]')
                   .replace(/gsk_[0-9a-zA-Z]{20,}/g, '[REDACTED_KEY]');
  }

  /**
   * Retrieves parallel router models or returns undefined to use defaults.
   */
  public static getMultiModelRouterModels(): any[] | undefined {
    try {
      const raw = localStorage.getItem('savantix_parallel_router_models');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }
}

