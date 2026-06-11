import { API_BASE_URL } from '../config/apiBase';
import { authHeader } from './authService';

const apiBaseUrl = API_BASE_URL;

export type ReturnRequest = {
  id: string;
  orderId: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  reason: string | null;
  requestedAt: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...authHeader(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, unknown>).message ?? `Request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return res.json() as Promise<T>;
}

export async function getMyReturns(): Promise<ReturnRequest[]> {
  return request<ReturnRequest[]>('/returns/me');
}

export async function requestReturn(
  orderId: string,
  itemId: string,
  reason?: string,
): Promise<ReturnRequest> {
  return request<ReturnRequest>(`/returns/orders/${orderId}/items/${itemId}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function listAdminReturns(status?: string): Promise<ReturnRequest[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  return request<ReturnRequest[]>(`/admin/returns${params}`);
}

export async function approveReturn(returnId: string): Promise<ReturnRequest> {
  return request<ReturnRequest>(`/admin/returns/${returnId}/approve`, { method: 'PATCH' });
}

export async function rejectReturn(returnId: string): Promise<ReturnRequest> {
  return request<ReturnRequest>(`/admin/returns/${returnId}/reject`, { method: 'PATCH' });
}
