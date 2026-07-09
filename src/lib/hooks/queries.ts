import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  providersApi,
  modelsApi,
  apiKeysApi,
  usageApi,
  logsApi,
  healthApi,
  validationApi,
  teamApi,
  rolesApi,
  permissionsApi,
  auditApi,
  notificationsApi,
  billingApi,
  docsApi,
} from "@/lib/api/endpoints";

export const queryKeys = {
  providers: ["providers"] as const,
  provider: (id: string) => ["providers", id] as const,
  models: ["models"] as const,
  modelsByProvider: (id: string) => ["models", "provider", id] as const,
  apiKeys: ["api-keys"] as const,
  usage: (range: string) => ["usage", range] as const,
  usageTrend: (days: number) => ["usage", "trend", days] as const,
  logs: (params?: Record<string, unknown>) => ["logs", params] as const,
  health: ["health"] as const,
  healthByProvider: (id: string) => ["health", id] as const,
  validation: ["validation"] as const,
  team: ["team"] as const,
  roles: ["roles"] as const,
  permissions: ["permissions"] as const,
  audit: (params?: Record<string, unknown>) => ["audit", params] as const,
  notifications: ["notifications"] as const,
  billingPlans: ["billing", "plans"] as const,
  invoices: ["billing", "invoices"] as const,
  paymentMethods: ["billing", "payment-methods"] as const,
  currentUsage: ["billing", "current-usage"] as const,
  docs: (category?: string) => ["docs", category] as const,
  doc: (slug: string) => ["docs", "slug", slug] as const,
};

// ============ Providers ============
export function useProviders() {
  return useQuery({ queryKey: queryKeys.providers, queryFn: () => providersApi.list() });
}

export function useProvider(id: string) {
  return useQuery({ queryKey: queryKeys.provider(id), queryFn: () => providersApi.get(id), enabled: !!id });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof providersApi.create>[0]) => providersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers }),
  });
}

export function useTestProviderConnection() {
  return useMutation({ mutationFn: (id: string) => providersApi.testConnection(id) });
}

// ============ Models ============
export function useModels(providerId?: string) {
  return useQuery({
    queryKey: providerId ? queryKeys.modelsByProvider(providerId) : queryKeys.models,
    queryFn: () => modelsApi.list(providerId),
  });
}

// ============ API Keys ============
export function useApiKeys() {
  return useQuery({ queryKey: queryKeys.apiKeys, queryFn: () => apiKeysApi.list() });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof apiKeysApi.create>[0]) => apiKeysApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.apiKeys }),
  });
}

export function useRotateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.rotate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.apiKeys }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.apiKeys }),
  });
}

// ============ Usage ============
export function useUsageSummary(range = "30d") {
  return useQuery({ queryKey: queryKeys.usage(range), queryFn: () => usageApi.summary(range) });
}

export function useUsageTrend(days = 30) {
  return useQuery({ queryKey: queryKeys.usageTrend(days), queryFn: () => usageApi.trend(days) });
}

// ============ Logs ============
export function useLogs(params?: { level?: string; providerId?: string; page?: number; pageSize?: number }) {
  return useQuery({ queryKey: queryKeys.logs(params), queryFn: () => logsApi.list(params) });
}

// ============ Health ============
export function useHealth() {
  return useQuery({ queryKey: queryKeys.health, queryFn: () => healthApi.list() });
}

export function useRunDiagnostic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => healthApi.runDiagnostic(providerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.health }),
  });
}

// ============ Validation ============
export function useValidation() {
  return useQuery({ queryKey: queryKeys.validation, queryFn: () => validationApi.list() });
}

export function useRunValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, modelId }: { providerId: string; modelId: string }) => validationApi.run(providerId, modelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.validation }),
  });
}

// ============ Team ============
export function useTeam() {
  return useQuery({ queryKey: queryKeys.team, queryFn: () => teamApi.list() });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof teamApi.invite>[0]) => teamApi.invite(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.team }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.team }),
  });
}

// ============ Roles ============
export function useRoles() {
  return useQuery({ queryKey: queryKeys.roles, queryFn: () => rolesApi.list() });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof rolesApi.create>[0]) => rolesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles }),
  });
}

// ============ Permissions ============
export function usePermissions() {
  return useQuery({ queryKey: queryKeys.permissions, queryFn: () => permissionsApi.list() });
}

// ============ Audit ============
export function useAuditLogs(params?: { actorId?: string; action?: string; page?: number; pageSize?: number }) {
  return useQuery({ queryKey: queryKeys.audit(params), queryFn: () => auditApi.list(params) });
}

// ============ Notifications ============
export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: () => notificationsApi.list() });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

// ============ Billing ============
export function useBillingPlans() {
  return useQuery({ queryKey: queryKeys.billingPlans, queryFn: () => billingApi.plans() });
}

export function useInvoices() {
  return useQuery({ queryKey: queryKeys.invoices, queryFn: () => billingApi.invoices() });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: () => billingApi.paymentMethods() });
}

export function useCurrentUsage() {
  return useQuery({ queryKey: queryKeys.currentUsage, queryFn: () => billingApi.currentUsage() });
}

// ============ Docs ============
export function useDocs(category?: string) {
  return useQuery({ queryKey: queryKeys.docs(category), queryFn: () => docsApi.list(category) });
}

export function useDoc(slug: string) {
  return useQuery({ queryKey: queryKeys.doc(slug), queryFn: () => docsApi.list().then(docs => docs.find(d => d.slug === slug)), enabled: !!slug });
}
