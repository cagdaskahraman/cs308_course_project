import { API_BASE_URL } from '../config/apiBase';
import { authHeader } from './authService';
import type { Product } from '../types/product';

const apiBaseUrl = API_BASE_URL;

async function request<T>(path: string, init?: RequestInit, fallback = 'Request failed'): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...authHeader(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(fallback);
  }
  return res.json() as Promise<T>;
}

export async function listWishlist(): Promise<Product[]> {
  return request<Product[]>('/wishlist', undefined, 'Failed to load wishlist');
}

export async function addToWishlist(productId: string): Promise<Product[]> {
  return request<Product[]>(
    `/wishlist/${productId}`,
    { method: 'POST' },
    'Failed to add to wishlist',
  );
}

export async function removeFromWishlist(productId: string): Promise<Product[]> {
  return request<Product[]>(
    `/wishlist/${productId}`,
    { method: 'DELETE' },
    'Failed to remove from wishlist',
  );
}
