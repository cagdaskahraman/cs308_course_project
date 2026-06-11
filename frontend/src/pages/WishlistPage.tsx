import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { ProductPriceDisplay } from '../components/ProductPriceDisplay';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { listWishlist, removeFromWishlist } from '../services/wishlistService';
import type { Product } from '../types/product';

export const WishlistPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const rows = await listWishlist();
      setItems(rows);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/wishlist', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load wishlist');
    }
  }, [navigate, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/wishlist', { replace: true });
      return;
    }
    void load().finally(() => setLoading(false));
  }, [isAuthenticated, load, navigate]);

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    try {
      const next = await removeFromWishlist(productId);
      setItems(next);
      showToast('Removed from wishlist.', 'info');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not remove item');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stockQuantity <= 0 || product.price <= 0) return;
    setBusyId(product.id);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, 1);
      showToast(`Added "${product.name}" to cart.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <Link to="/login?next=/wishlist" className="btn btn-primary mt-3">Log in</Link>
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading wishlist…" />;

  return (
    <>
      <PageHeader
        icon="bi-heart-fill"
        title="My wishlist"
        subtitle="Products you save for later and price-drop alerts."
        badge={`${items.length} saved`}
      />
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {items.length === 0 ? (
        <EmptyState
          icon="bi-heart"
          title="Your wishlist is empty"
          description="Save products from their detail pages to track deals."
          actionLabel="Browse shop"
          actionTo="/"
        />
      ) : (
        <div className="row g-3">
          {items.map((product) => (
            <div className="col-12 col-md-6" key={product.id}>
              <div className="content-card mb-0 h-100">
                <div className="d-flex gap-3">
                  <Link to={`/products/${product.id}`} className="flex-shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="rounded"
                      style={{ width: 88, height: 88, objectFit: 'cover' }}
                    />
                  </Link>
                  <div className="flex-grow-1">
                    <Link to={`/products/${product.id}`} className="text-decoration-none text-dark">
                      <h3 className="h6 fw-bold mb-1">{product.name}</h3>
                    </Link>
                    <div className="mb-2">
                      <ProductPriceDisplay product={product} size="sm" />
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={busyId === product.id || product.stockQuantity <= 0 || product.price <= 0}
                        onClick={() => void handleAddToCart(product)}
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={busyId === product.id}
                        onClick={() => void handleRemove(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
