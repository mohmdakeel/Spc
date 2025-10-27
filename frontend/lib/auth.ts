// lib/auth.ts
import api from './api';

export async function login(body: { username: string; password: string }) {
  const response = await api.post('/auth/login', body);
  return response.data;
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  const response = await api.post('/auth/logout');
  return response.data;
}

export async function changePassword(body: { oldPassword: string; newPassword: string }) {
  const response = await api.post('/auth/change-password', body);
  return response.data;
}
