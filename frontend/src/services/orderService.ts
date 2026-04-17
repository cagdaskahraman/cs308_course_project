import { authHeader } from './authService';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

export type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: { id: string; name: string; imageUrl: string };
};

export type Order = {
  id: string;
  orderDate: string;
  totalPrice: number;
  status: string;
  items: OrderItem[];
};

export type CheckoutPayload = {
  cartId?: string;
  items: { productId: string; quantity: number }[];
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

export async function checkout(payload: CheckoutPayload): Promise<Order> {
  return request<Order>(`${apiBaseUrl}/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
}

export async function getOrder(orderId: string): Promise<Order> {
  return request<Order>(`${apiBaseUrl}/orders/${orderId}`);
}
