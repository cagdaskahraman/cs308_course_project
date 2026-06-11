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

export function computeSalePrice(listPrice: number, discountRate: number): number {
  const rate = Math.min(100, Math.max(0, discountRate));
  const effective = listPrice * (1 - rate / 100);
  return Math.round(effective * 100) / 100;
}
