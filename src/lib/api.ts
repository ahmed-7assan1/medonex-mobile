import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { isGuestMode } from './fixtures';

/** Public API base of the MedOneX website. Not a secret. */
const BASE: string =
  (Constants.expoConfig?.extra?.apiBase as string) ?? 'https://www.medonex.me';

export const API_URL = `${BASE}/api/mobile`;
export const API_V1_URL = `${BASE}/api/v1`;

interface FetchOptions extends RequestInit {
  data?: unknown;
  timeoutMs?: number;
}

export async function authHeaders(custom?: HeadersInit, expectedOwner?: string): Promise<Headers> {
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json', ...(custom as object) });
  try {
    const record=Platform.OS==='web'?globalThis.localStorage?.getItem('authSessionV2'):await SecureStore.getItemAsync('authSessionV2');
    if(expectedOwner&&(!record||JSON.parse(record)?.user?.id!==expectedOwner))throw new Error('Account changed. Open this file again.');
    const token=record?JSON.parse(record)?.token:(Platform.OS === 'web' ? globalThis.localStorage?.getItem('sessionToken') : await SecureStore.getItemAsync('sessionToken'));
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch (error) {
    if(expectedOwner)throw error;
    // SecureStore unavailable (web preview) — proceed unauthenticated.
  }
  return headers;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  if (isGuestMode()) throw new ApiError(403, 'Guest preview is local-only');
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
    // A route the server does not have answers with the website's HTML
    // not-found page and HTTP 200. Treat it as a missing endpoint so screens
    // show their error state instead of crashing while parsing HTML as data.
    if (!isJson) throw new ApiError(404, { error: 'endpoint-missing' });
    return body as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Read-only GET against an absolute website API path (e.g. /api/v1/admin/...),
    used by the local admin console bridge. Never sends a body. */
export async function apiGetAbsolute(path: string, timeoutMs = 12000): Promise<{ status: number; body: string }> {
  if (isGuestMode()) return { status: 403, body: JSON.stringify({ error: 'Guest preview is local-only' }) };
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = await authHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timer);
    return { status: res.status, body: await res.text() };
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
  if (isGuestMode()) throw new ApiError(403, 'Guest preview is local-only');
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
    if (!isJson) throw new ApiError(404, { error: 'endpoint-missing' });
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
