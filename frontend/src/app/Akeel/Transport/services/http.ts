// src/app/Akeel/Transport/services/http.ts
import axios from 'axios';

/**
 * If NEXT_PUBLIC_TRANSPORT_BASE is set (e.g. http://localhost:8082),
 * we hit it directly. Otherwise use '/tapi' so Next rewrites proxy to 8082.
 */
const raw = (process.env.NEXT_PUBLIC_TRANSPORT_BASE || '').replace(/\/$/, '');
const baseURL = raw ? `${raw}/api` : '/tapi';

const http = axios.create({
  baseURL,
  withCredentials: true,                 // ← ensure SPC_JWT cookie is sent
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

export default http;

// Attach actor/role headers so backend auditing captures who performed the action.
http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const actor =
      localStorage.getItem('username') || // prefer username if stored
      localStorage.getItem('actor') ||
      localStorage.getItem('employeeId') ||
      undefined;
    if (actor) {
      config.headers = config.headers ?? {};
      config.headers['X-Actor'] = actor;
    }

    const role = localStorage.getItem('role') || undefined;
    if (role) {
      config.headers = config.headers ?? {};
      config.headers['X-Role'] = role;
    }
  }
  return config;
});

export function unwrapApi<T>(body: any): T {
  if (body && typeof body === 'object' && 'ok' in body) {
    if ((body as any).ok === false) {
      const msg = (body as any).message || 'Request failed';
      throw new Error(msg);
    }
    return (body as any).data as T;
  }
  return body as T;
}
