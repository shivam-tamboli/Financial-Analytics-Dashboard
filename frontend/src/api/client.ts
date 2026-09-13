import axios from 'axios';

// No hardcoded fallback, on purpose — same pattern as the backend's
// MONGO_URI/JWT_SECRET: a forgotten env var should fail loudly at startup,
// not silently point at whatever localhost happens to be running.
if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error('Missing required environment variable: VITE_API_BASE_URL');
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error?.config?.url?.includes('/auth/login');
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === 'string') return message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
