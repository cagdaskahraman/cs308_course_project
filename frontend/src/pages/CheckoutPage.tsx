import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSavedCartId, getCart, type CartResponse } from '../services/cartService';
import { checkout } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';

export const CheckoutPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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

  if (loading) return <p className="text-center fs-5 mt-5">Loading...</p>;

  if (!cartData || cartData.cart.items.length === 0) {
    return (
      <div className="text-center mt-5">
        <h4>Nothing to checkout</h4>
        <Link to="/" className="btn btn-primary mt-3">Browse Products</Link>
      </div>
    );
  }

  const { cart, totalPrice } = cartData;

  return (
    <>
      <h2 className="fw-bold mb-4">Checkout</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">Order Summary</h5>
          <ul className="list-group list-group-flush mb-3">
            {cart.items.map((item) => (
              <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{item.product.name} &times; {item.quantity}</span>
                <span className="fw-semibold">{formatPrice(item.quantity * item.product.price)}</span>
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <h4 className="mb-0">Total: {formatPrice(totalPrice)}</h4>
            <div className="d-flex gap-2">
              <Link to="/cart" className="btn btn-outline-secondary">Back to Cart</Link>
              <button
                className="btn btn-primary btn-lg"
                disabled={submitting}
                onClick={() => void handleCheckout()}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
