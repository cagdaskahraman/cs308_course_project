import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/authService';

type UserInfo = { id: string; email: string; role: string };

type AuthContextValue = {
  token: string | null;
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseTokenPayload(token: string): UserInfo | null {
  try {
    const base64 = token.split('.')[1];
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    return {
      id: String(payload.sub ?? payload.id ?? ''),
      email: String(payload.email ?? ''),
      role: String(payload.role ?? 'customer'),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserInfo | null>(() => {
    const t = localStorage.getItem('token');
    return t ? parseTokenPayload(t) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setUser(parseTokenPayload(token));
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    setToken(res.token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
