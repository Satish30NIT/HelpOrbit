import { clearSession, getToken } from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RequestOpts = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean; // include Bearer token if available (default: true)
};

export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...rest }: RequestOpts = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
        ? body
        : JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // non-JSON response; leave json as null
    }
  }

  if (!res.ok) {
    const payload = (json || {}) as {
      message?: string;
      details?: unknown;
    };
    if (res.status === 401) clearSession();
    throw new ApiError(
      res.status,
      payload.message || `Request failed (${res.status})`,
      payload.details
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOpts) =>
    apiFetch<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    apiFetch<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    apiFetch<T>(path, { ...opts, method: "PUT", body }),
  del: <T>(path: string, opts?: RequestOpts) =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};
