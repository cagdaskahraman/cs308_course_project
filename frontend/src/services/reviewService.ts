const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

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
  if (!res.ok) throw new Error(`Failed to fetch reviews (${res.status})`);
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
  if (!res.ok) throw new Error(`Failed to submit review (${res.status})`);
  return res.json() as Promise<Review>;
}
