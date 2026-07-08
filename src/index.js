import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";
import { config } from "./config.js";
import { supabase, supabaseAnon } from "./supabase.js";
import { requireAuth, mapUser, ensureProfile } from "./auth.js";
import { ok, fail, asyncRoute } from "./responses.js";
import { encryptSecret, decryptSecret, createPublicApiKey, hashKey, maskKey } from "./crypto.js";
import { getPreset, normalizeProviderType, providerPresets } from "./presets.js";
import { listProviderModels, callProviderChat, testProviderConnection, fallbackModels } from "./ai.js";
import { toProvider, toApiKey, toLog } from "./mappers.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin === "*" ? true : config.frontendOrigin.split(",").map((s) => s.trim()),
  credentials: true,
}));
app.use(express.json({ limit: "4mb" }));
app.use(morgan("tiny"));

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/(^-|-$)/g, "") || "provider";
}

async function getProviderForUser(userId, providerId) {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", providerId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

async function insertAudit(userId, action, resourceType, resourceId, metadata = {}) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

async function logUsage({
  userId,
  provider,
  modelId,
  latencyMs,
  usage,
  status = "success",
  errorMessage = null,
  path = "/api/playground/chat",
}) {
  const promptTokens = usage?.prompt_tokens ?? usage?.input_tokens ?? usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.completion_tokens ?? usage?.output_tokens ?? usage?.candidatesTokenCount ?? 0;
  const totalTokens = usage?.total_tokens ?? usage?.totalTokenCount ?? (promptTokens + completionTokens);

  await supabase.from("usage_logs").insert({
    user_id: userId,
    provider_id: provider?.id,
    provider_name: provider?.name,
    model_id: modelId,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    latency_ms: latencyMs,
    status,
    error_message: errorMessage,
    path,
    method: "POST",
    status_code: status === "success" ? 200 : 500,
    message: status === "success" ? "Provider request completed" : "Provider request failed",
  });
}

// Public backend health route
app.get("/", (_req, res) => ok(res, { name: "Moataz AI Backend", status: "ok" }));
app.get("/api/healthz", (_req, res) => ok(res, { status: "ok", time: new Date().toISOString() }));

// Auth
app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "INVALID_INPUT", "Invalid registration data.", parsed.error.flatten());

  const { name, email, password } = parsed.data;

  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return fail(res, 400, "REGISTER_FAILED", error.message);

  if (!data.session) {
    return fail(
      res,
      409,
      "EMAIL_CONFIRMATION_REQUIRED",
      "Account was created but Supabase requires email confirmation. Disable email confirmation in Supabase Auth or verify the email before login.",
    );
  }

  const profile = await ensureProfile(data.user);
  await insertAudit(profile.id, "auth.register", "user", profile.id);
  return ok(res, { token: data.session.access_token, user: mapUser(profile, data.user) }, 201);
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "INVALID_INPUT", "Invalid login data.", parsed.error.flatten());

  const { data, error } = await supabaseAnon.auth.signInWithPassword(parsed.data);
  if (error || !data.session || !data.user) {
    return fail(res, 401, "INVALID_CREDENTIALS", error?.message || "Incorrect email or password.");
  }

  const profile = await ensureProfile(data.user);
  await insertAudit(profile.id, "auth.login", "user", profile.id);
  return ok(res, { token: data.session.access_token, user: mapUser(profile, data.user) });
}));

app.post("/api/auth/logout", requireAuth, asyncRoute(async (req, res) => {
  await insertAudit(req.user.id, "auth.logout", "user", req.user.id);
  return ok(res, { success: true });
}));

// Provider presets for frontend dropdowns or onboarding
app.get("/api/provider-presets", requireAuth, asyncRoute(async (_req, res) => {
  return ok(res, Object.values(providerPresets));
}));

// Providers
app.get("/api/providers", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).map(toProvider));
}));

app.get("/api/providers/:id([0-9a-fA-F-]{36})", requireAuth, asyncRoute(async (req, res) => {
  const row = await getProviderForUser(req.user.id, req.params.id);
  if (!row) return fail(res, 404, "NOT_FOUND", "Provider not found.");
  return ok(res, toProvider(row));
}));

