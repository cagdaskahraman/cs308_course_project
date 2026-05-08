import { authHeader } from './authService';

import { API_BASE_URL } from '../config/apiBase';

const apiBaseUrl = API_BASE_URL;

export type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  status: 'processing' | 'in-transit' | 'delivered';
  product: { id: string; name: string; imageUrl: string };
};

export type Order = {
  id: string;
  orderDate: string;
  totalPrice: number;
  status: string;
  userId?: string | null;
  deliveryAddress?: string | null;
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
  deliveryAddress?: string;
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
  taxId: string | null;
  billingAddress: string;
  cardLast4: string;
  authorizationReference: string;
  items: InvoiceLineItem[];
  subtotal: number;
  total: number;
  issuedAt: string;
};

export type InvoiceMailDispatch = {
  to: string;
  subject: string;
  body: string;
  attachmentName: string;
  attachmentSize: number;
  messageId?: string;
  smtpResponse?: string;
  accepted?: string[];
  rejected?: string[];
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

export async function getAllOrdersForStaff(): Promise<Order[]> {
  return request<Order[]>(`${apiBaseUrl}/orders`, {
    headers: { ...authHeader() },
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: 'processing' | 'in-transit' | 'delivered' | 'cancelled',
): Promise<Order> {
  return request<Order>(`${apiBaseUrl}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ status }),
  });
}

export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  status: 'processing' | 'in-transit' | 'delivered',
): Promise<Order> {
  return request<Order>(`${apiBaseUrl}/orders/${orderId}/items/${itemId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ status }),
  });
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice> {
  return request<Invoice>(`${apiBaseUrl}/orders/${orderId}/invoice`, {
    headers: { ...authHeader() },
  });
}

export async function getInvoiceMailDispatchByOrderId(
  orderId: string,
): Promise<InvoiceMailDispatch> {
  return request<InvoiceMailDispatch>(`${apiBaseUrl}/orders/${orderId}/invoice-mail`, {
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
