const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

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

export async function getPendingReviews(): Promise<PendingReview[]> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/reviews?status=pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch pending reviews (${res.status})`);
  return res.json() as Promise<PendingReview[]>;
}

export async function approveReview(reviewId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/reviews/${reviewId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to approve review (${res.status})`);
}

export async function rejectReview(reviewId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${apiBaseUrl}/reviews/${reviewId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to reject review (${res.status})`);
}
