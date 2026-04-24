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

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

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
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading cart…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-danger mt-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-triangle-fill" aria-hidden />
        <span>{error}</span>
      </div>
    );
  }

  if (!cartData || cartData.cart.items.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-cart-x display-3 text-secondary mb-3 d-block" aria-hidden />
        <h4 className="fw-semibold">Your cart is empty</h4>
        <p className="text-secondary mb-4">Browse the catalog and add items to get started.</p>
        <Link to="/" className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2">
          <i className="bi bi-grid-1x2-fill" aria-hidden />
          Browse catalog
        </Link>
      </div>
    );
  }

  const { cart, totalPrice } = cartData;

  return (
    <>
      <h2 className="fw-bold mb-4 d-inline-flex align-items-center gap-2">
        <i className="bi bi-cart3 text-primary" aria-hidden />
        Shopping cart
      </h2>
      <div className="table-responsive card border-0 shadow-sm">
        <table className="table align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Product</th>
              <th scope="col" style={{ width: 160 }}>
                Qty
              </th>
              <th scope="col">Unit price</th>
              <th scope="col">Subtotal</th>
              <th scope="col" style={{ width: 56 }} aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/products/${item.product.id}`} className="text-decoration-none text-dark fw-semibold d-inline-flex align-items-center gap-2">
                    <i className="bi bi-box-seam text-secondary" aria-hidden />
                    {item.product.name}
                  </Link>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                      style={{ width: 36 }}
                      disabled={busyItemId === item.id || item.quantity <= 1}
                      onClick={() => void handleQtyChange(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <i className="bi bi-dash-lg" aria-hidden />
                    </button>
                    <span className="fw-semibold" style={{ minWidth: 28, textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                      style={{ width: 36 }}
                      disabled={busyItemId === item.id}
                      onClick={() => void handleQtyChange(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <i className="bi bi-plus-lg" aria-hidden />
                    </button>
                  </div>
                </td>
                <td>{formatPrice(item.product.price)}</td>
                <td className="fw-semibold">{formatPrice(item.quantity * item.product.price)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                    style={{ width: 38 }}
                    disabled={busyItemId === item.id}
                    onClick={() => void handleRemove(item.id)}
                    title="Remove"
                    aria-label="Remove item"
                  >
                    <i className="bi bi-trash3" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 gap-3 border-top pt-4">
        <h4 className="mb-0 d-inline-flex align-items-center gap-2">
          <i className="bi bi-receipt text-primary" aria-hidden />
          Total: {formatPrice(totalPrice)}
        </h4>
        <button
          type="button"
          className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2"
          onClick={() => navigate('/checkout')}
        >
          <i className="bi bi-credit-card-2-front" aria-hidden />
          Proceed to checkout
        </button>
      </div>
    </>
  );
};
