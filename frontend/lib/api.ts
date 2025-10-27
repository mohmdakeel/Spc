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
  timeout: 10000,
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
  (response) => response,
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
