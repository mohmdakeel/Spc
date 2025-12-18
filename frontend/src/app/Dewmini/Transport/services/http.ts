import axios from "axios";

/**
 * If NEXT_PUBLIC_API_BASE is set (e.g. http://localhost:8081),
 * we hit it directly. Otherwise we use '/api' so Next.js
 * rewrites can proxy to your backend (next.config.js).
 */
const rawBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
const baseURL = rawBase ? `${rawBase}/api` : "/api";
const timeoutMs = Math.min(Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10_000, 15_000);

const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: timeoutMs,
});

export default http;

export function unwrapApi<T>(body: any): T {
  if (body && typeof body === "object" && "ok" in body) {
    if ((body as any).ok === false) {
      const msg = (body as any).message || "Request failed";
      throw new Error(msg);
    }
    return (body as any).data as T;
  }
  return body as T;
}