app.post("/api/providers", requireAuth, asyncRoute(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    type: z.string().optional(),
    description: z.string().optional().default(""),
    baseUrl: z.string().optional().default(""),
    apiKey: z.string().optional(),
    defaultModel: z.string().optional().default(""),
    region: z.string().optional().default("global"),
    supportedFeatures: z.array(z.string()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "INVALID_INPUT", "Invalid provider data.", parsed.error.flatten());

  const incoming = parsed.data;
  const type = normalizeProviderType(incoming.type || incoming.name);
  const preset = getPreset(type);
  const baseUrl = incoming.baseUrl || preset.baseUrl;
  const defaultModel = incoming.defaultModel || preset.defaultModel || "";

  if (!baseUrl) return fail(res, 400, "INVALID_INPUT", "baseUrl is required for custom providers.");

  const insert = {
    user_id: req.user.id,
    name: incoming.name,
    slug: slugify(incoming.name),
    type,
    description: incoming.description,
    base_url: baseUrl,
    api_key_encrypted: incoming.apiKey ? encryptSecret(incoming.apiKey) : null,
    default_model: defaultModel,
    region: incoming.region,
    status: incoming.apiKey ? "pending" : "inactive",
    supported_features: incoming.supportedFeatures || preset.features || ["chat"],
  };

  const { data, error } = await supabase.from("providers").insert(insert).select("*").single();
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "provider.create", "provider", data.id, { type });
  return ok(res, toProvider(data), 201);
}));

app.patch("/api/providers/:id([0-9a-fA-F-]{36})", requireAuth, asyncRoute(async (req, res) => {
  const existing = await getProviderForUser(req.user.id, req.params.id);
  if (!existing) return fail(res, 404, "NOT_FOUND", "Provider not found.");

  const patch = {};
  if (req.body.name) {
    patch.name = String(req.body.name);
    patch.slug = slugify(req.body.name);
  }
  if (req.body.type) patch.type = normalizeProviderType(req.body.type);
  if (req.body.description !== undefined) patch.description = String(req.body.description || "");
  if (req.body.baseUrl !== undefined) patch.base_url = String(req.body.baseUrl || "");
  if (req.body.apiKey !== undefined) patch.api_key_encrypted = req.body.apiKey ? encryptSecret(req.body.apiKey) : null;
  if (req.body.defaultModel !== undefined) patch.default_model = String(req.body.defaultModel || "");
  if (req.body.region !== undefined) patch.region = String(req.body.region || "global");
  if (req.body.status !== undefined) patch.status = String(req.body.status);
  if (Array.isArray(req.body.supportedFeatures)) patch.supported_features = req.body.supportedFeatures;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("providers")
    .update(patch)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "provider.update", "provider", data.id);
  return ok(res, toProvider(data));
}));

app.delete("/api/providers/:id([0-9a-fA-F-]{36})", requireAuth, asyncRoute(async (req, res) => {
  const { error } = await supabase
    .from("providers")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "provider.delete", "provider", req.params.id);
  return ok(res, { success: true });
}));

app.post("/api/providers/:id([0-9a-fA-F-]{36})/test-connection", requireAuth, asyncRoute(async (req, res) => {
  const provider = await getProviderForUser(req.user.id, req.params.id);
  if (!provider) return fail(res, 404, "NOT_FOUND", "Provider not found.");

  const apiKey = decryptSecret(provider.api_key_encrypted);
  const started = Date.now();

  try {
    const result = await testProviderConnection(provider, apiKey);
    await supabase
      .from("providers")
      .update({
        status: "active",
        latency_ms: result.latencyMs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    await supabase.from("validation_results").insert({
      user_id: req.user.id,
      provider_id: provider.id,
      provider_name: provider.name,
      model_id: provider.default_model,
      model_name: provider.default_model,
      test_name: "connection",
      status: "pass",
      duration_ms: result.latencyMs,
      message: `Connected. ${result.modelsCount} models visible.`,
      category: "provider",
    });

    return ok(res, { success: true, latencyMs: result.latencyMs, modelsCount: result.modelsCount });
  } catch (err) {
    const latencyMs = Date.now() - started;
    await supabase
      .from("providers")
      .update({
        status: "error",
        latency_ms: latencyMs,
        error_rate: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    await supabase.from("validation_results").insert({
      user_id: req.user.id,
      provider_id: provider.id,
      provider_name: provider.name,
      model_id: provider.default_model,
      model_name: provider.default_model,
      test_name: "connection",
      status: "fail",
      duration_ms: latencyMs,
      message: err.message,
      category: "provider",
    });

    return fail(res, 400, "CONNECTION_FAILED", err.message, { latencyMs });
  }
}));

// Models
app.get("/api/litellm/models", requireAuth, asyncRoute(async (req, res) => {
  const providerId = req.query.providerId;
  if (providerId) {
    const provider = await getProviderForUser(req.user.id, providerId);
    if (!provider) return fail(res, 404, "NOT_FOUND", "Provider not found.");
    try {
      const models = await listProviderModels(provider, decryptSecret(provider.api_key_encrypted));
      return ok(res, models);
    } catch (_err) {
      return ok(res, fallbackModels(provider));
    }
  }

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", req.user.id);

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).flatMap((provider) => fallbackModels(provider)));
}));

// API Keys
app.get("/api/api-keys", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("app_api_keys")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).map(toApiKey));
}));

