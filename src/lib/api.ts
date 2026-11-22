import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

/** Public API base of the MedOneX website. Not a secret. */
const BASE: string =
  (Constants.expoConfig?.extra?.apiBase as string) ?? 'https://www.medonex.me';

export const API_URL = `${BASE}/api/mobile`;
export const API_V1_URL = `${BASE}/api/v1`;

interface FetchOptions extends RequestInit {
  data?: unknown;
  timeoutMs?: number;
}

async function authHeaders(custom?: HeadersInit): Promise<Headers> {
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json', ...(custom as object) });
  try {
    const token = await SecureStore.getItemAsync('sessionToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch {
    // SecureStore unavailable (web preview) — proceed unauthenticated.
  }
  return headers;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = await authHeaders(options.headers);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  const config: RequestInit = { ...options, headers, signal: controller.signal };
  if (options.data !== undefined) config.body = JSON.stringify(options.data);
  try {
    const res = await fetch(url, config);
    clearTimeout(timer);
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API ${status}`);
  }
}

export const api = {
  get: <T>(path: string, o?: FetchOptions) => apiFetch<T>(path, { ...o, method: 'GET' }),
  post: <T>(path: string, data?: unknown, o?: FetchOptions) => apiFetch<T>(path, { ...o, method: 'POST', data }),
};

async function apiV1Fetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_V1_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = await authHeaders(options.headers);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  const config: RequestInit = { ...options, headers, signal: controller.signal };
  if (options.data !== undefined) config.body = JSON.stringify(options.data);
  try {
    const res = await fetch(url, config);
    clearTimeout(timer);
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export const apiV1 = {
  get: <T>(path: string, o?: FetchOptions) => apiV1Fetch<T>(path, { ...o, method: 'GET' }),
  post: <T>(path: string, data?: unknown, o?: FetchOptions) => apiV1Fetch<T>(path, { ...o, method: 'POST', data }),
};
