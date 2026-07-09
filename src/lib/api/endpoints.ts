/**
 * API Endpoints — typed API layer wrapping the built-in Next.js API routes.
 */

import { apiClient } from "./client";
import type {
  Provider,
  Model,
  ApiKey,
  UsageSummary,
  LogEntry,
  HealthCheck,
  ValidationResult,
  TeamMember,
  Role,
  Permission,
  AuditLog,
  AppNotification,
  Invoice,
  BillingPlan,
  PaymentMethod,
  DocSection,
  Paginated,
} from "@/types";

// ============ Providers ============
export const providersApi = {
  list: () => apiClient.get<Provider[]>("/api/providers"),
  get: (id: string) => apiClient.get<Provider>(`/api/providers/${id}`),
  create: (data: Partial<Provider> & { apiKey?: string; defaultModel?: string }) => apiClient.post<Provider>("/api/providers", data),
  update: (id: string, data: Partial<Provider> & { apiKey?: string; defaultModel?: string }) => apiClient.patch<Provider>(`/api/providers/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/api/providers/${id}`),
  testConnection: (id: string) => apiClient.post<{ success: boolean; latencyMs: number }>(`/api/providers/${id}/test-connection`),
};

// ============ Models ============
export const modelsApi = {
  list: (providerId?: string) =>
    apiClient.get<Model[]>("/api/litellm/models", providerId ? { params: { providerId } } : undefined),
};

// ============ API Keys ============
export const apiKeysApi = {
  list: () => apiClient.get<ApiKey[]>("/api/api-keys"),
  create: (data: Partial<ApiKey>) => apiClient.post<ApiKey & { newKey?: string; key?: string }>("/api/api-keys", data),
  rotate: (id: string) => apiClient.post<{ id: string; newKey: string }>(`/api/api-keys/${id}/rotate`),
  revoke: (id: string) => apiClient.post<{ success: boolean }>(`/api/api-keys/${id}/revoke`),
};

// ============ Usage ============
export const usageApi = {
  summary: (range = "30d") => apiClient.get<UsageSummary>("/api/usage/summary", { params: { range } }),
  byProvider: (range = "30d") => apiClient.get("/api/usage/by-provider", { params: { range } }),
  byModel: (range = "30d") => apiClient.get("/api/usage/by-model", { params: { range } }),
  trend: (days = 30) => apiClient.get("/api/usage/trend", { params: { days } }),
};

// ============ Logs ============
export const logsApi = {
  list: (params?: { level?: string; providerId?: string; page?: number; pageSize?: number }) =>
    apiClient.get<Paginated<LogEntry>>("/api/providers/logs", { params }),
};

// ============ Health ============
export const healthApi = {
  list: () => apiClient.get<HealthCheck[]>("/api/providers/health"),
  runDiagnostic: (providerId: string) =>
    apiClient.post<{ providerId: string; status: string; latencyMs: number }>("/api/providers/health-check", { providerName: providerId }),
};

// ============ Validation ============
export const validationApi = {
  list: () => apiClient.get<ValidationResult[]>("/api/providers/validation-history"),
  run: (providerId: string, modelId: string, apiKey?: string) =>
    apiClient.post<{ id: string; status: string; message: string }>("/api/providers/validate-key", { providerName: providerId, modelToTest: modelId, apiKey }),
};

// ============ Playground ============
export const playgroundApi = {
  chat: (data: {
    providerId: string;
    modelId: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }) => apiClient.post<{ content: string; usage?: unknown; model: string; provider: string; latencyMs: number }>("/api/playground/chat", data, { timeout: 90_000 }),
};

// ============ Team ============
export const teamApi = {
  list: () => apiClient.get<TeamMember[]>("/api/users"),
  invite: (data: { email: string; roleId: string; name?: string }) => apiClient.post<TeamMember>("/api/users", data),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/users/${id}`),
};

// ============ Roles ============
export const rolesApi = {
  list: () => apiClient.get<Role[]>("/api/roles"),
  create: (data: Partial<Role>) => apiClient.post<Role>("/api/roles", data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/api/roles/${id}`),
};

