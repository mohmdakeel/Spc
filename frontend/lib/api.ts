// lib/api.ts
import axios from 'axios';

// If you set NEXT_PUBLIC_AUTH_BASE (e.g. http://localhost:8083), we hit it directly.
// Otherwise we call '/aapi' and let Next.js proxy to 8083.
const raw = (process.env.NEXT_PUBLIC_AUTH_BASE || '').replace(/\/$/, '');
const baseURL = raw ? `${raw}/api` : '/aapi';

const api = axios.create({
  baseURL,
  withCredentials: true,                 // ← send/receive SPC_JWT
  headers: { 'Content-Type': 'application/json' },
});

export default api;