app.post("/api/api-keys", requireAuth, asyncRoute(async (req, res) => {
  const newKey = createPublicApiKey();
  const name = req.body.name || "Gateway key";
  const row = {
    user_id: req.user.id,
    name,
    key_hash: hashKey(newKey),
    key_prefix: newKey.slice(0, 8),
    masked_key: maskKey(newKey),
    scopes: req.body.scopes || ["chat"],
    usage_limit: req.body.usageLimit || null,
    status: "active",
  };

  const { data, error } = await supabase.from("app_api_keys").insert(row).select("*").single();
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "api_key.create", "api_key", data.id);
  return ok(res, { ...toApiKey(data), newKey, key: newKey }, 201);
}));

app.post("/api/api-keys/:id/rotate", requireAuth, asyncRoute(async (req, res) => {
  const newKey = createPublicApiKey();
  const { data, error } = await supabase
    .from("app_api_keys")
    .update({
      key_hash: hashKey(newKey),
      key_prefix: newKey.slice(0, 8),
      masked_key: maskKey(newKey),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "api_key.rotate", "api_key", data.id);
  return ok(res, { id: data.id, newKey });
}));

app.post("/api/api-keys/:id/revoke", requireAuth, asyncRoute(async (req, res) => {
  const { error } = await supabase
    .from("app_api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "api_key.revoke", "api_key", req.params.id);
  return ok(res, { success: true });
}));

// Playground chat
app.post("/api/playground/chat", requireAuth, asyncRoute(async (req, res) => {
  const schema = z.object({
    providerId: z.string().uuid(),
    modelId: z.string().min(1),
    messages: z.array(z.object({
      role: z.string(),
      content: z.string(),
    })).min(1),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "INVALID_INPUT", "Invalid chat request.", parsed.error.flatten());

  const provider = await getProviderForUser(req.user.id, parsed.data.providerId);
  if (!provider) return fail(res, 404, "NOT_FOUND", "Provider not found.");

  const apiKey = decryptSecret(provider.api_key_encrypted);
  const started = Date.now();

  try {
    const result = await callProviderChat(provider, apiKey, parsed.data);
    const latencyMs = Date.now() - started;

    await supabase.from("chat_messages").insert([
      ...parsed.data.messages.map((m) => ({
        user_id: req.user.id,
        provider_id: provider.id,
        model_id: result.model,
        role: m.role,
        content: m.content,
      })),
      {
        user_id: req.user.id,
        provider_id: provider.id,
        model_id: result.model,
        role: "assistant",
        content: result.content,
      },
    ]);

    await supabase
      .from("providers")
      .update({
        request_count: Number(provider.request_count || 0) + 1,
        latency_ms: latencyMs,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    await logUsage({
      userId: req.user.id,
      provider,
      modelId: result.model,
      latencyMs,
      usage: result.usage,
      status: "success",
    });

    return ok(res, {
      content: result.content,
      usage: result.usage,
      model: result.model,
      provider: provider.name,
      latencyMs,
    });
  } catch (err) {
    const latencyMs = Date.now() - started;
    await logUsage({
      userId: req.user.id,
      provider,
      modelId: parsed.data.modelId,
      latencyMs,
      usage: null,
      status: "error",
      errorMessage: err.message,
    });
    return fail(res, 502, "PROVIDER_ERROR", err.message);
  }
}));

// Provider validation
app.get("/api/providers/validation-history", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("validation_results")
    .select("*")
    .eq("user_id", req.user.id)
    .order("checked_at", { ascending: false })
    .limit(100);

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).map((row) => ({
    id: row.id,
    providerId: row.provider_id,
    providerName: row.provider_name,
    modelId: row.model_id,
    modelName: row.model_name,
    testName: row.test_name,
    status: row.status,
    durationMs: row.duration_ms,
    score: row.score,
    message: row.message,
    checkedAt: row.checked_at,
    category: row.category,
  })));
}));

app.post("/api/providers/validate-key", requireAuth, asyncRoute(async (req, res) => {
  const providerType = normalizeProviderType(req.body.providerName || req.body.providerType);
  const preset = getPreset(providerType);
  const tempProvider = {
    id: "temp",
    user_id: req.user.id,
    name: preset.name,
    slug: providerType,
    type: providerType,
    base_url: req.body.baseUrl || preset.baseUrl,
    default_model: req.body.modelToTest || preset.defaultModel,
  };

  const started = Date.now();
  try {
    const result = await testProviderConnection(tempProvider, req.body.apiKey);
    return ok(res, {
      id: `validation_${Date.now()}`,
      status: "pass",
      message: `Key works. ${result.modelsCount} models found.`,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    return ok(res, {
      id: `validation_${Date.now()}`,
      status: "fail",
      message: err.message,
      durationMs: Date.now() - started,
    });
  }
}));

// Usage and monitoring
app.get("/api/usage/summary", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return fail(res, 500, "DB_ERROR", error.message);

  const rows = data || [];
  const totalRequests = rows.length;
  const totalTokens = rows.reduce((s, r) => s + Number(r.total_tokens || 0), 0);
  const avgLatencyMs = totalRequests ? Math.round(rows.reduce((s, r) => s + Number(r.latency_ms || 0), 0) / totalRequests) : 0;
  const errors = rows.filter((r) => r.status !== "success").length;

  const byProvider = new Map();
  const byModel = new Map();
  const byDay = new Map();

  for (const r of rows) {
    const providerKey = r.provider_id || "unknown";
    const p = byProvider.get(providerKey) || { providerId: r.provider_id, providerName: r.provider_name || "Unknown", requestCount: 0, cost: 0, pct: 0 };
    p.requestCount += 1;
    p.cost += Number(r.cost || 0);
    byProvider.set(providerKey, p);

    const modelKey = r.model_id || "unknown";
    const m = byModel.get(modelKey) || { modelId: r.model_id, modelName: r.model_id || "Unknown", providerName: r.provider_name || "Unknown", requestCount: 0, tokenCount: 0, cost: 0 };
    m.requestCount += 1;
    m.tokenCount += Number(r.total_tokens || 0);
    m.cost += Number(r.cost || 0);
    byModel.set(modelKey, m);

    const day = String(r.created_at || "").slice(0, 10);
    const d = byDay.get(day) || { date: day, requests: 0, tokens: 0, cost: 0, errors: 0 };
    d.requests += 1;
    d.tokens += Number(r.total_tokens || 0);
    d.cost += Number(r.cost || 0);
    if (r.status !== "success") d.errors += 1;
    byDay.set(day, d);
  }

  const topProviders = [...byProvider.values()].map((p) => ({ ...p, pct: totalRequests ? Math.round((p.requestCount / totalRequests) * 100) : 0 }));
  const topModels = [...byModel.values()].sort((a, b) => b.requestCount - a.requestCount).slice(0, 10);
  const dailyTrend = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  return ok(res, {
    totalRequests,
    totalTokens,
    totalCost: rows.reduce((s, r) => s + Number(r.cost || 0), 0),
    avgLatencyMs,
    errorRate: totalRequests ? errors / totalRequests : 0,
    changePct: { requests: 0, tokens: 0, cost: 0, latency: 0 },
    topProviders,
    topModels,
    dailyTrend,
  });
}));

app.get("/api/usage/by-provider", requireAuth, asyncRoute(async (_req, res) => ok(res, [])));
app.get("/api/usage/by-model", requireAuth, asyncRoute(async (_req, res) => ok(res, [])));
app.get("/api/usage/trend", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("usage_logs")
    .select("created_at,total_tokens,cost,status")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: true });
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, data || []);
}));

