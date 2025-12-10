// lib/api.ts
import axios from 'axios';

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

const api = axios.create({
  baseURL,
  withCredentials: true, // <-- send SPC_JWT cookie to backend
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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
    if (error.response?.status === 401) {
      // Token missing / expired -> go to login
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
