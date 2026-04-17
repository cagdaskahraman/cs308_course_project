import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSavedCartId, getCart, type CartResponse } from '../services/cartService';
import { checkout } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';

export const CheckoutPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/checkout', { replace: true });
      return;
    }
    const cartId = getSavedCartId();
    if (!cartId) {
      setError('');
      setCartData(null);
      setLoading(false);
      return;
    }
    void getCart(cartId)
      .then((data) => {
        setCartData(data);
        setError('');
      })
      .catch((e) => {
        localStorage.removeItem('electrostore_cart_id');
        setCartData(null);
        setError(
          e instanceof Error
            ? e.message
            : 'Could not load cart. Please return to cart and add items again.',
        );
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleCheckout = async () => {
    if (!cartData || cartData.cart.items.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const order = await checkout({
        cartId: cartData.cart.id,
        items: cartData.cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });
      localStorage.removeItem('electrostore_cart_id');
      navigate(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="es-cart">
        <div className="es-skeleton" style={{ height: 320 }} />
        <div className="es-skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  if (!cartData || cartData.cart.items.length === 0) {
    return (
      <div className="es-empty fade-up">
        <div className="es-empty__art">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10H3"/><path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><rect x="3" y="10" width="18" height="11" rx="2"/>
          </svg>
        </div>
        <h2 className="es-empty__title">Nothing to check out</h2>
        <p className="es-empty__desc">Your cart is empty. Add something you love to continue.</p>
        <Link to="/" className="es-btn es-btn--primary es-btn--lg">Browse products</Link>
      </div>
    );
  }

  const { cart, totalPrice } = cartData;
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <Link to="/cart" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        Back to cart
      </Link>

      <div className="between" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <span className="eyebrow">Final step</span>
          <h1 className="display-lg" style={{ margin: '.25rem 0 0' }}>Checkout</h1>
        </div>
      </div>

      {error && <div className="es-alert es-alert--danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="es-cart fade-up">
        <div className="es-card es-card--pad">
          <div className="between" style={{ marginBottom: '.75rem' }}>
            <h3 className="display-md" style={{ margin: 0 }}>Order review</h3>
            <span className="es-tag es-tag--muted">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
          </div>
          <div className="stack" style={{ gap: '.5rem' }}>
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="between"
                style={{ padding: '.85rem 0', borderBottom: '1px dashed var(--ink-200)' }}
              >
                <div className="flex-row" style={{ gap: '.85rem', minWidth: 0, flex: 1 }}>
                  <div className="es-cart-item__media" style={{ width: 56, height: 56, borderRadius: 10 }}>
                    <img src={item.product.imageUrl} alt="" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{item.product.name}</div>
                    <div className="muted" style={{ fontSize: '.82rem' }}>
                      {item.product.category} · Qty {item.quantity}
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  {formatPrice(item.quantity * item.product.price)}
                </span>
              </div>
            ))}
          </div>

          {user?.email && (
            <div className="es-surface" style={{ marginTop: '1rem', padding: '.9rem 1.1rem', boxShadow: 'none', border: '1px dashed var(--ink-200)' }}>
              <div className="muted" style={{ fontSize: '.75rem', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 2 }}>Shipping to</div>
              <div style={{ fontWeight: 600 }}>{user.email}</div>
            </div>
          )}
        </div>

        <aside className="es-summary fade-up fade-up-1">
          <h3 className="es-summary__title">Summary</h3>
          <div className="es-summary__row"><span>Subtotal</span><strong>{formatPrice(totalPrice)}</strong></div>
          <div className="es-summary__row"><span>Shipping</span><strong style={{ color: 'var(--success)' }}>Free</strong></div>
          <div className="es-summary__row"><span>Tax</span><span className="muted">Included</span></div>
          <div className="es-summary__total">
            <span className="es-summary__total-label">Total due</span>
            <span className="es-summary__total-value">{formatPrice(totalPrice)}</span>
          </div>
          <button
            className="es-btn es-btn--primary es-btn--lg es-btn--block"
            style={{ marginTop: '1rem' }}
            disabled={submitting}
            onClick={() => void handleCheckout()}
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
          <Link to="/cart" className="es-btn es-btn--ghost es-btn--block" style={{ marginTop: '.5rem' }}>
            Back to cart
          </Link>
          <div className="es-summary__note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>
            </svg>
            Protected by encrypted checkout
          </div>
        </aside>
      </div>
    </>
  );
};
