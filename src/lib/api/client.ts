/**
 * API Client — Production HTTP client for the NestJS backend.
 *
 * All requests go through this client. It handles:
 *   - Base URL configuration
 *   - JWT authentication (from auth store)
 *   - Request/response typing
 *   - Error normalization
 *   - Timeout handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const DEFAULT_TIMEOUT = 30_000;

export interface RequestOptions {
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  // Construct a fully qualified URL for the API call. When running in
  // a browser context we use `window.location.origin` as the base for
  // relative URLs. In a server context (e.g. during SSR) we fall back
  // to `http://localhost` which resolves correctly when calling from
  // Next.js middleware or server components. We intentionally avoid
  // stripping the protocol/host from the returned URL because doing so
  // results in malformed URLs like ":3001/providers" when deployed on
  // platforms such as Railway. See PR #123 for details.
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path}`,
    typeof window === "undefined" ? "http://localhost" : window.location.origin
  );
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("moataz-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token ?? null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = buildUrl(path, options?.params);
  const token = getAuthToken();
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Merge user-provided signal with our timeout signal
  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "include",
    });

    if (!response.ok) {
      let errorBody: { error?: { code?: string; message?: string; details?: unknown } } | null = null;
      try {
        errorBody = await response.json();
      } catch {
        // Non-JSON error response
      }
      const error = errorBody?.error;
      throw new ApiError(
        response.status,
        error?.code ?? "UNKNOWN_ERROR",
        error?.message ?? `HTTP ${response.status}`,
        error?.details
      );
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;

    const json = await response.json();
    // Backend wraps responses in { success, data, timestamp }
    return json.data ?? json;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(408, "TIMEOUT", "Request timeout");
    }
    throw new ApiError(0, "NETWORK_ERROR", (err as Error).message ?? "Network error");
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, undefined, options),
};
