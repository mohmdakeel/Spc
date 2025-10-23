// lib/auth.ts
import api from './api';

export async function login(body: { username: string; password: string }) {
  await api.post('/auth/login', body);   // sets JWT cookie
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}
