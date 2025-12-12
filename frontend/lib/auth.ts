// lib/auth.ts
import api from './api';
import { writeCache } from './cache';

const AUTH_CACHE_KEYS = [
  'auth:user-cache',
  'cache:auth:roles',
  'cache:auth:perms',
  'cache:auth:users',
];

export function clearAuthCaches() {
  if (typeof window === 'undefined') return;
  try {
    AUTH_CACHE_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    /* ignore cache clear failures */
  }
}

export async function login(body: { username: string; password: string }) {
  clearAuthCaches();
  await api.post('/auth/login', body);
}

// Preload common auth data so first navigation after login feels instant.
// Fire and forget; failures are harmless and will be re-fetched on demand.
export async function prewarmAuthCaches() {
  if (typeof window === 'undefined') return;

  const mapUsers = (list: any[]) =>
    list.map((u: any) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      roles: Array.isArray(u.roles) ? u.roles : [],
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
    }));

  const tasks = [
    api
      .get('/registrations', { timeout: 8000 })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        writeCache('cache:auth:employees', rows);
        writeCache('cache:auth:employees:list', rows);
        writeCache('cache:auth:reports:employees', rows);
      })
      .catch(() => {}),
    api
      .get('/users', { timeout: 8000 })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        writeCache('cache:auth:users', mapUsers(rows));
        writeCache('cache:auth:users:list', rows);
      })
      .catch(() => {}),
    api
      .get('/roles', { timeout: 8000 })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        writeCache('cache:auth:roles', rows);
        writeCache('cache:auth:roles:list', rows);
      })
      .catch(() => {}),
    api
      .get('/roles/permissions', { timeout: 8000 })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        writeCache('cache:auth:perms', rows);
      })
      .catch(() => {}),
  ];

  await Promise.allSettled(tasks);
}

export async function me() {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err: any) {
    const code = err?.code;
    const message = (err?.message || '').toLowerCase();
    const status = err?.response?.status;

    // Gracefully treat timeouts / network failures as "no session" instead of crashing
    if (
      code === 'ECONNABORTED' ||
      message.includes('timeout') ||
      message.includes('network error')
    ) {
      return null;
    }

    // Treat unauthorized/forbidden as "no active session" instead of hard error
    if (status === 401 || status === 403) {
      return null;
    }
    throw err;
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (err: any) {
    const status = err?.response?.status;
    // If session is already invalid/expired, treat as logged out.
    if (status === 401 || status === 403) return;
    throw err;
  } finally {
    clearAuthCaches();
  }
}

export async function changePassword(body: { oldPassword: string; newPassword: string }) {
  await api.post('/auth/change-password', body);
}
