import { authHeader } from './authService';

import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

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
  userId?: string | null;
  items: OrderItem[];
};

export type PaymentDetails = {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

export type CheckoutPayload = {
  cartId?: string;
  items: { productId: string; quantity: number }[];
  payment: PaymentDetails;
  billingEmail?: string;
};

export type InvoiceLineItem = {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  billingEmail: string;
  billingName: string;
  cardLast4: string;
  authorizationReference: string;
  items: InvoiceLineItem[];
  subtotal: number;
  total: number;
  issuedAt: string;
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
  return request<Order>(`${apiBaseUrl}/orders/${orderId}`, {
    headers: { ...authHeader() },
  });
}

export async function getMyOrders(): Promise<Order[]> {
  return request<Order[]>(`${apiBaseUrl}/orders/me`, {
    headers: { ...authHeader() },
  });
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice> {
  return request<Invoice>(`${apiBaseUrl}/orders/${orderId}/invoice`, {
    headers: { ...authHeader() },
  });
}

export function getInvoicePdfUrl(orderId: string): string {
  return `${apiBaseUrl}/orders/${orderId}/invoice.pdf`;
}

export async function downloadInvoicePdf(orderId: string): Promise<Blob> {
  const res = await fetch(getInvoicePdfUrl(orderId), {
    headers: { ...authHeader() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, unknown>).message ?? `Request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return res.blob();
}
