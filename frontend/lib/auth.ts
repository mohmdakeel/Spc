// lib/auth.ts
import api from './api';

export async function login(body: { username: string; password: string }) {
  await api.post('/auth/login', body);
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function changePassword(body: { oldPassword: string; newPassword: string }) {
  await api.post('/auth/change-password', body);
}
