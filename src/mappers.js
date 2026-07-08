export function toProvider(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    status: row.status || "pending",
    baseUrl: row.base_url || "",
    region: row.region || "global",
    supportedFeatures: row.supported_features || ["chat"],
    latencyMs: Number(row.latency_ms || 0),
    uptimePct: Number(row.uptime_pct ?? 100),
    requestCount: Number(row.request_count || 0),
    errorRate: Number(row.error_rate || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    type: row.type,
    defaultModel: row.default_model,
  };
}

export function toApiKey(row) {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    maskedKey: row.masked_key,
    status: row.status,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    scopes: row.scopes || [],
    usageLimit: row.usage_limit,
    usageCount: Number(row.usage_count || 0),
    createdBy: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toLog(row) {
  return {
    id: row.id,
    timestamp: row.created_at,
    level: row.level || "info",
    providerId: row.provider_id,
    providerName: row.provider_name,
    modelId: row.model_id,
    modelName: row.model_id,
    method: row.method || "POST",
    path: row.path || "/api/playground/chat",
    statusCode: row.status_code || 200,
    durationMs: Number(row.latency_ms || 0),
    tokenCount: Number(row.total_tokens || 0),
    cost: Number(row.cost || 0),
    userId: row.user_id,
    apiKeyId: row.api_key_id,
    message: row.message || "Request completed",
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}
