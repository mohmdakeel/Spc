// lib/api.ts
import axios, { type AxiosResponse } from 'axios';

/**
 * DEV mode:
 *   - We call /aapi/... from the browser
 *   - next.config.js rewrites /aapi -> http://localhost:8083/api
 *
 * PROD mode:
 *   - You can set NEXT_PUBLIC_AUTH_BASE=https://auth.company.com
 *   - Then we'll hit that directly instead of /aapi
 */
const rawBase = (process.env.NEXT_PUBLIC_AUTH_BASE || '').replace(/\/$/, '');
const baseURL = rawBase ? `${rawBase}/api` : '/aapi';

// Keep API calls responsive (default 10s; clamp env override to 15s max)
const timeoutMs = Math.min(Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10_000, 15_000);

const api = axios.create({
  baseURL,
  withCredentials: true, // <-- send SPC_JWT cookie to backend
  headers: { 'Content-Type': 'application/json' },
  timeout: timeoutMs,
});

// Request interceptor (optional hook point)
api.interceptors.request.use(
  (config) => {
    // You could manually attach Authorization header here if you ever want:
    // const token = window.localStorage.getItem('jwt');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

    const isEnvelope = (value: unknown): value is ApiEnvelope<unknown> => {
      return Boolean(
        value &&
        typeof value === 'object' &&
        'ok' in value
      );
    };

    const payload = response.data;
    if (isEnvelope(payload)) {
      if (payload.ok) {
        response.data = Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data ?? null : null;
        return response;
      }

      const err = new Error(payload.message || 'Request failed') as Error & {
        response?: { status: number; data: unknown };
      };
      err.response = { status: response.status, data: payload };
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const code = error.code;
    const message = (error?.message || '').toLowerCase();

    // Unauthenticated → bounce to login quickly
    if (status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }

      // Resolve with a benign response so callers don’t throw a runtime error
      const safeResponse: AxiosResponse = {
        status: status ?? 0,
        statusText: 'Unauthorized',
        data: null,
        headers: error.response?.headers ?? {},
        config: error.config,
        request: error.request,
      };
      return Promise.resolve(safeResponse);
    }

    // Forbidden → bounce to login to avoid getting stuck on 403 page
    if (status === 403) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Timeouts / network hiccups → return a benign response so UI can stay responsive
    if (code === 'ECONNABORTED' || message.includes('timeout')) {
      console.warn('API timeout – returning empty response to keep UI responsive');
      const safeResponse: AxiosResponse = {
        status: status ?? 0,
        statusText: 'Request Timeout',
        data: null,
        headers: error.response?.headers ?? {},
        config: error.config,
        request: error.request,
      };
      return Promise.resolve(safeResponse);
    }

    return Promise.reject(error);
  }
);

export default api;
