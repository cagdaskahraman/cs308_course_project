import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { getApprovedReviews, submitReview, type Review } from '../services/reviewService';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';
import { displayProductMeta } from '../utils/displayProductMeta';
import type { Product } from '../types/product';

function StarRating({ value }: { value: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= value ? '#f5a623' : '#ccc', fontSize: '1.1rem' }}>★</span>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          role="button"
          tabIndex={0}
          style={{ color: s <= value ? '#f5a623' : '#ccc', fontSize: '1.4rem', cursor: 'pointer' }}
          onClick={() => onChange(s)}
          onKeyDown={(e) => e.key === 'Enter' && onChange(s)}
        >★</span>
      ))}
    </span>
  );
}

export const ProductDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      .catch(() => { /* review endpoint may not be deployed yet */ })
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!product || product.stockQuantity <= 0) return;
    setAdding(true);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
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

  if (loading) return <p className="text-center fs-5 mt-5">Loading...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!product) return <div className="alert alert-warning mt-4">Product not found.</div>;

  return (
    <>
      <div className="row g-4">
        <div className="col-md-6">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: 480, objectFit: 'cover', width: '100%' }}
          />
        </div>
        <div className="col-md-6">
          <span className="badge text-bg-dark mb-2">{product.category}</span>
          <h2 className="fw-bold">{product.name}</h2>
          <p className="text-secondary">{product.description}</p>
          <div className="card border-0 bg-light mt-3">
            <div className="card-body py-3">
              <h6 className="text-muted text-uppercase small mb-3">Details</h6>
              <dl className="row mb-0 small">
                <dt className="col-sm-4 text-secondary">Model</dt>
                <dd className="col-sm-8 mb-2">{displayProductMeta(product.model)}</dd>
                <dt className="col-sm-4 text-secondary">Serial number</dt>
                <dd className="col-sm-8 mb-2">{displayProductMeta(product.serialNumber)}</dd>
                <dt className="col-sm-4 text-secondary">Warranty</dt>
                <dd className="col-sm-8 mb-2">{displayProductMeta(product.warrantyStatus)}</dd>
                <dt className="col-sm-4 text-secondary">Distributor</dt>
                <dd className="col-sm-8 mb-0">{displayProductMeta(product.distributorInfo)}</dd>
              </dl>
            </div>
          </div>
          <h3 className="text-primary fw-bold mt-3">{formatPrice(product.price)}</h3>
          <p className={`mt-2 ${product.stockQuantity > 0 ? 'text-success' : 'text-danger'}`}>
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
          </p>
          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-primary"
              disabled={product.stockQuantity <= 0 || adding}
              onClick={() => void handleAdd()}
            >
              {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
            </button>
            <Link to="/" className="btn btn-outline-secondary">Back to Catalog</Link>
          </div>
        </div>
      </div>

      <hr className="my-4" />
      <h4>Reviews</h4>

      {reviewsLoading ? (
        <p className="text-secondary">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-secondary">No reviews yet.</p>
      ) : (
        <div className="list-group mb-4">
          {reviews.map((r) => (
            <div key={r.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <StarRating value={r.rating} />
                <small className="text-muted">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</small>
              </div>
              <p className="mb-0">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      <h5 className="mt-3">Write a Review</h5>
      {!token ? (
        <div className="alert alert-info">
          Please <Link to="/login">log in</Link> to submit a review.
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmitReview(e)} className="mb-4">
          <div className="mb-3">
            <label className="form-label">Rating</label>
            <div><StarInput value={rating} onChange={setRating} /></div>
          </div>
          <div className="mb-3">
            <label htmlFor="reviewComment" className="form-label">Comment</label>
            <textarea
              id="reviewComment"
              className="form-control"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {submitMsg && (
            <p className={`mt-2 ${submitMsg.includes('Failed') ? 'text-danger' : 'text-success'}`}>
              {submitMsg}
            </p>
          )}
        </form>
      )}
    </>
  );
};
