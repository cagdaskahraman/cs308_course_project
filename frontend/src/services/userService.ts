import { API_BASE_URL } from '../config/apiBase';
import { authHeader } from './authService';

const apiBaseUrl = API_BASE_URL;

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  taxId: string | null;
  homeAddress: string | null;
  role: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  taxId?: string;
  homeAddress?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...authHeader(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, unknown>).message ?? `Request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return res.json() as Promise<T>;
}

export async function getMyProfile(): Promise<UserProfile> {
  return request<UserProfile>('/users/me');
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return request<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
