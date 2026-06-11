import { API_BASE_URL } from '../config/apiBase';
import { authHeader } from './authService';
import type { Product } from '../types/product';

const apiBaseUrl = API_BASE_URL;

export type PricingProduct = Product & {
  listPrice?: number;
  discountRate?: number;
};

export type RevenueSummary = {
  from: string;
  to: string;
  invoiceCount: number;
  totalRevenue: number;
  averageOrderValue: number;
};

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  billingEmail: string;
  billingName: string;
  total: number;
  issuedAt: string;
};

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
    let message = fallback;
    try {
      const body = (await res.json()) as { message?: unknown };
      if (Array.isArray(body.message)) message = body.message.map(String).join(', ');
      else if (typeof body.message === 'string') message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function listPricingProducts(): Promise<PricingProduct[]> {
  return request<PricingProduct[]>('/admin/pricing/products', undefined, 'Failed to load pricing products');
}

export async function updateProductPricing(
  productId: string,
  payload: { listPrice: number; discountRate?: number },
): Promise<PricingProduct> {
  return request<PricingProduct>(
    `/admin/pricing/products/${productId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'Failed to update pricing',
  );
}

export async function applyProductDiscount(payload: {
  productIds: string[];
  discountRate: number;
}): Promise<PricingProduct[]> {
  return request<PricingProduct[]>(
    '/admin/pricing/discounts',
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to apply discount',
  );
}

export async function listSalesInvoices(from: string, to: string): Promise<InvoiceSummary[]> {
  const params = new URLSearchParams({ from, to });
  return request<InvoiceSummary[]>(`/admin/sales/invoices?${params.toString()}`, undefined, 'Failed to load invoices');
}

export async function getRevenueSummary(from: string, to: string): Promise<RevenueSummary> {
  const params = new URLSearchParams({ from, to });
  return request<RevenueSummary>(`/admin/sales/revenue?${params.toString()}`, undefined, 'Failed to load revenue summary');
}
