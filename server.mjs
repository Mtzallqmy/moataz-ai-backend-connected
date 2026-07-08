import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const app = express();
const port = process.env.PORT || "3001";

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.CORS_ALLOW_ALL === "true") {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

function json(data, status = 200) {
  return { status, payload: { success: status < 400, data, timestamp: new Date().toISOString() } };
}

function error(message, status = 400, code = "BAD_REQUEST", details) {
  return { status, payload: { success: false, error: { code, message, details }, timestamp: new Date().toISOString() } };
}

app.get("/", (_req, res) => {
  res.json({ success: true, name: "Moataz AI Backend", status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "healthy", database: Boolean(process.env.DATABASE_URL), timestamp: new Date().toISOString() });
});


function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || crypto.randomBytes(4).toString("hex");
}
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function mask(value) {
  if (!value) return undefined;
  return value.length > 12 ? `${value.slice(0, 4)}••••••••${value.slice(-4)}` : "••••••••";
}
function encryptPlain(value) {
  if (!value) return undefined;
  const secret = crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "moataz-local-secret").digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}
function decryptMaybe(value) {
  if (!value) return undefined;
  try {
    const [ivB64, tagB64, encB64] = value.split(".");
    const secret = crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "moataz-local-secret").digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", secret, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encB64, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return undefined;
  }
}
async function body(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}
function normalizeProvider(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    logoUrl: undefined,
    status: p.status ?? "active",
    baseUrl: p.baseUrl ?? "",
    region: p.region ?? "global",
    supportedFeatures: Array.isArray(p.supportedFeatures) ? p.supportedFeatures : [],
    latencyMs: p.latencyMs ?? 0,
    uptimePct: p.uptimePct ?? 100,
    requestCount: p.requestCount ?? 0,
    errorRate: p.errorRate ?? 0,
    maskedApiKey: p.apiKeyMasked,
    defaultModel: p.defaultModel,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
  };
}
function normalizeModel(m) {
  return {
    id: m.id,
    providerId: m.providerId,
    providerName: m.providerName,
    name: m.name,
    slug: m.slug,
    description: m.description ?? "",
    contextWindow: m.contextWindow ?? 8192,
    maxOutput: m.maxOutput ?? 4096,
    inputPricePer1k: m.inputPricePer1k ?? 0,
    outputPricePer1k: m.outputPricePer1k ?? 0,
    capabilities: Array.isArray(m.capabilities) ? m.capabilities : [],
    modalities: Array.isArray(m.modalities) ? m.modalities : [],
    status: m.status ?? "active",
    benchmarkScore: m.benchmarkScore,
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    updatedAt: m.updatedAt?.toISOString?.() ?? m.updatedAt,
  };
}
async function ensureSeeded() {
  const count = await prisma.provider.count();
  if (count === 0) {
    const openai = await prisma.provider.create({ data: { id: "prv_openai", name: "OpenAI", slug: "openai", description: "OpenAI GPT models", baseUrl: "https://api.openai.com/v1", region: "global", litellmId: "openai", defaultModel: "gpt-4o-mini", supportedFeatures: ["chat", "vision", "tools", "streaming"], latencyMs: 180, uptimePct: 99.99 } });
    await prisma.model.createMany({ data: [
      { id: "mdl_gpt4o_mini", providerId: openai.id, providerName: openai.name, name: "gpt-4o-mini", slug: "gpt-4o-mini", description: "Fast OpenAI chat model", contextWindow: 128000, maxOutput: 16384, capabilities: ["chat", "vision", "tools"], modalities: ["text", "image"] },
      { id: "mdl_gpt4o", providerId: openai.id, providerName: openai.name, name: "gpt-4o", slug: "gpt-4o", description: "Flagship OpenAI chat model", contextWindow: 128000, maxOutput: 4096, capabilities: ["chat", "vision", "tools"], modalities: ["text", "image"] },
    ] });
  }
}
async function createLog(data) {
  try { await prisma.logEntry.create({ data: { ...data, statusCode: data.statusCode ?? 200, durationMs: data.durationMs ?? 0, level: data.level ?? "info", path: "/v1/chat/completions", method: "POST", metadata: data.metadata ?? {} } }); } catch {}
}

