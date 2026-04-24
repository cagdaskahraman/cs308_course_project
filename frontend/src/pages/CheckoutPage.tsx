import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSavedCartId, getCart, type CartResponse } from '../services/cartService';
import { checkout, type PaymentDetails } from '../services/orderService';
import { isAuthFailure } from '../services/authService';
import { formatPrice } from '../utils/formatPrice';

function luhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s+/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export const CheckoutPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<PaymentDetails>({
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });
  const [billingEmail, setBillingEmail] = useState(user?.email ?? '');

  const handleExpiryInput = (value: string): void => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const formatted =
      digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setPayment((prev) => ({ ...prev, expiry: formatted }));
  };

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

  useEffect(() => {
    setBillingEmail(user?.email ?? '');
  }, [user?.email]);

  const paymentValidationError = (): string | null => {
    const cardNumber = payment.cardNumber.replace(/\s+/g, '');
    if (!payment.cardHolder.trim() || payment.cardHolder.trim().length < 2) {
      return 'Card holder must be at least 2 characters.';
    }
    if (!/^\d{13,19}$/.test(cardNumber)) {
      return 'Card number must be 13 to 19 digits.';
    }
    if (!luhnValid(cardNumber)) {
      return 'Card number is invalid (failed checksum).';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expiry)) {
      return 'Expiry must be in MM/YY format.';
    }
    if (!/^\d{3,4}$/.test(payment.cvc)) {
      return 'CVC must be 3 or 4 digits.';
    }
    if (!billingEmail.trim()) {
      return 'Billing email is required.';
    }
    return null;
  };

  const handleCheckout = async () => {
    if (!cartData || cartData.cart.items.length === 0) return;
    const validationError = paymentValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const order = await checkout({
        cartId: cartData.cart.id,
        items: cartData.cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        payment: {
          cardHolder: payment.cardHolder.trim(),
          cardNumber: payment.cardNumber.replace(/\s+/g, ''),
          expiry: payment.expiry.trim(),
          cvc: payment.cvc.trim(),
        },
        billingEmail: billingEmail.trim(),
      });
      localStorage.removeItem('electrostore_cart_id');
      navigate(`/orders/${order.id}`);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/checkout', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading checkout…</p>
      </div>
    );
  }

  if (!cartData || cartData.cart.items.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-bag-x display-4 text-secondary mb-3 d-block" aria-hidden />
        <h4 className="fw-semibold">Nothing to checkout</h4>
        <Link to="/" className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2">
          <i className="bi bi-grid-1x2-fill" aria-hidden />
          Browse products
        </Link>
      </div>
    );
  }

  const { cart, totalPrice } = cartData;

  return (
    <>
      <h2 className="fw-bold mb-4 d-inline-flex align-items-center gap-2">
        <i className="bi bi-bag-check-fill text-primary" aria-hidden />
        Checkout
      </h2>
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      )}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3 d-inline-flex align-items-center gap-2">
            <i className="bi bi-receipt-cutoff" aria-hidden />
            Order summary
          </h5>
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
            <div className="d-flex flex-wrap gap-2">
              <Link to="/cart" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                <i className="bi bi-arrow-left" aria-hidden />
                Back to cart
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2"
                disabled={submitting}
                onClick={() => void handleCheckout()}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden />
                    Placing order…
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill" aria-hidden />
                    Pay & place order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3 d-inline-flex align-items-center gap-2">
            <i className="bi bi-credit-card-2-front" aria-hidden />
            Payment
          </h5>
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="cardHolder" className="form-label d-inline-flex align-items-center gap-2">
                <i className="bi bi-person-badge" aria-hidden />
                Card holder
              </label>
              <input
                id="cardHolder"
                className="form-control"
                placeholder="AYSE YILMAZ"
                value={payment.cardHolder}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, cardHolder: e.target.value }))
                }
                maxLength={60}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="cardNumber" className="form-label d-inline-flex align-items-center gap-2">
                <i className="bi bi-credit-card" aria-hidden />
                Card number
              </label>
              <input
                id="cardNumber"
                className="form-control"
                inputMode="numeric"
                placeholder="4242424242424242"
                value={payment.cardNumber}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, cardNumber: e.target.value.replace(/[^\d\s]/g, '') }))
                }
                maxLength={23}
                required
              />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="expiry" className="form-label d-inline-flex align-items-center gap-2">
                <i className="bi bi-calendar3" aria-hidden />
                Expiry (MM/YY)
              </label>
              <input
                id="expiry"
                className="form-control"
                placeholder="08/28"
                value={payment.expiry}
                inputMode="numeric"
                autoComplete="cc-exp"
                onChange={(e) => handleExpiryInput(e.target.value)}
                maxLength={5}
                required
              />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="cvc" className="form-label d-inline-flex align-items-center gap-2">
                <i className="bi bi-shield-lock" aria-hidden />
                CVC
              </label>
              <input
                id="cvc"
                className="form-control"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="737"
                value={payment.cvc}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, cvc: e.target.value.replace(/\D/g, '') }))
                }
                maxLength={4}
                required
              />
            </div>
            <div className="col-12">
              <label htmlFor="billingEmail" className="form-label d-inline-flex align-items-center gap-2">
                <i className="bi bi-envelope-at" aria-hidden />
                Billing email
              </label>
              <input
                id="billingEmail"
                type="email"
                className="form-control"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="text-secondary small mb-0 mt-3 d-flex align-items-start gap-2">
            <i className="bi bi-info-circle mt-1" aria-hidden />
            <span>
              Mock payment for course demo. Card details are validated (including Luhn) and are not stored on the server.
            </span>
          </p>
        </div>
      </div>
    </>
  );
};
