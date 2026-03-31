import type { Product } from '../types/product';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

const toAbsoluteImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${apiBaseUrl}${imageUrl}`;
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${apiBaseUrl}/products`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = (await response.json()) as Product[];
  return data.map((product) => ({
    ...product,
    imageUrl: toAbsoluteImageUrl(product.imageUrl),
  }));
};