async function handleApi(req, method, path) {
  const [a, b, c] = path;
  await ensureSeeded();

  // Providers
  if (a === "providers" && method === "GET" && !b) {
    const providers = await prisma.provider.findMany({ orderBy: { createdAt: "asc" } });
    return json(providers.map(normalizeProvider));
  }
  if (a === "providers" && method === "POST" && !b) {
    const input = await body(req);
    if (!input.name || !input.baseUrl) return error("Provider name and baseUrl are required", 422, "VALIDATION_ERROR");
    const baseSlug = slugify(input.name);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.provider.findUnique({ where: { slug } })) slug = `${baseSlug}-${i++}`;
    const provider = await prisma.provider.create({ data: {
      name: input.name,
      slug,
      description: input.description || "",
      baseUrl: input.baseUrl,
      region: input.region || "global",
      litellmId: input.litellmId || slug,
      apiKeyEncrypted: encryptPlain(input.apiKey),
      apiKeyMasked: mask(input.apiKey),
      defaultModel: input.defaultModel || input.model || "",
      status: "active",
      supportedFeatures: input.supportedFeatures || ["chat", "streaming"],
      latencyMs: 0,
      uptimePct: 100,
    }});
    if (input.defaultModel || input.model) {
      await prisma.model.create({ data: { providerId: provider.id, providerName: provider.name, name: input.defaultModel || input.model, slug: slugify(input.defaultModel || input.model), description: `${input.defaultModel || input.model} via ${provider.name}`, capabilities: ["chat"], modalities: ["text"] } });
    }
    await createLog({ providerId: provider.id, providerName: provider.name, message: `Provider ${provider.name} created`, metadata: { apiKeyMasked: provider.apiKeyMasked } });
    return json(normalizeProvider(provider), 201);
  }
  if (a === "providers" && b === "models" && method === "GET") {
    const models = await prisma.model.findMany({ orderBy: { createdAt: "asc" } });
    return json(models.map(normalizeModel));
  }
  if (a === "providers" && b === "logs" && method === "GET") {
    const logs = await prisma.logEntry.findMany({ orderBy: { timestamp: "desc" }, take: 100 });
    return json({ data: logs.map(l => ({ ...l, timestamp: l.timestamp.toISOString(), createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() })), pagination: { page: 1, pageSize: 100, total: logs.length, totalPages: 1 } });
  }
  if (a === "providers" && b === "health" && method === "GET") {
    const providers = await prisma.provider.findMany({ include: { healthChecks: { orderBy: { lastCheckedAt: "desc" }, take: 1 } } });
    const rows = await Promise.all(providers.map(async p => {
      const h = p.healthChecks[0] ?? await prisma.healthCheck.create({ data: { providerId: p.id, providerName: p.name, status: "healthy", latencyMs: p.latencyMs, uptimePct: p.uptimePct, incidents: 0, region: p.region, details: { connectivity: true, authentication: Boolean(p.apiKeyMasked), rateLimit: 0, quotaRemaining: 0 } } });
      return { id: h.id, providerId: p.id, providerName: p.name, status: h.status, latencyMs: h.latencyMs, lastCheckedAt: h.lastCheckedAt.toISOString(), uptimePct: h.uptimePct, incidents: h.incidents, region: h.region || "global", details: h.details };
    }));
    return json(rows);
  }
  if (a === "providers" && b === "health-check" && method === "POST") {
    const input = await body(req);
    const provider = await prisma.provider.findFirst({ where: input.providerName ? { OR: [{ id: input.providerName }, { slug: input.providerName }, { name: input.providerName }] } : undefined });
    if (!provider) return error("Provider not found", 404, "NOT_FOUND");
    const started = Date.now();
    let ok = false;
    try { const r = await fetch(provider.baseUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) }); ok = r.status < 500; } catch { ok = false; }
    const latencyMs = Date.now() - started;
    await prisma.healthCheck.create({ data: { providerId: provider.id, providerName: provider.name, status: ok ? "healthy" : "degraded", latencyMs, uptimePct: ok ? 99.99 : 95, incidents: ok ? 0 : 1, region: provider.region, details: { connectivity: ok, authentication: Boolean(provider.apiKeyMasked), rateLimit: 0, quotaRemaining: 0 } } });
    return json({ providerId: provider.id, status: ok ? "healthy" : "degraded", latencyMs });
  }
  if (a === "providers" && b === "validation-history" && method === "GET") {
    const rows = await prisma.validationResult.findMany({ orderBy: { checkedAt: "desc" }, take: 100 });
    return json(rows.map(r => ({ ...r, checkedAt: r.checkedAt.toISOString(), createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  }
  if (a === "providers" && b === "validate-key" && method === "POST") {
    const input = await body(req);
    const provider = await prisma.provider.findFirst({ where: { OR: [{ id: input.providerName || "" }, { slug: input.providerName || "" }, { name: input.providerName || "" }] } });
    if (!provider) return error("Provider not found", 404, "NOT_FOUND");
    const started = Date.now();
    const apiKey = input.apiKey || decryptMaybe(provider.apiKeyEncrypted);
    let status = "skipped", message = "No API key provided. Save an API key on the Providers page first.";
    if (apiKey) {
      try {
        const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(12000) });
        status = response.ok ? "pass" : "fail";
        message = response.ok ? "API key accepted by provider." : `Provider returned HTTP ${response.status}`;
      } catch (e) {
        status = "fail";
        message = e?.message || "Validation request failed";
      }
    }
    const row = await prisma.validationResult.create({ data: { providerId: provider.id, providerName: provider.name, modelId: input.modelToTest, modelName: input.modelToTest, status, durationMs: Date.now() - started, score: status === "pass" ? 100 : 0, message, category: "authentication" } });
    return json({ id: row.id, providerId: provider.id, providerName: provider.name, status, durationMs: row.durationMs, message, checkedAt: row.checkedAt.toISOString(), category: row.category });
  }
  if (a === "providers" && b && c === "test-connection" && method === "POST") {
    const provider = await prisma.provider.findUnique({ where: { id: b } });
    if (!provider) return error("Provider not found", 404, "NOT_FOUND");
    const started = Date.now();
    let success = false;
    try { const r = await fetch(provider.baseUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) }); success = r.status < 500; } catch { success = false; }
    const latencyMs = Date.now() - started;
    await prisma.provider.update({ where: { id: provider.id }, data: { latencyMs, status: success ? "active" : "error" } });
    return json({ success, latencyMs });
  }
  if (a === "providers" && b && method === "GET") {
    const provider = await prisma.provider.findFirst({ where: { OR: [{ id: b }, { slug: b }] } });
    if (!provider) return error("Provider not found", 404, "NOT_FOUND");
    return json(normalizeProvider(provider));
  }
  if (a === "providers" && b && method === "PATCH") {
    const input = await body(req);
    const provider = await prisma.provider.update({ where: { id: b }, data: {
      name: input.name ?? undefined, description: input.description ?? undefined, baseUrl: input.baseUrl ?? undefined, region: input.region ?? undefined,
      defaultModel: input.defaultModel ?? undefined, apiKeyEncrypted: input.apiKey ? encryptPlain(input.apiKey) : undefined, apiKeyMasked: input.apiKey ? mask(input.apiKey) : undefined,
    }});
    return json(normalizeProvider(provider));
  }
  if (a === "providers" && b && method === "DELETE") {
    await prisma.provider.delete({ where: { id: b } });
    return json({ success: true });
  }

  // LiteLLM compatibility endpoints
  if (a === "litellm" && b === "models" && method === "GET") {
    const models = await prisma.model.findMany({ orderBy: { createdAt: "asc" } });
    return json(models.map(normalizeModel));
  }
  if (a === "litellm" && b === "health" && method === "GET") return json({ status: "healthy", proxy: "internal-next-api", timestamp: new Date().toISOString() });
  if (a === "litellm" && b === "status" && method === "GET") return json({ status: "ready", database: "connected" });

  // Playground real inference endpoint. OpenAI-compatible providers work directly.
  if (a === "playground" && b === "chat" && method === "POST") {
    const input = await body(req);
    const provider = await prisma.provider.findUnique({ where: { id: input.providerId } });
    const model = await prisma.model.findUnique({ where: { id: input.modelId } });
    if (!provider || !model) return error("Provider or model not found", 404, "NOT_FOUND");
    const apiKey = decryptMaybe(provider.apiKeyEncrypted) || input.apiKey || process.env[`${provider.slug.toUpperCase().replace(/-/g, "_")}_API_KEY`];
    if (!apiKey) return error(`No API key saved for ${provider.name}. Add it in Providers page.`, 400, "MISSING_PROVIDER_API_KEY");
    const endpoint = `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const started = Date.now();
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: model.name, messages: input.messages, temperature: input.temperature ?? 0.7, max_tokens: input.maxTokens ?? 1024, top_p: input.topP ?? 1, stream: false }), signal: AbortSignal.timeout(60000) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        await createLog({ providerId: provider.id, providerName: provider.name, modelId: model.id, modelName: model.name, statusCode: response.status, durationMs: Date.now() - started, level: "error", message: payload?.error?.message || `Provider returned HTTP ${response.status}`, metadata: payload });
        return error(payload?.error?.message || `Provider returned HTTP ${response.status}`, response.status, "PROVIDER_ERROR", payload);
      }
      const content = payload?.choices?.[0]?.message?.content ?? payload?.content?.[0]?.text ?? JSON.stringify(payload);
      const usage = payload?.usage || {};
      const durationMs = Date.now() - started;
      await createLog({ providerId: provider.id, providerName: provider.name, modelId: model.id, modelName: model.name, statusCode: 200, durationMs, tokenCount: usage.total_tokens, message: "Playground chat completion", metadata: { usage } });
      await prisma.provider.update({ where: { id: provider.id }, data: { requestCount: { increment: 1 }, latencyMs: durationMs, status: "active" } });
      return json({ content, usage, model: model.name, provider: provider.name, latencyMs: durationMs });
    } catch (e) {
      await createLog({ providerId: provider.id, providerName: provider.name, modelId: model.id, modelName: model.name, statusCode: 500, durationMs: Date.now() - started, level: "error", message: e?.message || "Inference failed" });
      return error(e?.message || "Inference failed", 500, "INFERENCE_FAILED");
    }
  }

  // API Keys
  if (a === "api-keys" && method === "GET" && !b) {
    const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
    return json(keys.map(k => ({ ...k, scopes: Array.isArray(k.scopes) ? k.scopes : [], createdAt: k.createdAt.toISOString(), updatedAt: k.updatedAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString(), expiresAt: k.expiresAt?.toISOString() })));
  }
  if (a === "api-keys" && method === "POST" && !b) {
    const input = await body(req);
    const raw = `nx_${crypto.randomBytes(24).toString("hex")}`;
    const key = await prisma.apiKey.create({ data: { name: input.name || "Gateway API Key", keyPrefix: raw.slice(0, 7), keyHash: hash(raw), maskedKey: mask(raw), scopes: input.scopes || ["chat"], usageLimit: input.usageLimit, createdBy: "Admin" } });
    return json({ ...key, key: raw, newKey: raw, scopes: key.scopes }, 201);
  }
  if (a === "api-keys" && b && c === "rotate" && method === "POST") {
    const raw = `nx_${crypto.randomBytes(24).toString("hex")}`;
    const key = await prisma.apiKey.update({ where: { id: b }, data: { keyPrefix: raw.slice(0, 7), keyHash: hash(raw), maskedKey: mask(raw) } });
    return json({ id: key.id, newKey: raw });
  }
  if (a === "api-keys" && b && c === "revoke" && method === "POST") {
    await prisma.apiKey.update({ where: { id: b }, data: { status: "revoked" } });
    return json({ success: true });
  }

  // Usage
  if (a === "usage" && (b === "summary" || !b) && method === "GET") {
    const days = await prisma.usageDaily.findMany({ orderBy: { date: "asc" }, take: 30 });
    const totalRequests = days.reduce((s, d) => s + d.requestCount, 0);
    const totalTokens = days.reduce((s, d) => s + d.tokenCount, 0);
    const totalCost = days.reduce((s, d) => s + d.cost, 0);
    const errors = days.reduce((s, d) => s + d.errorCount, 0);
    const byProvider = new Map();
    const byModel = new Map();
    for (const d of days) {
      const p = byProvider.get(d.providerName) || { providerId: d.providerId, providerName: d.providerName, requestCount: 0, cost: 0 };
      p.requestCount += d.requestCount; p.cost += d.cost; byProvider.set(d.providerName, p);
      const m = byModel.get(d.modelName) || { modelId: d.modelId, modelName: d.modelName, providerName: d.providerName, requestCount: 0, tokenCount: 0, cost: 0 };
      m.requestCount += d.requestCount; m.tokenCount += d.tokenCount; m.cost += d.cost; byModel.set(d.modelName, m);
    }
    return json({ totalRequests, totalTokens, totalCost, avgLatencyMs: days.length ? Math.round(days.reduce((s, d) => s + d.avgLatencyMs, 0) / days.length) : 0, errorRate: totalRequests ? errors / totalRequests : 0, changePct: { requests: 12, tokens: 9, cost: 5, latency: -3 }, topProviders: [...byProvider.values()].map(p => ({ ...p, providerId: p.providerId || "", pct: totalRequests ? p.requestCount / totalRequests : 0 })), topModels: [...byModel.values()].map(m => ({ ...m, modelId: m.modelId || "" })), dailyTrend: days.map(d => ({ date: d.date.toISOString().slice(0,10), requests: d.requestCount, tokens: d.tokenCount, cost: d.cost, errors: d.errorCount })) });
  }
  if (a === "usage" && b === "trend" && method === "GET") {
    const days = await prisma.usageDaily.findMany({ orderBy: { date: "asc" }, take: 30 });
    return json(days.map(d => ({ date: d.date.toISOString().slice(0,10), requests: d.requestCount, tokens: d.tokenCount, cost: d.cost, errors: d.errorCount })));
  }
  if (a === "usage" && (b === "by-provider" || b === "by-model") && method === "GET") return handleApi(req, "GET", ["usage", "summary"]);

  // Simple resources
  if (a === "users" && method === "GET") {
    const rows = await prisma.teamMember.findMany({ orderBy: { createdAt: "asc" } });
    return json(rows.map(r => ({ ...r, permissions: Array.isArray(r.permissions) ? r.permissions : [], createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(), lastActiveAt: r.lastActiveAt?.toISOString() })));
  }
  if (a === "users" && method === "POST") {
    const input = await body(req);
    const row = await prisma.teamMember.create({ data: { userId: crypto.randomUUID(), name: input.name || input.email, email: input.email, role: "Developer", roleId: input.roleId || "role_developer", permissions: ["providers:read", "playground:use"] } });
    return json(row, 201);
  }
  if (a === "users" && b && method === "DELETE") { await prisma.teamMember.delete({ where: { id: b } }); return json({ success: true }); }
  if (a === "roles" && method === "GET") { const rows = await prisma.role.findMany(); const members = await prisma.teamMember.findMany(); return json(rows.map(r => ({ ...r, permissions: Array.isArray(r.permissions) ? r.permissions : [], memberCount: members.filter(m => m.roleId === r.id || m.role === r.name).length, color: r.isSystem ? "violet" : "cyan", createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }))); }
  if (a === "roles" && method === "POST") { const input = await body(req); return json(await prisma.role.create({ data: { name: input.name, description: input.description || "", permissions: input.permissions || [] } }), 201); }
  if (a === "roles" && b && method === "DELETE") { await prisma.role.delete({ where: { id: b } }); return json({ success: true }); }
  if (a === "permissions" && method === "GET") { const rows = await prisma.permission.findMany(); return json(rows.map(r => ({ id: r.id, name: r.name, description: r.description || "", group: r.category, resource: r.name.split(":")[0] || r.category, actions: [r.name.split(":")[1] || "read"] }))); }
  if (a === "audit-logs" && method === "GET") { const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }); return json({ data: rows.map(r => ({ ...r, timestamp: r.createdAt.toISOString(), actorId: r.actorId || "system", actorName: r.actorName, actorEmail: "system@moataz.local", resource: r.target || "system", resourceId: r.id, resourceName: r.target || "Moataz Gateway", ipAddress: r.ipAddress || "127.0.0.1", userAgent: r.userAgent || "Railway", createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })), pagination: { page: 1, pageSize: 100, total: rows.length, totalPages: 1 } }); }
  if (a === "notifications" && method === "GET") { const rows = await prisma.appNotification.findMany({ orderBy: { createdAt: "desc" } }); return json(rows.map(r => ({ ...r, category: "system", actionUrl: "/providers", actionLabel: "Configure providers", createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }))); }
  if (a === "notifications" && b && c === "read" && method === "POST") { await prisma.appNotification.update({ where: { id: b }, data: { read: true } }); return json({ success: true }); }
  if (a === "notifications" && b === "read" && c === "all" && method === "POST") { await prisma.appNotification.updateMany({ data: { read: true } }); return json({ success: true }); }
  if (a === "billing" && b === "plans" && method === "GET") return json([{ id: "free", name: "Free", description: "For testing and personal projects", price: 0, currency: "USD", interval: "month", features: ["1,000 requests", "3 providers", "Basic analytics"], limits: { requestsPerMonth: 1000, tokensPerMonth: 1000000, providers: 3, teamMembers: 1 }, isCurrent: true }, { id: "pro", name: "Pro", description: "Production projects", price: 29, currency: "USD", interval: "month", features: ["100k requests", "Unlimited providers", "Team access"], limits: { requestsPerMonth: 100000, tokensPerMonth: 50000000, providers: -1, teamMembers: 10 }, isPopular: true }, { id: "enterprise", name: "Enterprise", description: "Custom limits and support", price: 299, currency: "USD", interval: "month", features: ["Custom limits", "SLA", "Priority support"], limits: { requestsPerMonth: -1, tokensPerMonth: -1, providers: -1, teamMembers: -1 } }]);
  if (a === "billing" && b === "invoices" && method === "GET") { const rows = await prisma.invoice.findMany({ orderBy: { issuedAt: "desc" } }); return json(rows.map(r => ({ id: r.id, number: r.number, date: r.issuedAt.toISOString(), dueDate: (r.dueAt || r.issuedAt).toISOString(), amount: r.amount, currency: "USD", status: r.status, plan: "Free", period: r.issuedAt.toISOString().slice(0,7), createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }))); }
  if (a === "billing" && b === "payments" && method === "GET") { const rows = await prisma.paymentMethod.findMany(); return json(rows.map(r => ({ id: r.id, type: "card", brand: r.brand, last4: r.last4, expiryMonth: r.expMonth, expiryYear: r.expYear, isDefault: r.isDefault }))); }
  if (a === "docs" && method === "GET") return json([{ id: "quickstart", slug: "quickstart", title: "Quickstart", description: "Deploy, add a provider key, and test the Playground.", category: "Getting Started", content: "Add a provider API key from Providers, create a gateway key from API Keys, then test real chat completions in Playground.", order: 1, updatedAt: new Date().toISOString() }]);

  return error(`Endpoint not found: /api/${path.join("/")}`, 404, "NOT_FOUND");
}



app.all("/api/*", async (req, res) => {
  try {
    const path = req.path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
    const result = await handleApi(req, req.method, path);
    res.status(result.status).json(result.payload);
  } catch (e) {
    console.error(e);
    const result = error(e?.message || "Internal server error", 500, "INTERNAL_ERROR");
    res.status(result.status).json(result.payload);
  }
});

app.all("*", (_req, res) => {
  const result = error("Endpoint not found", 404, "NOT_FOUND");
  res.status(result.status).json(result.payload);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Moataz AI Backend running on 0.0.0.0:${port}`);
});
