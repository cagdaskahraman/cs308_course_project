import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

const TOKEN_KEY = 'token';
const USER_KEY = 'authUser';

export type AuthUser = {
  id: string;
  email: string;
  role: 'customer' | 'product_manager' | 'admin';
};

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error('Invalid response from server');
  }

  if (!response.ok) {
    const err = data as { message?: string | string[] };
    let errorMessage = `Request failed with status ${response.status}`;
    if (Array.isArray(err.message)) {
      errorMessage = err.message.join(', ');
    } else if (typeof err.message === 'string') {
      errorMessage = err.message;
    }
    throw new Error(errorMessage);
  }

  return data as T;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await postJson('/auth/register', payload);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return postJson<LoginResponse>('/auth/login', payload);
}

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isAuthFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('invalid or expired token') ||
    msg.includes('missing authorization header') ||
    msg.includes('request failed (401)') ||
    msg.includes('not authenticated')
  );
}
