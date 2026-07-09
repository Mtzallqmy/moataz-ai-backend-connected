export const providerPresets = {
  openai: {
    name: "OpenAI",
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    features: ["chat", "models", "vision", "tools"],
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
    adapter: "openai",
  },
  openrouter: {
    name: "OpenRouter",
    type: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    features: ["chat", "models", "routing"],
    models: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-flash-1.5"],
    adapter: "openai",
  },
  anthropic: {
    name: "Anthropic",
    type: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-latest",
    features: ["chat", "vision", "long-context"],
    models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
    adapter: "anthropic",
  },
  google: {
    name: "Google Gemini",
    type: "google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-flash",
    features: ["chat", "vision", "code"],
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"],
    adapter: "google",
  },
  mistral: {
    name: "Mistral AI",
    type: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    features: ["chat", "models", "tools"],
    models: ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest", "codestral-latest"],
    adapter: "openai",
  },
  groq: {
    name: "Groq",
    type: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    features: ["chat", "models", "fast-inference"],
    models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
    adapter: "openai",
  },
  deepseek: {
    name: "DeepSeek",
    type: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    features: ["chat", "models", "reasoning"],
    models: ["deepseek-chat", "deepseek-reasoner"],
    adapter: "openai",
  },
  together: {
    name: "Together AI",
    type: "together",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    features: ["chat", "models", "open-source"],
    models: [
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ],
    adapter: "openai",
  },
  xai: {
    name: "xAI",
    type: "xai",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
    features: ["chat", "models"],
    models: ["grok-2-latest", "grok-2-mini-latest"],
    adapter: "openai",
  },
  cohere: {
    name: "Cohere",
    type: "cohere",
    baseUrl: "https://api.cohere.com/v2",
    defaultModel: "command-r-plus",
    features: ["chat", "rerank", "embeddings"],
    models: ["command-r-plus", "command-r", "command-light"],
    adapter: "cohere",
  },
  custom: {
    name: "Custom OpenAI Compatible",
    type: "custom",
    baseUrl: "",
    defaultModel: "",
    features: ["chat"],
    models: [],
    adapter: "openai",
  },
};

export function normalizeProviderType(input) {
  const value = String(input || "").trim().toLowerCase();
  if (providerPresets[value]) return value;
  if (value.includes("openrouter")) return "openrouter";
  if (value.includes("anthropic") || value.includes("claude")) return "anthropic";
  if (value.includes("google") || value.includes("gemini")) return "google";
  if (value.includes("mistral")) return "mistral";
  if (value.includes("groq")) return "groq";
  if (value.includes("deepseek")) return "deepseek";
  if (value.includes("together")) return "together";
  if (value.includes("cohere")) return "cohere";
  if (value.includes("xai") || value.includes("grok")) return "xai";
  if (value.includes("openai") || value.includes("gpt")) return "openai";
  return "custom";
}

export function getPreset(typeOrName) {
  const type = normalizeProviderType(typeOrName);
  return providerPresets[type] || providerPresets.custom;
}
