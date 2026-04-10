const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, unknown>).message ?? `Request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}
