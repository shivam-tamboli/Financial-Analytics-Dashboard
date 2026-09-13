import { apiClient } from './client';
import type { AuthUser } from '../types';

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function loginRequest(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { username, password });
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

// Takes the token explicitly rather than relying on the request interceptor to
// read it from localStorage: the caller clears localStorage synchronously right
// after firing this off, and axios's interceptors run on the microtask queue —
// by the time they'd run, the token would already be gone.
export async function logoutRequest(token: string): Promise<void> {
  await apiClient.post('/auth/logout', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
