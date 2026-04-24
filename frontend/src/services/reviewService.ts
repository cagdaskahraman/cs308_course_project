import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

async function messageFromFailedResponse(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    const { message } = body;
    if (Array.isArray(message)) return message.map(String).join(' ');
    if (typeof message === 'string' && message.trim()) return message.trim();
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'You must be logged in. Sign in again if your session expired.';
  if (res.status === 403) return 'You are not allowed to perform this action.';
  if (res.status === 404) return 'The requested resource was not found.';
  return `Request failed (${res.status}).`;
}

export type Review = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type CreateReviewPayload = {
  productId: string;
  rating: number;
  comment: string;
};

export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const res = await fetch(`${apiBaseUrl}/reviews/product/${productId}?status=approved`);
  if (!res.ok) throw new Error(await messageFromFailedResponse(res));
  return res.json() as Promise<Review[]>;
}

export async function submitReview(payload: CreateReviewPayload, token: string): Promise<Review> {
  const res = await fetch(`${apiBaseUrl}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await messageFromFailedResponse(res));
  return res.json() as Promise<Review>;
}
