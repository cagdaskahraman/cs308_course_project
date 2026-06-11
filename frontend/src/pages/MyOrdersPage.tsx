import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, type Order } from '../services/orderService';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { formatPrice } from '../utils/formatPrice';
import { isAuthFailure } from '../services/authService';

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'delivered':
      return 'status-badge status-badge--delivered';
    case 'in-transit':
      return 'status-badge status-badge--in-transit';
    case 'processing':
      return 'status-badge status-badge--processing';
    case 'cancelled':
      return 'status-badge status-badge--cancelled';
    default:
      return 'status-badge';
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'in-transit':
      return 'In transit';
    case 'processing':
      return 'Processing';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const MyOrdersPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    void getMyOrders()
      .then(setOrders)
      .catch((e) => {
        if (isAuthFailure(e)) {
          signOut();
          navigate('/login?next=/orders', { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Could not load orders');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/orders', { replace: true });
      return;
    }
    load();
  }, [isAuthenticated, load, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="text-center mt-5">
        <p>Redirecting to login…</p>
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading your orders…" />;

  if (error) {
    return (
      <div className="alert alert-danger mt-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-triangle-fill" aria-hidden />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        icon="bi-receipt-cutoff"
        title="My orders"
        subtitle="Track delivery progress, download invoices, and request returns."
        badge={`${orders.length} order${orders.length === 1 ? '' : 's'}`}
      >
        <button
          type="button"
          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
          onClick={() => load()}
        >
          <i className="bi bi-arrow-clockwise" aria-hidden />
          Refresh
        </button>
      </PageHeader>

      {orders.length === 0 ? (
        <EmptyState
          icon="bi-inbox"
          title="No orders yet"
          description="Your purchase history will appear here after checkout."
          actionLabel="Start shopping"
          actionTo="/"
        />
      ) : (
        <div className="d-flex flex-column gap-2">
          {orders.map((o) => (
            <div key={o.id} className="order-card d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div className="text-secondary small mb-1">
                  {new Date(o.orderDate).toLocaleString()}
                </div>
                <div className="fw-bold">{formatPrice(o.totalPrice)}</div>
                <div className="text-secondary small">
                  {o.items?.length ?? 0} item{(o.items?.length ?? 0) === 1 ? '' : 's'}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className={statusBadgeClass(o.status)}>
                  {statusLabel(o.status)}
                </span>
                <Link to={`/orders/${o.id}`} className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
                  <i className="bi bi-eye" aria-hidden />
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
