import { getPreset } from "./presets.js";

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function textFromMessages(messages) {
  return (messages || [])
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
}

export function fallbackModels(provider) {
  const preset = getPreset(provider.type || provider.slug || provider.name);
  return (preset.models || []).map((name) => ({
    id: `${provider.id}_${name}`.replace(/[^a-zA-Z0-9_]+/g, "_"),
    providerId: provider.id,
    providerName: provider.name,
    name,
    slug: name,
    description: `${provider.name} model`,
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePer1k: 0,
    outputPricePer1k: 0,
    capabilities: ["chat"],
    modalities: ["text"],
    status: "active",
    createdAt: provider.created_at || new Date().toISOString(),
    updatedAt: provider.updated_at || new Date().toISOString(),
  }));
}

export async function listProviderModels(provider, apiKey) {
  const preset = getPreset(provider.type || provider.slug || provider.name);
  const baseUrl = provider.base_url || preset.baseUrl;

  if (!apiKey) return fallbackModels(provider);

  if (preset.adapter === "google") {
    const url = `${baseUrl.replace(/\/+$/, "")}/models?key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Google model list failed: ${r.status}`);
    const data = await r.json();
    const models = (data.models || []).map((m) => (m.name || "").replace(/^models\//, "")).filter(Boolean);
    return (models.length ? models : preset.models).map((name) => ({
      id: `${provider.id}_${name}`.replace(/[^a-zA-Z0-9_]+/g, "_"),
      providerId: provider.id,
      providerName: provider.name,
      name,
      slug: name,
      description: `${provider.name} model`,
      contextWindow: 128000,
      maxOutput: 8192,
      inputPricePer1k: 0,
      outputPricePer1k: 0,
      capabilities: ["chat"],
      modalities: ["text"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  if (preset.adapter === "anthropic") {
    const r = await fetch(joinUrl(baseUrl, "/models"), {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!r.ok) throw new Error(`Anthropic model list failed: ${r.status}`);
    const data = await r.json();
    const models = (data.data || []).map((m) => m.id).filter(Boolean);
    return (models.length ? models : preset.models).map((name) => ({
      id: `${provider.id}_${name}`.replace(/[^a-zA-Z0-9_]+/g, "_"),
      providerId: provider.id,
      providerName: provider.name,
      name,
      slug: name,
      description: `${provider.name} model`,
      contextWindow: 200000,
      maxOutput: 8192,
      inputPricePer1k: 0,
      outputPricePer1k: 0,
      capabilities: ["chat"],
      modalities: ["text"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  // OpenAI compatible providers: OpenAI, Mistral, Groq, DeepSeek, Together, xAI, OpenRouter and custom.
  const r = await fetch(joinUrl(baseUrl, "/models"), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!r.ok) throw new Error(`OpenAI-compatible model list failed: ${r.status}`);
  const data = await r.json();
  const models = (data.data || data.models || []).map((m) => m.id || m.name).filter(Boolean);
  return (models.length ? models : preset.models).map((name) => ({
    id: `${provider.id}_${name}`.replace(/[^a-zA-Z0-9_]+/g, "_"),
    providerId: provider.id,
    providerName: provider.name,
    name,
    slug: name,
    description: `${provider.name} model`,
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePer1k: 0,
    outputPricePer1k: 0,
    capabilities: ["chat"],
    modalities: ["text"],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

async function callOpenAICompatible(provider, apiKey, payload) {
  const preset = getPreset(provider.type || provider.slug || provider.name);
  const baseUrl = provider.base_url || preset.baseUrl;
  const model = payload.modelId || provider.default_model || preset.defaultModel;
  const r = await fetch(joinUrl(baseUrl, "/chat/completions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(preset.type === "openrouter" ? { "HTTP-Referer": "https://moataz.ai", "X-Title": "Moataz AI Gateway" } : {}),
    },
    body: JSON.stringify({
      model,
      messages: payload.messages,
      temperature: payload.temperature ?? 0.7,
      max_tokens: payload.maxTokens ?? 1024,
      top_p: payload.topP ?? 1,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data?.error?.message || `Provider chat failed: ${r.status}`);
  }
  const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
  return {
    content,
    usage: data.usage || null,
    model,
  };
}

async function callAnthropic(provider, apiKey, payload) {
  const preset = getPreset(provider.type || provider.slug || provider.name);
  const baseUrl = provider.base_url || preset.baseUrl;
  const model = payload.modelId || provider.default_model || preset.defaultModel;
  const system = (payload.messages || []).find((m) => m.role === "system")?.content;
  const messages = (payload.messages || [])
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
    }));

  const r = await fetch(joinUrl(baseUrl, "/messages"), {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      system,
      messages,
      max_tokens: payload.maxTokens ?? 1024,
      temperature: payload.temperature ?? 0.7,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data?.error?.message || `Anthropic chat failed: ${r.status}`);
  }
  return {
    content: data.content?.map((p) => p.text || "").join("\n") || "",
    usage: data.usage || null,
    model,
  };
}

async function callGoogle(provider, apiKey, payload) {
  const preset = getPreset(provider.type || provider.slug || provider.name);
  const baseUrl = provider.base_url || preset.baseUrl;
  const model = payload.modelId || provider.default_model || preset.defaultModel;
  const contents = (payload.messages || [])
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));

  const systemInstruction = (payload.messages || []).find((m) => m.role === "system")?.content;
  const url = `${joinUrl(baseUrl, `/models/${encodeURIComponent(model)}:generateContent`)}?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: payload.temperature ?? 0.7,
        maxOutputTokens: payload.maxTokens ?? 1024,
        topP: payload.topP ?? 1,
      },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data?.error?.message || `Google chat failed: ${r.status}`);
  }
  return {
    content: data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "",
    usage: data.usageMetadata || null,
    model,
  };
}

async function callCohere(provider, apiKey, payload) {
  const preset = getPreset(provider.type || provider.slug || provider.name);
  const baseUrl = provider.base_url || preset.baseUrl;
  const model = payload.modelId || provider.default_model || preset.defaultModel;
  const messages = (payload.messages || []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
    content: String(m.content || ""),
  }));

  const r = await fetch(joinUrl(baseUrl, "/chat"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: payload.temperature ?? 0.7 }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data?.message || `Cohere chat failed: ${r.status}`);
  }
  return {
    content: data.message?.content?.map((p) => p.text || "").join("\n") || data.text || "",
    usage: data.usage || null,
    model,
  };
}

export async function callProviderChat(provider, apiKey, payload) {
  if (!apiKey) throw new Error("No provider API key is configured.");
  const preset = getPreset(provider.type || provider.slug || provider.name);

  if (preset.adapter === "anthropic") return callAnthropic(provider, apiKey, payload);
  if (preset.adapter === "google") return callGoogle(provider, apiKey, payload);
  if (preset.adapter === "cohere") return callCohere(provider, apiKey, payload);
  return callOpenAICompatible(provider, apiKey, payload);
}

export async function testProviderConnection(provider, apiKey) {
  const started = Date.now();
  const models = await listProviderModels(provider, apiKey);
  return {
    success: true,
    latencyMs: Date.now() - started,
    modelsCount: models.length,
  };
}
