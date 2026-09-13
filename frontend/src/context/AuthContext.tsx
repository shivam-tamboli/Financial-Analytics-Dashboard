import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { loginRequest, logoutRequest } from '../api/auth';
import { extractErrorMessage } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const response = await loginRequest(username, password);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Login failed'));
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Best-effort only: the token is discarded client-side regardless of whether
    // this call succeeds, since that's what actually ends a stateless-JWT session.
    // Captured synchronously and passed explicitly — by the time axios's request
    // interceptor would run (microtask queue), localStorage is already cleared.
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      void logoutRequest(currentToken).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token), isAuthenticating, login, logout }),
    [user, token, isAuthenticating, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
