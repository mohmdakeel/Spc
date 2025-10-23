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

// keep your interceptors (X-Actor/X-Role) if you want
export default http;

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