app.get("/api/providers/logs", requireAuth, asyncRoute(async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("usage_logs")
    .select("*", { count: "exact" })
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (req.query.providerId) q = q.eq("provider_id", req.query.providerId);

  const { data, error, count } = await q;
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, { items: (data || []).map(toLog), page, pageSize, total: count || 0 });
}));

app.get("/api/providers/health", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).map((p) => ({
    id: `health_${p.id}`,
    providerId: p.id,
    providerName: p.name,
    status: p.status === "active" ? "healthy" : p.status === "error" ? "down" : "degraded",
    latencyMs: Number(p.latency_ms || 0),
    lastCheckedAt: p.updated_at,
    uptimePct: Number(p.uptime_pct ?? 100),
    incidents: 0,
    region: p.region || "global",
    details: {
      connectivity: p.status !== "error",
      authentication: Boolean(p.api_key_encrypted),
      rateLimit: 0,
      quotaRemaining: 0,
    },
  })));
}));

app.post("/api/providers/health-check", requireAuth, asyncRoute(async (req, res) => {
  const provider = await getProviderForUser(req.user.id, req.body.providerName || req.body.providerId);
  if (!provider) return fail(res, 404, "NOT_FOUND", "Provider not found.");
  const result = await testProviderConnection(provider, decryptSecret(provider.api_key_encrypted));
  return ok(res, { providerId: provider.id, status: "healthy", latencyMs: result.latencyMs });
}));

