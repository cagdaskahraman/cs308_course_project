import type { Product } from '../types/product';

import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

const CART_STORAGE_KEY = 'electrostore_cart_id';

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  createdAt: string;
  items: CartItem[];
};

export type CartResponse = {
  cart: Cart;
  totalPrice: number;
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

export function getSavedCartId(): string | null {
  return localStorage.getItem(CART_STORAGE_KEY);
}

export function saveCartId(id: string): void {
  localStorage.setItem(CART_STORAGE_KEY, id);
}

export async function createCart(): Promise<Cart> {
  const cart = await request<Cart>(`${apiBaseUrl}/cart`, { method: 'POST' });
  saveCartId(cart.id);
  return cart;
}

export async function getOrCreateCartId(): Promise<string> {
  const existing = getSavedCartId();
  if (existing) return existing;
  const cart = await createCart();
  return cart.id;
}

export async function getCart(cartId: string): Promise<CartResponse> {
  return request<CartResponse>(`${apiBaseUrl}/cart/${cartId}`);
}

export async function addCartItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
  return request<Cart>(`${apiBaseUrl}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId, productId, quantity }),
  });
}

export async function updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart> {
  return request<Cart>(`${apiBaseUrl}/cart/${cartId}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(cartId: string, itemId: string): Promise<CartResponse> {
  return request<CartResponse>(`${apiBaseUrl}/cart/${cartId}/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function mergeGuestCartWithUser(
  token: string,
  guestCartId?: string | null,
): Promise<CartResponse> {
  const response = await request<CartResponse>(`${apiBaseUrl}/cart/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(guestCartId ? { guestCartId } : {}),
  });
  saveCartId(response.cart.id);
  return response;
}

export function clearSavedCartId(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
}
