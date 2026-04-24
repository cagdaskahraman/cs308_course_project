import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  downloadInvoicePdf,
  getInvoiceByOrderId,
  getOrder,
  type Invoice,
  type Order,
} from '../services/orderService';
import { isAuthFailure } from '../services/authService';
import { formatPrice } from '../utils/formatPrice';
import { useAuth } from '../context/AuthContext';

const STATUS_STEPS = ['processing', 'in-transit', 'delivered'] as const;

const stepIconClass = (step: (typeof STATUS_STEPS)[number]): string => {
  switch (step) {
    case 'processing':
      return 'bi-hourglass-split';
    case 'in-transit':
      return 'bi-truck';
    case 'delivered':
      return 'bi-house-check';
    default:
      return 'bi-circle';
  }
};

const statusLabel = (s: string): string => {
  switch (s) {
    case 'processing': return 'Processing';
    case 'in-transit': return 'In Transit';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return s;
  }
};

export const OrderTrackingPage = (): JSX.Element => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!orderId || !isAuthenticated) return;
    setLoading(true);
    void getOrder(orderId)
      .then(async (loadedOrder) => {
        setOrder(loadedOrder);
        try {
          const loadedInvoice = await getInvoiceByOrderId(orderId);
          setInvoice(loadedInvoice);
        } catch {
          setInvoice(null);
        }
      })
      .catch((e) => {
        if (isAuthFailure(e)) {
          signOut();
          navigate(`/login?next=/orders/${orderId}`, { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Order not found');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, orderId, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?next=/orders/${orderId ?? ''}`, { replace: true });
      return;
    }
    load();
  }, [isAuthenticated, load, navigate, orderId]);

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading order…</p>
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
  if (!order) {
    return (
      <div className="alert alert-warning mt-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-question-circle" aria-hidden />
        <span>Order not found.</span>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const activeIdx = Math.max(
    0,
    STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]),
  );
  const handleInvoiceDownload = async () => {
    if (!orderId || !invoice) return;
    setDownloadingInvoice(true);
    try {
      const blob = await downloadInvoicePdf(orderId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <>
      <h2 className="fw-bold mb-4 d-inline-flex align-items-center gap-2">
        <i className="bi bi-geo-alt-fill text-primary" aria-hidden />
        Order status
      </h2>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <small className="text-secondary">Order ID</small>
              <p className="mb-0 fw-semibold" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{order.id}</p>
            </div>
            <div className="text-end">
              <small className="text-secondary">Date</small>
              <p className="mb-0">{new Date(order.orderDate).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          {isCancelled ? (
            <div className="alert alert-danger mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-x-octagon-fill" aria-hidden />
              <span>This order has been cancelled.</span>
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-center position-relative my-4 px-4">
              <div
                className="position-absolute bg-light rounded"
                style={{ height: 4, left: '10%', right: '10%', top: '50%', transform: 'translateY(-50%)', zIndex: 0 }}
              />
              <div
                className="position-absolute bg-primary rounded"
                style={{
                  height: 4,
                  left: '10%',
                  width: `${Math.min(activeIdx / (STATUS_STEPS.length - 1), 1) * 80}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              />
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= activeIdx;
                return (
                  <div key={step} className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                    <div
                      className={`step-icon-ring rounded-circle mx-auto d-flex align-items-center justify-content-center ${done ? 'bg-primary text-white is-active' : 'bg-light border'}`}
                      style={{ width: 44, height: 44, fontSize: '1.1rem' }}
                    >
                      <i className={`bi ${stepIconClass(step)}`} aria-hidden />
                    </div>
                    <small className={`d-block mt-2 ${done ? 'fw-semibold' : 'text-secondary'}`}>
                      {statusLabel(step)}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3 d-inline-flex align-items-center gap-2">
            <i className="bi bi-basket3" aria-hidden />
            Items
          </h5>
          <ul className="list-group list-group-flush">
            {order.items.map((item) => (
              <li key={item.id} className="list-group-item d-flex justify-content-between">
                <span>{item.product.name} &times; {item.quantity}</span>
                <span className="fw-semibold">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-2">
            <h5 className="mb-0">Total: {formatPrice(order.totalPrice)}</h5>
            <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2" onClick={load}>
              <i className="bi bi-arrow-clockwise" aria-hidden />
              Refresh status
            </button>
          </div>
        </div>
      </div>

      {invoice && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body">
            <h5 className="card-title mb-2 d-inline-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-pdf text-danger" aria-hidden />
              Invoice
            </h5>
            <p className="text-secondary mb-3">
              Invoice #{invoice.invoiceNumber} issued to {invoice.billingEmail}
            </p>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="badge text-bg-light">Auth: {invoice.authorizationReference}</span>
              <span className="badge text-bg-light">Card: **** {invoice.cardLast4}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-3 d-inline-flex align-items-center gap-2"
              onClick={() => void handleInvoiceDownload()}
              disabled={downloadingInvoice}
            >
              {downloadingInvoice ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden />
                  Preparing PDF…
                </>
              ) : (
                <>
                  <i className="bi bi-download" aria-hidden />
                  Download invoice PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Link to="/" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
          <i className="bi bi-arrow-left" aria-hidden />
          Back to catalog
        </Link>
      </div>
    </>
  );
};
