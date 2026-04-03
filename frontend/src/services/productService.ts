import type { Product } from '../types/product';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

const toAbsoluteImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${apiBaseUrl}${imageUrl}`;
};

export interface GetProductsOptions {
  category?: string;
  search?: string;
  sortBy?: 'price' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export const getProducts = async (options?: GetProductsOptions): Promise<Product[]> => {
  const url = new URL(`${apiBaseUrl}/products`);
  
  if (options) {
    if (options.category) url.searchParams.append('category', options.category);
    if (options.search) url.searchParams.append('search', options.search);
    if (options.sortBy) url.searchParams.append('sortBy', options.sortBy);
    if (options.sortOrder) url.searchParams.append('sortOrder', options.sortOrder);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = (await response.json()) as Product[];
  return data.map((product) => ({
    ...product,
    imageUrl: toAbsoluteImageUrl(product.imageUrl),
  }));
};

export const getCategories = async (): Promise<string[]> => {
  const response = await fetch(`${apiBaseUrl}/products/categories`);
  if (!response.ok) {
    throw new Error(`Categories request failed with status ${response.status}`);
  }
  return response.json() as Promise<string[]>;
};