// Telegram integration
app.get("/api/integrations/telegram/status", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("telegram_integrations")
    .select("id,bot_username,default_provider_id,default_model,status,webhook_url,created_at,updated_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, data || []);
}));

app.post("/api/integrations/telegram/connect", requireAuth, asyncRoute(async (req, res) => {
  const schema = z.object({
    botToken: z.string().min(10),
    defaultProviderId: z.string().uuid(),
    defaultModel: z.string().min(1),
    setWebhook: z.boolean().optional().default(false),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "INVALID_INPUT", "Invalid Telegram integration data.", parsed.error.flatten());

  const token = parsed.data.botToken;
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
  if (!me.ok) return fail(res, 400, "TELEGRAM_ERROR", me.description || "Telegram bot token is invalid.");

  const insert = {
    user_id: req.user.id,
    bot_username: me.result.username,
    bot_token_encrypted: encryptSecret(token),
    default_provider_id: parsed.data.defaultProviderId,
    default_model: parsed.data.defaultModel,
    status: "connected",
  };

  const { data, error } = await supabase.from("telegram_integrations").insert(insert).select("*").single();
  if (error) return fail(res, 500, "DB_ERROR", error.message);

  let webhook = null;
  if (parsed.data.setWebhook && config.publicBackendUrl) {
    webhook = `${config.publicBackendUrl.replace(/\/+$/, "")}/api/integrations/telegram/webhook/${data.id}`;
    const set = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhook }),
    }).then((r) => r.json());

    if (set.ok) {
      await supabase.from("telegram_integrations").update({ webhook_url: webhook }).eq("id", data.id);
    }
  }

  await insertAudit(req.user.id, "telegram.connect", "telegram_integration", data.id);
  return ok(res, {
    id: data.id,
    botUsername: data.bot_username,
    status: data.status,
    webhookUrl: webhook,
  }, 201);
}));

app.post("/api/integrations/telegram/webhook/:id", asyncRoute(async (req, res) => {
  const { data: integration, error } = await supabase
    .from("telegram_integrations")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !integration) return fail(res, 404, "NOT_FOUND", "Telegram integration not found.");

  const message = req.body.message || req.body.edited_message;
  const chatId = message?.chat?.id;
  const text = message?.text;
  if (!chatId || !text) return ok(res, { ignored: true });

  const provider = await getProviderForUser(integration.user_id, integration.default_provider_id);
  if (!provider) return ok(res, { ignored: true, reason: "No provider" });

  const botToken = decryptSecret(integration.bot_token_encrypted);
  const apiKey = decryptSecret(provider.api_key_encrypted);
  let content = "لم أستطع معالجة الرسالة الآن.";

  try {
    const result = await callProviderChat(provider, apiKey, {
      modelId: integration.default_model,
      messages: [
        { role: "system", content: "You are a helpful Telegram AI assistant. Reply in the user's language." },
        { role: "user", content: text },
      ],
      maxTokens: 800,
    });
    content = result.content || content;
  } catch (err) {
    content = `حدث خطأ من مزود الذكاء الاصطناعي: ${err.message}`;
  }

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: content }),
  });

  return ok(res, { delivered: true });
}));

