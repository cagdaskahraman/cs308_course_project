import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import {
  getApprovedReviews,
  getMyReviewForProduct,
  submitReview,
  submitReviewComment,
  type Review,
} from '../services/reviewService';
import { addToWishlist, listWishlist, removeFromWishlist } from '../services/wishlistService';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';
import { ProductDiscountBadge, ProductPriceDisplay } from '../components/ProductPriceDisplay';
import { StarRating } from '../components/StarRating';
import { displayProductMeta } from '../utils/displayProductMeta';
import type { Product } from '../types/product';

export const ProductDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const { showToast } = useToast();

  const token = localStorage.getItem('token');

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const list = await getApprovedReviews(id);
      setReviews(list.filter((r) => r.status === 'approved'));
    } catch (e) {
      setReviews([]);
      setReviewsError(
        e instanceof Error ? e.message : 'Reviews could not be loaded. Check your connection or try again later.',
      );
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    void getProductById(id)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : 'Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (!id || !token) {
      setMyReview(null);
      return;
    }
    void getMyReviewForProduct(id, token)
      .then(setMyReview)
      .catch(() => setMyReview(null));
  }, [id, token]);

  useEffect(() => {
    if (!id || !token) {
      setWishlisted(false);
      return;
    }
    void listWishlist()
      .then((items) => setWishlisted(items.some((item) => item.id === id)))
      .catch(() => setWishlisted(false));
  }, [id, token]);

  const handleAdd = async () => {
    if (!product || product.stockQuantity <= 0 || product.price <= 0) return;
    setAdding(true);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, 1);
      setAdded(true);
      showToast(`Added "${product.name}" to cart.`, 'success');
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
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await submitReview(
        {
          productId: id,
          rating,
        },
        token,
      );
      setSubmitSuccess('Rating submitted successfully.');
      setComment('');
      setRating(5);
      await loadReviews();
      const mine = await getMyReviewForProduct(id, token);
      setMyReview(mine);
      showToast('Rating submitted.', 'success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token) return;
    setCommentSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await submitReviewComment(id, comment.trim(), token);
      setSubmitSuccess('Comment submitted for review.');
      setComment('');
      await loadReviews();
      const mine = await getMyReviewForProduct(id, token);
      setMyReview(mine);
      showToast('Comment submitted for review.', 'info');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not submit comment.',
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading product…" />;
  if (error) {
    return (
      <div className="alert alert-danger mt-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-triangle-fill" aria-hidden />
        <span>{error}</span>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="alert alert-warning mt-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-emoji-frown" aria-hidden />
        <span>Product not found.</span>
      </div>
    );
  }

  return (
    <>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="product-detail-gallery product-image-wrap">
            <ProductDiscountBadge product={product} />
            <img
              src={product.imageUrl}
              alt={product.name}
              className="img-fluid w-100 product-image"
            />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="product-detail-panel">
          <span className="category-pill mb-3">
            <i className="bi bi-tag-fill" aria-hidden />
            {product.category}
          </span>
          <h1 className="fw-bold mb-2" style={{ letterSpacing: '-0.03em' }}>{product.name}</h1>
          <p className="text-secondary mb-4" style={{ lineHeight: 1.65 }}>{product.description}</p>
          <div className="product-specs mt-3">
              <h6 className="text-muted text-uppercase small mb-3 d-inline-flex align-items-center gap-2">
                <i className="bi bi-info-circle" aria-hidden />
                Specifications
              </h6>
              <dl className="row mb-0 small">
                <dt className="col-sm-4 d-inline-flex align-items-center gap-1">
                  <i className="bi bi-cpu" aria-hidden />
                  Model
                </dt>
                <dd className="col-sm-8 mb-2">{displayProductMeta(product.model)}</dd>
                <dt className="col-sm-4 text-secondary d-inline-flex align-items-center gap-1">
                  <i className="bi bi-upc-scan" aria-hidden />
                  Serial number
                </dt>
                <dd className="col-sm-8 mb-2">{displayProductMeta(product.serialNumber)}</dd>
                <dt className="col-sm-4 text-secondary d-inline-flex align-items-center gap-1">
                  <i className="bi bi-box-seam" aria-hidden />
                  Quantity in stock
                </dt>
                <dd className="col-sm-8 mb-2">{product.stockQuantity}</dd>
                <dt className="col-sm-4 text-secondary d-inline-flex align-items-center gap-1">
                  <i className="bi bi-shield-check" aria-hidden />
                  Warranty
                </dt>
                <dd className="col-sm-8 mb-2">{displayProductMeta(product.warrantyStatus)}</dd>
                <dt className="col-sm-4 text-secondary d-inline-flex align-items-center gap-1">
                  <i className="bi bi-building" aria-hidden />
                  Distributor
                </dt>
                <dd className="col-sm-8 mb-0">{displayProductMeta(product.distributorInfo)}</dd>
              </dl>
          </div>
          <div className="product-price-hero">
            <ProductPriceDisplay product={product} size="lg" showSavings />
          </div>
          <div className="d-flex justify-content-end mt-2">
            <p
              className={`mb-0 d-inline-flex align-items-center gap-2 fw-medium ${product.stockQuantity > 0 ? 'text-success' : 'text-danger'}`}
            >
              <i className={`bi ${product.stockQuantity > 0 ? 'bi-check-circle' : 'bi-x-circle'}`} aria-hidden />
              {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              disabled={product.stockQuantity <= 0 || product.price <= 0 || adding}
              onClick={() => void handleAdd()}
            >
              {adding ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden />
                  Adding…
                </>
              ) : added ? (
                <>
                  <i className="bi bi-check-lg" aria-hidden />
                  Added
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus" aria-hidden />
                  Add to cart
                </>
              )}
            </button>
            {token ? (
              <button
                type="button"
                className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                onClick={() => {
                  if (!product) return;
                  void (wishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id))
                    .then((items) => {
                      setWishlisted(items.some((item) => item.id === product.id));
                      showToast(wishlisted ? 'Removed from wishlist.' : 'Added to wishlist.', 'success');
                    })
                    .catch((e) => showToast(e instanceof Error ? e.message : 'Wishlist update failed', 'danger'));
                }}
              >
                <i className={`bi ${wishlisted ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden />
                {wishlisted ? 'In wishlist' : 'Add to wishlist'}
              </button>
            ) : null}
            <Link to="/" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
              <i className="bi bi-arrow-left" aria-hidden />
              Back to catalog
            </Link>
          </div>
          </div>
        </div>
      </div>

      <section className="reviews-panel">
      <h4 className="mb-1 d-inline-flex align-items-center gap-2">
        <i className="bi bi-chat-square-text text-primary" aria-hidden />
        Customer reviews
      </h4>
      <p className="text-muted small mb-3">Verified customer ratings and approved comments are shown below.</p>

      {reviewsLoading ? (
        <div className="d-flex align-items-center gap-2 text-secondary mb-4" role="status" aria-live="polite">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>Loading reviews…</span>
        </div>
      ) : reviewsError ? (
        <div className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4">
          <span>{reviewsError}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-dark flex-shrink-0 d-inline-flex align-items-center gap-1"
            onClick={() => void loadReviews()}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden />
            Retry
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-secondary mb-4">No approved reviews yet.</p>
      ) : (
        <div className="mb-4">
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <StarRating value={r.rating} size="md" />
                <small className="text-muted">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</small>
              </div>
              <p className="mb-0 text-secondary">
                {r.comment?.trim() ? r.comment : 'Rating-only feedback.'}
              </p>
            </div>
          ))}
        </div>
      )}

      <h5 className="mt-3 d-inline-flex align-items-center gap-2">
        <i className="bi bi-pencil-square" aria-hidden />
        Write a review
      </h5>
      {!token ? (
        <div className="alert alert-info d-flex align-items-start gap-2">
          <i className="bi bi-info-circle mt-1" aria-hidden />
          <span>
            <Link to="/login">Log in</Link> to rate delivered products. Written comments are reviewed before they appear above.
          </span>
        </div>
      ) : (
        <div className="mb-4">
          {submitError && (
            <div className="alert alert-danger" role="alert">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="alert alert-success" role="status">
              {submitSuccess}
            </div>
          )}
          {!myReview ? (
            <form onSubmit={(e) => void handleSubmitReview(e)} className="mb-3">
              <div className="mb-3">
                <label className="form-label">Rating (only for delivered items)</label>
                <StarRating value={rating} size="lg" interactive onChange={setRating} />
              </div>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill" aria-hidden />
                    Submit rating
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="alert alert-secondary">
              Your rating: <strong>{myReview.rating}/5</strong>
            </div>
          )}
          {myReview?.status === 'pending' && myReview.pendingComment ? (
            <div className="alert alert-info mb-3">
              Your comment is being reviewed and will appear once approved.
            </div>
          ) : null}
          {myReview && myReview.status === 'approved' && (
            <form onSubmit={(e) => void handleSubmitComment(e)}>
              <div className="mb-3">
                <label htmlFor="reviewComment" className="form-label">Comment</label>
                <textarea
                  id="reviewComment"
                  className="form-control"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add comment to your rating"
                  required
                />
              </div>
              <button type="submit" className="btn btn-outline-primary d-inline-flex align-items-center gap-2" disabled={commentSubmitting}>
                {commentSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden />
                    Sending…
                  </>
                ) : (
                  <>
                    <i className="bi bi-chat-dots" aria-hidden />
                    Submit comment
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
      </section>
    </>
  );
};
