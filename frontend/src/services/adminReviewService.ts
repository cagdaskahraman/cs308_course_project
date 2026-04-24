import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

export type PendingReview = {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
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
  if (res.status === 403) return 'You do not have permission to moderate reviews.';
  return `${fallback} (${res.status})`;
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/reviews?status=pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to fetch pending reviews'));
  return res.json() as Promise<PendingReview[]>;
}

export async function approveReview(reviewId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/reviews/${reviewId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to approve review'));
}

export async function rejectReview(reviewId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/reviews/${reviewId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to reject review'));
}
