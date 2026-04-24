import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

export type AdminDirectoryUser = {
  id: string;
  email: string;
  role: 'customer' | 'product_manager' | 'admin';
  createdAt: string;
};

function getToken(): string {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (Array.isArray(body.message)) return body.message.map(String).join(', ');
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
  } catch {
    // ignore
  }
  if (res.status === 401) return 'Session expired. Please log in again.';
  if (res.status === 403) return 'Administrator access required.';
  return `${fallback} (${res.status})`;
}

export async function listAdminUsers(): Promise<AdminDirectoryUser[]> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load users'));
  return res.json() as Promise<AdminDirectoryUser[]>;
}

export async function setUserRole(
  userId: string,
  role: AdminDirectoryUser['role'],
): Promise<AdminDirectoryUser> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to update role'));
  return res.json() as Promise<AdminDirectoryUser>;
}
