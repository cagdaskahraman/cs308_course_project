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

const Star = ({ filled }: { filled: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24"
       fill={filled ? 'var(--gold)' : 'none'}
       stroke={filled ? 'var(--gold)' : 'var(--ink-300)'}
       strokeWidth="1.6" strokeLinejoin="round">
    <path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.9 6.2 20.6l1.1-6.4L2.6 9.6l6.5-.9z"/>
  </svg>
);

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
      <div className="es-empty fade-up">
        <div className="es-empty__art">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="es-empty__title">Sign in required</h2>
        <p className="es-empty__desc">This area is reserved for product managers. Please sign in to continue.</p>
        <Link to="/login" className="es-btn es-btn--primary">Sign in</Link>
      </div>
    );
  }

  if (role !== 'product_manager') {
    return (
      <div className="es-empty fade-up">
        <div className="es-empty__art">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M4.9 4.9l14.2 14.2"/>
          </svg>
        </div>
        <h2 className="es-empty__title">Access restricted</h2>
        <p className="es-empty__desc">You do not have permission to access this page.</p>
        <Link to="/" className="es-btn es-btn--outline">Return home</Link>
      </div>
    );
  }

  if (loading) return <div className="es-skeleton" style={{ height: 300 }} />;
  if (error) return <div className="es-alert es-alert--danger">{error}</div>;

  return (
    <>
      <div className="es-mod-head fade-up">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="display-lg" style={{ margin: '.25rem 0 0' }}>Review moderation</h1>
          <p className="muted" style={{ marginTop: '.25rem', marginBottom: 0 }}>
            Approve or reject submitted product reviews before they go public.
          </p>
        </div>
        <span className="es-mod-count">
          <span className="es-dot es-dot--warn" />
          {reviews.length} pending
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="es-empty fade-up fade-up-1">
          <div className="es-empty__art">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <h3 className="es-empty__title">All caught up</h3>
          <p className="es-empty__desc">There are no pending reviews at the moment. Great work.</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: '.85rem' }}>
          {reviews.map((r) => (
            <div key={r.id} className="es-mod-card fade-up">
              <div className="es-mod-card__head">
                <div className="flex-row" style={{ gap: '.6rem', flexWrap: 'wrap' }}>
                  {r.productName && <span className="es-tag">{r.productName}</span>}
                  <span className="es-stars">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} filled={s <= r.rating} />)}
                  </span>
                  <span className="muted" style={{ fontSize: '.85rem' }}>
                    {r.rating} / 5
                  </span>
                </div>
                <span className="muted" style={{ fontSize: '.82rem' }}>
                  {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <blockquote className="es-mod-card__quote">{r.comment}</blockquote>
              <div className="es-mod-card__actions">
                <button
                  className="es-btn es-btn--success es-btn--sm"
                  disabled={busyId === r.id}
                  onClick={() => void handleApprove(r.id)}
                >
                  <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-11"/>
                  </svg>
                  Approve
                </button>
                <button
                  className="es-btn es-btn--danger es-btn--sm"
                  disabled={busyId === r.id}
                  onClick={() => void handleReject(r.id)}
                >
                  <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
                  </svg>
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
