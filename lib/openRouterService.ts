/**
 * OpenRouter AI Service
 * Dynamically queries active free models with auto-routing via openrouter/free
 */

export interface OpenRouterGenerateParams {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  image?: string;
}

// In-memory cache for dynamic free models
let cachedFreeModels: string[] = [];
let lastModelsFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Known reliable free models as static defaults
const DEFAULT_FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3.8-27b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-2.5-2.6b:free'
];

async function getActiveFreeModels(): Promise<string[]> {
  const now = Date.now();
  if (cachedFreeModels.length > 0 && (now - lastModelsFetchTime < CACHE_TTL_MS)) {
    return cachedFreeModels;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const json: any = await res.json();
      if (Array.isArray(json?.data)) {
        const freeList = json.data
          .filter((m: any) => m.id?.endsWith(':free') || m.id === 'openrouter/free')
          .map((m: any) => m.id as string);

        if (freeList.length > 0) {
          // Put openrouter/free first if available
          const sorted = ['openrouter/free', ...freeList.filter((id: string) => id !== 'openrouter/free')];
          cachedFreeModels = Array.from(new Set(sorted));
          lastModelsFetchTime = now;
          return cachedFreeModels;
        }
      }
    }
  } catch (err: any) {
    // If fetching model list fails, use static defaults
    console.log('[OpenRouter] Model discovery fetch skipped, using default free models list.');
  }

  return DEFAULT_FREE_MODELS;
}

export async function generateWithOpenRouter(params: OpenRouterGenerateParams): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  const dynamicFreeModels = await getActiveFreeModels();
  const configuredModel = params.model || process.env.OPENROUTER_MODEL;

  // Build candidate list: start with openrouter/free or user's requested model
  const modelsToTry: string[] = [];
  if (configuredModel && !configuredModel.includes('llama-3.3-70b-instruct:free') && !configuredModel.includes('mistral-7b-instruct:free')) {
    modelsToTry.push(configuredModel);
  }
  // Always include openrouter/free first as it auto-routes to healthy free providers
  modelsToTry.push('openrouter/free');
  for (const m of dynamicFreeModels) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  const messages: Array<{ role: 'system' | 'user'; content: any }> = [];
  if (params.systemInstruction) {
    messages.push({ role: 'system', content: params.systemInstruction });
  }

  if (params.image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: params.prompt },
        { type: 'image_url', image_url: { url: params.image } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: params.prompt });
  }

  // Try up to 3 candidate models to keep response fast
  const candidates = modelsToTry.slice(0, 3);

  for (const model of candidates) {
    try {
      console.log(`[OpenRouter] Requesting generation with model ${model}...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://joeword.app',
          'X-Title': 'Joe Word',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        // Model might be temporarily unavailable or retired, proceed to next
        console.log(`[OpenRouter] Model ${model} returned status ${response.status}, trying next fallback...`);
        continue;
      }

      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        console.log(`[OpenRouter] Generation succeeded with model ${model}!`);
        return content.trim();
      }
    } catch (err: any) {
      console.log(`[OpenRouter] Connection error with model ${model}:`, err.message || err);
    }
  }

  return null;
}
