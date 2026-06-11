import { formatPrice } from '../utils/formatPrice';
import { getProductPricing } from '../utils/productPricing';
import type { Product } from '../types/product';

type ProductPriceDisplayProps = {
  product: Pick<Product, 'price' | 'listPrice' | 'discountRate'>;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'inline' | 'stacked';
  showSavings?: boolean;
};

export const ProductPriceDisplay = ({
  product,
  size = 'md',
  layout = 'stacked',
  showSavings = false,
}: ProductPriceDisplayProps): JSX.Element => {
  const pricing = getProductPricing(product);

  if (!pricing.hasDiscount) {
    return (
      <div className={`product-price product-price--${size} product-price--single`}>
        <span className="product-price__current">
          {pricing.salePrice > 0 ? formatPrice(pricing.salePrice) : '—'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`product-price product-price--${size} product-price--discount product-price--${layout}`}
    >
      <div className="product-price__badge" aria-label={`${pricing.discountRate} percent off`}>
        <span className="product-price__badge-label">DISCOUNT</span>
        <span className="product-price__badge-rate">-{pricing.discountRate}%</span>
      </div>
      <div className="product-price__values">
        <span className="product-price__original">{formatPrice(pricing.listPrice)}</span>
        <span className="product-price__current">{formatPrice(pricing.salePrice)}</span>
      </div>
      {showSavings ? (
        <span className="product-price__savings">
          You save {formatPrice(pricing.savings)}
        </span>
      ) : null}
    </div>
  );
};

export const ProductDiscountBadge = ({
  product,
}: {
  product: Pick<Product, 'price' | 'listPrice' | 'discountRate'>;
}): JSX.Element | null => {
  const { hasDiscount } = getProductPricing(product);
  if (!hasDiscount) return null;

  return (
    <span className="product-card__flag" aria-label="Deal">
      <i className="bi bi-stars" aria-hidden />
      Deal
    </span>
  );
};
