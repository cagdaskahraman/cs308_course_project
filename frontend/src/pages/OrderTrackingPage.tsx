import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  cancelOrder,
  downloadInvoicePdf,
  getInvoiceMailDispatchByOrderId,
  getInvoiceByOrderId,
  getOrder,
  type InvoiceMailDispatch,
  type Invoice,
  type Order,
} from '../services/orderService';
import { isAuthFailure } from '../services/authService';
import { getMyReturns, requestReturn, type ReturnRequest } from '../services/returnService';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { formatPrice } from '../utils/formatPrice';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [returningItemId, setReturningItemId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceDispatch, setInvoiceDispatch] = useState<InvoiceMailDispatch | null>(null);
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
          const myReturns = await getMyReturns();
          setReturns(myReturns.filter((row) => row.orderId === loadedOrder.id));
        } catch {
          setReturns([]);
        }
        try {
          const loadedInvoice = await getInvoiceByOrderId(orderId);
          setInvoice(loadedInvoice);
          try {
            const dispatch = await getInvoiceMailDispatchByOrderId(orderId);
            setInvoiceDispatch(dispatch);
          } catch {
            setInvoiceDispatch(null);
          }
        } catch {
          setInvoice(null);
          setInvoiceDispatch(null);
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

  if (loading) return <LoadingState label="Loading order…" />;
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
  const canCancel = order.status === 'processing';
  const withinReturnWindow =
    (Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24) <= 30;

  const handleCancel = async () => {
    if (!orderId || !canCancel) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(orderId);
      setOrder(updated);
      showToast('Order cancelled and stock restored.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReturn = async (itemId: string) => {
    if (!orderId) return;
    setReturningItemId(itemId);
    try {
      const created = await requestReturn(orderId, itemId, 'Customer return request');
      setReturns((prev) => [created, ...prev]);
      showToast('Return request submitted for sales manager review.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not request return');
    } finally {
      setReturningItemId(null);
    }
  };

  const returnForItem = (itemId: string) =>
    returns.find((row) => row.orderItemId === itemId);
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

  const progressWidth = `${Math.min(activeIdx / (STATUS_STEPS.length - 1), 1) * 80}%`;

  return (
    <>
      <PageHeader
        icon="bi-geo-alt-fill"
        title="Order tracking"
        subtitle="Follow delivery progress, download invoices, or request returns."
        badge={statusLabel(order.status)}
      />

      <div className="content-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <div className="small text-secondary text-uppercase fw-bold">Order ID</div>
            <p className="mb-0 fw-semibold" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{order.id}</p>
          </div>
          <div className="text-end">
            <div className="small text-secondary text-uppercase fw-bold">Placed on</div>
            <p className="mb-0">{new Date(order.orderDate).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        {isCancelled ? (
          <div className="alert alert-danger mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-x-octagon-fill" aria-hidden />
            <span>This order has been cancelled.</span>
          </div>
        ) : (
          <div className="order-timeline">
            <div className="order-timeline__track" />
            <div className="order-timeline__progress" style={{ width: progressWidth }} />
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= activeIdx;
              return (
                <div key={step} className="order-timeline__step">
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

      <div className="content-card">
        <h2 className="content-card__title">
          <i className="bi bi-basket3" aria-hidden />
          Order items
        </h2>
          <ul className="list-group list-group-flush">
            {order.items.map((item) => {
              const existingReturn = returnForItem(item.id);
              const returnBlocksRequest =
                existingReturn?.status === 'pending' ||
                existingReturn?.status === 'refunded';
              const canReturn =
                order.status === 'delivered' &&
                item.status === 'delivered' &&
                withinReturnWindow &&
                !returnBlocksRequest;
              return (
                <li key={item.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div>{item.product.name} &times; {item.quantity}</div>
                      {existingReturn ? (
                        <span className="badge text-bg-light mt-2">
                          Return: {existingReturn.status}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold">
                        {formatPrice(item.priceAtPurchase * item.quantity)}
                      </div>
                      {canReturn ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning mt-2"
                          disabled={returningItemId === item.id}
                          onClick={() => void handleReturn(item.id)}
                        >
                          Request return
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="cart-summary d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
            <div>
              <div className="small text-secondary text-uppercase fw-bold">Order total</div>
              <div className="fs-4 fw-bold mb-0">{formatPrice(order.totalPrice)}</div>
            </div>
            <div className="d-flex gap-2">
              {canCancel ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={cancelling}
                  onClick={() => void handleCancel()}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel order'}
                </button>
              ) : null}
              <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2" onClick={load}>
                <i className="bi bi-arrow-clockwise" aria-hidden />
                Refresh status
              </button>
            </div>
          </div>
      </div>

      {invoice && (
        <div className="content-card">
          <h2 className="content-card__title">
            <i className="bi bi-file-earmark-pdf text-danger" aria-hidden />
            Invoice
          </h2>
            <p className="text-secondary mb-3">
              Invoice #{invoice.invoiceNumber} issued to {invoice.billingEmail}
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="stat-card h-100">
                  <div className="stat-card__label">Billing details</div>
                  <p className="mb-1 small">{invoice.billingName}</p>
                  <p className="mb-0 small">{invoice.billingAddress}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="stat-card h-100">
                  <div className="stat-card__label">Payment details</div>
                  <p className="mb-1 small">Authorization: {invoice.authorizationReference}</p>
                  <p className="mb-1 small">Card: **** {invoice.cardLast4}</p>
                  <p className="mb-0 small fw-semibold">Total: {formatPrice(invoice.total)}</p>
                </div>
              </div>
            </div>
            <div className="table-responsive data-card mb-3">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={`${invoice.id}-${item.productId ?? item.name}`}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.unitPrice)}</td>
                      <td className="fw-semibold">{formatPrice(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="badge text-bg-light">Auth: {invoice.authorizationReference}</span>
              <span className="badge text-bg-light">Card: **** {invoice.cardLast4}</span>
            </div>
            {invoiceDispatch ? (
              <div className="alert alert-success mt-3 mb-0 py-2 d-flex align-items-center gap-2">
                <i className="bi bi-envelope-check-fill" aria-hidden />
                <span>
                  Email sent to <strong>{invoiceDispatch.to}</strong> with attachment{' '}
                  <strong>{invoiceDispatch.attachmentName}</strong>.
                </span>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-3 d-inline-flex align-items-center gap-2"
              onClick={() => void handleInvoiceDownload()}
              disabled={downloadingInvoice}
            >
              {downloadingInvoice ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden />
                  Preparing invoice…
                </>
              ) : (
                <>
                  <i className="bi bi-download" aria-hidden />
                  Download invoice
                </>
              )}
            </button>
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
