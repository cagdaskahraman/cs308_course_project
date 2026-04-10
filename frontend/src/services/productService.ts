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

export const getProducts = async (category?: string | null): Promise<Product[]> => {
  const url = new URL(`${apiBaseUrl}/products`);
  if (category) {
    url.searchParams.append('category', category);
  }
  const data = await fetchJson<Product[]>(url.toString());
  return data.map((product) => ({
    ...product,
    imageUrl: toAbsoluteImageUrl(product.imageUrl),
  }));
};

export const getProductById = async (id: string): Promise<Product> => {
  const product = await fetchJson<Product>(`${apiBaseUrl}/products/${id}`);
  return { ...product, imageUrl: toAbsoluteImageUrl(product.imageUrl) };
};

export const getCategories = async (): Promise<string[]> => {
  return fetchJson<string[]>(`${apiBaseUrl}/products/categories`);
};
