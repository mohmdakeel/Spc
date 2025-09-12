// Base URL of your Spring Boot app
export const API_BASE = 'http://localhost:8081';

// Common helpers used by services
export const parseJson = async (r: Response) => {
  const ct = r.headers.get('content-type') || '';
  if (ct.includes('application/json')) return r.json();
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
};

export const throwHttp = async (r: Response, fallback: string) => {
  let msg = fallback;
  try {
    const body = await parseJson(r);
    if (body && typeof body === 'object') {
      // Compatible with your ApiResponse { ok, message, data }
      msg = body.message || body.error || body.title || msg;
      if ('ok' in body && body.ok === false && body.message) msg = body.message;
    }
  } catch {}
  throw new Error(msg);
};

// Unwrap ApiResponse<T> to T, but return the body if it isn't wrapped
export const unwrapApi = <T = any>(body: any): T =>
  body && typeof body === 'object' && 'ok' in body ? (body.data as T) : (body as T);
