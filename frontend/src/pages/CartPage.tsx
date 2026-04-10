import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getSavedCartId,
  getCart,
  updateCartItem,
  removeCartItem,
  type CartResponse,
} from '../services/cartService';
import { formatPrice } from '../utils/formatPrice';

export const CartPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    const cartId = getSavedCartId();
    if (!cartId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getCart(cartId);
      setCartData(data);
    } catch {
      setCartData(null);
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
      alert(e instanceof Error ? e.message : 'Failed to update');
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
      alert(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) return <p className="text-center fs-5 mt-5">Loading cart...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  if (!cartData || cartData.cart.items.length === 0) {
    return (
      <div className="text-center mt-5">
        <h4>Your cart is empty</h4>
        <Link to="/" className="btn btn-primary mt-3">Start Shopping</Link>
      </div>
    );
  }

  const { cart, totalPrice } = cartData;

  return (
    <>
      <h2 className="fw-bold mb-4">Shopping Cart</h2>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th style={{ width: 140 }}>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
              <th style={{ width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/products/${item.product.id}`} className="text-decoration-none text-dark fw-semibold">
                    {item.product.name}
                  </Link>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={busyItemId === item.id || item.quantity <= 1}
                      onClick={() => void handleQtyChange(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="fw-semibold" style={{ minWidth: 24, textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={busyItemId === item.id}
                      onClick={() => void handleQtyChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{formatPrice(item.product.price)}</td>
                <td className="fw-semibold">{formatPrice(item.quantity * item.product.price)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={busyItemId === item.id}
                    onClick={() => void handleRemove(item.id)}
                    title="Remove"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
        <h4 className="mb-0">Total: {formatPrice(totalPrice)}</h4>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </button>
      </div>
    </>
  );
};
