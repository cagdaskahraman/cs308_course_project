import { API_BASE_URL } from '../config/apiBase';
import { authHeader } from './authService';
import type { Product } from '../types/product';

const apiBaseUrl = API_BASE_URL;

export type AdminProductPayload = {
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  category: string;
  imageUrl: string;
  stockQuantity: number;
  warrantyStatus: string;
  distributorInfo: string;
};

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (Array.isArray(body.message)) return body.message.map(String).join(', ');
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
  } catch {
    // no JSON error body
  }
  if (res.status === 401) return 'Session expired. Please log in again.';
  if (res.status === 403) return 'Product manager access required.';
  if (res.status === 409) return 'This action conflicts with existing catalog data.';
  return `${fallback} (${res.status})`;
}

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
    throw new Error(await getErrorMessage(res, fallback));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listAdminProducts(query?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (query?.search?.trim()) params.set('search', query.search.trim());
  if (query?.category?.trim()) params.set('category', query.category.trim());
  const qs = params.toString();
  return request<Product[]>(`/admin/products${qs ? `?${qs}` : ''}`, undefined, 'Failed to load products');
}

export async function createAdminProduct(payload: AdminProductPayload): Promise<Product> {
  return request<Product>(
    '/admin/products',
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to create product',
  );
}

export async function updateAdminProduct(
  productId: string,
  payload: Partial<AdminProductPayload>,
): Promise<Product> {
  return request<Product>(
    `/admin/products/${productId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'Failed to update product',
  );
}

export async function updateAdminProductStock(
  productId: string,
  stockQuantity: number,
): Promise<Product> {
  return request<Product>(
    `/admin/products/${productId}/stock`,
    { method: 'PATCH', body: JSON.stringify({ stockQuantity }) },
    'Failed to update stock',
  );
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await request<void>(
    `/admin/products/${productId}`,
    { method: 'DELETE' },
    'Failed to delete product',
  );
}

export async function listAdminCategories(): Promise<string[]> {
  return request<string[]>('/admin/categories', undefined, 'Failed to load categories');
}

export async function createAdminCategory(name: string): Promise<void> {
  await request<void>(
    '/admin/categories',
    { method: 'POST', body: JSON.stringify({ name }) },
    'Failed to create category',
  );
}

export async function deleteAdminCategory(name: string): Promise<void> {
  await request<void>(
    `/admin/categories/${encodeURIComponent(name)}`,
    { method: 'DELETE' },
    'Failed to delete category',
  );
}
