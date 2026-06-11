import type { Product } from '../types/product';

export type ProductPricing = {
  listPrice: number;
  salePrice: number;
  discountRate: number;
  hasDiscount: boolean;
  savings: number;
};

export function getProductPricing(
  product: Pick<Product, 'price' | 'listPrice' | 'discountRate'>,
): ProductPricing {
  const salePrice = Number(product.price) || 0;
  const listPrice = Number(product.listPrice ?? product.price) || salePrice;
  const discountRate = Math.round(Number(product.discountRate ?? 0));
  const hasDiscount =
    discountRate > 0 && listPrice > salePrice && salePrice > 0;
  const savings = hasDiscount ? listPrice - salePrice : 0;

  return {
    listPrice,
    salePrice,
    discountRate,
    hasDiscount,
    savings,
  };
}
