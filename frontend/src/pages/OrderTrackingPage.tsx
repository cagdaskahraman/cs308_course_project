import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, type Order } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';

const STATUS_STEPS = ['processing', 'in-transit', 'delivered'] as const;

const statusLabel = (s: string): string => {
  switch (s) {
    case 'processing': return 'Processing';
    case 'in-transit': return 'In Transit';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return s;
  }
};

const statusDescription = (s: string): string => {
  switch (s) {
    case 'processing': return 'We have received your order and are preparing it for shipment.';
    case 'in-transit': return 'Your order is on its way. Expect delivery soon.';
    case 'delivered': return 'Your order has been delivered. Enjoy!';
    case 'cancelled': return 'This order was cancelled.';
    default: return '';
  }
};

export const OrderTrackingPage = (): JSX.Element => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback((isRefresh = false) => {
    if (!orderId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    void getOrder(orderId)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Order not found'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="stack">
        <div className="es-skeleton" style={{ height: 110 }} />
        <div className="es-skeleton" style={{ height: 160 }} />
        <div className="es-skeleton" style={{ height: 220 }} />
      </div>
    );
  }
  if (error) return <div className="es-alert es-alert--danger">{error}</div>;
  if (!order) return <div className="es-alert es-alert--warn">Order not found.</div>;

  const isCancelled = order.status === 'cancelled';
  const activeIdx = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const progress = Math.max(0, Math.min(activeIdx, STATUS_STEPS.length - 1));
  const progressPct = STATUS_STEPS.length > 1
    ? (progress / (STATUS_STEPS.length - 1)) * 82 // matches track span of 9% to 91%
    : 0;

  return (
    <>
      <Link to="/" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        Back to catalog
      </Link>

      <div className="between fade-up" style={{ alignItems: 'flex-end', marginBottom: '1.25rem' }}>
        <div>
          <span className="eyebrow">Order confirmed</span>
          <h1 className="display-lg" style={{ margin: '.25rem 0 0' }}>
            {isCancelled ? 'Order cancelled' : 'Thank you for your order'}
          </h1>
          <p className="muted" style={{ marginTop: '.3rem' }}>
            {statusDescription(order.status)}
          </p>
        </div>
        <button
          className="es-btn es-btn--outline es-btn--sm"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }}>
            <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8"/><path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16"/><path d="M3 21v-5h5"/>
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh status'}
        </button>
      </div>

      <div className="es-order-head fade-up fade-up-1">
        <div>
          <div className="muted" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.14em' }}>Order ID</div>
          <div className="es-order-head__id">{order.id}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.14em' }}>Placed on</div>
          <div style={{ fontWeight: 600 }}>{new Date(order.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {isCancelled ? (
        <div className="es-surface fade-up fade-up-2" style={{ padding: '1.5rem', marginTop: '1rem', borderLeft: '3px solid var(--danger)' }}>
          <div className="flex-row" style={{ gap: '.75rem' }}>
            <span className="es-dot es-dot--danger" />
            <strong style={{ color: 'var(--danger)' }}>This order has been cancelled</strong>
          </div>
          <p className="muted" style={{ marginTop: '.5rem', marginBottom: 0 }}>If this was unexpected, please contact support.</p>
        </div>
      ) : (
        <div className="es-surface fade-up fade-up-2" style={{ padding: 'clamp(1.2rem, 2.2vw, 1.75rem)', marginTop: '1rem' }}>
          <div className="es-timeline">
            <div className="es-timeline__track" />
            <div className="es-timeline__progress" style={{ width: `${progressPct}%` }} />
            {STATUS_STEPS.map((step, idx) => {
              const done = idx < activeIdx;
              const current = idx === activeIdx;
              const cls = done ? 'es-timeline__step--done' : current ? 'es-timeline__step--current' : '';
              return (
                <div key={step} className={`es-timeline__step ${cls}`}>
                  <div className="es-timeline__dot">
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-11"/>
                      </svg>
                    ) : idx + 1}
                  </div>
                  <span className="es-timeline__label">{statusLabel(step)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="es-surface fade-up fade-up-3" style={{ padding: 'clamp(1.2rem, 2.2vw, 1.75rem)', marginTop: '1.25rem' }}>
        <h3 className="display-md" style={{ fontSize: '1.2rem', margin: 0, marginBottom: '.85rem' }}>Items in this order</h3>
        <div className="stack" style={{ gap: '.25rem' }}>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="between"
              style={{ padding: '.75rem 0', borderBottom: '1px dashed var(--ink-200)' }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                <div className="muted" style={{ fontSize: '.82rem' }}>Qty {item.quantity} · {formatPrice(item.priceAtPurchase)} each</div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="between" style={{ marginTop: '1rem' }}>
          <span className="muted">Order total</span>
          <span className="es-summary__total-value">{formatPrice(order.totalPrice)}</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};
