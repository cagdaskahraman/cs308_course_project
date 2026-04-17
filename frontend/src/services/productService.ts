import type { Product } from '../types/product';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/** Avoid infinite “Loading…” if the API is down or unreachable. */
const REQUEST_TIMEOUT_MS = 15_000;

async function fetchJson<T>(input: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(input, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Timed out after ${REQUEST_TIMEOUT_MS / 1000}s — is the backend running at ${apiBaseUrl}?`,
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const toAbsoluteImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${apiBaseUrl}${imageUrl}`;
};

function mapProductFromApi(raw: Product): Product {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    price: raw.price,
    stockQuantity: raw.stockQuantity,
    category: raw.category,
    imageUrl: toAbsoluteImageUrl(raw.imageUrl),
    model: raw.model ?? null,
    serialNumber: raw.serialNumber ?? null,
    warrantyStatus: raw.warrantyStatus ?? null,
    distributorInfo: raw.distributorInfo ?? null,
  };
}

export type ProductQueryParams = {
  category?: string | null;
  search?: string;
  sortBy?: 'price';
  sortOrder?: 'asc' | 'desc';
};

export const getProducts = async (params?: ProductQueryParams | string | null): Promise<Product[]> => {
  const url = new URL(`${apiBaseUrl}/products`);

  const opts: ProductQueryParams = typeof params === 'string' || params === null || params === undefined
    ? { category: params ?? undefined }
    : params;

  if (opts.category) url.searchParams.append('category', opts.category);
  if (opts.search?.trim()) url.searchParams.append('search', opts.search.trim());
  if (opts.sortBy) url.searchParams.append('sortBy', opts.sortBy);
  if (opts.sortOrder) url.searchParams.append('sortOrder', opts.sortOrder);

  const data = await fetchJson<Product[]>(url.toString());
  return data.map(mapProductFromApi);
};

export const getProductById = async (id: string): Promise<Product> => {
  const product = await fetchJson<Product>(`${apiBaseUrl}/products/${id}`);
  return mapProductFromApi(product);
};

export const getCategories = async (): Promise<string[]> => {
  return fetchJson<string[]>(`${apiBaseUrl}/products/categories`);
};