// Repository connections (GitHub-compatible)
app.get("/api/repositories", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase
    .from("repository_connections")
    .select("id,name,provider,owner,repo,default_branch,status,created_at,updated_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, data || []);
}));

app.post("/api/repositories/connect", requireAuth, asyncRoute(async (req, res) => {
  const schema = z.object({
    token: z.string().min(10),
    owner: z.string().min(1),
    repo: z.string().min(1),
    name: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "INVALID_INPUT", "Invalid repository data.", parsed.error.flatten());

  const { token, owner, repo, name } = parsed.data;
  const gh = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Moataz-AI-Gateway",
    },
  }).then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }));

  if (!gh.ok) return fail(res, 400, "GITHUB_ERROR", gh.data?.message || `GitHub returned ${gh.status}`);

  const row = {
    user_id: req.user.id,
    name: name || gh.data.full_name,
    provider: "github",
    owner,
    repo,
    default_branch: gh.data.default_branch || "main",
    token_encrypted: encryptSecret(token),
    status: "connected",
  };

  const { data, error } = await supabase.from("repository_connections").insert(row).select("id,name,provider,owner,repo,default_branch,status,created_at,updated_at").single();
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  await insertAudit(req.user.id, "repository.connect", "repository", data.id);
  return ok(res, data, 201);
}));

async function getRepoConnection(userId, id) {
  const { data, error } = await supabase
    .from("repository_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

app.post("/api/repositories/:id/files/read", requireAuth, asyncRoute(async (req, res) => {
  const conn = await getRepoConnection(req.user.id, req.params.id);
  if (!conn) return fail(res, 404, "NOT_FOUND", "Repository connection not found.");
  const token = decryptSecret(conn.token_encrypted);
  const ref = req.body.ref || conn.default_branch;
  const path = req.body.path || "README.md";

  const url = `https://api.github.com/repos/${conn.owner}/${conn.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(ref)}`;
  const gh = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Moataz-AI-Gateway",
    },
  }).then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }));

  if (!gh.ok) return fail(res, 400, "GITHUB_ERROR", gh.data?.message || `GitHub returned ${gh.status}`);

  const content = gh.data.content ? Buffer.from(gh.data.content, "base64").toString("utf8") : "";
  return ok(res, { path, ref, sha: gh.data.sha, content });
}));

