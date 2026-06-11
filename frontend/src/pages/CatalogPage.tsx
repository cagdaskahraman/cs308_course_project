import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ProductDiscountBadge, ProductPriceDisplay } from '../components/ProductPriceDisplay';
import { StarRating } from '../components/StarRating';
import { getProductPricing } from '../utils/productPricing';
import type { Product } from '../types/product';

type SortOption =
  | ''
  | 'price-asc'
  | 'price-desc'
  | 'popularity-desc';

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export const CatalogPage = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [sort, setSort] = useState<SortOption>('');
  const { showToast } = useToast();

  const categoryIconClass = (category: string): string => {
    const normalized = category.toLowerCase();
    if (normalized === 'laptop') return 'bi-laptop';
    if (normalized === 'headphone') return 'bi-headphones';
    if (normalized === 'phone') return 'bi-phone';
    if (normalized === 'tablet') return 'bi-tablet';
    if (normalized === 'accessory') return 'bi-usb-symbol';
    if (normalized === 'monitor') return 'bi-display';
    if (normalized === 'camera') return 'bi-camera';
    return 'bi-grid';
  };

  useEffect(() => {
    void getCategories()
      .then(setCategories)
      .catch((e) => console.error('Could not load categories:', e));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    const sortBy =
      sort.startsWith('price-')
        ? ('price' as const)
        : sort.startsWith('popularity-')
          ? ('popularity' as const)
          : undefined;
    const sortOrder = sort.endsWith('-asc')
      ? ('asc' as const)
      : sort.endsWith('-desc')
        ? ('desc' as const)
        : undefined;

    void getProducts({
      category: selectedCategory,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    })
      .then(setProducts)
      .catch((e) => setError(`Could not load products: ${e instanceof Error ? e.message : 'Unexpected error'}`))
      .finally(() => setLoading(false));
  }, [selectedCategory, debouncedSearch, sort]);

  const handleAddToCart = useCallback(
    async (product: Product) => {
      if (product.stockQuantity <= 0 || product.price <= 0) return;
      setAddingId(product.id);
      try {
        const cartId = await getOrCreateCartId();
        await addCartItem(cartId, product.id, 1);
        showToast(`Added "${product.name}" to cart.`, 'success');
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Failed to add to cart');
      } finally {
        setAddingId(null);
      }
    },
    [showToast],
  );

  const content = useMemo(() => {
    if (loading) return <LoadingState label="Loading products…" />;
    if (error) {
      return (
        <div className="alert alert-danger d-flex align-items-center gap-2 mt-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      );
    }
    if (products.length === 0) {
      return (
        <EmptyState
          icon="bi-search"
          title="No products found"
          description="Try a different search term or category filter."
        />
      );
    }

    return (
      <div className="row g-4 catalog-grid">
        {products.map((product, index) => {
          const pricing = getProductPricing(product);
          return (
            <div
              className="col-12 col-sm-6 col-xl-4 stagger-item"
              key={product.id}
              style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
            >
              <article className="card product-card h-100 border-0">
                <Link to={`/products/${product.id}`} className="d-block overflow-hidden product-image-wrap">
                  <ProductDiscountBadge product={product} />
                  {pricing.hasDiscount ? (
                    <span className="product-card__flag">
                      <i className="bi bi-stars" aria-hidden />
                      Deal
                    </span>
                  ) : null}
                  <img className="card-img-top product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
                </Link>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <Link to={`/products/${product.id}`} className="text-decoration-none text-dark flex-grow-1">
                      <h5 className="card-title mb-0">{product.name}</h5>
                    </Link>
                    <span className="category-pill">
                      <i className="bi bi-tag-fill" aria-hidden />
                      {product.category}
                    </span>
                  </div>
                  <p className="card-text text-secondary flex-grow-1 small mb-3 product-card__desc">
                    {product.description.length > 96
                      ? `${product.description.slice(0, 96)}…`
                      : product.description}
                  </p>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="rating-pill">
                      {(product.reviewCount ?? 0) > 0 ? (
                        <>
                          <StarRating value={Math.round(product.averageRating ?? 0)} size="sm" />
                          <span>{(product.averageRating ?? 0).toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-secondary">No reviews yet</span>
                      )}
                    </span>
                    <span className="text-secondary small">
                      {product.reviewCount ?? 0} review{(product.reviewCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-end mt-auto flex-wrap gap-2">
                    <ProductPriceDisplay product={product} size="md" showSavings={pricing.hasDiscount} />
                    <span className={`stock-pill ${product.stockQuantity > 0 ? 'stock-pill--in' : 'stock-pill--out'}`}>
                      <i className={`bi ${product.stockQuantity > 0 ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} aria-hidden />
                      {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="product-card__actions">
                    <Link to={`/products/${product.id}`} className="btn btn-outline-secondary btn-sm product-card__view">
                      <i className="bi bi-eye" aria-hidden />
                      View
                    </Link>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm product-card__cart"
                      disabled={product.stockQuantity <= 0 || product.price <= 0 || addingId === product.id}
                      onClick={() => void handleAddToCart(product)}
                    >
                      {product.stockQuantity <= 0 ? (
                        <>
                          <i className="bi bi-slash-circle" aria-hidden />
                          Out of stock
                        </>
                      ) : product.price <= 0 ? (
                        <>
                          <i className="bi bi-hourglass-split" aria-hidden />
                          Price unavailable
                        </>
                      ) : addingId === product.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm" aria-hidden />
                          Adding…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cart-plus" aria-hidden />
                          Add to cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    );
  }, [error, loading, products, addingId, handleAddToCart]);

  return (
    <>
      <div className="catalog-banner mb-3">
        <div className="catalog-banner__text">
          <h1 className="catalog-banner__title">
            <i className="bi bi-shop-window" aria-hidden />
            Premium electronics
          </h1>
          <p className="catalog-banner__subtitle mb-0">
            Browse products with live stock, reviews, and member pricing.
          </p>
        </div>
        <span className="catalog-banner__badge">
          {loading ? '…' : `${products.length} products`}
        </span>
      </div>

      <div className="category-bar mb-3">
        <button
          type="button"
          className={`category-chip${selectedCategory === null ? ' is-active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          <i className="bi bi-grid-fill" aria-hidden />
          All products
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`category-chip${selectedCategory === cat ? ' is-active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            <i className={`bi ${categoryIconClass(cat)}`} aria-hidden />
            {cat}
          </button>
        ))}
      </div>

      <div className="search-toolbar row g-2 mb-4 align-items-center">
        <div className="col-12 col-md-8">
          <label htmlFor="catalogSearch" className="visually-hidden">
            Search products
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search" aria-hidden />
            </span>
            <input
              id="catalogSearch"
              type="search"
              className="form-control"
              placeholder="Search by name or description…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <label htmlFor="catalogSort" className="visually-hidden">
            Sort products
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-sort-down" aria-hidden />
            </span>
            <select
              id="catalogSort"
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
            >
              <option value="">Sort by</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
              <option value="popularity-desc">Popularity: high → low</option>
            </select>
          </div>
        </div>
      </div>

      {content}
    </>
  );
};
