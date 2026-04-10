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

export const OrderTrackingPage = (): JSX.Element => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    void getOrder(orderId)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Order not found'))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-center fs-5 mt-5">Loading order...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!order) return <div className="alert alert-warning mt-4">Order not found.</div>;

  const isCancelled = order.status === 'cancelled';
  const activeIdx = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);

  return (
    <>
      <h2 className="fw-bold mb-4">Order Status</h2>

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
            <div className="alert alert-danger mb-0">This order has been cancelled.</div>
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
                      className={`rounded-circle mx-auto d-flex align-items-center justify-content-center ${done ? 'bg-primary text-white' : 'bg-light border'}`}
                      style={{ width: 36, height: 36, fontSize: 14, fontWeight: 600 }}
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <small className={`d-block mt-1 ${done ? 'fw-semibold' : 'text-secondary'}`}>
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
          <h5 className="card-title mb-3">Items</h5>
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
            <button className="btn btn-sm btn-outline-primary" onClick={load}>Refresh Status</button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link to="/" className="btn btn-outline-secondary">Back to Catalog</Link>
      </div>
    </>
  );
};
