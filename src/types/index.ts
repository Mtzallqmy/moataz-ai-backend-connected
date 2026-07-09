// Core domain types for the AI Gateway platform

export type ID = string;

export type Locale = "en" | "ar";

export type ThemeMode = "light" | "dark" | "system";

export type Direction = "ltr" | "rtl";

export type Status = "active" | "inactive" | "pending" | "error" | "suspended";

export type HealthStatus = "healthy" | "degraded" | "down" | "maintenance";

export type Severity = "info" | "warning" | "error" | "critical";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface User extends Timestamps {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  status: Status;
  lastActiveAt?: string;
}

export interface Provider extends Timestamps {
  id: ID;
  name: string;
  slug: string;
  type?: string;
  description: string;
  logoUrl?: string;
  status: Status;
  baseUrl: string;
  defaultModel?: string;
  region: string;
  supportedFeatures: string[];
  latencyMs: number;
  uptimePct: number;
  requestCount: number;
  errorRate: number;
}

export interface Model extends Timestamps {
  id: ID;
  providerId: ID;
  providerName: string;
  name: string;
  slug: string;
  description: string;
  contextWindow: number;
  maxOutput: number;
  inputPricePer1k: number;
  outputPricePer1k: number;
  capabilities: string[];
  modalities: string[];
  status: Status;
  benchmarkScore?: number;
}

export interface ApiKey extends Timestamps {
  id: ID;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  status: Status;
  lastUsedAt?: string;
  expiresAt?: string;
  scopes: string[];
  usageLimit?: number;
  usageCount: number;
  createdBy: string;
}

export interface UsageRecord {
  date: string;
  providerId: ID;
  providerName: string;
  modelId: ID;
  modelName: string;
  requestCount: number;
  tokenCount: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  avgLatencyMs: number;
  errorCount: number;
}

export interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  errorRate: number;
  changePct: {
    requests: number;
    tokens: number;
    cost: number;
    latency: number;
  };
  topProviders: Array<{
    providerId: ID;
    providerName: string;
    requestCount: number;
    cost: number;
    pct: number;
  }>;
  topModels: Array<{
    modelId: ID;
    modelName: string;
    providerName: string;
    requestCount: number;
    tokenCount: number;
    cost: number;
  }>;
  dailyTrend: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
    errors: number;
  }>;
}

export interface LogEntry extends Timestamps {
  id: ID;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  providerId?: ID;
  providerName?: string;
  modelId?: ID;
  modelName?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  tokenCount?: number;
  cost?: number;
  userId?: ID;
  apiKeyId?: ID;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface HealthCheck {
  id: ID;
  providerId: ID;
  providerName: string;
  status: HealthStatus;
  latencyMs: number;
  lastCheckedAt: string;
  uptimePct: number;
  incidents: number;
  region: string;
  details: {
    connectivity: boolean;
    authentication: boolean;
    rateLimit: number;
    quotaRemaining: number;
  };
}

export interface ValidationResult {
  id: ID;
  providerId: ID;
  providerName: string;
  modelId: ID;
  modelName: string;
  testName: string;
  status: "pass" | "fail" | "skipped" | "running";
  durationMs: number;
  score?: number;
  message: string;
  checkedAt: string;
  category: string;
}

export interface TeamMember extends Timestamps {
  id: ID;
  userId: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  roleId: ID;
  status: Status;
  lastActiveAt?: string;
  permissions: string[];
}

export interface Role extends Timestamps {
  id: ID;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
  color?: string;
}

export interface Permission {
  id: ID;
  name: string;
  description: string;
  group: string;
  resource: string;
  actions: string[];
}

export interface AuditLog extends Timestamps {
  id: ID;
  timestamp: string;
  actorId: ID;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: ID;
  resourceName: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure";
  metadata?: Record<string, unknown>;
}

export interface AppNotification extends Timestamps {
  id: ID;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface Invoice extends Timestamps {
  id: ID;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "draft";
  plan: string;
  period: string;
  pdfUrl?: string;
}

export interface BillingPlan {
  id: ID;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  limits: {
    requestsPerMonth: number;
    tokensPerMonth: number;
    providers: number;
    teamMembers: number;
  };
  isCurrent?: boolean;
  isPopular?: boolean;
}

export interface PaymentMethod {
  id: ID;
  type: "card" | "bank" | "wallet";
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface DocSection {
  id: ID;
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
  order: number;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  changePct?: number;
  trend?: "up" | "down" | "neutral";
  icon: string;
  description?: string;
}

export interface ChartSeries {
  name: string;
  data: Array<{ x: string | number; y: number }>;
  color?: string;
}
