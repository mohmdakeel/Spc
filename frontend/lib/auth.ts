// lib/auth.ts
import api from './api';

export async function login(body: { username: string; password: string }) {
  await api.post('/auth/login', body);
}

export async function me() {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
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
  }
}

export async function changePassword(body: { oldPassword: string; newPassword: string }) {
  await api.post('/auth/change-password', body);
}
