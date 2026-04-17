import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getSavedCartId,
  getCart,
  updateCartItem,
  removeCartItem,
  type CartResponse,
} from '../services/cartService';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';

export const CartPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadCart = useCallback(async () => {
    const cartId = getSavedCartId();
    if (!cartId) {
      setError('');
      setCartData(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getCart(cartId);
      setCartData(data);
      setError('');
    } catch (e) {
      localStorage.removeItem('electrostore_cart_id');
      setCartData(null);
      setError(
        e instanceof Error
          ? e.message
          : 'Could not load cart. A new cart will be created when you add an item.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCart(); }, [loadCart]);

  const handleQtyChange = async (itemId: string, newQty: number) => {
    if (!cartData || newQty < 1) return;
    setBusyItemId(itemId);
    try {
      await updateCartItem(cartData.cart.id, itemId, newQty);
      await loadCart();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cartData) return;
    setBusyItemId(itemId);
    try {
      await removeCartItem(cartData.cart.id, itemId);
      await loadCart();
      showToast('Removed from cart', 'info');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="es-cart">
        <div className="stack">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="es-skeleton" style={{ height: 128 }} />
          ))}
        </div>
        <div className="es-skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  if (error) return <div className="es-alert es-alert--danger">{error}</div>;

  if (!cartData || cartData.cart.items.length === 0) {
    return (
      <div className="es-empty fade-up">
        <div className="es-empty__art">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>
            <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 8H6"/>
          </svg>
        </div>
        <h2 className="es-empty__title">Your cart is empty</h2>
        <p className="es-empty__desc">Browse the catalog and add something great — we'll keep it saved for you.</p>
        <Link to="/" className="es-btn es-btn--primary es-btn--lg">Start shopping</Link>
      </div>
    );
  }

  const { cart, totalPrice } = cartData;
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <div className="between" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <span className="eyebrow">Review your selection</span>
          <h1 className="display-lg" style={{ margin: '.25rem 0 0' }}>Your cart</h1>
        </div>
        <span className="muted" style={{ fontSize: '.92rem' }}>
          {itemCount} item{itemCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="es-cart fade-up">
        <div className="es-cart-list">
          {cart.items.map((item) => (
            <div key={item.id} className="es-cart-item">
              <Link to={`/products/${item.product.id}`} className="es-cart-item__media">
                <img src={item.product.imageUrl} alt={item.product.name} />
              </Link>
              <div className="es-cart-item__body">
                <div>
                  <span className="es-cart-item__cat">{item.product.category}</span>
                  <Link to={`/products/${item.product.id}`} className="es-cart-item__title">
                    {item.product.name}
                  </Link>
                  <div className="muted" style={{ fontSize: '.82rem', marginTop: 2 }}>
                    {formatPrice(item.product.price)} each
                  </div>
                </div>
                <div className="es-cart-item__row">
                  <div className="es-qty">
                    <button
                      className="es-qty__btn"
                      disabled={busyItemId === item.id || item.quantity <= 1}
                      onClick={() => void handleQtyChange(item.id, item.quantity - 1)}
                      aria-label="Decrease"
                    >−</button>
                    <span className="es-qty__value">{item.quantity}</span>
                    <button
                      className="es-qty__btn"
                      disabled={busyItemId === item.id}
                      onClick={() => void handleQtyChange(item.id, item.quantity + 1)}
                      aria-label="Increase"
                    >+</button>
                  </div>
                  <span className="es-cart-item__price">{formatPrice(item.quantity * item.product.price)}</span>
                </div>
              </div>
              <button
                className="es-cart-item__remove"
                disabled={busyItemId === item.id}
                onClick={() => void handleRemove(item.id)}
                aria-label="Remove item"
                title="Remove"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <aside className="es-summary fade-up fade-up-1">
          <h3 className="es-summary__title">Order summary</h3>
          <div className="es-summary__row">
            <span>Subtotal</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>
          <div className="es-summary__row">
            <span>Shipping</span>
            <strong style={{ color: 'var(--success)' }}>Free</strong>
          </div>
          <div className="es-summary__row">
            <span>Estimated tax</span>
            <span className="muted">Calculated at checkout</span>
          </div>
          <div className="es-summary__total">
            <span className="es-summary__total-label">Total</span>
            <span className="es-summary__total-value">{formatPrice(totalPrice)}</span>
          </div>
          <button
            className="es-btn es-btn--primary es-btn--lg es-btn--block"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
            <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
            </svg>
          </button>
          <Link to="/" className="es-btn es-btn--ghost es-btn--block" style={{ marginTop: '.5rem' }}>
            Continue shopping
          </Link>
          <div className="es-summary__note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secure, encrypted checkout
          </div>
        </aside>
      </div>
    </>
  );
};
