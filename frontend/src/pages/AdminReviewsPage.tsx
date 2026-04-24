import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
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

  const canModerate = user?.role === 'product_manager' || user?.role === 'admin';

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
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/reviews', { replace: true });
        return;
      }
      alert(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/reviews', { replace: true });
        return;
      }
      alert(e instanceof Error ? e.message : 'Reject failed');
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

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading pending reviews…</p>
      </div>
    );
  }
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
      <h2 className="fw-bold mb-4 d-inline-flex align-items-center gap-2">
        <i className="bi bi-shield-check text-primary" aria-hidden />
        Review moderation
      </h2>
      {reviews.length === 0 ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <i className="bi bi-check2-all fs-4" aria-hidden />
          <span>No pending reviews at the moment.</span>
        </div>
      ) : (
        <div className="list-group">
          {reviews.map((r) => (
            <div key={r.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  {r.productName && (
                    <span className="badge text-bg-secondary me-2">{r.productName}</span>
                  )}
                  <span style={{ color: '#f5a623' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                </div>
                <small className="text-muted">
                  {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                </small>
              </div>
              <p className="mb-2">{r.comment}</p>
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
