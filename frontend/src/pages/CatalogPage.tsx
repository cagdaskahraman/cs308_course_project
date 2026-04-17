import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';
import { readWishlist, toggleWishlistId } from '../utils/wishlist';
import type { Product } from '../types/product';

type SortOption = '' | 'price-asc' | 'price-desc';

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 1 0-7.78 7.78l1.06 1.07L12 21.23l7.78-7.78 1.06-1.07a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ProductCard = ({
  product,
  onAdd,
  busy,
  wished,
  onToggleWish,
  index,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  busy: boolean;
  wished: boolean;
  onToggleWish: (id: string) => void;
  index: number;
}) => {
  const ref = useRef<HTMLElement>(null);
  const oos = product.stockQuantity <= 0;
  const low = product.stockQuantity > 0 && product.stockQuantity <= 3;

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--cx', `${x}%`);
    el.style.setProperty('--cy', `${y}%`);
  };

  return (
    <article
      ref={ref}
      className="es-product fade-up"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      onMouseMove={handleMove}
    >
      <Link to={`/products/${product.id}`} className="es-product__media" aria-label={product.name}>
        <img className="es-product__img" src={product.imageUrl} alt={product.name} loading="lazy" />
        <div className="es-product__badges">
          <span className="es-product__badge">{product.category}</span>
        </div>
        {(oos || low) && (
          <span className={`es-product__status${low && !oos ? ' es-product__status--low' : ''}`}>
            {oos ? 'Sold out' : `Only ${product.stockQuantity} left`}
          </span>
        )}
      </Link>
      <button
        type="button"
        className={`es-wish${wished ? ' es-wish--on' : ''}`}
        aria-pressed={wished}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => onToggleWish(product.id)}
      >
        <HeartIcon filled={wished} />
      </button>
      <div className="es-product__body">
        <span className="es-product__category">{product.category}</span>
        <h3 className="es-product__title">
          <Link to={`/products/${product.id}`} style={{ color: 'inherit' }}>{product.name}</Link>
        </h3>
        <p className="es-product__desc">{product.description}</p>
        <div className="es-product__meta">
          <span className="es-product__price">{formatPrice(product.price)}</span>
          <span className="es-product__stock">
            <span className={`es-dot ${oos ? 'es-dot--danger' : low ? 'es-dot--warn' : 'es-dot--ok'}`} />
            {oos ? 'Out of stock' : low ? `${product.stockQuantity} left` : 'In stock'}
          </span>
        </div>
        <div className="es-product__cta">
          <button
            className={`es-btn ${oos ? 'es-btn--outline' : 'es-btn--primary'} es-btn--block`}
            disabled={oos || busy}
            onClick={() => onAdd(product)}
          >
            {oos ? (
              'Notify me'
            ) : busy ? (
              <>Adding…</>
            ) : (
              <>
                <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6h15l-1.5 9h-12z"/>
                  <circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>
                  <path d="M6 6L5 3H2"/>
                </svg>
                Add to cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

const SkeletonCard = () => (
  <div className="es-product" aria-hidden>
    <div className="es-skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
    <div className="es-product__body">
      <div className="es-skeleton" style={{ height: 10, width: 60 }} />
      <div className="es-skeleton" style={{ height: 18, width: '80%' }} />
      <div className="es-skeleton" style={{ height: 12, width: '100%' }} />
      <div className="es-skeleton" style={{ height: 12, width: '70%' }} />
      <div className="es-skeleton" style={{ height: 40, marginTop: '1rem' }} />
    </div>
  </div>
);

export const CatalogPage = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(() => readWishlist());

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [sort, setSort] = useState<SortOption>('');
  const { showToast } = useToast();

  const searchRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getCategories()
      .then(setCategories)
      .catch((e) => console.error('Could not load categories:', e));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    const sortBy = sort === 'price-asc' || sort === 'price-desc' ? ('price' as const) : undefined;
    const sortOrder = sort === 'price-asc' ? ('asc' as const) : sort === 'price-desc' ? ('desc' as const) : undefined;

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (product.stockQuantity <= 0) return;
    setAddingId(product.id);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, 1);
      showToast(`${product.name} added to cart`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  const handleToggleWish = (id: string) => {
    setWishlist((prev) => toggleWishlistId(prev, id));
  };

  const resultsLabel = useMemo(() => {
    if (loading) return 'Loading catalog…';
    const count = products.length;
    const scope = selectedCategory ?? 'All';
    return `${count} ${count === 1 ? 'product' : 'products'} · ${scope}`;
  }, [loading, products.length, selectedCategory]);

  const collageImages = useMemo(
    () => products.slice(0, 3).map((p) => p.imageUrl).filter(Boolean),
    [products],
  );

  const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const headlineWords = ['Modern', 'electronics,'];
  const italicWords = ['thoughtfully', 'chosen.'];

  return (
    <>
      {/* Dynamic background layer */}
      <div className="es-aurora" aria-hidden>
        <span className="es-aurora__blob es-aurora__blob--1" />
        <span className="es-aurora__blob es-aurora__blob--2" />
        <span className="es-aurora__blob es-aurora__blob--3" />
        <span className="es-aurora__blob es-aurora__blob--4" />
        <span className="es-aurora__grid" />
      </div>

      <div className="es-layer">
        {/* Hero */}
        <section className="es-hero fade-up" ref={heroRef}>
          <div className="es-hero__spot" />
          <div className="es-hero__inner">
            <div className="es-hero__eyebrow">Spring '26 · New arrivals</div>
            <h1 className="es-hero__title">
              {headlineWords.map((w, i) => (
                <span key={`h-${i}`} className="kinetic" style={{ animationDelay: `${i * 80}ms` }}>
                  {w}&nbsp;
                </span>
              ))}
              <em>
                {italicWords.map((w, i) => (
                  <span key={`i-${i}`} className="kinetic" style={{ animationDelay: `${(headlineWords.length + i) * 80}ms` }}>
                    {w}&nbsp;
                  </span>
                ))}
              </em>
            </h1>
            <p className="es-hero__sub">
              Phones, laptops and audio from the brands we trust — free 2-day delivery and effortless 30-day returns.
            </p>
            <div className="es-hero__ctas">
              <button className="es-hero__cta es-hero__cta--primary" onClick={scrollToGrid}>
                Shop the catalog
                <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="es-hero__collage" aria-hidden>
            {collageImages.length >= 3 ? (
              <>
                <div className="es-hero__tile es-hero__tile--1"><img src={collageImages[0]} alt="" /></div>
                <div className="es-hero__tile es-hero__tile--2"><img src={collageImages[1]} alt="" /></div>
                <div className="es-hero__tile es-hero__tile--3"><img src={collageImages[2]} alt="" /></div>
              </>
            ) : (
              <>
                <div className="es-hero__tile es-hero__tile--1" />
                <div className="es-hero__tile es-hero__tile--2" />
                <div className="es-hero__tile es-hero__tile--3" />
              </>
            )}
          </div>
        </section>

        {/* Browse / grid */}
        <div className="es-section-head" ref={gridRef}>
          <div>
            <span className="eyebrow">Browse</span>
            <h2 className="display-md" style={{ marginTop: 4 }}>
              {selectedCategory ? selectedCategory : 'All products'}
            </h2>
          </div>
          <div className="es-section-head__line" aria-hidden />
        </div>

        <div className="es-filters">
          <div className="es-search">
            <svg className="es-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              className="es-search__input"
              placeholder="Search phones, laptops, audio…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span className="es-search__kbd" aria-hidden>/</span>
          </div>
          <select
            className="es-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{ minWidth: 200 }}
            aria-label="Sort products"
          >
            <option value="">Sort by — Featured</option>
            <option value="price-asc">Price · Low to high</option>
            <option value="price-desc">Price · High to low</option>
          </select>
        </div>

        <div className="es-chiprow">
          <button
            className={`es-chip${selectedCategory === null ? ' es-chip--active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`es-chip${selectedCategory === cat ? ' es-chip--active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="es-results-bar">
          <span>{resultsLabel}</span>
          {(selectedCategory || debouncedSearch) && (
            <button
              type="button"
              className="link link--muted"
              onClick={() => { setSelectedCategory(null); setSearchInput(''); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {error && <div className="es-alert es-alert--danger" style={{ marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <div className="grid-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="es-empty">
            <div className="es-empty__art">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3 className="es-empty__title">No products found</h3>
            <p className="es-empty__desc">Try a different search term or clear the filters.</p>
          </div>
        ) : (
          <div className="grid-3">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                busy={addingId === p.id}
                wished={wishlist.has(p.id)}
                onToggleWish={handleToggleWish}
                onAdd={(prod) => void handleAddToCart(prod)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
