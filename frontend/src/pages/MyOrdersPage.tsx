import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, type Order } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';
import { isAuthFailure } from '../services/authService';

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'delivered':
      return 'text-bg-success';
    case 'in-transit':
      return 'text-bg-info';
    case 'processing':
      return 'text-bg-warning';
    case 'cancelled':
      return 'text-bg-secondary';
    default:
      return 'text-bg-light';
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

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading your orders…</p>
      </div>
    );
  }

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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0 d-inline-flex align-items-center gap-2">
          <i className="bi bi-receipt-cutoff text-primary" aria-hidden />
          My orders
        </h2>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
          onClick={() => load()}
        >
          <i className="bi bi-arrow-clockwise" aria-hidden />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox display-4 text-secondary mb-3 d-block" aria-hidden />
            <p className="text-secondary mb-3">You have not placed any orders yet.</p>
            <Link to="/" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-grid-1x2-fill" aria-hidden />
              Browse catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-responsive card border-0 shadow-sm">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">
                  <span className="d-inline-flex align-items-center gap-1">
                    <i className="bi bi-calendar3" aria-hidden />
                    Date
                  </span>
                </th>
                <th scope="col">
                  <span className="d-inline-flex align-items-center gap-1">
                    <i className="bi bi-hash" aria-hidden />
                    Order
                  </span>
                </th>
                <th scope="col">
                  <span className="d-inline-flex align-items-center gap-1">
                    <i className="bi bi-box-seam" aria-hidden />
                    Items
                  </span>
                </th>
                <th scope="col">
                  <span className="d-inline-flex align-items-center gap-1">
                    <i className="bi bi-currency-exchange" aria-hidden />
                    Total
                  </span>
                </th>
                <th scope="col">
                  <span className="d-inline-flex align-items-center gap-1">
                    <i className="bi bi-truck" aria-hidden />
                    Status
                  </span>
                </th>
                <th scope="col" className="text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.orderDate).toLocaleString()}</td>
                  <td>
                    <span className="font-monospace small text-break" style={{ fontSize: '0.8rem' }}>{o.id}</span>
                  </td>
                  <td>{o.items?.length ?? 0}</td>
                  <td className="fw-semibold">{formatPrice(o.totalPrice)}</td>
                  <td>
                    <span className={`badge rounded-pill ${statusBadgeClass(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td className="text-end">
                    <Link to={`/orders/${o.id}`} className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
                      <i className="bi bi-eye" aria-hidden />
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