app.post("/api/repositories/:id/files/write", requireAuth, asyncRoute(async (req, res) => {
  const conn = await getRepoConnection(req.user.id, req.params.id);
  if (!conn) return fail(res, 404, "NOT_FOUND", "Repository connection not found.");
  const token = decryptSecret(conn.token_encrypted);
  const path = req.body.path;
  const content = req.body.content;
  const message = req.body.message || `Update ${path} via Moataz AI`;
  const branch = req.body.branch || conn.default_branch;
  const sha = req.body.sha;
  if (!path || content === undefined) return fail(res, 400, "INVALID_INPUT", "path and content are required.");

  const url = `https://api.github.com/repos/${conn.owner}/${conn.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const gh = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Moataz-AI-Gateway",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(String(content), "utf8").toString("base64"),
      branch,
      sha,
    }),
  }).then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }));

  if (!gh.ok) return fail(res, 400, "GITHUB_ERROR", gh.data?.message || `GitHub returned ${gh.status}`);
  await insertAudit(req.user.id, "repository.file.write", "repository", conn.id, { path, branch });
  return ok(res, gh.data);
}));

// Team, roles, permissions
app.get("/api/users", requireAuth, asyncRoute(async (_req, res) => {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).map((u) => ({
    id: u.id,
    userId: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleId: u.role?.toLowerCase(),
    status: u.status,
    permissions: [],
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    lastActiveAt: u.last_active_at,
  })));
}));

app.post("/api/users", requireAuth, asyncRoute(async (req, res) => {
  // For production invitation flow you can replace this with Supabase Admin inviteUserByEmail.
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(req.body.email, {
    data: { name: req.body.name || req.body.email?.split("@")[0], role: req.body.roleId || "Member" },
  });
  if (error) return fail(res, 400, "INVITE_FAILED", error.message);
  await insertAudit(req.user.id, "user.invite", "user", data.user?.id, { email: req.body.email });
  return ok(res, { id: data.user.id, userId: data.user.id, name: req.body.name || req.body.email, email: req.body.email, role: req.body.roleId || "Member", roleId: req.body.roleId || "Member", status: "pending", permissions: [], createdAt: data.user.created_at, updatedAt: data.user.updated_at }, 201);
}));

app.delete("/api/users/:id", requireAuth, asyncRoute(async (req, res) => {
  if (req.params.id === req.user.id) return fail(res, 400, "INVALID_ACTION", "You cannot remove your own account from the team here.");
  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return fail(res, 400, "DELETE_FAILED", error.message);
  await supabase.from("app_users").delete().eq("id", req.params.id);
  await insertAudit(req.user.id, "user.delete", "user", req.params.id);
  return ok(res, { success: true });
}));

app.get("/api/roles", requireAuth, asyncRoute(async (_req, res) => ok(res, [
  { id: "owner", name: "Owner", description: "Full access", isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "admin", name: "Admin", description: "Manage providers and users", isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "member", name: "Member", description: "Use chat and view usage", isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
])));

app.post("/api/roles", requireAuth, asyncRoute(async (req, res) => ok(res, { id: `role_${Date.now()}`, name: req.body.name, description: req.body.description || "", isSystem: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, 201)));
app.delete("/api/roles/:id", requireAuth, asyncRoute(async (_req, res) => ok(res, { success: true })));

app.get("/api/permissions", requireAuth, asyncRoute(async (_req, res) => ok(res, [
  { id: "providers.manage", name: "Manage providers", description: "Create and edit provider connections", category: "providers" },
  { id: "chat.use", name: "Use chat", description: "Use the chat playground and API", category: "chat" },
  { id: "keys.manage", name: "Manage keys", description: "Create and rotate API keys", category: "security" },
  { id: "repos.manage", name: "Manage repositories", description: "Read and write connected repositories", category: "repositories" },
  { id: "telegram.manage", name: "Manage Telegram", description: "Connect and configure Telegram bots", category: "integrations" },
])));

// Notifications, audit, billing and docs
app.get("/api/audit-logs", requireAuth, asyncRoute(async (req, res) => {
  const { data, error, count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, { items: data || [], page: 1, pageSize: 100, total: count || 0 });
}));

app.get("/api/notifications", requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (error) return fail(res, 500, "DB_ERROR", error.message);
  return ok(res, (data || []).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type || "info",
    read: n.read,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  })));
}));

app.post("/api/notifications/:id/read", requireAuth, asyncRoute(async (req, res) => {
  await supabase.from("notifications").update({ read: true, updated_at: new Date().toISOString() }).eq("id", req.params.id).eq("user_id", req.user.id);
  return ok(res, { success: true });
}));

app.post("/api/notifications/read/all", requireAuth, asyncRoute(async (req, res) => {
  await supabase.from("notifications").update({ read: true, updated_at: new Date().toISOString() }).eq("user_id", req.user.id);
  return ok(res, { success: true });
}));

app.get("/api/billing/plans", requireAuth, asyncRoute(async (_req, res) => ok(res, [])));
app.get("/api/billing/invoices", requireAuth, asyncRoute(async (_req, res) => ok(res, [])));
app.get("/api/billing/payments", requireAuth, asyncRoute(async (_req, res) => ok(res, [])));

app.get("/api/docs", requireAuth, asyncRoute(async (_req, res) => ok(res, [
  {
    id: "getting-started",
    title: "Getting started",
    slug: "getting-started",
    category: "setup",
    content: "Configure Supabase, deploy this backend on Railway, set NEXT_PUBLIC_API_URL in Vercel, then add your provider keys.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "telegram",
    title: "Telegram integration",
    slug: "telegram",
    category: "integrations",
    content: "Create a Telegram bot with BotFather, save the token in the Integrations page, and set the webhook to the Railway URL.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
])));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  return fail(res, 500, "INTERNAL_ERROR", err.message || "Unexpected server error.");
});

app.listen(config.port, () => {
  console.log(`Moataz AI backend listening on port ${config.port}`);
});