// ============ Permissions ============
export const permissionsApi = {
  list: () => apiClient.get<Permission[]>("/api/permissions"),
};

// ============ Audit ============
export const auditApi = {
  list: (params?: { page?: number; pageSize?: number }) => apiClient.get<Paginated<AuditLog>>("/api/audit-logs", { params }),
};

// ============ Notifications ============
export const notificationsApi = {
  list: () => apiClient.get<AppNotification[]>("/api/notifications"),
  markRead: (id: string) => apiClient.post<{ success: boolean }>(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.post<{ success: boolean }>("/api/notifications/read/all"),
};

// ============ Billing ============
export const billingApi = {
  plans: () => apiClient.get<BillingPlan[]>("/api/billing/plans"),
  invoices: () => apiClient.get<Invoice[]>("/api/billing/invoices"),
  paymentMethods: () => apiClient.get<PaymentMethod[]>("/api/billing/payments"),
  currentUsage: () => apiClient.get<UsageSummary>("/api/usage/summary"),
};

// ============ Documentation ============
export const docsApi = {
  list: (category?: string) => apiClient.get<DocSection[]>("/api/docs", category ? { params: { category } } : undefined),
};

// ============ Integrations ============
export const integrationsApi = {
  telegramStatus: () => apiClient.get<Array<{
    id: string;
    bot_username?: string;
    botUsername?: string;
    status: string;
    default_provider_id?: string;
    default_model?: string;
    webhook_url?: string;
    created_at?: string;
  }>>("/api/integrations/telegram/status"),
  connectTelegram: (data: { botToken: string; defaultProviderId: string; defaultModel: string; setWebhook?: boolean }) =>
    apiClient.post<{ id: string; botUsername: string; status: string; webhookUrl?: string }>("/api/integrations/telegram/connect", data),
};

// ============ Repositories ============
export const repositoriesApi = {
  list: () => apiClient.get<Array<{
    id: string;
    name: string;
    provider: string;
    owner: string;
    repo: string;
    default_branch?: string;
    status: string;
    created_at?: string;
  }>>("/api/repositories"),
  connect: (data: { token: string; owner: string; repo: string; name?: string }) =>
    apiClient.post<{ id: string; name: string; owner: string; repo: string; status: string }>("/api/repositories/connect", data),
  readFile: (id: string, data: { path: string; ref?: string }) =>
    apiClient.post<{ path: string; ref: string; sha: string; content: string }>(`/api/repositories/${id}/files/read`, data),
  writeFile: (id: string, data: { path: string; content: string; message?: string; branch?: string; sha?: string }) =>
    apiClient.post(`/api/repositories/${id}/files/write`, data),
};


// ============ Provider Presets ============
export const providerPresetsApi = {
  list: () => apiClient.get<Array<{
    name: string;
    type: string;
    baseUrl: string;
    defaultModel: string;
    features: string[];
    models: string[];
    adapter: string;
  }>>("/api/provider-presets"),
};

// ============ Agent / Tools ============
export const toolsApi = {
  browse: (data: { url: string }) => apiClient.post<{ url: string; title: string; contentType: string; text: string; fetchedAt: string }>("/api/tools/browser", data, { timeout: 45_000 }),
};

export const agentApi = {
  run: (data: {
    providerId: string;
    modelId: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    tools?: {
      browserUrl?: string;
      repositoryId?: string;
      repositoryPath?: string;
      repositoryRef?: string;
      codeDraft?: string;
      mode?: "chat" | "agent" | "code" | "research";
    };
  }) => apiClient.post<{ content: string; usage?: unknown; model: string; provider: string; latencyMs: number; toolContextCount?: number }>("/api/agent/run", data, { timeout: 120_000 }),
};
