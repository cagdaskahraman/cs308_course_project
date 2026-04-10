import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPendingReviews,
  approveReview,
  rejectReview,
  type PendingReview,
} from '../services/adminReviewService';

function getUserRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    return String(payload.role ?? 'customer');
  } catch {
    return null;
  }
}

export const AdminReviewsPage = (): JSX.Element => {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const role = getUserRole();

  useEffect(() => {
    if (role !== 'product_manager') {
      setLoading(false);
      return;
    }
    void getPendingReviews()
      .then(setReviews)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [role]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
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
      alert(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  if (!localStorage.getItem('token')) {
    return (
      <div className="text-center mt-5">
        <h4>Please log in to access this page</h4>
        <Link to="/login" className="btn btn-primary mt-3">Log In</Link>
      </div>
    );
  }

  if (role !== 'product_manager') {
    return (
      <div className="alert alert-warning mt-5">
        You do not have permission to access this page.
      </div>
    );
  }

  if (loading) return <p className="text-center fs-5 mt-5">Loading pending reviews...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <>
      <h2 className="fw-bold mb-4">Review Moderation</h2>
      {reviews.length === 0 ? (
        <p className="text-secondary">No pending reviews at the moment.</p>
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
                  className="btn btn-sm btn-success"
                  disabled={busyId === r.id}
                  onClick={() => void handleApprove(r.id)}
                >
                  Approve
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={busyId === r.id}
                  onClick={() => void handleReject(r.id)}
                >
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
