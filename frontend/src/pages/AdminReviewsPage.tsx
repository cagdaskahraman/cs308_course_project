import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StarRating } from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import {
  getPendingReviews,
  approveReview,
  rejectReview,
  type PendingReview,
} from '../services/adminReviewService';

export const AdminReviewsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  const canModerate = user?.role === 'product_manager';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/admin/reviews', { replace: true });
      return;
    }
    if (!canModerate) {
      setLoading(false);
      return;
    }
    void getPendingReviews()
      .then(setReviews)
      .catch((e) => {
        if (isAuthFailure(e)) {
          signOut();
          navigate('/login?next=/admin/reviews', { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, [canModerate, isAuthenticated, navigate, signOut]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Comment approved.', 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/reviews', { replace: true });
        return;
      }
      showToast(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Comment rejected.', 'info');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/reviews', { replace: true });
        return;
      }
      showToast(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-shield-lock display-4 text-secondary mb-3 d-block" aria-hidden />
        <h4 className="fw-semibold">Please log in to access this page</h4>
        <Link to="/login?next=/admin/reviews" className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2">
          <i className="bi bi-box-arrow-in-right" aria-hidden />
          Log in
        </Link>
      </div>
    );
  }

  if (!canModerate) {
    return (
      <div className="alert alert-warning mt-5 d-flex align-items-start gap-2">
        <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden />
        <span>You do not have permission to access this page.</span>
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading pending reviews…" />;
  if (error) {
    return (
      <div className="alert alert-danger mt-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-circle-fill" aria-hidden />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      <AdminModerationNav active="reviews" />
      <PageHeader
        icon="bi-shield-check"
        title="Customer reviews"
        subtitle="Review written comments before they are published on product pages."
        badge={`${reviews.length} pending`}
      />
      {reviews.length === 0 ? (
        <EmptyState
          icon="bi-check2-all"
          title="All caught up"
          description="No pending reviews at the moment."
        />
      ) : (
        <div>
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  {r.productName ? (
                    <span className="badge text-bg-secondary">{r.productName}</span>
                  ) : null}
                  {r.productId ? (
                    <span className="badge text-bg-light">#{r.productId.slice(0, 8)}</span>
                  ) : null}
                  <StarRating value={r.rating} />
                </div>
                <small className="text-muted">
                  {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                </small>
              </div>
              <p className="mb-1"><strong>Pending comment:</strong> {r.comment}</p>
              <p className="mb-2 text-muted small">Approved rating: {r.rating}/5</p>
              {r.existingComment ? (
                <p className="mb-2 text-muted small">
                  Current visible comment: {r.existingComment}
                </p>
              ) : null}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                  disabled={busyId === r.id}
                  onClick={() => void handleApprove(r.id)}
                >
                  <i className="bi bi-check-lg" aria-hidden />
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                  disabled={busyId === r.id}
                  onClick={() => void handleReject(r.id)}
                >
                  <i className="bi bi-x-lg" aria-hidden />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
