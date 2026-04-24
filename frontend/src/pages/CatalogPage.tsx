import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';
import type { Product } from '../types/product';

type SortOption =
  | ''
  | 'price-asc'
  | 'price-desc'
  | 'popularity-asc'
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
      if (product.stockQuantity <= 0) return;
      setAddingId(product.id);
      try {
        const cartId = await getOrCreateCartId();
        await addCartItem(cartId, product.id, 1);
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Failed to add to cart');
      } finally {
        setAddingId(null);
      }
    },
    [showToast],
  );

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="text-center py-5 text-secondary" role="status">
          <div className="spinner-border text-primary mb-3" aria-hidden />
          <p className="fs-5 mb-0">Loading products…</p>
        </div>
      );
    }
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
        <div className="text-center py-5">
          <i className="bi bi-search display-4 text-secondary mb-3 d-block" aria-hidden />
          <p className="fs-5 text-secondary mb-0">No products found.</p>
        </div>
      );
    }

    return (
      <div className="row g-4">
        {products.map((product, index) => (
          <div
            className="col-12 col-md-6 col-lg-4 stagger-item"
            key={product.id}
            style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
          >
            <article className="card product-card h-100 border-0 shadow-sm">
              <Link to={`/products/${product.id}`} className="d-block overflow-hidden">
                <img className="card-img-top product-image" src={product.imageUrl} alt={product.name} />
              </Link>
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Link to={`/products/${product.id}`} className="text-decoration-none text-dark">
                    <h5 className="card-title mb-0">{product.name}</h5>
                  </Link>
                  <span className="badge text-bg-dark d-inline-flex align-items-center gap-1">
                    <i className="bi bi-tag-fill" aria-hidden />
                    {product.category}
                  </span>
                </div>
                <p className="text-secondary small mb-2 d-inline-flex align-items-center gap-1">
                  <i className="bi bi-hash" aria-hidden />
                  {product.id.slice(0, 8)}…
                </p>
                <p className="card-text text-secondary flex-grow-1 small">{product.description}</p>
                <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                  <span className="fw-bold fs-5 text-primary d-inline-flex align-items-center gap-1">
                    <i className="bi bi-currency-exchange" aria-hidden />
                    {formatPrice(product.price)}
                  </span>
                  <span
                    className={`small d-inline-flex align-items-center gap-1 ${product.stockQuantity > 0 ? 'text-success' : 'text-danger'}`}
                  >
                    <i className={`bi ${product.stockQuantity > 0 ? 'bi-box-seam' : 'bi-x-octagon-fill'}`} aria-hidden />
                    Stock: {product.stockQuantity}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-3 w-100 d-inline-flex align-items-center justify-content-center gap-2"
                  disabled={product.stockQuantity <= 0 || addingId === product.id}
                  onClick={() => void handleAddToCart(product)}
                >
                  {product.stockQuantity <= 0 ? (
                    <>
                      <i className="bi bi-slash-circle" aria-hidden />
                      Out of stock
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
            </article>
          </div>
        ))}
      </div>
    );
  }, [error, loading, products, addingId, handleAddToCart]);

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <h1 className="h3 fw-bold mb-0 d-inline-flex align-items-center gap-2">
          <i className="bi bi-shop-window text-primary" aria-hidden />
          Catalog
        </h1>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center">
        <button
          type="button"
          className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-2 ${selectedCategory === null ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
          onClick={() => setSelectedCategory(null)}
        >
          <i className="bi bi-grid-fill" aria-hidden />
          All products
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-2 ${selectedCategory === cat ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            <i className="bi bi-bookmark-fill" aria-hidden />
            {cat}
          </button>
        ))}
      </div>

      <div className="row g-2 mb-4 align-items-center">
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
              <option value="popularity-asc">Popularity: low → high</option>
            </select>
          </div>
        </div>
      </div>

      {content}
    </>
  );
};
