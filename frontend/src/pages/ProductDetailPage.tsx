import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { getApprovedReviews, submitReview, type Review } from '../services/reviewService';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';
import type { Product } from '../types/product';

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    className={`es-star${filled ? ' es-star--on' : ''}`}
    width="18" height="18" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth="1.6" strokeLinejoin="round"
  >
    <path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.9 6.2 20.6l1.1-6.4L2.6 9.6l6.5-.9z"/>
  </svg>
);

function StarRating({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="es-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size }}>
          <Star filled={s <= value} />
        </span>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="es-stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          style={{ border: 0, background: 'transparent', padding: 2, cursor: 'pointer' }}
          className="es-star--input"
        >
          <Star filled={s <= (hover || value)} />
        </button>
      ))}
    </span>
  );
}

export const ProductDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const { showToast } = useToast();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    void getProductById(id)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : 'Product not found'))
      .finally(() => setLoading(false));

    setReviewsLoading(true);
    void getApprovedReviews(id)
      .then(setReviews)
      .catch(() => { /* reviews endpoint may be unavailable */ })
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!product || product.stockQuantity <= 0) return;
    setAdding(true);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, qty);
      setAdded(true);
      showToast(`${product.name} added to cart`, 'success');
      setTimeout(() => setAdded(false), 1800);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await submitReview({ productId: id, rating, comment }, token);
      setSubmitMsg('Review submitted! It will appear after approval.');
      setComment('');
      setRating(5);
    } catch {
      setSubmitMsg('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="es-pdp">
        <div className="es-skeleton" style={{ aspectRatio: '4/3', borderRadius: 24 }} />
        <div className="stack">
          <div className="es-skeleton" style={{ height: 16, width: 100 }} />
          <div className="es-skeleton" style={{ height: 34, width: '80%' }} />
          <div className="es-skeleton" style={{ height: 14, width: '100%' }} />
          <div className="es-skeleton" style={{ height: 14, width: '90%' }} />
          <div className="es-skeleton" style={{ height: 48, width: 200 }} />
        </div>
      </div>
    );
  }
  if (error) return <div className="es-alert es-alert--danger">{error}</div>;
  if (!product) return <div className="es-alert es-alert--warn">Product not found.</div>;

  const oos = product.stockQuantity <= 0;
  const low = product.stockQuantity > 0 && product.stockQuantity <= 3;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <>
      <Link to="/" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        All products
      </Link>

      <section className="es-pdp fade-up">
        <div className="es-pdp__media">
          <span className="es-pdp__tag-float">{product.category}</span>
          <img className="es-pdp__img" src={product.imageUrl} alt={product.name} />
        </div>

        <div className="fade-up fade-up-1">
          <span className="eyebrow">{product.category} · Model {product.id.slice(0, 6)}</span>
          <h1 className="es-pdp__title">{product.name}</h1>

          <div className="flex-row" style={{ gap: '.65rem', marginBottom: '.9rem' }}>
            <StarRating value={Math.round(avgRating) || 5} />
            <span className="muted" style={{ fontSize: '.88rem' }}>
              {reviews.length > 0 ? `${avgRating.toFixed(1)} · ${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'No reviews yet'}
            </span>
          </div>

          <div className="es-pdp__price">{formatPrice(product.price)}</div>

          <p className="es-pdp__desc" style={{ marginTop: '1rem' }}>{product.description}</p>

          <div className="es-pdp__stock-chip">
            <span className={`es-dot ${oos ? 'es-dot--danger' : low ? 'es-dot--warn' : 'es-dot--ok'}`} />
            {oos ? 'Out of stock' : low ? `Only ${product.stockQuantity} left in stock` : `${product.stockQuantity} in stock · ready to ship`}
          </div>

          <div className="es-pdp__actions">
            {!oos && (
              <div className="es-qty" role="group" aria-label="Quantity">
                <button className="es-qty__btn" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span className="es-qty__value">{qty}</span>
                <button
                  className="es-qty__btn"
                  disabled={qty >= product.stockQuantity}
                  onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            )}
            <button
              className={`es-btn ${oos ? 'es-btn--outline' : 'es-btn--primary'} es-btn--lg`}
              disabled={oos || adding}
              onClick={() => void handleAdd()}
              style={{ flex: '1 1 240px' }}
            >
              {oos ? 'Sold out — notify me' : adding ? 'Adding…' : added ? 'Added to cart' : `Add to cart · ${formatPrice(product.price * qty)}`}
            </button>
          </div>

          <div className="es-trust">
            <div className="es-trust__item">
              <span className="es-trust__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </span>
              <div>
                <strong>Free 2-day shipping</strong>
                <span>On all orders over $50</span>
              </div>
            </div>
            <div className="es-trust__item">
              <span className="es-trust__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z"/><path d="M8 12l3 3 5-6"/>
                </svg>
              </span>
              <div>
                <strong>30-day returns</strong>
                <span>Change your mind, risk-free</span>
              </div>
            </div>
            <div className="es-trust__item">
              <span className="es-trust__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <div>
                <strong>Secure checkout</strong>
                <span>Encrypted, verified payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="es-reviews">
        <div className="es-reviews__head">
          <div>
            <span className="eyebrow">Customer voices</span>
            <h2 className="display-md" style={{ marginTop: 6 }}>Reviews &amp; ratings</h2>
          </div>
          {reviews.length > 0 && (
            <div className="es-surface" style={{ padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
              <span className="display-md" style={{ margin: 0 }}>{avgRating.toFixed(1)}</span>
              <div>
                <StarRating value={Math.round(avgRating)} />
                <div style={{ fontSize: '.78rem', color: 'var(--ink-500)' }}>{reviews.length} review{reviews.length > 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
        </div>

        {reviewsLoading ? (
          <p className="muted">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="es-surface" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p className="muted" style={{ margin: 0 }}>No reviews yet — be the first to share your experience.</p>
          </div>
        ) : (
          <div className="stack" style={{ gap: '.75rem' }}>
            {reviews.map((r) => (
              <div key={r.id} className="es-review">
                <div className="es-review__head">
                  <StarRating value={r.rating} />
                  <span className="es-review__meta">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="es-review__body" style={{ margin: 0 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        <div className="es-write-review" style={{ marginTop: '1.5rem' }}>
          <h3 className="display-md" style={{ fontSize: '1.25rem', margin: 0, marginBottom: '.25rem' }}>Write a review</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '.92rem' }}>
            Share a few words about the product — help others make a great choice.
          </p>
          {!token ? (
            <div className="es-alert es-alert--info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <div>
                Please <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 600 }}>sign in</Link> to submit a review.
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmitReview(e)} className="stack">
              <div className="es-field">
                <label className="es-label">Your rating</label>
                <StarInput value={rating} onChange={setRating} />
              </div>
              <div className="es-field">
                <label className="es-label" htmlFor="reviewComment">Your review</label>
                <textarea
                  id="reviewComment"
                  className="es-textarea"
                  rows={4}
                  value={comment}
                  placeholder="What did you love? What could be better?"
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>
              <div>
                <button type="submit" className="es-btn es-btn--primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
              {submitMsg && (
                <div className={`es-alert ${submitMsg.includes('Failed') ? 'es-alert--danger' : 'es-alert--success'}`}>
                  {submitMsg}
                </div>
              )}
            </form>
          )}
        </div>
      </section>
    </>
  );
};
